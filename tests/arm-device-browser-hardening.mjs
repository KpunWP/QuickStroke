import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const arm=fs.readFileSync(path.join(ROOT,"arm-test.html"),"utf8");
const configSource=fs.readFileSync(path.join(ROOT,"config.js"),"utf8");
const cfgCtx={window:{}};cfgCtx.window=cfgCtx;vm.createContext(cfgCtx);vm.runInContext(configSource,cfgCtx);
const ready=cfgCtx.QS_CONFIG.thresholds.armReadiness;

function extractFunction(source,name){
  const start=source.indexOf("function "+name);
  assert.ok(start>=0,"Missing function "+name);
  const brace=source.indexOf("{",start);
  let depth=0,quote=null,line=false,block=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(ch==="\\"){i++;continue;}if(ch===quote)quote=null;continue;}
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch==="\`"){quote=ch;continue;}
    if(ch==="{")depth++;
    if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("Unterminated "+name);
}

const normalizeVector=extractFunction(arm,"normalizeVector");
const normalizeScreenAngle=extractFunction(arm,"normalizeScreenAngle");
const toScreenFrame=extractFunction(arm,"toScreenFrame");
const readScreenOrientation=extractFunction(arm,"readScreenOrientation");
const isSensorFresh=extractFunction(arm,"isSensorFresh");

const frameCtx={};
vm.createContext(frameCtx);
vm.runInContext(`${normalizeVector};${toScreenFrame};this.toScreenFrame=toScreenFrame;`,frameCtx);
function frame(v,a){return JSON.parse(JSON.stringify(frameCtx.toScreenFrame(v,a)));}
function near(a,b,eps=1e-9){return Math.abs(a-b)<=eps;}
function assertVec(actual,expected){
  assert.ok(near(actual.x,expected.x),`x ${actual.x} != ${expected.x}`);
  assert.ok(near(actual.y,expected.y),`y ${actual.y} != ${expected.y}`);
  assert.ok(near(actual.z,expected.z),`z ${actual.z} != ${expected.z}`);
}
assertVec(frame({x:0,y:-1,z:0},0),{x:0,y:-1,z:0});
assertVec(frame({x:0,y:-1,z:0},90),{x:-1,y:0,z:0});
assertVec(frame({x:0,y:-1,z:0},-90),{x:1,y:0,z:0});
assertVec(frame({x:0,y:-1,z:0},180),{x:0,y:1,z:0});
console.log("PASS: Arm screen-frame rotation is deterministic at 0/±90/180 degrees");

function orientationCase({screenAngle,screenType,legacyAngle,width=390,height=844}){
  const ctx={
    screen:{orientation:{}},
    window:{innerWidth:width,innerHeight:height},
  };
  if(screenAngle!==undefined)ctx.screen.orientation.angle=screenAngle;
  if(screenType!==undefined)ctx.screen.orientation.type=screenType;
  if(legacyAngle!==undefined)ctx.window.orientation=legacyAngle;
  vm.createContext(ctx);
  vm.runInContext(`${normalizeScreenAngle};${readScreenOrientation};this.read=readScreenOrientation;`,ctx);
  return JSON.parse(JSON.stringify(ctx.read()));
}
assert.deepEqual(
  orientationCase({screenAngle:90,screenType:"landscape-primary",legacyAngle:0}),
  {angle:90,type:"landscape-primary",source:"screen.orientation",inferred:false}
);
assert.deepEqual(
  orientationCase({legacyAngle:-90,width:844,height:390}),
  {angle:270,type:"landscape-primary",source:"window.orientation",inferred:false}
);
assert.deepEqual(
  orientationCase({width:390,height:844}),
  {angle:0,type:"portrait-primary",source:"viewport-inferred",inferred:true}
);
console.log("PASS: orientation source precedence is screen.orientation -> window.orientation -> viewport");

function freshness({gravityReady,lastSensorSampleAt,now}){
  const ctx={gravityReady,lastSensorSampleAt,ARM_READINESS_CFG:ready,performance:{now:()=>now}};
  vm.createContext(ctx);
  vm.runInContext(`${isSensorFresh};this.check=isSensorFresh;`,ctx);
  return ctx.check(now);
}
assert.equal(freshness({gravityReady:true,lastSensorSampleAt:1000,now:1000+ready.sampleFreshMs}),true);
assert.equal(freshness({gravityReady:true,lastSensorSampleAt:1000,now:1000+ready.sampleFreshMs+0.001}),false);
assert.equal(freshness({gravityReady:true,lastSensorSampleAt:1000,now:949.999}),false);
assert.equal(freshness({gravityReady:true,lastSensorSampleAt:1000,now:950}),true);
assert.equal(freshness({gravityReady:false,lastSensorSampleAt:1000,now:1000}),false);
assert.equal(freshness({gravityReady:true,lastSensorSampleAt:0,now:1000}),false);
console.log("PASS: sensor freshness boundaries match current engineering contract");

const orientationHandler=extractFunction(arm,"onScreenOrientationChange");
assert.match(orientationHandler,/phase === 'MEASURE'[\s\S]*abortMeasurementForReadiness\('screen_orientation_changed'\)/);
assert.match(orientationHandler,/phase === 'PRE_MEASURE_RECHECK'[\s\S]*returnToCalibration\('screen_orientation_changed'\)/);
assert.match(orientationHandler,/phase === 'CALIB'[\s\S]*resetCalibrationWindow\(\)[\s\S]*showReadinessWarning\('screen_orientation_changed'\)/);

const visibilityHandler=extractFunction(arm,"onArmVisibilityChange");
assert.match(visibilityHandler,/if \(!document\.hidden\) return/);
assert.match(visibilityHandler,/phase === 'MEASURE'[\s\S]*abortMeasurementForReadiness\('page_hidden'\)/);
assert.match(visibilityHandler,/phase === 'PRE_MEASURE_RECHECK'[\s\S]*returnToCalibration\('page_hidden'\)/);
assert.match(visibilityHandler,/phase === 'CALIB'[\s\S]*resetCalibrationWindow\(\)[\s\S]*showReadinessWarning\('page_hidden'\)/);
console.log("PASS: rotate/background transitions fail safely by phase");

assert.match(arm,/if \(gravitySource && gravitySource !== source\) \{[\s\S]*gravityWindow = \[\];[\s\S]*stableCount = 0;[\s\S]*sensorSourceSwitchCount\+\+/);
assert.match(arm,/if \(performance\.now\(\) - lastMotionAt > MOTION_FALLBACK_MS\)/);
assert.match(arm,/setGravityVector\(fallback, 'orientation-fallback', 1\)/);
assert.match(arm,/if \(phase === 'MEASURE' && !isSensorFresh\(now\)\)[\s\S]*abortMeasurementForReadiness\('sensor_stale'\)/);
console.log("PASS: source switching, orientation fallback and stale-measurement abort guards remain present");

console.log("PASS: Arm P0-E device/browser hardening suite");
