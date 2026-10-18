import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const speech=fs.readFileSync(path.join(root,"speech-test.html"),"utf8");
const configSource=fs.readFileSync(path.join(root,"config.js"),"utf8");
const arm=fs.readFileSync(path.join(root,"arm-test.html"),"utf8");
const consent=fs.readFileSync(path.join(root,"jssf-consent.html"),"utf8");

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

assert.match(speech,/const IOS_JSSF_ASR_ONLY = IS_IOS && isConsentedJssfSpeech && IOS_TRIAL_PARAM !== '0'/);
assert.match(speech,/iosJssfContext.appMode === 'research'/);
assert.match(speech,/iosJssfContext.researchMetadata\?\.researchProfile === 'community_remote_qr'/);
assert.match(speech,/iosJssfContext.researchMetadata\?\.consentStatus === 'consented'/);
assert.match(arm,/armContext\?\.appMode === 'research'/);
assert.match(arm,/armContext\?\.researchMetadata\?\.researchProfile === 'community_remote_qr'/);
assert.match(arm,/armContext\?\.researchMetadata\?\.consentStatus === 'consented'/);
console.log('PASS: Public/Dev sessions cannot be rerouted into JSSF-only iOS Speech');
assert.match(speech,/new URLSearchParams\(location\.search\)\.get\('iosJssfAsrOnly'\) === '1'/);
assert.match(speech,/sessionStorage\.getItem\('qs_jssf_ios_asr_only'\) === '1'/);
assert.match(arm,/speech-test\.html\?iosJssfAsrOnly=1/);
assert.match(consent,/speech-test\.html\?iosJssfAsrOnly=1/);
assert.match(speech,/if \(IOS_JSSF_ASR_ONLY\) sessionStorage\.removeItem\('qs_jssf_ios_asr_only'\)/);
assert.match(speech,/iOS JSSF · ASR ONLY/);
console.log("PASS: iPhone JSSF ASR-only route survives Arm → Speech and direct resume navigation");

assert.equal(cfg.keepMicAliveOnIOS,true);
assert.equal(cfg.reuseHealthProbeMs,450);
assert.equal(cfg.retryFullReleaseWaitMs,1200);
assert.equal(cfg.deadMicSilenceMs,2000);
assert.equal(cfg.deadMicEnergyMin,0.00001);
assert.equal(cfg.deadMicMaxAttempts,4);
console.log("PASS: iOS retry/dead-mic operational settings are explicit");

