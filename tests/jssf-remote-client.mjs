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
assert.equal(sync.featureReady(),true);
assert.equal(sync.canSync(),false);
assert.equal(await sync.flush().then(x=>x.reason),"disabled");
assert.equal(await sync.enqueue({eventType:"technical_event",payload:{code:"SENSOR_STALE"}}),false);
assert.equal(networkCalls,0);
assert.equal(dbOpens,0);
console.log("PASS: live remote feature remains isolated from Public Mode with no network or persistent writes");

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
context.QS_CONFIG.jssfRemote.enabled=false;
assert.equal(sync.featureReady(),false);
assert.equal(sync.canSync(),false);
for(const cb of listeners.get("quickstroke:research-record-finalized")||[])cb({
 detail:{kind:"module_run",record:{module:"arm",screeningSessionId:currentContext.screeningSessionId,moduleRunId:"MR-abc123456789",moduleRunSequenceNo:1}}
});
assert.equal(dbOpens,0);
assert.equal(networkCalls,0);
context.QS_CONFIG.jssfRemote.enabled=true;
assert.equal(sync.featureReady(),true);
console.log("PASS: clinical, Dev and explicitly disabled remote Research cannot auto-upload");

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
assert.match(consent,/function releaseReady\(\)/);
assert.match(consent,/remote\?\.featureReady\?\.\(\)===true/);
assert.match(consent,/await remote\.enroll\(\)/);
assert.match(consent,/listWithdrawableEnrollments/);
assert.match(consent,/getRemoteResumeBundle/);
assert.match(consent,/restoreScreeningContext/);
assert.match(consent,/ทำต่อจากรอบเดิม/);
assert.match(read("result.html"),/recoverSupersededRemoteOpenRecords/);
assert.match(read("result.html"),/จบการทดสอบและส่งผล/);
assert.match(read("js\/research-store.js"),/SUPERSEDED_RUN_RECOVERED/);
assert.match(consent,/researchProfile:"community_remote_qr"/);
assert.match(consent,/operatorRole:"participant_self_service"/);
assert.match(consent,/activeNonRemoteContext\(context\)/);
assert.match(consent,/jssf_consent_setup_rollback/);
assert.match(consent,/sessionStorage\.setItem\("fast_mode","full"\)/);
assert.match(consent,/store\.addScreeningSession/);
assert.match(consent,/await remote\.enroll\(\)[\s\S]*window\.location\.href="\.\/face-test\.html"/);
const withdrawal=read("jssf-withdraw.html");
assert.match(withdrawal,/listWithdrawableEnrollments/);
assert.match(withdrawal,/requestWithdrawal\(selected\.clientSessionId\)/);
assert.match(client,/listWithdrawableEnrollments/);
assert.match(read("service-worker.js"),/quickstroke-pwa-v51/);
assert.match(read("service-worker.js"),/\/jssf-consent\.html/);
assert.match(read("service-worker.js"),/\/jssf-withdraw\.html/);
assert.match(read("result.html"),/CURRENT = calculate\(\);[\s\S]*void \(async \(\) =>/);
assert.match(read("speech-test.html"),/qualityReasonAsrInterimOnly/);
assert.match(read("face-test.html"),/next-step-emphasis/);
assert.match(read("face-test.html"),/body\.result-visible #fast-nav-btn[\s\S]*linear-gradient\(145deg,#2388FF/);
assert.match(read("face-test.html"),/body\.result-visible #start-btn[\s\S]*var\(--ios-glass-strong\)/);
assert.match(read("arm-test.html"),/next-step-emphasis/);
assert.match(read("speech-test.html"),/next-step-emphasis/);
assert.match(read("face-test.html"),/body\.screening-active:not\(\.result-visible\) #dashboard/);
assert.match(read("speech-test.html"),/qualityLimitingFlags = uniqueQualityFlags\.filter/);
assert.match(read("speech-test.html"),/flag === 'ASR_INTERIM_ONLY'[\s\S]*transcriptCoverageRatio >= RATE_MIN_TRANSCRIPT_COVERAGE/);
assert.match(read("speech-test.html"),/finalizeModuleRun\(moduleRunId,[\s\S]*qualityStatus:[\s\S]*qualityFlags:/);
assert.match(read("result.html"),/CURRENT = calculate\(\);[\s\S]*void \(async \(\) =>/);
assert.match(read("speech-test.html"),/qualityReasonAsrInterimOnly/);
assert.match(read("locales\/th-TH\/ui.json"),/ระบบได้รับเฉพาะผลถอดเสียงชั่วคราว/);
assert.match(read("config.js"),/enabled: true,[\s\S]*consentApproved: true,[\s\S]*agePolicyApproved: true,[\s\S]*retentionPolicyApproved: true/);
assert.match(client,/pending\(cred\.sessionId\)/);
console.log("PASS: all pages load gated sync client; approved live config is explicit; withdrawal can recover after tab close; offline assets updated");
