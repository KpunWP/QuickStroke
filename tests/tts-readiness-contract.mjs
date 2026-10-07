import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeEvent, CONTRACT_VERSION } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const now=new Date().toISOString();
const evt=sanitizeEvent({
  eventId:"123e4567-e89b-42d3-a456-426614174000",
  eventType:"technical_event",
  module:"arm",
  occurredAt:now,
  payload:{
    code:"TTS_NO_START",
    tts:{
      stage:"prompt",
      status:"no_start",
      lang:"th-TH",
      synthesisAvailable:true,
      voiceCount:12,
      matchingVoiceCount:0,
      errorCode:"no_start",
      voiceNames:["FORBIDDEN"],
      userAgent:"FORBIDDEN",
      promptText:"FORBIDDEN_PROMPT",
      deliveryMode:"english_fallback",
      spokenLang:"en-US"
    }
  }
});
assert.equal(CONTRACT_VERSION,"jssf-remote-ingest-0.5.0");
assert.deepEqual(evt.payload.tts,{
  stage:"prompt",
  status:"no_start",
  lang:"th-TH",
  deliveryMode:"english_fallback",
  spokenLang:"en-US",
  synthesisAvailable:true,
  voiceCount:12,
  matchingVoiceCount:0,
  errorCode:"no_start"
});
assert.ok(!JSON.stringify(evt).includes("voiceNames"));
assert.ok(!JSON.stringify(evt).includes("userAgent"));
assert.ok(!JSON.stringify(evt).includes("FORBIDDEN_PROMPT"));

assert.throws(()=>sanitizeEvent({
  eventId:"123e4567-e89b-42d3-a456-426614174001",
  eventType:"technical_event",
  module:"speech",
  occurredAt:now,
  payload:{code:"TTS_READINESS",tts:{stage:"prime",status:"available",lang:"th-TH",voiceCount:999}}
}),/Invalid ttsVoiceCount/);

const remote=fs.readFileSync(path.join(ROOT,"js/jssf-remote-sync.js"),"utf8");
const edge=fs.readFileSync(path.join(ROOT,"supabase/functions/jssf-remote-ingest/index.ts"),"utf8");
const face=fs.readFileSync(path.join(ROOT,"face-test.html"),"utf8");
const arm=fs.readFileSync(path.join(ROOT,"arm-test.html"),"utf8");
const speech=fs.readFileSync(path.join(ROOT,"speech-test.html"),"utf8");
const consent=fs.readFileSync(path.join(ROOT,"jssf-consent.html"),"utf8");
const sw=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");

assert.match(remote,/SamsungBrowser/);
assert.match(remote,/samsung_internet/);
assert.ok(remote.indexOf("SamsungBrowser") < remote.indexOf('/firefox|fxios'));
assert.match(edge,/samsung_internet/);
assert.match(remote,/queueTtsTelemetry/);

assert.match(face,/showSmilePrompt\(FL\.smilePrompt\)/);
assert.match(face,/TTS_NO_START/);
assert.match(arm,/\$\('instr'\)\.textContent\s*=\s*T\.instrMeasure/);
assert.match(arm,/\$\('cd-num'\)\.textContent/);
assert.match(arm,/TTS_NO_START/);
assert.match(speech,/\$\('hint-text'\)\.textContent\s*=\s*T\.speakNowPrompt/);
assert.match(speech,/TTS_NO_START/);
for (const html of [face,arm,speech,consent,result]) assert.match(html,/config\.js\?v=20261007-audio-fallback-v20/);
assert.match(face,/english_fallback/);
assert.match(face,/Face forward and keep still/);
assert.match(arm,/english_fallback/);
assert.match(arm,/Start\. Close your eyes and keep your arm still/);
assert.match(speech,/english_fallback/);
assert.match(speech,/You may start speaking/);
const result=fs.readFileSync(path.join(ROOT,"result.html"),"utf8");
assert.match(result,/jssfCompletionSpeechPlan/);
assert.match(result,/Test complete\. Thank you\./);
assert.match(sw,/url\.pathname === "\/config\.js"/);
assert.match(sw,/cache: "no-cache"/);
assert.match(result,/english_fallback/);
assert.match(result,/Test complete\. Thank you\./);

console.log("PASS: bounded TTS telemetry, Thai-to-English spoken fallback, Samsung classification, and visual fallbacks");
