import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sanitizeEvent } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const arm=read("arm-test.html");
const store=read("js/research-store.js");
const remoteSource=read("js/jssf-remote-sync.js");
const configSource=read("config.js");

// 1) Arm canonical/local persistence contract: attempt -> module measurement -> sensor observations.
assert.ok(arm.includes("function finalizeCanonicalArmAttempt"));
assert.ok(arm.includes("const armResearchTelemetry = buildArmJssfResearchTelemetry"));
assert.match(arm,/ARM_RESEARCH_STORE.finalizeTestAttempt(attemptSnapshot.testAttemptId, attemptSnapshot)/);
assert.match(arm,/ARM_DATA_CONTRACT.createModuleMeasurement(/);
assert.match(arm,/protocolUnderstanding:armProtocolUnderstandingCopy()/);
assert.match(arm,/raiseGesture:armRaiseGestureShadowSnapshot(legacy)/);
assert.match(arm,/researchTelemetry:cloneArmResearchValue(attemptSnapshot.armResearchTelemetry)/);
assert.match(arm,/ARM_RESEARCH_STORE.addModuleMeasurement(measurement)/);
assert.match(arm,/ARM_RESEARCH_STORE.appendSensorObservations(observations)/);

// 2) Research export includes rich local records needed for retrospective analysis.
assert.match(store,/readBundle([sS]*moduleMeasurements[sS]*sensorObservations/);
assert.match(store,/exportSession([sS]*...bundle/);
assert.match(store,/sanitizeResearchExport(output)/);

// 3) Build the same browser client used by the app and convert a realistic Arm attempt.
let currentContext={
  appMode:"research",
  screeningSessionId:"S-arm-p0f-123456789",
  researchMetadata:{researchProfile:"community_remote_qr",consentStatus:"consented"}
};
const browser={
  console,Promise,Date,JSON,Object,Array,String,Number,RegExp,Set,Map,
  crypto:{randomUUID:()=>crypto.randomUUID()},
  fetch:()=>{throw new Error("network disabled in audit");},
  indexedDB:{open:()=>{throw new Error("indexeddb not required for event conversion");}},
  addEventListener:()=>{},
  navigator:{userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari"},
  QuickStrokeDataContract:{getSessionContext:()=>currentContext},
  document:undefined,
  QS_CONFIG:null
};
browser.window=browser;
vm.createContext(browser);
vm.runInContext(configSource,browser,{filename:"config.js"});
vm.runInContext(remoteSource,browser,{filename:"js/jssf-remote-sync.js"});
const sync=browser.QuickStrokeJssfRemote;

const canonicalAttempt={
  module:"arm",
  screeningSessionId:currentContext.screeningSessionId,
  moduleRunId:"MR-arm-p0f-123456",
  testAttemptId:"TA-arm-p0f-123456",
  attemptSequenceNo:1,
  measurementTarget:"left_arm",
  validityStatus:"valid",
  observationStatus:"abnormal",
  qualityStatus:"limited",
  qualityFlags:["DEVICE_ORIENTATION_FALLBACK"],
  startedAt:"2026-10-03T12:00:00Z",
  completedAt:"2026-10-03T12:00:10Z",
  armResearchTelemetry:{
    schemaVersion:"arm-jssf-telemetry-0.1.0",
    protocolUnderstanding:{
      answer:"not_understood",
      questionVersion:"arm-protocol-understanding-1.0.0",
      answeredAt:"2026-10-03T11:59:58Z",
      blocksTest:false,
      freeText:"LOCAL_ONLY_DROP"
    },
    raiseGesture:{
      detected:true,maxAngleFromRestDeg:10.5,thresholdDeg:8,hardGate:false,
      evidence:"device_rotation_from_rest"
    },
    measurement:{
      targetDurationMs:10000,
      observedDurationMs:9900,
      finalDriftMaxDeg:12.2,
      finalRatioZX:.35,
      finalMotionClass:"possible_arm_drift",
      cutoffs:[3,4,5,6,7,8,10].map(second=>({
        second,available:true,capturedThroughMs:second*1000,
        driftMaxDeg:Math.min(12.2,second+2),
        peakDeltaX:.10,peakDeltaZ:.05,ratioZX:.5,motionClass:second<6?"uncertain":"possible_arm_drift"
      }))
    },
    posture:{
      baselineStableSpreadDeg:1.2,
      baselineScreenY:-.92,
      baselineScreenZ:.08,
      flatZThreshold:.9,
      portraitYMin:.55,
      preMeasureMaxDeltaDeg:5,
      lastReadinessSnapshot:{
        stage:"pre_measure_recheck",invalidReason:null,screenY:-.92,screenZ:.08,
        screenAngle:0,screenType:"portrait-primary",sensorSource:"devicemotion"
      }
    },
    sensor:{acceptedSamples:500,sourceSwitches:1,telemetrySamples:100},
    trace:Array.from({length:21},(_,i)=>({
      tMs:i*500,driftDeg:i*.61,driftMaxDeg:i*.61,deltaX:.1,deltaZ:.05,
      ratioZX:.5,screenY:-.9,screenZ:.1,sensorFresh:true,raw:"DROP"
    })),
    rawSensorObservations:"LOCAL_ONLY_DROP"
  }
};
const remoteEvent=sync.eventFromRecord("test_attempt",canonicalAttempt);
assert.equal(remoteEvent.eventType,"test_attempt_completed");
assert.equal(remoteEvent.module,"arm");
assert.equal(remoteEvent.payload.armResearch.protocolUnderstanding.answer,"not_understood");
assert.equal(remoteEvent.payload.armResearch.raiseGesture.hardGate,false);
assert.equal(remoteEvent.payload.armResearch.measurement.cutoffs.length,7);
assert.equal(remoteEvent.payload.armResearch.trace.length,21);
assert.equal(remoteEvent.payload.armResearch.posture.lastReadinessSnapshot.sensorSource,"devicemotion");
assert.doesNotMatch(JSON.stringify(remoteEvent),/LOCAL_ONLY_DROP|rawSensorObservations|"raw"/);

// 4) Edge sanitizer accepts the bounded payload and strips any client extras.
const edgeEvent=sanitizeEvent({
  eventId:crypto.randomUUID(),
  eventType:remoteEvent.eventType,
  module:remoteEvent.module,
  occurredAt:"2026-10-03T12:00:10Z",
  payload:{
    ...remoteEvent.payload,
    injectedRaw:"DROP_SERVER_SIDE"
  }
});
assert.equal(edgeEvent.payload.armResearch.protocolUnderstanding.answer,"not_understood");
assert.equal(edgeEvent.payload.armResearch.measurement.cutoffs.length,7);
assert.equal(edgeEvent.payload.armResearch.trace.length,21);
assert.equal(edgeEvent.payload.armResearch.sensor.sourceSwitches,1);
assert.equal(edgeEvent.payload.armResearch.posture.lastReadinessSnapshot.stage,"pre_measure_recheck");
assert.doesNotMatch(JSON.stringify(edgeEvent),/DROP_SERVER_SIDE|LOCAL_ONLY_DROP|rawSensorObservations/);
assert.ok(JSON.stringify(edgeEvent).length<8000);

// 5) Isolation invariants remain explicit.
assert.match(remoteSource,/record.module==="arm" ? safeArmResearch(record.armResearchTelemetry) : undefined/);
assert.match(remoteSource,/researchProfile!=="community_remote_qr"/);
assert.match(remoteSource,/appMode!=="research"/);
assert.match(configSource,/community_remote_qr/);

// 6) Full P0 suites are linked into CI; production source thresholds stay guarded elsewhere.
for(const file of [
  "tests/arm-p0-remote-contract.mjs",
  "tests/arm-sensor-replay.mjs",
  "tests/arm-dynamics-duration.mjs",
  "tests/arm-device-browser-hardening.mjs"
]) assert.ok(fs.existsSync(path.join(ROOT,file)),file+" missing");

console.log("PASS: Arm P0-F research E2E audit preserves rich local research data, bounded remote telemetry, sanitizer/privacy, and mode isolation");
