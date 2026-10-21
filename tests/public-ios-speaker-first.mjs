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
console.log('PASS: Public iOS release → voice only → reacquire live mic; muted mic fails visibly; JSSF untouched');
console.log('DEVICE UAT REQUIRED: iPhone Safari real TTS/ASR initial and two retry attempts');
