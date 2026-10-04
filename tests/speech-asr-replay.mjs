import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const speech=fs.readFileSync(path.join(root,"speech-test.html"),"utf8");
const configSource=fs.readFileSync(path.join(root,"config.js"),"utf8");

function extractFunction(source,name){
  const start=source.indexOf("function "+name);
  assert.ok(start>=0,"Missing function "+name);
  const brace=source.indexOf("{",start);
  let depth=0,quote=null,line=false,block=false,regex=false,charClass=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(ch==="\\"){i++;continue;}if(ch===quote)quote=null;continue;}
    if(regex){
      if(ch==="\\"){i++;continue;}
      if(ch==="[")charClass=true;
      if(ch==="]")charClass=false;
      if(ch==="/"&&!charClass)regex=false;
      continue;
    }
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue;}
    if(ch==="/" && /[=(,:;!&|?{}\[]/.test(source.slice(0,i).trim().slice(-1) || "=")){regex=true;continue;}
    if(ch==="{")depth++;
    if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("Unterminated "+name);
}

function normalizeSpeechText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[.,!?。、「」"\s]/g, "")
    .replace(/良い/g, "いい")
    .replace(/よい/g, "いい")
    .replace(/綺麗/g, "きれい")
    .replace(/きょう/g, "今日");
}

const mergeCtx={normalizeSpeechText};
vm.createContext(mergeCtx);
vm.runInContext(
  extractFunction(speech,"dropNormalizedPrefix")+"\n"+
  extractFunction(speech,"mergeSpeechTranscripts")+"\n"+
  "this.merge=mergeSpeechTranscripts;",
  mergeCtx
);
const merge=(a,b)=>mergeCtx.merge(a,b);

assert.equal(merge("วันนี้","ท้องฟ้าแจ่มใส"),"วันนี้ ท้องฟ้าแจ่มใส");
assert.equal(merge("วันนี้ท้อง","ท้องฟ้าแจ่มใส"),"วันนี้ท้อง ฟ้าแจ่มใส");
assert.equal(merge("วันนี้","วันนี้ท้องฟ้าแจ่มใส"),"วันนี้ท้องฟ้าแจ่มใส");
assert.equal(merge("วันนี้ท้องฟ้าแจ่มใส","ท้องฟ้าแจ่มใส"),"วันนี้ท้องฟ้าแจ่มใส");
assert.equal(merge("วันนี้ท้องฟ้า","วันนี้ท้องฟ้า"),"วันนี้ท้องฟ้า");
console.log("PASS: transcript merging handles pause fragments, overlap, supersets, and duplicates");

function replayAndroidSessions(sessionTranscripts){
  let accumulated="";
  let restarts=0;
  for(let i=0;i<sessionTranscripts.length;i++){
    const current=sessionTranscripts[i] || "";
    if(current) accumulated=merge(accumulated,current);
    if(i<sessionTranscripts.length-1) restarts++;
  }
  return {transcript:accumulated,restarts};
}

assert.deepEqual(
  replayAndroidSessions(["วันนี้","ท้องฟ้า","แจ่มใส"]),
  {transcript:"วันนี้ ท้องฟ้า แจ่มใส",restarts:2}
);
assert.deepEqual(
  replayAndroidSessions(["วันนี้ท้อง","ท้องฟ้าแจ่มใส",""]),
  {transcript:"วันนี้ท้อง ฟ้าแจ่มใส",restarts:2}
);
assert.deepEqual(
  replayAndroidSessions(["วันนี้","วันนี้ท้องฟ้าแจ่มใส"]),
  {transcript:"วันนี้ท้องฟ้าแจ่มใส",restarts:1}
);
console.log("PASS: deterministic Android multi-session replay preserves one phrase across natural pauses");

const asrMap=extractFunction(speech,"asrTechnicalCode");
const asrCtx={};
vm.createContext(asrCtx);
vm.runInContext(asrMap+";this.map=asrTechnicalCode;",asrCtx);
assert.equal(asrCtx.map("no-speech"),"ASR_NO_SPEECH");
assert.equal(asrCtx.map("network"),"ASR_NETWORK");
assert.equal(asrCtx.map("audio-capture"),"ASR_AUDIO_CAPTURE");
assert.equal(asrCtx.map("aborted"),"ASR_ABORTED");
assert.equal(asrCtx.map("not-allowed"),"ASR_PERMISSION_OR_SERVICE_DENIED");
console.log("PASS: deterministic ASR error replay maps to coarse research-safe codes");

function levenshteinDistance(a,b){
  const left=Array.from(a||""),right=Array.from(b||"");
  const prev=Array.from({length:right.length+1},(_,i)=>i);
  const curr=new Array(right.length+1);
  for(let i=1;i<=left.length;i++){
    curr[0]=i;
    for(let j=1;j<=right.length;j++){
      const cost=left[i-1]===right[j-1]?0:1;
      curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+cost);
    }
    for(let j=0;j<=right.length;j++)prev[j]=curr[j];
  }
  return prev[right.length];
}
function similarity(text,variants){
  if(!text)return 0;
  let best=0;
  for(const variant of variants){
    const maxLen=Math.max(Array.from(text).length,Array.from(variant).length,1);
    best=Math.max(best,1-levenshteinDistance(text,variant)/maxLen);
  }
  return Math.max(0,Math.min(1,best));
}
function chooseAlternative(alternatives,acceptedVariants){
  let chosenText="",chosenSimilarity=-1;
  for(const tx of alternatives){
    if(!tx)continue;
    const score=similarity(normalizeSpeechText(tx),acceptedVariants.map(normalizeSpeechText));
    if(!chosenText || score>chosenSimilarity ||
      (score===chosenSimilarity && normalizeSpeechText(tx).length>normalizeSpeechText(chosenText).length)){
      chosenText=tx; chosenSimilarity=score;
    }
  }
  return {text:chosenText,similarity:chosenSimilarity};
}
const target=["วันนี้ท้องฟ้าแจ่มใส"];
const selected=chooseAlternative(
  ["วันนี้ท้องฟ้ามืด","วันนี้ท้องฟ้าแจ่มใส"],
  target
);
assert.equal(selected.text,"วันนี้ท้องฟ้าแจ่มใส");
assert.equal(selected.similarity,1);
console.log("PASS: replay documents target-similarity alternative selection bias");

assert.match(configSource,/androidPhrasePauseMs:\s*1800/);
assert.match(configSource,/androidRecognitionSafetyMs:\s*12000/);
assert.match(speech,/ANDROID_PHRASE_PAUSE_MS = SPEECH_CFG\.androidPhrasePauseMs \?\? 1800/);
assert.match(speech,/ANDROID_RECOGNITION_SAFETY_MS = SPEECH_CFG\.androidRecognitionSafetyMs \?\? 12000/);
assert.match(speech,/if \(bestTranscript && !recognitionFinalTimer\)/);
assert.match(speech,/setTimeout\(\(\) => startRecognitionSafely\(0\), 120\)/);
console.log("PASS: Android pause/restart operational timings are explicit and source-wired");
