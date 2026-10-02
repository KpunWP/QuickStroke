import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { sanitizeBatch } from "../supabase/functions/jssf-remote-ingest/payload.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const arm=fs.readFileSync(path.join(root,"arm-test.html"),"utf8");
const speech=fs.readFileSync(path.join(root,"speech-test.html"),"utf8");

function extractFunction(source,name){
  const start=source.indexOf("function "+name);
  assert.ok(start>=0,`Missing function ${name}`);
  const brace=source.indexOf("{",start);
  let depth=0,quote=null,line=false,block=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(ch==="\\"){i++;continue;}if(ch===quote)quote=null;continue;}
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"' || ch==="`"){quote=ch;continue;}
    if(ch==="{")depth++;
    if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("Unterminated "+name);
}

const normalizeGravity=extractFunction(arm,"normalizeGravityConvention");
const androidCtx={navigator:{userAgent:"Mozilla/5.0 (Linux; Android 14; 24069PC21G) Chrome/140 Mobile"}};
vm.createContext(androidCtx);
vm.runInContext(`const ARM_ANDROID_GRAVITY_COMPAT=/Android/i.test(navigator.userAgent||"");${normalizeGravity};this.run=normalizeGravityConvention;`,androidCtx);
assert.deepEqual(
  JSON.parse(JSON.stringify(androidCtx.run({x:1,y:9,z:-2},"devicemotion"))),
  {x:-1,y:-9,z:2}
);
assert.deepEqual(
  JSON.parse(JSON.stringify(androidCtx.run({x:1,y:9,z:-2},"orientation-fallback"))),
  {x:-1,y:-9,z:2}
);

const iosCtx={navigator:{userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari"}};
vm.createContext(iosCtx);
vm.runInContext(`const ARM_ANDROID_GRAVITY_COMPAT=/Android/i.test(navigator.userAgent||"");${normalizeGravity};this.run=normalizeGravityConvention;`,iosCtx);
assert.deepEqual(
  JSON.parse(JSON.stringify(iosCtx.run({x:1,y:-9,z:2},"devicemotion"))),
  {x:1,y:-9,z:2}
);
console.log("PASS: Android Arm gravity sign is normalized while iOS remains unchanged");

const asrMap=extractFunction(speech,"asrTechnicalCode");
const asrCtx={};
vm.createContext(asrCtx);
vm.runInContext(`${asrMap};this.map=asrTechnicalCode;`,asrCtx);
assert.equal(asrCtx.map("no-speech"),"ASR_NO_SPEECH");
assert.equal(asrCtx.map("network"),"ASR_NETWORK");
assert.equal(asrCtx.map("not-allowed"),"ASR_PERMISSION_OR_SERVICE_DENIED");
assert.equal(asrCtx.map("service-not-allowed"),"ASR_PERMISSION_OR_SERVICE_DENIED");
assert.equal(asrCtx.map("language-not-supported"),"ASR_LANGUAGE_OR_GRAMMAR");
assert.equal(asrCtx.map("mystery"),"ASR_OTHER_ERROR");
console.log("PASS: SpeechRecognition errors map only to coarse sanitized diagnostic codes");

const event={
  eventId:"123e4567-e89b-42d3-a456-426614174000",
  eventType:"technical_event",
  module:"speech",
  occurredAt:new Date().toISOString(),
  payload:{
    code:"ASR_NO_TRANSCRIPT",
    relatedModuleRunId:"MR-speech12345",
    transcript:"FORBIDDEN_TRANSCRIPT",
    rawAudio:"FORBIDDEN_AUDIO"
  }
};
const [sanitized]=sanitizeBatch([event]);
assert.deepEqual(sanitized.payload,{code:"ASR_NO_TRANSCRIPT",relatedModuleRunId:"MR-speech12345"});
assert.ok(!JSON.stringify(sanitized).includes("FORBIDDEN_TRANSCRIPT"));
assert.ok(!JSON.stringify(sanitized).includes("FORBIDDEN_AUDIO"));
console.log("PASS: Edge sanitizer strips transcript/raw audio from ASR diagnostics");

assert.match(speech,/const ANDROID_EXCLUSIVE_ASR = IS_ANDROID/);
assert.match(speech,/releaseAcousticCaptureForExclusiveAsr/);
assert.match(speech,/oldStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
assert.match(speech,/await sleep\(450\)/);
assert.match(speech,/if \(ANDROID_EXCLUSIVE_ASR\) flags\.push\('ACOUSTIC_METRICS_UNAVAILABLE'\)/);
assert.match(speech,/const stabScore = ANDROID_EXCLUSIVE_ASR \? null/);
assert.match(speech,/const snrDb = ANDROID_EXCLUSIVE_ASR \? null/);
assert.match(speech,/legacyWeightedScore = Number\.isFinite\(stabScore\)/);
for (const file of ["locales/th-TH/ui.json","locales/en-US/ui.json","locales/ja-JP/ui.json"]) {
  const messages=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  assert.equal(typeof messages.speech.qualityReasonAcousticUnavailable,"string");
  assert.ok(messages.speech.qualityReasonAcousticUnavailable.length>10);
}
console.log("PASS: Android Speech exclusive-ASR mode releases WebAudio and marks acoustic metrics unavailable");
