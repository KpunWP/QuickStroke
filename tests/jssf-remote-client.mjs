import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const client=read("js/jssf-remote-sync.js");
const config=read("config.js");
const source=read("js/research-store.js");
let networkCalls=0,dbOpens=0;
const listeners=new Map();
let currentContext={
  appMode:"public",screeningSessionId:"S-abc123456789abcdef",
  researchMetadata:null
};
const context={
  console,Promise,Date,JSON,Object,Array,String,Number,RegExp,Set,Map,
  crypto:{randomUUID:()=>crypto.randomUUID()},
  fetch:()=>{networkCalls++;throw Error("Disabled client must not use fetch");},
  indexedDB:{open:()=>{dbOpens++;throw Error("Disabled client must not open database");}},
  addEventListener:(type,handler)=>{
    const items=listeners.get(type)||[];items.push(handler);listeners.set(type,items);
  },
  QuickStrokeDataContract:{getSessionContext:()=>currentContext},
  navigator:{userAgent:"Mozilla/5.0 iPhone Safari"},
  document:undefined,
  QS_CONFIG:null
};
context.window=context;
vm.createContext(context);
vm.runInContext(config,context,{filename:"config.js"});
vm.runInContext(client,context,{filename:"js/jssf-remote-sync.js"});
const sync=context.QuickStrokeJssfRemote;
assert.equal(typeof sync.featureReady,"function");
assert.equal(sync.featureReady(),false);
assert.equal(sync.canSync(),false);
assert.equal(await sync.flush().then(x=>x.reason),"disabled");
assert.equal(await sync.enqueue({eventType:"technical_event",payload:{code:"SENSOR_STALE"}}),false);
assert.equal(networkCalls,0);
assert.equal(dbOpens,0);
console.log("PASS: staging gates prevent all network and persistent writes in Public Mode");

currentContext={
 appMode:"research",screeningSessionId:"S-abc123456789abcdef",
 researchMetadata:{researchProfile:"clinic_supervised",consentStatus:"consented"}
};
assert.equal(sync.canSync(),false);
currentContext.appMode="dev";
currentContext.researchMetadata=null;
assert.equal(sync.canSync(),false);
currentContext.appMode="research";
currentContext.researchMetadata={researchProfile:"community_remote_qr",consentStatus:"consented"};
assert.equal(sync.featureReady(),false);
assert.equal(sync.canSync(),false);
for(const cb of listeners.get("quickstroke:research-record-finalized")||[])cb({
 detail:{kind:"module_run",record:{module:"arm",screeningSessionId:currentContext.screeningSessionId,moduleRunId:"MR-abc123456789",moduleRunSequenceNo:1}}
});
assert.equal(dbOpens,0);
assert.equal(networkCalls,0);
console.log("PASS: clinical, Dev and disabled remote Research cannot auto-upload");

const sample={
 module:"arm",screeningSessionId:currentContext.screeningSessionId,
 moduleRunId:"MR-abc123456789",moduleRunSequenceNo:1,
 moduleRunStatus:"completed",validityStatus:"valid",observationStatus:"abnormal",
 qualityStatus:"limited",qualityFlags:["LEFT_DRIFT"],
 attemptCount:2,startedAt:"2026-09-25T01:00:00Z",completedAt:"2026-09-25T01:00:12Z",
 rawAudio:"FORBIDDEN",rawSensorValues:[1,2,3],faceImage:"FORBIDDEN"
};
const event=sync.eventFromRecord("module_run",sample);
assert.equal(event.eventType,"module_run_completed");
assert.equal(event.module,"arm");
assert.equal(event.payload.sequenceNo,1);
assert.equal(event.payload.attemptCount,2);
assert.equal(event.payload.retryCount,0);
assert.equal(event.payload.observationStatus,"abnormal");
assert.equal(event.payload.durationMs,12000);
assert.doesNotMatch(JSON.stringify(event),/FORBIDDEN|rawSensorValues/);
const interrupted=sync.eventFromRecord("module_run",{...sample,moduleRunStatus:"interrupted"});
assert.equal(interrupted.payload.observationStatus,"indeterminate");
const attempt=sync.eventFromRecord("test_attempt",{
 ...sample,testAttemptId:"TA-abc123456789",attemptSequenceNo:2,
 invalidReasonCode:"WRIST_MOVEMENT"
});
assert.equal(attempt.eventType,"test_attempt_completed");
assert.equal(attempt.payload.attemptNo,2);
assert.equal(attempt.payload.invalidReasonCode,"WRIST_MOVEMENT");
assert.equal(attempt.payload.qualityStatus,"limited");
assert.doesNotMatch(JSON.stringify(attempt),/FORBIDDEN/);
console.log("PASS: post-commit canonical event conversion preserves retry data and excludes raw media");

assert.match(source,/quickstroke:research-record-finalized/);
assert.match(source,/store\.put\(next\); await done;[\s\S]*?quickstroke:research-record-finalized/);
for(const file of ["index.html","face-test.html","arm-test.html","speech-test.html","result.html"]) {
  assert.match(read(file),/js\/jssf-remote-sync\.js/);
}
const consent=read("jssf-consent.html");
assert.match(consent,/ผู้ทดสอบทางไกล|บุคคลทั่วไป/);
assert.match(consent,/disabled aria-disabled="true"/);
assert.doesNotMatch(consent,/\.enroll\(/);
assert.match(read("service-worker.js"),/quickstroke-pwa-v43/);
assert.match(read("service-worker.js"),/\/jssf-consent\.html/);
assert.match(read("config.js"),/enabled: false,[\s\S]*consentApproved: false,[\s\S]*agePolicyApproved: false,[\s\S]*retentionPolicyApproved: false/);
assert.match(client,/pending\(cred\.sessionId\)/);
console.log("PASS: all pages load gated sync client; draft consent cannot enroll; offline assets updated");
