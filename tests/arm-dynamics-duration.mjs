import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=fs.readFileSync(path.join(ROOT,"config.js"),"utf8");
const ctx={window:{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx,{filename:"config.js"});
const cfg=ctx.QS_CONFIG.thresholds.arm;

function normalize(v){
  const m=Math.hypot(v.x,v.y,v.z); assert.ok(m>0);
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
  if(deg<cfg.normalDriftMaxDeg) return {key:"normal",deg,dx,dz,ratio};
  if(deg<cfg.driftFailDeg) return {key:"uncertain",deg,dx,dz,ratio};
  if(ratio<cfg.wristRatioThr||dz<cfg.dropZMin) return {key:"wrist_movement",deg,dx,dz,ratio};
  return {key:"possible_arm_drift",deg,dx,dz,ratio};
}
function targetVector(deg,ratioZX){
  const theta=deg*Math.PI/180,phi=Math.atan(ratioZX);
  return normalize({x:Math.sin(theta)*Math.cos(phi),y:-Math.cos(theta),z:Math.sin(theta)*Math.sin(phi)});
}
function blend(a,b,f){return normalize({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f});}
function lpf(prev,raw){
  const u=normalize(raw);
  return normalize({x:prev.x+cfg.lpf*(u.x-prev.x),y:prev.y+cfg.lpf*(u.y-prev.y),z:prev.z+cfg.lpf*(u.z-prev.z)});
}
function firstCross(samples,predicate){
  const row=samples.find(predicate);
  return row?row.t:null;
}
function snapshotAt(samples,second){
  let row=samples[0];
  for(const s of samples){ if(s.t<=second+1e-9) row=s; else break; }
  return {second,t:Number(row.t.toFixed(4)),driftMaxDeg:Number(row.driftMax.toFixed(4)),class:row.result.key};
}
function replay({sampleRateHz=50,durationSec=10,onsetSec=0,rampSec=2,targetDeg=12,ratioZX=.5}={}){
  const base={x:0,y:-1,z:0},target=targetVector(targetDeg,ratioZX);
  let filtered={...base},driftMax=0,peakDelta={x:0,y:0,z:0},aboveFailSince=null,alertAt=null;
  const samples=[],dt=1/sampleRateHz;
  for(let i=0;i<=Math.round(durationSec*sampleRateHz);i++){
    const t=i*dt;
    const f=t<onsetSec?0:Math.min(1,(t-onsetSec)/Math.max(rampSec,1e-9));
    const raw=blend(base,target,f);
    filtered=lpf(filtered,raw);
    const deg=angle(base,filtered);
    const delta={x:filtered.x-base.x,y:filtered.y-base.y,z:filtered.z-base.z};
    if(deg>driftMax){driftMax=deg;peakDelta={...delta};}
    const result=classify(driftMax,peakDelta);
    if(deg>=cfg.driftFailDeg){
      if(aboveFailSince===null) aboveFailSince=t;
      if(alertAt===null && (t-aboveFailSince)*1000>=cfg.thresholdAlertHoldMs-1e-6) alertAt=t;
    } else {
      aboveFailSince=null;
    }
    samples.push({t,deg,driftMax,result});
  }
  return {
    sampleRateHz,onsetSec,rampSec,targetDeg,ratioZX,samples,
    cross5:firstCross(samples,s=>s.driftMax>=cfg.normalDriftMaxDeg),
    cross10:firstCross(samples,s=>s.driftMax>=cfg.driftFailDeg),
    alertAt,
    cutoffs:[3,4,5,6,7,8,10].map(sec=>snapshotAt(samples,sec)),
    final:samples.at(-1)
  };
}

const scenarios={
  earlyFast:replay({onsetSec:.5,rampSec:.75,targetDeg:12,ratioZX:.5}),
  earlySlow:replay({onsetSec:.5,rampSec:4,targetDeg:12,ratioZX:.5}),
  midSlow:replay({onsetSec:3,rampSec:4,targetDeg:12,ratioZX:.5}),
  lateFast:replay({onsetSec:6.5,rampSec:.75,targetDeg:12,ratioZX:.5}),
  lateSlow:replay({onsetSec:6.5,rampSec:3,targetDeg:12,ratioZX:.5}),
  wrist:replay({onsetSec:.5,rampSec:1,targetDeg:12,ratioZX:.1})
};

assert.equal(scenarios.earlyFast.final.result.key,"possible_arm_drift");
assert.equal(scenarios.earlySlow.final.result.key,"possible_arm_drift");
assert.equal(scenarios.midSlow.final.result.key,"possible_arm_drift");
assert.equal(scenarios.lateFast.final.result.key,"possible_arm_drift");
assert.equal(scenarios.lateSlow.final.result.key,"possible_arm_drift");
assert.equal(scenarios.wrist.final.result.key,"wrist_movement");

assert.ok(scenarios.earlyFast.cross10 < scenarios.earlySlow.cross10);
assert.ok(scenarios.earlySlow.cross10 < scenarios.midSlow.cross10);
assert.ok(scenarios.midSlow.cross10 < scenarios.lateFast.cross10);
assert.ok(scenarios.lateFast.cross10 < scenarios.lateSlow.cross10);

assert.equal(scenarios.lateFast.cutoffs.find(x=>x.second===6).class,"normal");
assert.notEqual(scenarios.lateFast.cutoffs.find(x=>x.second===8).class,"normal");
assert.equal(scenarios.lateSlow.cutoffs.find(x=>x.second===6).class,"normal");
assert.equal(scenarios.lateSlow.cutoffs.find(x=>x.second===8).class,"uncertain");
assert.equal(scenarios.lateSlow.cutoffs.find(x=>x.second===10).class,"possible_arm_drift");

const rates=[20,50,100].map(sampleRateHz=>replay({sampleRateHz,onsetSec:.5,rampSec:1.5,targetDeg:12,ratioZX:.5}));
for(const run of rates) assert.equal(run.final.result.key,"possible_arm_drift");

const report={
  schemaVersion:"arm-dynamics-report-0.1.0",
  thresholds:{
    measureSec:cfg.measureSec,
    normalDriftMaxDeg:cfg.normalDriftMaxDeg,
    driftFailDeg:cfg.driftFailDeg,
    thresholdAlertHoldMs:cfg.thresholdAlertHoldMs,
    lpf:cfg.lpf
  },
  scenarios:Object.fromEntries(Object.entries(scenarios).map(([name,run])=>[name,{
    onsetSec:run.onsetSec,rampSec:run.rampSec,
    cross5Sec:run.cross5===null?null:Number(run.cross5.toFixed(3)),
    cross10Sec:run.cross10===null?null:Number(run.cross10.toFixed(3)),
    alertSec:run.alertAt===null?null:Number(run.alertAt.toFixed(3)),
    finalClass:run.final.result.key,
    cutoffs:run.cutoffs
  }])),
  sampleRateTiming:rates.map(run=>({
    sampleRateHz:run.sampleRateHz,
    cross5Sec:Number(run.cross5.toFixed(3)),
    cross10Sec:Number(run.cross10.toFixed(3)),
    alertSec:Number(run.alertAt.toFixed(3)),
    finalClass:run.final.result.key
  }))
};

console.log(JSON.stringify(report,null,2));
console.log("PASS: Arm P0-D dynamics replay captures duration/crossing behavior without changing production thresholds");
