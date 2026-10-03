import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sanitizeEvent, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const event=sanitizeEvent({
  eventId:randomUUID(),
  eventType:"test_attempt_completed",
  module:"arm",
  occurredAt:new Date().toISOString(),
  payload:{
    testAttemptId:"TA-arm-p0-test",
    moduleRunId:"MR-arm-p0-test",
    attemptNo:1,
    measurementTarget:"left_arm",
    validityStatus:"valid",
    observationStatus:"no_alert",
    qualityStatus:"acceptable",
    durationMs:10000,
    armResearch:{
      schemaVersion:"arm-jssf-telemetry-0.1.0",
      protocolUnderstanding:{answer:"understood",questionVersion:"arm-protocol-understanding-1.0.0",note:"remove"},
      raiseGesture:{detected:true,maxAngleFromRestDeg:10.2,thresholdDeg:8,hardGate:true},
      measurement:{
        targetDurationMs:10000,observedDurationMs:9900,finalDriftMaxDeg:4.8,finalRatioZX:.12,finalMotionClass:"normal",
        cutoffs:[3,4,5,6,7,8,10].map(second=>({second,available:true,capturedThroughMs:second*1000,driftMaxDeg:4,peakDeltaX:.1,peakDeltaZ:.02,ratioZX:.2,motionClass:"normal"}))
      },
      posture:{baselineStableSpreadDeg:1.1,baselineScreenY:-.9,baselineScreenZ:.1,flatZThreshold:.9,portraitYMin:.55,preMeasureMaxDeltaDeg:5},
      sensor:{acceptedSamples:500,sourceSwitches:0,telemetrySamples:100},
      trace:[{tMs:0,driftDeg:0,driftMaxDeg:0,deltaX:0,deltaZ:0,ratioZX:0,screenY:-.9,screenZ:.1,sensorFresh:true,extra:"remove"}],
      extra:"remove"
    }
  }
});

assert.equal(CONTRACT_VERSION,"jssf-remote-ingest-0.2.0");
assert.equal(event.payload.armResearch.protocolUnderstanding.answer,"understood");
assert.equal(event.payload.armResearch.raiseGesture.hardGate,false);
assert.equal(event.payload.armResearch.measurement.cutoffs.length,7);
assert.equal(event.payload.armResearch.posture.flatZThreshold,.9);
assert.equal(event.payload.armResearch.sensor.telemetrySamples,100);
assert.equal(event.payload.armResearch.trace.length,1);
assert.ok(!JSON.stringify(event).includes("remove"));

assert.throws(()=>sanitizeEvent({
  eventId:randomUUID(),eventType:"test_attempt_completed",module:"arm",occurredAt:new Date().toISOString(),
  payload:{testAttemptId:"TA-arm-p0-test2",moduleRunId:"MR-arm-p0-test2",attemptNo:1,measurementTarget:"left_arm",
    armResearch:{measurement:{cutoffs:[]},trace:Array.from({length:22},(_,i)=>({tMs:i}))}}
}),/Invalid arm trace/);

console.log("PASS: Arm P0 remote telemetry is bounded, sanitized, and non-gating");
