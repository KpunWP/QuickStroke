import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../speech-test.html',import.meta.url),'utf8');
assert.doesNotMatch(html,/iosSilenceRevivalAttempted|replacement\.createMediaStreamSource\(streamRef\)/,'remove obsolete graph revival');
assert.match(html,/IOS_ASR_SHUTDOWN_TIMEOUT/,'distinguish timed-out ASR shutdown');
assert.match(html,/recoverDeadMic\(\)/,'preserve digital-silence invalidation');

// Automatic validity retry must follow the same iOS keep-alive policy as a
// manual retry, rather than forcing a fresh getUserMedia after releasing it.
const automaticRetry=html.slice(html.indexOf('function scheduleAutomaticValidityRetry('),html.indexOf('function finishSpeechInvalid('));
assert.match(automaticRetry,/startRecording\(IS_IOS \? false : true\)/,'preserve iOS capture on automatic retry');
assert.match(html,/await startRecording\(false\)/,'manual iOS retry retains microphone pipeline');

// iOS completed capture should stop ASR gracefully while interruptions still abort.
const asrShutdown=html.slice(html.indexOf('function shutdownRecognition()'),html.indexOf('function resetRecognitionEngine()'));
assert.match(asrShutdown,/IS_IOS && phase === 'DONE' && typeof oldRecognition\.stop === 'function'/,'completed iOS ASR must stop gracefully');
assert.match(asrShutdown,/oldRecognition\.stop\(\)/,'graceful ASR stop');
assert.match(asrShutdown,/oldRecognition\.abort\(\)/,'interrupted ASR still aborts');

