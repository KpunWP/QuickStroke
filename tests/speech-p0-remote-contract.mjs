import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sanitizeEvent, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

assert.equal(CONTRACT_VERSION,"jssf-remote-ingest-0.6.0");

const event=sanitizeEvent({
  eventId:randomUUID(),
  eventType:"test_attempt_completed",
  module:"speech",
  occurredAt:new Date().toISOString(),
  payload:{
    testAttemptId:"TA-speech-p0-test",
    moduleRunId:"MR-speech-p0-test",
    attemptNo:1,
    measurementTarget:"speech",
    validityStatus:"valid",
    observationStatus:"no_alert",
    qualityStatus:"acceptable",
    durationMs:2400,
    transcript:"FORBIDDEN_TRANSCRIPT",
    rawAudio:"FORBIDDEN_AUDIO",
    speechResearch:{
      schemaVersion:"speech-remote-research-0.1.0",
      timing:{durationMs:1320,policy:"asr_mic_hybrid_v1_1",startSource:"asr_mic_confirmed",endSource:"mic_last_active"},
      pcmProbe:{enabled:true,available:true,policy:"calibrated_time_domain_vad_probe_v1",startOffsetMs:900,endOffsetMs:2150,durationMs:1250,voiceFrameCount:62,audioContextSampleRate:48000},
      phrase:{
        exactAcceptedVariant:true,similarity:1,transcriptCoverageRatio:1,reliable:true,
        observationStatus:"no_alert",
        alternativeSelectionPolicy:"target_phrase_similarity_best_alternative",
        transcript:"FORBIDDEN_NESTED_TRANSCRIPT"
      },
      rate:{speechUnitsPerSec:4.54,reliable:true,referenceStatus:"within_reference"},
      asr:{finalReceived:true,eventCount:7,startCount:2,restartCount:1,resultCount:2,finalResultCount:1,errorCount:0},
      quality:{status:"acceptable",flags:["ASR_INTERIM_ONLY"],acousticMetricsAvailable:true},
      platform:{isIOS:true,isAndroid:false,androidExclusiveAsr:false},
      privacy:{rawAudioStored:true,transcriptIncluded:true,rawFramesIncluded:true},
      frames:["FORBIDDEN_FRAME"]
    }
  }
});

assert.equal(event.payload.speechResearch.phrase.exactAcceptedVariant,true);
assert.equal(event.payload.speechResearch.asr.restartCount,1);
assert.equal(event.payload.speechResearch.pcmProbe.durationMs,1250);
assert.equal(event.payload.speechResearch.pcmProbe.audioContextSampleRate,48000);
assert.equal(event.payload.speechResearch.platform.isIOS,true);
assert.equal(event.payload.speechResearch.privacy.rawAudioStored,false);
assert.equal(event.payload.speechResearch.privacy.transcriptIncluded,false);
assert.equal(event.payload.speechResearch.privacy.rawFramesIncluded,false);

const json=JSON.stringify(event);
for (const forbidden of ["FORBIDDEN_TRANSCRIPT","FORBIDDEN_NESTED_TRANSCRIPT","FORBIDDEN_AUDIO","FORBIDDEN_FRAME"]) {
  assert.ok(!json.includes(forbidden), forbidden+" leaked through sanitizer");
}

assert.throws(()=>sanitizeEvent({
  eventId:randomUUID(),eventType:"test_attempt_completed",module:"speech",occurredAt:new Date().toISOString(),
  payload:{testAttemptId:"TA-speech-p0-test2",moduleRunId:"MR-speech-p0-test2",attemptNo:1,measurementTarget:"speech",
    speechResearch:{timing:{durationMs:999999}}}
}),/speechDurationMs/);

assert.throws(()=>sanitizeEvent({
  eventId:randomUUID(),eventType:"test_attempt_completed",module:"speech",occurredAt:new Date().toISOString(),
  payload:{testAttemptId:"TA-speech-pcm-test",moduleRunId:"MR-speech-pcm-test",attemptNo:1,measurementTarget:"speech",
    speechResearch:{pcmProbe:{enabled:true,durationMs:999999}}}
}),/speechPcmProbeDurationMs/);

console.log("PASS: Speech P0 remote telemetry is bounded and sanitized");
console.log("PASS: Android PCM probe telemetry is bounded derived timing only");
console.log("PASS: transcript/raw audio/raw frames are excluded");
