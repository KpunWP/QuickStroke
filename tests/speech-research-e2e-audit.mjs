import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { sanitizeEvent, CONTRACT_VERSION }
  from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const client=read("js/jssf-remote-sync.js");
const config=read("config.js");

let currentContext={
  appMode:"research",
  screeningSessionId:"S-speech-e2e-abcdef123456",
  researchMetadata:{researchProfile:"community_remote_qr",consentStatus:"consented"}
};
const context={
  console,Promise,Date,JSON,Object,Array,String,Number,RegExp,Set,Map,
  crypto:{randomUUID:()=>crypto.randomUUID()},
  fetch:()=>{throw new Error("network not required for contract audit");},
  indexedDB:{open:()=>{throw new Error("IndexedDB not required for event conversion audit");}},
  addEventListener:()=>{},
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
assert.equal(sync.featureReady(),true);
assert.equal(sync.canSync(),true);

const canonicalAttempt={
  module:"speech",
  screeningSessionId:currentContext.screeningSessionId,
  moduleRunId:"MR-speech-e2e-001",
  testAttemptId:"TA-speech-e2e-001",
  attemptSequenceNo:1,
  measurementTarget:"speech",
  validityStatus:"valid",
  observationStatus:"no_alert",
  qualityStatus:"acceptable",
  qualityFlags:[],
  startedAt:"2026-10-04T02:00:00.000Z",
  completedAt:"2026-10-04T02:00:01.500Z",
  transcript:"FORBIDDEN_TRANSCRIPT",
  rawAudio:"FORBIDDEN_AUDIO",
  rawFrames:["FORBIDDEN_FRAME"],
  speechResearchTelemetry:{
    schemaVersion:"speech-remote-research-0.1.0",
    timing:{
      durationMs:1500,
      policy:"asr_mic_hybrid_v1_1",
      startSource:"asr_mic_confirmed",
      endSource:"mic_last_active"
    },
    phrase:{
      exactAcceptedVariant:true,
      similarity:1,
      transcriptCoverageRatio:1,
      reliable:true,
      observationStatus:"no_alert",
      alternativeSelectionPolicy:"target_phrase_similarity_best_alternative",
      transcript:"FORBIDDEN_NESTED_TRANSCRIPT"
    },
    rate:{
      speechUnitsPerSec:4,
      reliable:true,
      referenceStatus:"within_reference"
    },
    asr:{
      finalReceived:true,
      eventCount:8,
      startCount:2,
      restartCount:1,
      resultCount:2,
      finalResultCount:1,
      errorCount:0
    },
    quality:{
      status:"acceptable",
      flags:[],
      acousticMetricsAvailable:true
    },
    platform:{
      isIOS:true,
      isAndroid:false,
      androidExclusiveAsr:false
    },
    privacy:{
      rawAudioStored:true,
      transcriptIncluded:true,
      rawFramesIncluded:true
    }
  }
};

const browserEvent=sync.eventFromRecord("test_attempt",canonicalAttempt);
assert.equal(browserEvent.eventType,"test_attempt_completed");
assert.equal(browserEvent.module,"speech");
assert.equal(browserEvent.payload.speechResearch.timing.durationMs,1500);
assert.equal(browserEvent.payload.speechResearch.asr.restartCount,1);
assert.equal(browserEvent.payload.speechResearch.phrase.exactAcceptedVariant,true);
assert.equal(browserEvent.payload.speechResearch.privacy.rawAudioStored,false);
assert.equal(browserEvent.payload.speechResearch.privacy.transcriptIncluded,false);
assert.equal(browserEvent.payload.speechResearch.privacy.rawFramesIncluded,false);

const browserJson=JSON.stringify(browserEvent);
for(const forbidden of [
  "FORBIDDEN_TRANSCRIPT","FORBIDDEN_NESTED_TRANSCRIPT","FORBIDDEN_AUDIO","FORBIDDEN_FRAME"
]){
  assert.ok(!browserJson.includes(forbidden),forbidden+" leaked from browser sanitizer");
}
console.log("PASS: canonical Speech attempt becomes bounded browser remote event");

const serverEvent=sanitizeEvent({
  eventId:crypto.randomUUID(),
  eventType:browserEvent.eventType,
  module:browserEvent.module,
  occurredAt:browserEvent.occurredAt,
  payload:browserEvent.payload
});
assert.equal(CONTRACT_VERSION,"jssf-remote-ingest-0.6.0");
assert.equal(serverEvent.payload.speechResearch.timing.durationMs,1500);
assert.equal(serverEvent.payload.speechResearch.asr.restartCount,1);
assert.equal(serverEvent.payload.speechResearch.phrase.alternativeSelectionPolicy,
  "target_phrase_similarity_best_alternative");
assert.equal(serverEvent.payload.speechResearch.privacy.rawAudioStored,false);
assert.equal(serverEvent.payload.speechResearch.privacy.transcriptIncluded,false);
assert.equal(serverEvent.payload.speechResearch.privacy.rawFramesIncluded,false);
console.log("PASS: Edge sanitizer preserves bounded Speech research summary");

currentContext={
  appMode:"public",
  screeningSessionId:"S-public-abcdef123456",
  researchMetadata:null
};
assert.equal(sync.canSync(),false);

currentContext={
  appMode:"research",
  screeningSessionId:"S-clinic-abcdef123456",
  researchMetadata:{researchProfile:"clinic_supervised",consentStatus:"consented"}
};
assert.equal(sync.canSync(),false);

currentContext={
  appMode:"dev",
  screeningSessionId:"S-dev-abcdef123456",
  researchMetadata:null
};
assert.equal(sync.canSync(),false);
console.log("PASS: Public, clinic Research, and Dev remain excluded from JSSF remote sync");

const speech=read("speech-test.html");
assert.match(speech,/attempt\.speechResearchTelemetry = buildSpeechJssfResearchTelemetry\(payload, asrEvents\)/);
assert.match(speech,/rawAudioStored:false/);
assert.match(speech,/transcriptIncluded:false/);
assert.match(speech,/rawFramesIncluded:false/);

for(const file of [
  "tests/speech-p0-remote-contract.mjs",
  "tests/speech-asr-replay.mjs",
  "tests/speech-timing-rate-replay.mjs",
  "tests/speech-device-browser-hardening.mjs"
]){
  assert.ok(fs.existsSync(path.join(root,file)),file+" missing");
}
console.log("PASS: Speech P0 A-E audit coverage is present");

const workflow=read(".github/workflows/speech-p0-validation.yml");
for(const command of [
  "node tests/run-tests.mjs",
  "node tests/jssf-remote-client.mjs",
  "node tests/speech-p0-remote-contract.mjs",
  "node tests/speech-asr-replay.mjs",
  "node tests/speech-timing-rate-replay.mjs",
  "node tests/speech-device-browser-hardening.mjs",
  "python3 tests/check-inline-scripts.py"
]){
  assert.ok(workflow.includes(command),"workflow missing "+command);
}
console.log("PASS: Speech P0 CI executes full research audit set");
