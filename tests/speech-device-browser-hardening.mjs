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
  let depth=0,quote=null,line=false,block=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i],next=source[i+1];
    if(line){if(ch==="\n")line=false;continue;}
    if(block){if(ch==="*"&&next==="/"){block=false;i++;}continue;}
    if(quote){if(ch==="\\"){i++;continue;}if(ch===quote)quote=null;continue;}
    if(ch==="/"&&next==="/"){line=true;i++;continue;}
    if(ch==="/"&&next==="*"){block=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue;}
    if(ch==="{")depth++;
    if(ch==="}"&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error("Unterminated "+name);
}

const configCtx={window:{}};
configCtx.window=configCtx;
vm.createContext(configCtx);
vm.runInContext(configSource,configCtx);
const cfg=configCtx.QS_CONFIG.thresholds.speech;

assert.equal(cfg.keepMicAliveOnIOS,true);
assert.equal(cfg.reuseHealthProbeMs,450);
assert.equal(cfg.retryFullReleaseWaitMs,1200);
assert.equal(cfg.deadMicSilenceMs,2000);
assert.equal(cfg.deadMicEnergyMin,0.00001);
assert.equal(cfg.deadMicMaxAttempts,4);
console.log("PASS: iOS retry/dead-mic operational settings are explicit");

const mapFn=extractFunction(speech,"mapMicErrorReason");
const mapCtx={};
vm.createContext(mapCtx);
vm.runInContext(mapFn+";this.map=mapMicErrorReason;",mapCtx);
assert.equal(mapCtx.map({name:"NotAllowedError"}),"MICROPHONE_PERMISSION_DENIED");
assert.equal(mapCtx.map({name:"SecurityError"}),"MICROPHONE_PERMISSION_DENIED");
assert.equal(mapCtx.map({name:"NotFoundError"}),"MICROPHONE_NOT_FOUND");
assert.equal(mapCtx.map({name:"DevicesNotFoundError"}),"MICROPHONE_NOT_FOUND");
assert.equal(mapCtx.map({name:"NotReadableError"}),"MICROPHONE_IN_USE");
assert.equal(mapCtx.map({name:"TrackStartError"}),"MICROPHONE_IN_USE");
assert.equal(mapCtx.map({message:"Web Audio API unavailable"}),"WEB_AUDIO_UNAVAILABLE");
assert.equal(mapCtx.map({name:"UnknownError"}),"MICROPHONE_START_FAILED");
assert.equal(
  mapCtx.map({permissionResult:{reasonCode:"MIC_PERMISSION_DENIED",raw:{name:"NotAllowedError"}}}),
  "MIC_PERMISSION_DENIED"
);
console.log("PASS: microphone permission/device/browser failures are deterministically classified");

assert.match(speech,/const KEEP_MIC_ALIVE = IS_IOS && \(SPEECH_CFG\.keepMicAliveOnIOS \?\? true\)/);
assert.match(speech,/const canProbeReuse = KEEP_MIC_ALIVE &&/);
assert.match(speech,/const healthyReuse = await probeExistingAudioPipeline\(\)/);
assert.match(speech,/await stopAll\(true\);[\s\S]*await sleep\(RETRY_FULL_RELEASE_WAIT_MS\)/);
console.log("PASS: iOS keep-alive is health-probed before reuse and stale pipelines are fully rebuilt");

assert.match(speech,/if \(ANDROID_EXCLUSIVE_ASR\) \{[\s\S]*await releaseAcousticCaptureForExclusiveAsr\(\)/);
assert.match(speech,/oldStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
assert.match(speech,/const useAcousticTimingForScoring = !ANDROID_EXCLUSIVE_ASR/);
assert.doesNotMatch(speech,/ANDROID_CONCURRENT_PCM_PROBE|androidPcmProbe|buildAndroidPcmProbeTelemetry/);
assert.match(speech,/ACOUSTIC_METRICS_UNAVAILABLE/);
console.log("PASS: Android production path stays exclusive-ASR and concurrent PCM probe is removed");

assert.match(speech,/document\.addEventListener\('visibilitychange'/);
assert.match(speech,/if \(!document\.hidden \|\| !activeSpeechAttemptRecord\?\.testAttemptId\) return/);
assert.match(speech,/finishSpeechInvalid\('PAGE_HIDDEN'/);
assert.match(speech,/finalizeOpenSpeechLifecycle\('PAGE_HIDDEN'\)/);
assert.match(speech,/attemptStatus:reasonCode === 'PAGE_HIDDEN' \? 'interrupted' : 'completed'/);
console.log("PASS: page hiding interrupts active Speech lifecycle rather than silently completing it");

assert.match(speech,/if \(deadMicAttempt > DEAD_MIC_MAX_ATTEMPT\)/);
assert.match(speech,/finishSpeechInvalid\('DEAD_MIC_RECOVERY_FAILED'/);
assert.match(speech,/setPendingSpeechAttempt\('technical_recovery', recoveryFrom, 'DEAD_MIC_DETECTED'\)/);
assert.match(speech,/const waitMs = 1500 \+ deadMicAttempt \* 1500/);
console.log("PASS: dead-mic recovery is bounded and escalates to a terminal technical failure");

assert.match(speech,/const mustReleaseImmediately = \[/);
for(const code of [
  "PAGE_HIDDEN","MICROPHONE_PERMISSION_DENIED","MICROPHONE_NOT_FOUND",
  "MICROPHONE_NOT_AVAILABLE","MICROPHONE_IN_USE","MICROPHONE_STREAM_FAILED",
  "MICROPHONE_START_FAILED","DEAD_MIC_RECOVERY_FAILED"
]){
  assert.ok(speech.includes("'"+code+"'"),"Missing immediate-release code "+code);
}
console.log("PASS: terminal microphone/page failures force full resource release");


assert.match(speech,/function ensureMicDisclosureBeforeFirstUse\(\)[\s\S]*allowBtn\.onclick = \(\) => \{[\s\S]*navigator\.mediaDevices\.getUserMedia\(/);
assert.match(speech,/async function startRecording\(forceDirectMic = false, preauthorizedStream = null\)/);
assert.match(speech,/preauthorizedStream && hasLiveAudioTrack\(preauthorizedStream\)[\s\S]*streamRef = preauthorizedStream/);
assert.match(speech,/const firstUseStream = await ensureMicDisclosureBeforeFirstUse\(\);[\s\S]*await startRecording\(false, firstUseStream\)/);
console.log("PASS: first microphone permission request stays inside the QuickStroke disclosure user gesture");


assert.match(speech,/function prepareSpeechCaptureAudioSession\(\)[\s\S]*navigator\.audioSession\.type = 'play-and-record'/);
assert.match(speech,/prepareSpeechCaptureAudioSession\(\);[\s\S]*navigator\.mediaDevices\.getUserMedia\(/);
assert.match(speech,/await flushSpeechResearchPersistence\(\);[\s\S]*window\.location\.href = 'result\.html'/);
assert.doesNotMatch(speech,/Promise\.race\(\[[\s\S]*flushSpeechResearchPersistence\(\)[\s\S]*1500/);
console.log("PASS: Speech restores capture audio category and Result waits for canonical persistence");