// Research-only iOS exclusive audio handoff must be disabled by default and
// expose missing acoustic metrics instead of fabricating speech measurements.
assert.match(html,/const IOS_EXCLUSIVE_ASR_TRIAL = IS_IOS/);
assert.match(html,/IOS_EXCLUSIVE_TRIAL_ENABLED/);
assert.match(html,/ios-exclusive-asr-trial-status/);
assert.match(html,/const EXCLUSIVE_ASR_CAPTURE = ANDROID_EXCLUSIVE_ASR \|\| IOS_ASR_ONLY_TRIAL/);
assert.match(html,/if \(EXCLUSIVE_ASR_CAPTURE\) \{\s*await releaseAcousticCaptureForExclusiveAsr\(\)/);
assert.match(html,/acousticMetricsAvailable: !EXCLUSIVE_ASR_CAPTURE/);
assert.match(html,/scoreUsableForResearch: !EXCLUSIVE_ASR_CAPTURE/);

const helper=html.slice(html.indexOf('function waitForSpeechMicStep('),html.indexOf('async function probeExistingAudioPipeline('));
const start=html.slice(html.indexOf('async function startRecording('),html.indexOf('async function releaseAcousticCaptureForExclusiveAsr('));
const mapping=html.slice(html.indexOf('function mapMicErrorReason('),html.indexOf('function prepareSpeechCaptureAudioSession('));
function harness(kind){
 const elements=new Map(); const noop=()=>{};
 const el=id=>{if(!elements.has(id))elements.set(id,{style:{},classList:{add:noop,remove:noop},setAttribute:noop,disabled:true});return elements.get(id);};
 let stopped=0,lateResolve,loop=0,failures=[];
 const stream={getTracks:()=>[{stop(){stopped++;}}]};
 const pending=new Promise(r=>lateResolve=r);
 const ctx={console,Promise,Error,Date,performance,setTimeout:(f,ms)=>setTimeout(f,Math.min(ms,10)),clearTimeout,
  audioStartToken:0,IS_IOS:false,KEEP_MIC_ALIVE:true,DEBUG_ON:false,phase:'IDLE',speechAttemptNo:0,audioCtx:null,analyser:null,source:null,streamRef:null,
  T:{preparePrompt:'prepare',calibrating:'preparing',noiseCalib:'noise',noiseMetric:'noise',rate:'rate',pending:'pending',btnRetry:'retry'},
  $:el,document:{getElementById:()=>null},sessionStorage:{getItem:()=> 'th'},
  clearResultReleaseTimer:noop,DBG:noop,DBG_TRACK:noop,ensureSpeechModuleRun:noop,beginSpeechCanonicalAttempt:noop,resetMeasurementState:noop,
  setSpeechCard:noop,captureSpeechMicrophoneRuntime:noop,prepareSpeechCaptureAudioSession:noop,queueSpeechTechnicalDiagnostic:noop,
  currentSpeechQualityFlags:()=>[],hasLiveAudioTrack:()=>true,waitForMicTrackReady:async()=>true,
  finishSpeechInvalid:(code,details)=>{failures.push({code,details});ctx.phase='DONE';el('action-btn').disabled=false;},
  stopAll:async()=>{ctx.streamRef?.getTracks().forEach(t=>t.stop());ctx.audioCtx=null;},runLoop:()=>loop++,
  navigator:{mediaDevices:{getUserMedia:()=>kind==='gum'?pending:Promise.resolve(stream)}},
 };
 ctx.window={AudioContext:class{constructor(){this.state=kind==='resume'?'suspended':'running';}resume(){return pending;} createAnalyser(){return {};}createMediaStreamSource(){return {connect:noop};}}};
 vm.createContext(ctx);
 vm.runInContext('let DBG_T0,currentAttemptStartedAtMs,currentAttemptStartedAt,currentAttemptPerformanceStartedAt,lastAsrErrorCode,confidenceWasImputed,asrFinalReceived,pipelineReadyMs,sawRealSignal,calibStartMs;'+helper+mapping+start,ctx);
 return {ctx,el,stream,pending,resolve:lateResolve,failures,get stopped(){return stopped;},get loop(){return loop;}};
}
for(const kind of ['resume','gum']){
 const h=harness(kind);
 await h.ctx.startRecording(true,kind==='resume'?h.stream:null);
 assert.equal(h.ctx.phase,'DONE');
 assert.equal(h.el('action-btn').disabled,false);
 assert.match(h.el('action-btn').textContent,/ลองเปิดไมโครโฟน/);
 assert.equal(h.failures[0].code,'MICROPHONE_START_FAILED');
 assert.ok(h.failures[0].details.qualityFlags.includes('MIC_PREPARATION_TIMEOUT'));
 if(kind==='resume')assert.equal(h.stopped,1,'unused preauthorized stream released');
 h.resolve(kind==='gum'?h.stream:undefined);
 await new Promise(r=>setImmediate(r));
 assert.equal(h.loop,0,'late completion must not resume calibration');
 if(kind==='gum')assert.equal(h.stopped,1,'late microphone stream released');
 console.log('PASS: hung '+kind+' exits to retry, preserves failure and cleans late/unused streams');
}
{
 const h=harness('healthy');await h.ctx.startRecording(true);
 assert.equal(h.loop,1);assert.equal(h.failures.length,0);
 console.log('PASS: healthy microphone reaches calibration unchanged');
}
{
 const h=harness('healthy');const result=h.ctx.waitForSpeechMicStep(h.pending,'test',12000).catch(e=>e);
 h.ctx.audioStartToken++;h.resolve(h.stream);
 assert.equal((await result).name,'AbortError');assert.equal(h.stopped,1);
 console.log('PASS: superseded attempt cannot claim a late stream');
}

// iOS ASR-only trial never creates or reacquires WebAudio/MediaStream.
assert.match(html,/const IOS_ASR_ONLY_TRIAL = IOS_EXCLUSIVE_ASR_TRIAL/);
assert.match(html,/if \(IOS_ASR_ONLY_TRIAL\) \{[\s\S]*?IOS_ASR_ONLY_NO_PCM[\s\S]*?beginSpeechRecognition\(\);[\s\S]*?return;/);
assert.match(html,/if \(IOS_ASR_ONLY_TRIAL\) \{[\s\S]*?resolve\(null\); \/\/ ASR obtains its own permission/);
assert.match(html,/const KEEP_MIC_ALIVE = IS_IOS && !IOS_ASR_ONLY_TRIAL/);
