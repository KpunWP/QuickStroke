import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const configSource=fs.readFileSync(path.join(root,"config.js"),"utf8");
const speechSource=fs.readFileSync(path.join(root,"speech-test.html"),"utf8");

const ctx={window:{}};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(configSource,ctx);
const cfg=ctx.QS_CONFIG.thresholds.speech;

assert.equal(cfg.normalMin,2.5);
assert.equal(cfg.normalMax,6.0);
assert.equal(cfg.rateMinTranscriptCoverage,0.60);
assert.equal(cfg.rateSpeechUnitSource,"target_phrase_fixed");
assert.equal(cfg.rateTimingPolicy,"asr_mic_hybrid_v1_1");

function rateObservation({units,durationSec,coverage,startSource,endSource}){
  const value=units/Math.max(durationSec,0.2);
  const timingUsesFallback=
    ["legacy_energy_fallback","current_activity_fallback"].includes(startSource) ||
    ["legacy_energy_fallback","current_activity_fallback"].includes(endSource);
  const reliable=Number.isFinite(coverage) &&
    coverage>=cfg.rateMinTranscriptCoverage &&
    !timingUsesFallback;
  const referenceStatus=!reliable?"unavailable":
    value<cfg.normalMin?"below_reference":
    value>cfg.normalMax?"above_reference":"within_reference";
  return {value,reliable,referenceStatus};
}

const units=6;
const durationCases=[
  [0.9,"above_reference"],
  [1.0,"within_reference"],
  [1.5,"within_reference"],
  [2.4,"within_reference"],
  [2.5,"below_reference"]
];
for(const [durationSec,status] of durationCases){
  const r=rateObservation({
    units,durationSec,coverage:1,
    startSource:"asr_mic_confirmed",endSource:"mic_last_active"
  });
  assert.equal(r.referenceStatus,status,"duration "+durationSec+"s");
}
console.log("PASS: fixed 6-unit phrase reproduces current 2.5–6.0 units/s reference boundaries");

for(const coverage of [0,0.3,0.59]){
  const r=rateObservation({
    units,durationSec:1.5,coverage,
    startSource:"asr_mic_confirmed",endSource:"mic_last_active"
  });
  assert.equal(r.reliable,false);
  assert.equal(r.referenceStatus,"unavailable");
}
for(const coverage of [0.60,0.8,1]){
  const r=rateObservation({
    units,durationSec:1.5,coverage,
    startSource:"asr_mic_confirmed",endSource:"mic_last_active"
  });
  assert.equal(r.reliable,true);
  assert.equal(r.referenceStatus,"within_reference");
}
console.log("PASS: transcript coverage boundary is deterministic at 0.60");

for(const [startSource,endSource] of [
  ["legacy_energy_fallback","mic_last_active"],
  ["asr_mic_confirmed","legacy_energy_fallback"],
  ["asr_mic_confirmed","current_activity_fallback"]
]){
  const r=rateObservation({units,durationSec:1.5,coverage:1,startSource,endSource});
  assert.equal(r.reliable,false);
  assert.equal(r.referenceStatus,"unavailable");
}
console.log("PASS: fallback timing sources make rate unavailable even when numeric rate is normal");

for(const [startSource,endSource] of [
  ["asr_mic_confirmed","mic_last_active"],
  ["asr_speech_start","asr_speech_end"],
  ["mic_activity","mic_last_active"]
]){
  const r=rateObservation({units,durationSec:1.5,coverage:1,startSource,endSource});
  assert.equal(r.reliable,true);
}
console.log("PASS: supported non-fallback timing sources remain rate-eligible");

function boundarySensitivity(durationSec,deltaMs){
  const base=rateObservation({
    units,durationSec,coverage:1,
    startSource:"asr_mic_confirmed",endSource:"mic_last_active"
  });
  const shifted=rateObservation({
    units,durationSec:durationSec+deltaMs/1000,coverage:1,
    startSource:"asr_mic_confirmed",endSource:"mic_last_active"
  });
  return {base,shifted};
}

const fastBoundary=boundarySensitivity(1.0,80);
assert.equal(fastBoundary.base.referenceStatus,"within_reference");
assert.equal(fastBoundary.shifted.referenceStatus,"within_reference");
assert.ok(fastBoundary.base.value-fastBoundary.shifted.value>0.4);

const slowBoundary=boundarySensitivity(2.4,80);
assert.equal(slowBoundary.base.referenceStatus,"within_reference");
assert.equal(slowBoundary.shifted.referenceStatus,"below_reference");
console.log("PASS: replay documents that +80ms timing shift can cross the slow-rate boundary near 2.4s");

assert.match(speechSource,/const syllPerSec = rateSpeechUnitCount \/ Math\.max\(durSec, 0\.2\)/);
assert.match(speechSource,/transcriptCoverageRatio >= RATE_MIN_TRANSCRIPT_COVERAGE/);
assert.match(speechSource,/RATE_TIMING_FALLBACK/);
assert.match(speechSource,/timingUsesFallback/);
console.log("PASS: timing/rate replay remains wired to current production policy");

console.log("OBSERVATION: rate classification is timing-sensitive near reference boundaries; no threshold change made.");
