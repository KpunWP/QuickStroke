import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(ROOT,"config.js"),"utf8");
const ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx,{filename:"config.js"});
const cfg=ctx.QS_CONFIG.thresholds.arm;
const ready=ctx.QS_CONFIG.thresholds.armReadiness;

function normalize(v){
  const m=Math.hypot(v.x,v.y,v.z);
  assert.ok(m>0);
  return {x:v.x/m,y:v.y/m,z:v.z/m};
}
function angle(a,b){
  const aa=normalize(a),bb=normalize(b);
  const d=Math.max(-1,Math.min(1,aa.x*bb.x+aa.y*bb.y+aa.z*bb.z));
  return Math.acos(d)*180/Math.PI;
}
function classify(deg,delta){
  const dx=Math.abs(delta?.x||0),dz=Math.abs(delta?.z||0);
  const ratio=dz/Math.max(dx,0.001);
  if(deg<cfg.normalDriftMaxDeg) return {key:"normal",valid:true,passed:true,deg,dx,dz,ratio};
  if(deg<cfg.driftFailDeg) return {key:"uncertain",valid:false,passed:null,deg,dx,dz,ratio};
  if(ratio<cfg.wristRatioThr||dz<cfg.dropZMin) return {key:"wrist_movement",valid:false,passed:null,deg,dx,dz,ratio};
  return {key:"possible_arm_drift",valid:true,passed:false,deg,dx,dz,ratio};
}
function targetVector(deg,ratioZX){
  const theta=deg*Math.PI/180;
  const phi=Math.atan(ratioZX);
  return normalize({
    x:Math.sin(theta)*Math.cos(phi),
    y:-Math.cos(theta),
    z:Math.sin(theta)*Math.sin(phi)
  });
}
function blendVector(a,b,f){
  return normalize({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f});
}
function lpfStep(prev,raw){
  const u=normalize(raw);
  return normalize({
    x:prev.x+cfg.lpf*(u.x-prev.x),
    y:prev.y+cfg.lpf*(u.y-prev.y),
    z:prev.z+cfg.lpf*(u.z-prev.z)
  });
}

function replay({sampleRateHz=50,durationSec=10,targetDeg=12,ratioZX=.5,rampSec=2}={}){
  const base={x:0,y:-1,z:0};
  const target=targetVector(targetDeg,ratioZX);
  let filtered={...base},driftMax=0,peakDelta={x:0,y:0,z:0};
  const samples=[];
  const dt=1/sampleRateHz;
  for(let i=0;i<=Math.round(durationSec*sampleRateHz);i++){
    const t=i*dt;
    const f=Math.min(1,t/rampSec);
    const raw=blendVector(base,target,f);
    filtered=lpfStep(filtered,raw);
    const deg=angle(base,filtered);
    const delta={x:filtered.x-base.x,y:filtered.y-base.y,z:filtered.z-base.z};
    if(deg>driftMax){driftMax=deg;peakDelta={...delta};}
    samples.push({t,deg,driftMax,delta:{...delta},result:classify(driftMax,peakDelta)});
  }
  return {sampleRateHz,durationSec,final:samples.at(-1),samples};
}
function calibrationTimeSec(sampleRateHz){
  const samplesToBaseline=cfg.stableWindow+cfg.stableHold-1;
  return samplesToBaseline/sampleRateHz;
}

assert.equal(cfg.measureSec,10);
assert.equal(cfg.normalDriftMaxDeg,5);
assert.equal(cfg.driftFailDeg,10);
assert.equal(cfg.wristRatioThr,.20);
assert.equal(cfg.dropZMin,.04);
assert.equal(cfg.stableAngleDeg,2.5);
assert.equal(cfg.lpf,.15);
assert.equal(ready.preMeasureMaxDeltaDeg,5);

assert.equal(classify(4.999,{x:.1,z:.1}).key,"normal");
assert.equal(classify(5,{x:.1,z:.1}).key,"uncertain");
assert.equal(classify(9.999,{x:.1,z:.1}).key,"uncertain");
assert.equal(classify(10,{x:.2,z:.039}).key,"wrist_movement");
assert.equal(classify(10,{x:.2,z:.04}).key,"possible_arm_drift");
assert.equal(classify(10,{x:.25,z:.04}).key,"wrist_movement");

const normal=replay({targetDeg:4,ratioZX:.5});
const uncertain=replay({targetDeg:7,ratioZX:.5});
const drop=replay({targetDeg:12,ratioZX:.5});
const wrist=replay({targetDeg:12,ratioZX:.1});
assert.equal(normal.final.result.key,"normal");
assert.equal(uncertain.final.result.key,"uncertain");
assert.equal(drop.final.result.key,"possible_arm_drift");
assert.equal(wrist.final.result.key,"wrist_movement");

const rates=[20,50,100].map(sampleRateHz=>replay({sampleRateHz,targetDeg:12,ratioZX:.5}));
for(const run of rates) assert.equal(run.final.result.key,"possible_arm_drift");
const finalDrifts=rates.map(run=>Number(run.final.driftMax.toFixed(4)));
assert.ok(new Set(finalDrifts).size>=1);

const calibration=rates.map(run=>({sampleRateHz:run.sampleRateHz,baselineReadySec:calibrationTimeSec(run.sampleRateHz)}));
assert.ok(calibration[0].baselineReadySec>calibration[1].baselineReadySec);
assert.ok(calibration[1].baselineReadySec>calibration[2].baselineReadySec);

const report={
  schemaVersion:"arm-replay-report-0.1.0",
  thresholds:{
    measureSec:cfg.measureSec,normalDriftMaxDeg:cfg.normalDriftMaxDeg,driftFailDeg:cfg.driftFailDeg,
    wristRatioThr:cfg.wristRatioThr,dropZMin:cfg.dropZMin,stableWindow:cfg.stableWindow,
    stableHold:cfg.stableHold,stableAngleDeg:cfg.stableAngleDeg,lpf:cfg.lpf,
    preMeasureMaxDeltaDeg:ready.preMeasureMaxDeltaDeg
  },
  scenarios:{
    normal:normal.final.result.key,
    uncertain:uncertain.final.result.key,
    possibleArmDrift:drop.final.result.key,
    wristMovement:wrist.final.result.key
  },
  sampleRateObservation:rates.map(run=>({
    sampleRateHz:run.sampleRateHz,
    finalDriftMaxDeg:Number(run.final.driftMax.toFixed(4)),
    finalClass:run.final.result.key,
    baselineReadySec:Number(calibrationTimeSec(run.sampleRateHz).toFixed(3))
  }))
};
console.log(JSON.stringify(report,null,2));
console.log("PASS: deterministic Arm synthetic replay preserves current boundaries and exposes sample-rate dependence without changing production thresholds");
