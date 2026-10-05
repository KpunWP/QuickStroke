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
assert.equal(sync.version,"jssf-remote-client-0.2.0");
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
 invalidReasonCode:"WRIST_MOVEMENT",
 armResearchTelemetry:{
   schemaVersion:"arm-jssf-telemetry-0.1.0",
   protocolUnderstanding:{answer:"not_understood",questionVersion:"arm-protocol-understanding-1.0.0",note:"drop-me"},
   raiseGesture:{detected:true,maxAngleFromRestDeg:12.3456,thresholdDeg:8,hardGate:true},
   measurement:{targetDurationMs:10000,observedDurationMs:9912,finalDriftMaxDeg:11.4,finalRatioZX:0.25,finalMotionClass:"possible_arm_drift",
     cutoffs:[3,4,5,6,7,8,10].map(second=>({second,available:true,capturedThroughMs:second*1000,driftMaxDeg:second,peakDeltaX:.1,peakDeltaZ:.04,ratioZX:.4,motionClass:"normal"}))},
   posture:{baselineStableSpreadDeg:1.2,baselineScreenY:-.88,baselineScreenZ:.12,flatZThreshold:.9,portraitYMin:.55,preMeasureMaxDeltaDeg:5},
   sensor:{acceptedSamples:500,sourceSwitches:0,telemetrySamples:100},
   trace:Array.from({length:30},(_,i)=>({tMs:Math.min(i*400,12000),driftDeg:i/10,driftMaxDeg:i/10,deltaX:.1,deltaZ:.04,ratioZX:.4,screenY:-.8,screenZ:.1,sensorFresh:true,extra:"drop-me"}))
 }
});
assert.equal(attempt.eventType,"test_attempt_completed");
assert.equal(attempt.payload.attemptNo,2);
assert.equal(attempt.payload.invalidReasonCode,"WRIST_MOVEMENT");
assert.equal(attempt.payload.qualityStatus,"limited");
assert.equal(attempt.payload.armResearch.protocolUnderstanding.answer,"not_understood");
assert.equal(attempt.payload.armResearch.raiseGesture.hardGate,false);
assert.equal(attempt.payload.armResearch.measurement.cutoffs.length,7);
assert.equal(attempt.payload.armResearch.trace.length,21);
assert.equal(attempt.payload.armResearch.posture.flatZThreshold,.9);
assert.equal(attempt.payload.armResearch.sensor.telemetrySamples,100);
assert.doesNotMatch(JSON.stringify(attempt),/drop-me|rawSensorValues/);
console.log("PASS: canonical event conversion sends bounded sanitized Arm research telemetry");

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
assert.match(consent,/ก่อนเริ่มการทดสอบ/);
assert.match(consent,/Code Scanner/);
assert.match(consent,/Chrome หรือ browser หลักของเครื่อง/);
assert.match(consent,/renderBrowserGuidance\(\)/);
assert.match(consent,/openExternalBrowser/);
assert.match(consent,/เปิดด้วย Safari/);
assert.match(consent,/requiresExternalBrowser/);
assert.match(read("result.html"),/recoverSupersededRemoteOpenRecords/);
assert.match(read("result.html"),/จบการทดสอบและส่งผล/);
assert.match(read("js\/research-store.js"),/SUPERSEDED_RUN_RECOVERED/);
assert.match(read("js/research-store.js"),/const done = transactionToPromise\(tx\);[\s\S]*await done;/);
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
assert.match(read("service-worker.js"),/quickstroke-pwa-v69/);
assert.match(read("service-worker.js"),/\/jssf-consent\.html/);
assert.match(read("service-worker.js"),/\/jssf-withdraw\.html/);
assert.match(read("result.html"),/CURRENT = calculate\(\);[\s\S]*void \(async \(\) =>/);
assert.match(read("speech-test.html"),/qualityReasonAsrInterimOnly/);
assert.match(read("face-test.html"),/next-step-emphasis/);
assert.match(read("face-test.html"),/body\.result-visible #fast-nav-btn[\s\S]*linear-gradient\(145deg,#2388FF/);
assert.match(read("face-test.html"),/body\.result-visible #start-btn[\s\S]*var\(--ios-glass-strong\)/);
assert.match(read("arm-test.html"),/next-step-emphasis/);
assert.match(read("speech-test.html"),/next-step-emphasis/);
assert.match(read("speech-test.html"),/preparePrompt/);
assert.match(read("speech-test.html"),/speakNowPrompt/);
assert.match(read("speech-test.html"),/analyzingPrompt/);
assert.match(read("speech-test.html"),/ANDROID_EXCLUSIVE_ASR/);
assert.match(read("speech-test.html"),/ACOUSTIC_METRICS_UNAVAILABLE/);
assert.match(read("speech-test.html"),/releaseAcousticCaptureForExclusiveAsr/);
assert.match(read("speech-test.html"),/ANDROID_PHRASE_PAUSE_MS/);
assert.match(read("speech-test.html"),/mergeSpeechTranscripts/);
assert.match(read("speech-test.html"),/commitCurrentAndroidSession/);
assert.match(read("locales\/th-TH\/ui.json"),/ไม่มีค่า SNR/);
assert.match(read("arm-test.html"),/ARM_ANDROID_GRAVITY_COMPAT/);
assert.match(read("arm-test.html"),/normalizeGravityConvention\(raw, source\)/);
assert.match(read("arm-test.html"),/const normalizedRaw = normalizeGravityConvention\(raw, source\)/);
assert.match(read("speech-test.html"),/ASR_NO_TRANSCRIPT/);
assert.match(read("speech-test.html"),/ASR_NETWORK/);
assert.match(client,/queueTechnicalEvent/);
assert.match(client,/ASR_PERMISSION_OR_SERVICE_DENIED/);
assert.match(read("supabase\/functions\/jssf-remote-ingest\/payload.mjs"),/ASR_NO_TRANSCRIPT/);
assert.match(read("supabase\/functions\/jssf-remote-ingest\/payload.mjs"),/ASR_NETWORK/);
assert.match(read("speech-test.html"),/#test-screen\.done #fast-nav-btn,[\s\S]*position:static!important/);
assert.match(read("locales\/th-TH\/ui.json"),/เริ่มพูดได้เลยตอนนี้/);
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
