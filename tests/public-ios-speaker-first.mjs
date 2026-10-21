import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const speech=fs.readFileSync(new URL('../speech-test.html',import.meta.url),'utf8');
function segment(begin,end){
 const i=speech.indexOf(begin),j=speech.indexOf(end,i);
 assert.ok(i>=0 && j>i,'Cannot locate '+begin);
 return speech.slice(i,j);
}
assert.match(speech,/const PUBLIC_IOS_SPEAKER_FIRST = IS_IOS && !IOS_ASR_ONLY_TRIAL[\s\S]*?iosJssfContext\.appMode === 'public'/);
assert.match(speech,/const KEEP_MIC_ALIVE = IS_IOS && !IOS_ASR_ONLY_TRIAL && !PUBLIC_IOS_SPEAKER_FIRST/);
assert.match(speech,/const cleanupAfterResult = releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES \|\| PUBLIC_SPEECH_TTS_TRIAL \|\| PUBLIC_IOS_SPEAKER_FIRST\)/);
const recognition=speech.slice(speech.indexOf('async function beginSpeechRecognition()'),speech.indexOf("async function releaseCurrentAudioResources(",speech.indexOf('async function beginSpeechRecognition()')));
assert.match(recognition,/if \(ANDROID_JSSF_SPEECH_CUES \|\| PUBLIC_IOS_SPEAKER_FIRST\)/);
assert.match(recognition,/'asr_audio_start_timeout'/);
assert.match(recognition,/\(ANDROID_JSSF_SPEECH_CUES \|\| PUBLIC_IOS_SPEAKER_FIRST\) \? 4500 : 900/);
assert.match(recognition,/recognition\.onaudiostart = \(\) => \{[\s\S]*?markSpeechRecognitionReady\('audio_start'\)/);

const calibrationHandoff=segment('const countdownToken = audioStartToken;', "const cueStatus = 'visual_only';");
assert.ok(calibrationHandoff.indexOf('await releasePublicSpeakerFirstCalibrationMic(countdownToken)')>=0);
assert.ok(calibrationHandoff.indexOf('await releasePublicSpeakerFirstCalibrationMic(countdownToken)')
 < calibrationHandoff.indexOf('await playPublicTtsCountdownDigit(count)'));
assert.match(calibrationHandoff,/PUBLIC_IOS_SPEAKER_FIRST \|\| PUBLIC_SPEECH_TTS_TRIAL/);
assert.match(calibrationHandoff,/if \(ANDROID_JSSF_SPEECH_CUES\)/);
const resumeHandoff=segment("const cueStatus = 'visual_only';","// Enter the recognition phase,");
assert.match(resumeHandoff,/await restorePublicSpeakerFirstMic\(countdownToken\)/);
assert.ok(speech.indexOf('const ready=await restorePublicSpeakerFirstMic(countdownToken)')
 < speech.indexOf("phase = 'RECORDING';",speech.indexOf("const cueStatus = 'visual_only';")));
assert.match(speech,/if \(PUBLIC_SPEECH_TTS_TRIAL \|\| PUBLIC_IOS_SPEAKER_FIRST\) \{\s*\/\/ Speaker-first/);
assert.match(speech,/if \(PUBLIC_SPEECH_TTS_TRIAL \|\| PUBLIC_IOS_SPEAKER_FIRST\) \{\s*void cleanupAfterResult/);

const combined=segment('async function playPublicIosUnifiedCountdown(token) {','async function playPublicIosCompletionCue(message) {');
assert.match(combined,/const content=words\.join\(', '\)/);
assert.match(combined,/const words=\[3,2,1\]\.map\(publicCountdownSpeechWord\)/);
assert.match(combined,/const u=new SpeechSynthesisUtterance\(content\)/);
assert.equal((combined.match(/synth\.speak\(u\)/g)||[]).length,1,'iPhone plays all three words in a single utterance');
assert.match(combined,/u\.onboundary=event=>\{/);
assert.match(combined,/setTimeout\(\(\)=>show\(2\),850\)/);
assert.match(combined,/setTimeout\(\(\)=>show\(1\),1750\)/);
assert.match(combined,/setTimeout\(\(\)=>\{[\s\S]*?\},5000\)/);
const countdown=segment('const countdownToken = audioStartToken;', "const cueStatus = 'visual_only';");
assert.match(countdown,/await releasePublicSpeakerFirstCalibrationMic\(countdownToken\)/);
assert.match(countdown,/if \(PUBLIC_IOS_SPEAKER_FIRST\) \{\s*await playPublicIosUnifiedCountdown\(countdownToken\)/);
assert.ok(countdown.indexOf('await releasePublicSpeakerFirstCalibrationMic(countdownToken)')<countdown.indexOf('await playPublicIosUnifiedCountdown(countdownToken)'));
assert.match(speech,/async function playPublicIosCompletionCue\(message\) \{[\s\S]*?recorded\.play\(message,\{timeoutMs:5000\}\)/);
assert.match(speech,/if \(PUBLIC_IOS_SPEAKER_FIRST\) \{\s*status=await playPublicIosCompletionCue\(message\)/);
assert.doesNotMatch(speech,/id="public-countdown-audio-status"|id="speech-voice-uat"|id="speech-voice-uat-status"/);

const handlers=segment('// iPhone Public: preserve calibrated noise/onset thresholds','async function releaseAcousticCaptureForExclusiveAsr()');
assert.doesNotMatch(handlers,/resetMeasurementState\(|beginSpeechCanonicalAttempt\(|calibStartMs\s*=/);
assert.match(handlers,/captureSpeechMicrophoneRuntime\(streamRef,'public_post_tts_capture'\)/);

function harness({enabled=true,muted=false}={}){
 let stopped=0,closed=0,acquired=0,connected=0,diagnostics=[],invalid=[];
 const oldTrack={stop:()=>{stopped++;}};
 const newTrack={stop:()=>{stopped++;}};
 const oldStream={getTracks:()=>[oldTrack]};
 const newStream={getTracks:()=>[newTrack]};
 class FakeCtx {
  constructor(){this.state='running';}
  createAnalyser(){return{fftSize:0,smoothingTimeConstant:0};}
  createMediaStreamSource(){return{connect:()=>{connected++;}};}
  close(){closed++;this.state='closed';return Promise.resolve();}
 }
 const ctx={
  PUBLIC_IOS_SPEAKER_FIRST:enabled,phase:'READY_CUE',audioStartToken:9,
  source:{disconnect:()=>{}},streamRef:oldStream,analyser:{},audioCtx:new FakeCtx(),
  navigator:{audioSession:{type:'play-and-record'},mediaDevices:{getUserMedia:async()=>{
   acquired++;return newStream;
  }}},
  window:{AudioContext:FakeCtx},performance:{now:()=>1000},sleep:async()=>{},
  queueSpeechTechnicalDiagnostic:msg=>diagnostics.push(msg),
  prepareSpeechCaptureAudioSession:()=>{ctx.navigator.audioSession.type='play-and-record';},
  waitForSpeechMicStep:async p=>await p,
  hasLiveAudioTrack:v=>v===newStream,
  waitForMicTrackReady:async()=>!muted,
  captureSpeechMicrophoneRuntime:()=>{},
  mapMicErrorReason:()=> 'MICROPHONE_START_FAILED',
  finishSpeechInvalid:(reason,detail)=>{invalid.push({reason,detail});ctx.phase='DONE';},
  console,Promise
 };
 vm.createContext(ctx);
 vm.runInContext(handlers,ctx);
 return{ctx,oldStream,get stopped(){return stopped;},get closed(){return closed;},
  get acquired(){return acquired;},get connected(){return connected;},
  diagnostics,invalid};
}
const h=harness();
await h.ctx.releasePublicSpeakerFirstCalibrationMic(9);
assert.equal(h.stopped,1,'original calibration mic is physically stopped before TTS');
assert.equal(h.closed,1,'WebAudio closes before spoken countdown');
assert.equal(h.ctx.audioCtx,null);
assert.equal(h.ctx.streamRef,null);
assert.equal(h.ctx.navigator.audioSession.type,'playback');
assert.equal(h.acquired,0,'no acquisition during speaker-only countdown');
assert.equal(await h.ctx.restorePublicSpeakerFirstMic(9),true);
assert.equal(h.acquired,1);
assert.equal(h.connected,1,'reopened stream supplies the existing PCM analyser');
assert.equal(h.ctx.navigator.audioSession.type,'play-and-record');
assert.equal(h.ctx.streamRef===h.oldStream,false);
assert.equal(h.invalid.length,0);
assert.deepEqual(h.diagnostics,['PUBLIC_SPEAKER_FIRST_MIC_RELEASED','PUBLIC_SPEAKER_FIRST_MIC_REOPENED']);
const dead=harness({muted:true});
await dead.ctx.releasePublicSpeakerFirstCalibrationMic(9);
assert.equal(await dead.ctx.restorePublicSpeakerFirstMic(9),false);
assert.equal(dead.ctx.phase,'DONE');
assert.equal(dead.invalid[0].reason,'MICROPHONE_START_FAILED');
assert.equal(dead.invalid[0].detail.stage,'public_post_tts_capture');
assert.equal(dead.acquired,1);
assert.equal(dead.stopped,2,'failed reopening stops both streams');
const jssf=harness({enabled:false});
assert.equal(await jssf.ctx.releasePublicSpeakerFirstCalibrationMic(9),undefined);
assert.equal(await jssf.ctx.restorePublicSpeakerFirstMic(9),false);
assert.equal(jssf.stopped,0);
assert.equal(jssf.closed,0);
assert.equal(jssf.acquired,0);

// Regression: first-use microphone permission succeeds in a real user tap.
// Public iPhone Retry must acquire getUserMedia in that SAME click, not after
// awaiting asynchronous cleanup that consumes Safari's transient activation.
const retrySource=segment('async function startPublicIosRetryFromGesture() {','// ── SNR Gate: แสดง/จัดการคำเตือนเสียงรบกวน ──');
assert.match(retrySource,/const requested=navigator\.mediaDevices\.getUserMedia\(/);
assert.ok(retrySource.indexOf('const requested=navigator.mediaDevices.getUserMedia(')
  < retrySource.indexOf('const freshStream=await waitForSpeechMicStep('));
assert.match(retrySource,/await startRecording\(false,freshStream\)/);
const retryHandler=segment("else if (phase === 'DONE') {","// Public iPhone retry: called synchronously");
assert.match(retryHandler,/if \(PUBLIC_IOS_SPEAKER_FIRST\) \{[\s\S]*?await startPublicIosRetryFromGesture\(\)/);
assert.match(retryHandler,/else if \(IS_IOS\) \{[\s\S]*?await startRecording\(false\)/);

let requestedDuringTap=false,createdContext=false,startedWith=null,allowResolve=null;
const capturedStream={
 getAudioTracks:()=>[{readyState:'live',muted:false}],
 getTracks:()=>[{stop:()=>{}}]
};
const retryContext={
 PUBLIC_IOS_SPEAKER_FIRST:true,audioStartToken:12,phase:'IDLE',audioCtx:null,
 window:{AudioContext:class FakeAudioContext{constructor(){this.state='running';createdContext=true;}},
  QuickStrokeThaiRecorded:{stop:()=>{}},speechSynthesis:{cancel:()=>{}}},
 navigator:{mediaDevices:{getUserMedia:()=>{requestedDuringTap=true;return new Promise(resolve=>{allowResolve=resolve;});}}},
 prepareSpeechCaptureAudioSession:()=>{},
 queueSpeechTechnicalDiagnostic:()=>{},waitForSpeechMicStep:async(p)=>p,
 hasLiveAudioTrack:s=>s===capturedStream,
 startRecording:async(force,stream)=>{startedWith={force,stream};},
 console
};
vm.createContext(retryContext);
vm.runInContext(retrySource,retryContext);
const retryPromise=retryContext.startPublicIosRetryFromGesture();
assert.equal(requestedDuringTap,true,'getUserMedia request runs synchronously during retry tap');
assert.equal(createdContext,true,'AudioContext is created during retry tap');
assert.equal(startedWith,null,'startRecording waits for the newly authorized stream');
allowResolve(capturedStream);
await retryPromise;
assert.equal(startedWith.force,false);
assert.equal(startedWith.stream,capturedStream);
const finishHandler=segment('function finishSpeechInvalid(reasonCode, details = {}) {','function evaluateSpeech(text, confidence) {');
assert.match(finishHandler,/releaseMicAfterSpeechResult\(mustReleaseImmediately \|\| PUBLIC_IOS_SPEAKER_FIRST\)/);
const completion=speech.slice(speech.indexOf('const finishedAudioToken = audioStartToken'),speech.indexOf('requestAnimationFrame(() => {',speech.indexOf('const finishedAudioToken = audioStartToken')));
assert.match(completion,/iosResultMicReleasePending=true/);
assert.match(completion,/if\(\$\('action-btn'\)\)\$\('action-btn'\)\.disabled=true/);
assert.match(completion,/try \{[\s\S]*?status=await playPublicIosCompletionCue\(message\);[\s\S]*?\} finally \{/);
assert.match(completion,/iosResultMicReleasePending=false/);
console.log('PASS: iPhone retry starts getUserMedia inside tap, holds retry during completion MP3 and releases mic after invalid result');

console.log('PASS: Public iOS release → voice only → reacquire live mic; muted mic fails visibly; JSSF untouched');
console.log('DEVICE UAT REQUIRED: iPhone Safari real TTS/ASR initial and two retry attempts');