// Regression: a live iOS capture pipeline must not be interrupted by a
// new instruction MP3 on retry; first-use playback uses speaker routing.
const instruction=speech.slice(speech.indexOf('async function playSpeechInstructionBeforeCapture()'),speech.indexOf('async function handleAction()'));
assert.match(speech,/const SPEECH_SILENT_START_TRIAL = IS_IOS && !IOS_ASR_ONLY_TRIAL/);
assert.match(instruction,/if \(SPEECH_SILENT_START_TRIAL\) return 'silent_trial'/);
assert.match(speech,/if \(!SPEECH_SILENT_START_TRIAL && !IOS_ASR_ONLY_TRIAL && !ANDROID_JSSF_SPEECH_CUES\) primeSpeechCue\(\)/);
assert.match(speech,/if \(!IS_IOS && !SPEECH_SILENT_START_TRIAL && !ANDROID_JSSF_SPEECH_CUES\) primeSpeechCue\(\)/);
assert.match(speech,/else if \(!IS_ANDROID && !SPEECH_SILENT_START_TRIAL\) \{\s*playVisualCountdownBeep\(\)/);
console.log('PASS: silent Speech trial disables app cues while preserving visual countdown');

assert.match(instruction,/navigator\.audioSession\.type='playback'/);
assert.match(instruction,/!hasLiveAudioTrack\(streamRef\)/);
const retry=speech.slice(speech.indexOf("else if (phase === 'DONE')"),speech.indexOf('// ── SNR Gate:'));
assert.match(retry,/if \(IS_IOS\) \{/);
assert.match(retry,/await playSpeechInstructionBeforeCapture\(\);/);
const recovery=speech.slice(speech.indexOf("captureSpeechPermissionRuntime(result, 'fast_permissions_ui')"),speech.indexOf("captureSpeechPermissionRuntime(result, 'fast_permissions_ui')")+270);
assert.match(recovery,/if \(!IS_IOS\) await playSpeechInstructionBeforeCapture\(\)/);
console.log('PASS: iOS retry preserves active audio session and first-use cue selects playback route');


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

assert.match(speech,/const KEEP_MIC_ALIVE = IS_IOS && !IOS_ASR_ONLY_TRIAL && \(SPEECH_CFG\.keepMicAliveOnIOS \?\? true\)/);
assert.match(speech,/const canProbeReuse = KEEP_MIC_ALIVE &&/);
assert.match(speech,/const healthyReuse = await probeExistingAudioPipeline\(\)/);
assert.match(speech,/consecutiveLiveSamples >= 2/);
assert.match(speech,/lastLiveAt - firstLiveAt >= 90/);
assert.match(speech,/lastDeviation > REUSE_ENERGY_MIN/);
assert.match(speech,/IOS_REUSE_PROBE_STABLE/);
assert.match(speech,/IOS_REUSE_PROBE_UNSTABLE/);
assert.match(speech,/IOS_CALIBRATION_DIGITAL_SILENCE/);
assert.match(speech,/IOS_REUSE_PIPELINE_REJECTED/);

assert.match(speech,/await stopAll\(true\);[\s\S]*await sleep\(RETRY_FULL_RELEASE_WAIT_MS\)/);
console.log("PASS: iOS keep-alive is health-probed before reuse and stale pipelines are fully rebuilt");

// P0 iOS manual recovery: no blind new microphone request after digital silence.
// The explicit user's Retry gesture will start a fresh capture after full release.
const recoverFn=extractFunction(speech,"recoverDeadMic");
const iosBranch=recoverFn.slice(recoverFn.indexOf("if (IS_IOS)"), recoverFn.indexOf("if (deadMicAttempt >"));
assert.match(iosBranch,/await stopAll\(true\)/);
assert.match(iosBranch,/finishSpeechInvalid\('DEAD_MIC_DETECTED'/);
assert.doesNotMatch(iosBranch,/startRecording\(/);
assert.doesNotMatch(iosBranch,/finalizeCanonicalSpeechAttempt\(/);
assert.match(speech,/await stopAll\(IS_IOS && forceDirectMic \? true :/);
assert.match(speech,/const cleanupAfterResult = releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES\)/);
assert.match(speech,/if \(!IS_IOS\) scheduleResultMicRelease\(\)/);
console.log("PASS: iOS speech result releases mic and dead mic requires explicit Retry gesture");
const releaseGate=extractFunction(speech,'releaseMicAfterSpeechResult');
assert.match(releaseGate,/iosResultMicReleasePending = true/);
assert.match(releaseGate,/retryButton\.disabled = true/);
assert.match(releaseGate,/stopAll\(fullRelease\)\.finally/);
assert.match(releaseGate,/iosResultMicReleasePending = false/);
assert.match(speech,/if \(IS_IOS && iosResultMicReleasePending\) return;/);
assert.match(speech,/const cleanupAfterResult = releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES\)/);
console.log('PASS: iOS Speech Retry waits for full mic cleanup before enabling user gesture');



assert.match(speech,/if \(EXCLUSIVE_ASR_CAPTURE\) \{[\s\S]*await releaseAcousticCaptureForExclusiveAsr\(\)/);
assert.match(speech,/oldStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
assert.match(speech,/const useAcousticTimingForScoring = !EXCLUSIVE_ASR_CAPTURE/);
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
const firstSpeechStart=speech.slice(speech.indexOf("if (phase === 'IDLE')"),speech.indexOf("else if (phase === 'RECORDING')"));
assert.ok(firstSpeechStart.indexOf('await playSpeechInstructionBeforeCapture();') < firstSpeechStart.indexOf('await ensureMicDisclosureBeforeFirstUse();'), 'first-use voice must finish before iOS opens a microphone stream');
assert.ok(firstSpeechStart.indexOf('await ensureMicDisclosureBeforeFirstUse();') < firstSpeechStart.indexOf('await startRecording(false, firstUseStream);'), 'capture should use the stream from the disclosure gesture');
console.log("PASS: first microphone permission request stays inside the QuickStroke disclosure user gesture");
assert.match(speech,/const firstUsePreparedCtx=IS_IOS && !forceDirectMic && !!preauthorizedStream/);
assert.match(speech,/if \(!firstUsePreparedCtx\) \{/);
assert.match(speech,/if \(!firstUsePreparedCtx\) audioCtx = new AudioContextClass\(\)/);
const firstDisclosure=speech.slice(speech.indexOf('async function ensureMicDisclosureBeforeFirstUse()'),speech.indexOf('async function selectLang('));
assert.ok(firstDisclosure.indexOf('if (IS_IOS && (!audioCtx') < firstDisclosure.indexOf('const request = navigator.mediaDevices.getUserMedia'), 'audio context must be initialized before first mic acquisition on iOS');
console.log('PASS: iPhone first-use context is prepared in user gesture and preserved for first capture');
const iosRetryBlock=speech.slice(speech.indexOf("else if (phase === 'DONE')"),speech.indexOf("// ── SNR Gate:"));
assert.match(iosRetryBlock,/if \(IS_IOS\) \{/);
assert.match(iosRetryBlock,/await startRecording\(false\)/);
assert.doesNotMatch(iosRetryBlock,/new RetryAudioContext/);
assert.doesNotMatch(iosRetryBlock,/retryStreamRequest/);
assert.match(speech,/const healthyReuse = await probeExistingAudioPipeline\(\)/);
assert.match(speech,/if \(healthyReuse\) \{/);
assert.match(speech,/await stopAll\(true\);[\s\S]*await sleep\(RETRY_FULL_RELEASE_WAIT_MS\)/);
assert.match(speech,/const cleanupAfterResult = releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES\)/);
console.log('PASS: iOS Retry probes preserved pipeline before rebuilding dead capture');


const firstStart=speech.slice(speech.indexOf("if (phase === 'IDLE')"),speech.indexOf("else if (phase === 'RECORDING')"));
assert.match(firstStart,/let firstUseStage='instruction'/);
assert.match(firstStart,/firstUseStage='disclosure'/);
assert.match(firstStart,/firstUseStage='capture'/);
assert.match(firstStart,/FIRST_USE_DISCLOSURE_FAILED/);
assert.match(firstStart,/FIRST_USE_CAPTURE_UNHANDLED/);
assert.match(firstStart,/mapMicErrorReason\(error\)/);
assert.doesNotMatch(firstStart,/finishSpeechInvalid\('I18N_LOAD_FAILED'/);
console.log("PASS: first-use failures preserve stage-specific diagnostics rather than mislabeling microphone failures as locale failures");



assert.match(speech,/function prepareSpeechCaptureAudioSession\(\)[\s\S]*navigator\.audioSession\.type = 'play-and-record'/);
assert.match(speech,/prepareSpeechCaptureAudioSession\(\);[\s\S]*navigator\.mediaDevices\.getUserMedia\(/);
assert.match(speech,/await flushSpeechResearchPersistence\(\);[\s\S]*window\.location\.href = 'result\.html'/);
assert.doesNotMatch(speech,/Promise\.race\(\[[\s\S]*flushSpeechResearchPersistence\(\)[\s\S]*1500/);
console.log("PASS: Speech restores capture audio category and Result waits for canonical persistence");
