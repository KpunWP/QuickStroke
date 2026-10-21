import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createHash } from 'node:crypto';

const arm=fs.readFileSync("arm-test.html","utf8");
const speech=fs.readFileSync("speech-test.html","utf8");
const face=fs.readFileSync("face-test.html","utf8");
const result=fs.readFileSync("result.html","utf8");
const th=JSON.parse(fs.readFileSync("locales/th-TH/ui.json","utf8"));

assert.match(speech,/#test-screen\.speech-countdown-active #speech-status-row\{display:none!important;\}/);
assert.match(speech,/#test-screen\.speech-countdown-active #action-btn\{display:none!important;\}/);
assert.match(speech,/#test-screen\.speech-countdown-active #mid\{[\s\S]*?overflow-y:auto!important/);
assert.ok(speech.includes('padding-top:calc(112px + env(safe-area-inset-top))!important'));
assert.match(speech,/justify-content:center!important/);
const facePilot=fs.readFileSync('face-test.html','utf8');
assert.ok(facePilot.includes('body.result-visible #score-num{display:none!important;}'));
assert.match(arm,/#test-screen:has\(#final-banner\[style\*="flex"\]\) #mid\{/);
assert.match(arm,/padding-bottom:calc\(210px \+ env\(safe-area-inset-bottom\)\)!important/);
assert.equal(th.speech?.accuracy || th.accuracy, 'ความถูกต้องของคำพูด');

assert.match(speech,/#domain-rate-row\{display:none!important;\}/);
assert.match(speech,/setDomainStatus\('quality', qualityStatusClass, qualityStatusText, false\)/);
assert.match(speech,/setDomainStatus\('phrase', phraseStatusClass, phraseStatusText, true\)/);
assert.match(speech,/id="domain-rate-row"/);
assert.match(speech,/id="result-details-toggle"/);

 
// Pilot UI hides historical metric bars without deleting research/measurement DOM.
assert.match(speech,/#metrics-box,\s*#test-screen\.done\.result-details-open #metrics-box\{display:none!important;\}/);
assert.match(speech,/#speech-card-rate\{display:none!important;\}/);
for(const id of ['metrics-box','val-word','val-rate','val-stab','bar-word','bar-rate','bar-stab']) {
  assert.ok(speech.includes('id="'+id+'"'), 'retain metric node for measurement and persistence: '+id);
}


// Arm: Step 1 makes one best-effort automatic audio attempt on entrance.
// Confirmation remains usable if the browser blocks playback.
assert.doesNotMatch(arm,/กดยืนยันใช้แขนซ้าย/);
assert.doesNotMatch(arm,/armSideConfirmationVoice/);
assert.match(arm,/function rightArmConfirmationVoice\(\)/);
assert.match(arm,/กดยืนยันใช้แขนขวา/);

// No manual audio test button in Arm Step 1.
assert.doesNotMatch(arm,/id="arm-listen-btn"/);
assert.doesNotMatch(arm,/function playArmStepOneGuide\(\)/);
assert.match(arm,/function attemptAutoArmStepOneVoice\(\)/);
assert.match(arm,/armInitialCueAttempted=true/);
assert.match(arm,/attemptAutoArmStepOneVoice\(\);/);
assert.match(arm,/id="arm-intro"/);
assert.match(arm,/id="arm-intro-start"/);
assert.match(arm,/function startArmFromIntro\(\)/);
const introClick=arm.slice(arm.indexOf('function startArmFromIntro()'),arm.indexOf('function renderArmIntroCopy()'));
assert.match(introClick,/intro\.hidden=true;[\s\S]*attemptAutoArmStepOneVoice\(\)/);
assert.match(arm,/#test-screen\.arm-intro-visible #action-dock\{display:none!important;\}/);
assert.match(introClick,/classList\.remove\('arm-intro-visible'\)/);
assert.match(introClick,/confirm\.disabled=false/);
assert.match(arm,/if \(!\$\('arm-intro'\)\?\.hidden\) return;/);

const armLang=arm.slice(arm.indexOf('async function selectLang(code)'),arm.indexOf('function handleArmFastFlow()'));
assert.match(armLang,/renderArmIntroCopy\(\)/);
assert.match(armLang,/classList\.add\('arm-intro-visible'\)/);
assert.doesNotMatch(armLang,/attemptAutoArmStepOneVoice\(\)/);

assert.match(arm,/QuickStrokeThaiRecorded\.play\(phrase,\{timeoutMs:8000\}\)/);
assert.match(arm,/canRecorded && \(forceRecorded \|\| \(!skipRecorded && recorded\.use\(currentLangCode\(\)\)\)\)/);
assert.match(speech,/const SPEECH_SILENT_START_TRIAL = IS_IOS && !IOS_ASR_ONLY_TRIAL/);
assert.match(speech,/setDomainStatus\('quality', qualityStatusClass, qualityStatusText, false\)/);

assert.match(arm,/function armStepOneVoice\(side\)/);
const btnFlow=arm.slice(arm.indexOf("function handleBtn()"),arm.indexOf("function handleBtn()")+6000);
assert.match(btnFlow,/setArmGuideStage\('left', 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\('left', 2\)/);
assert.match(btnFlow,/setArmGuideStage\('right', 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\('right', 2\)/);
assert.match(arm,/setArmGuideStage\(arm, 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\(arm, 2\)/);

assert.match(arm,/setArmTtsStatus\('initial-auto-'\+status\)/);
assert.match(arm,/speak\(rightArmConfirmationVoice\(\)\)/);

const armRecordedManifest=fs.readFileSync('js/thai-recorded-audio.js','utf8');
for (const [phrase,file] of [
  ['ถือโทรศัพท์ด้วยมือซ้ายตามภาพ แล้วกดยืนยันเพื่อเริ่มทดสอบ','arm_12_left_start.mp3'],
  ['กดยืนยันใช้แขนขวา','arm_13_confirm_right.mp3']
]) {
  assert.ok(armRecordedManifest.includes(phrase) && armRecordedManifest.includes(file),'recorded prompt must be mapped');
  assert.ok(fs.existsSync('audio/th/'+file),file+' must exist before merging for Android/Consent preload');
}
assert.match(armRecordedManifest,/QuickStrokeDevMode\?\.isEnabled\?\.\(\) !== true/,'debug sound-test button only in Dev');

// The exact participant recording must survive binary Git upload and remain
// a playable MP3; text-only manifest tests would miss a corrupted asset.
const rightArmClip=fs.readFileSync('audio/th/arm_13_confirm_right.mp3');
const gitBlobHash=createHash('sha1').update('blob '+rightArmClip.length+String.fromCharCode(0)).update(rightArmClip).digest('hex');
assert.equal(gitBlobHash,'a0f7fe42fd1adb167accc158538b506a11a50ee0');
assert.ok(rightArmClip.length>7000 && rightArmClip.subarray(0,3).toString()==='ID3');
assert.match(arm,/speak\(rightArmConfirmationVoice\(\)\)/);
assert.match(arm,/if\(pilotFallback && !forceRecorded && status!=='ended' && status!=='cancelled'\)/);
assert.match(face,/function speakFace\(txt, opts=\{\}\)/);
assert.match(speech,/return speakSpeechNative\(value\)\.then\(status=>/);
assert.match(result,/const prefersRecorded=!!\(canRecorded && recorded\?\.use\(LANG\)\)/);


// Ordinary Public retains the original visual countdown; only explicitly
// opted-in Public TTS UAT speaks numbers before ASR starts. JSSF paths unchanged.
// "Speak now" is still gated on SpeechRecognition confirming audio capture.
assert.match(speech,/READY_CUE/);
assert.match(speech,/function speechCueText\(\)/);
assert.match(speech,/function speakSpeechCue\(text\)/);
assert.match(speech,/function primeSpeechCue\(\)/);
assert.match(speech,/for \(const count of \[3,2,1\]\)/);
assert.match(speech,/function playVisualCountdownBeep\(\)/);
assert.match(speech,/ctx\.state!=='running'/);
assert.match(speech,/gain\.gain\.exponentialRampToValueAtTime\(0\.0001,t\+0\.13\)/);
assert.match(speech,/if \(ANDROID_JSSF_SPEECH_CUES\) \{\s*await playAndroidJssfSpokenCount\(count\)/);
assert.match(speech,/const ANDROID_JSSF_SPEECH_CUES = IS_ANDROID && isConsentedJssfSpeech/);
assert.match(speech,/if \(ANDROID_JSSF_SPEECH_CUES\) \{\s*await releaseAcousticCaptureForExclusiveAsr\(\)/);
assert.match(speech,/if \(!ANDROID_JSSF_SPEECH_CUES\) await releaseAcousticCaptureForExclusiveAsr\(\)/);
assert.match(speech,/if \(IOS_ASR_ONLY_TRIAL \|\| ANDROID_JSSF_SPEECH_CUES\) \{\s*void cleanupAfterResult\.then/);
assert.match(speech,/const cleanupAfterResult = releaseMicAfterSpeechResult\(ANDROID_JSSF_SPEECH_CUES \|\| PUBLIC_SPEECH_TTS_TRIAL \|\| PUBLIC_IOS_SPEAKER_FIRST\)/);
const androidCount=speech.slice(speech.indexOf("if (ANDROID_JSSF_SPEECH_CUES) {\n          await releaseAcousticCaptureForExclusiveAsr();"),speech.indexOf("const cueStatus = 'visual_only';",speech.indexOf("if (ANDROID_JSSF_SPEECH_CUES) {\n          await releaseAcousticCaptureForExclusiveAsr();")));
assert.ok(androidCount.indexOf("await releaseAcousticCaptureForExclusiveAsr()")<androidCount.indexOf("await playAndroidJssfSpokenCount(count)"),'mic capture must stop before spoken count');
assert.match(speech,/speakSpeechCue\('เตรียมพูด'\)/);
assert.match(speech,/speakSpeechCue\('ทดสอบการพูดเสร็จแล้ว'\)/);


assert.match(speech,/const cueStatus = 'visual_only'/);
assert.ok(speech.includes('#mic-circle.speech-countdown #mic-icon{font-size:112px'), 'countdown should be large inside central icon');
assert.ok(speech.includes("$('mic-icon').textContent = String(count);"), 'each countdown digit should replace the mic icon');
assert.ok(speech.includes("$('mic-icon').textContent       = '🎤';"), 'restore microphone graphic as recognition prepares');
assert.match(speech,/phase = 'READY_CUE';[\s\S]*phase = 'RECORDING';[\s\S]*recordingStartedMs = null/);
assert.match(speech,/recognition\.onaudiostart = \(\) => \{[\s\S]*markSpeechRecognitionReady\('audio_start'\)/);
assert.match(speech,/function markSpeechRecognitionReady\(source = 'audio_start'\)[\s\S]*recordingStartedMs = performance\.now\(\)[\s\S]*T\.speakNowPrompt/);
assert.match(speech,/phase === 'CALIBRATING' \|\| phase === 'READY_CUE'[\s\S]*speechSynthesis\?\.cancel/);
const cueIndex=speech.indexOf("for (const count of [3,2,1])");
const recordIndex=speech.indexOf("phase = 'RECORDING';", cueIndex);
const asrIndex=speech.indexOf("beginSpeechRecognition()", recordIndex);
const audioReadyIndex=speech.indexOf("markSpeechRecognitionReady('audio_start')");
assert.ok(cueIndex>=0 && recordIndex>cueIndex && asrIndex>recordIndex);
assert.ok(audioReadyIndex>=0);

// Speech instructional audio must be bundled before releasing Consent preload.
const recordedAudio=fs.readFileSync("js/thai-recorded-audio.js","utf8");
const voiceText='เตรียมพูดตามข้อความบนหน้าจอ รอจนขึ้นว่าเริ่มพูดได้';
// The SW caches scripts independently of HTML. Every module must fetch the
// updated MP3 manifest rather than reusing the obsolete Ogg manifest.
for (const path of ['jssf-consent.html','face-test.html','arm-test.html','speech-test.html','result.html']) {
  const html=fs.readFileSync(path,'utf8');
  assert.ok(html.includes('thai-recorded-audio.js?v=20261018-jssf-audio-priority-v1'), 'stale audio JS URL: '+path);
  assert.ok(!html.includes('thai-recorded-audio.js?v=20261018-jssf-android-spoken-cues-v1'), 'old Ogg route remains: '+path);
}

assert.ok(recordedAudio.includes(voiceText), 'instruction must be mapped in recorded audio manifest');
assert.ok(recordedAudio.includes('speech_02_instruction.mp3'));
assert.ok(fs.existsSync("audio/th/speech_02_instruction.mp3"), 'approved instruction MP3 must be uploaded to GitHub before release');

// Require the participant-approved recordings before releasing JSSF Android.
const approvedAndroidSpeechCues = [
  ['เตรียมพูด', 'speech_03_prepare_short.mp3'],
  ['3', 'speech_04_count_three.mp3'],
  ['2', 'speech_05_count_two.mp3'],
  ['1', 'speech_06_count_one.mp3'],
  ['ทดสอบการพูดเสร็จแล้ว', 'speech_07_module_complete.mp3']
];
for (const [phrase,file] of approvedAndroidSpeechCues) {
  assert.ok(recordedAudio.includes("'" + phrase + "':'" + file + "'"), 'manifest mismatch: '+phrase);
  assert.ok(fs.existsSync('audio/th/'+file), 'approved participant audio missing: '+file);
  assert.ok(fs.statSync('audio/th/'+file).size > 3000, 'audio clip incomplete: '+file);
}
assert.match(speech,/if \(ANDROID_JSSF_SPEECH_CUES && mapped\)/);
assert.match(speech,/const result=await speakSpeechCue\(String\(count\)\)/);
assert.match(speech,/await sleep\(Math\.max\(0,1000-\(performance\.now\(\)-began\)\)\)/);
assert.match(speech,/return speakSpeechCue\('ทดสอบการพูดเสร็จแล้ว'\)/);

assert.match(speech,/function playSpeechInstructionBeforeCapture\(\)/);
assert.match(speech,/await playSpeechInstructionBeforeCapture\(\)/);
assert.match(speech,/await sleep\(1000\)/, 'countdown should show each large digit for a full second');
assert.match(speech,/speech-countdown-active #freq-canvas\{display:none!important;\}/,'waveform should not overlap countdown');

// Full-flow Face -> Arm transition navigates directly; the Arm page does not
// attempt autoplay TTS before the participant's first Arm-page gesture.
assert.doesNotMatch(face,/function nextArmConfirmationVoice\(\)/);
assert.doesNotMatch(face,/speakFacePromise\(nextArmConfirmationVoice\(\)\)/);
assert.match(face,/window\.location\.href=target/);
assert.doesNotMatch(
  arm,
  /speakNow\(armSideConfirmationVoice\('left'\)\)/
);

// Remote JSSF result preserves prior not-evaluable attempts as retry history
// without converting them into abnormal clinical evidence.
assert.match(result,/historicalInvalidRetained/);
assert.match(result,/invalidHistoryCount/);
assert.match(result,/modulePriorInvalid/);
assert.equal(th.result.modulePriorInvalid,"เคยประเมินไม่ได้และทดสอบซ้ำ {n} ครั้ง");

// Android getVoices() may resolve between Face/Arm instructions. The chosen
// mode must remain stable within this tab and after navigating to another HTML page.
function simulateAndroidAudioRoute(initialVoices, storage) {
  let voices = initialVoices;
  const sharedStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  };
  const browser = {
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel) Chrome/155 Mobile' },
    location: { search:'' },
    URLSearchParams,
    sessionStorage:sharedStorage,
    document:{ readyState:'loading', addEventListener(){} },
    speechSynthesis:{ getVoices(){ return voices; } }
  };
  browser.window=browser;
  vm.runInNewContext(recordedAudio, browser);
  return {
    use: browser.QuickStrokeThaiRecorded.use,
    setVoices(next) { voices=next; }
  };
}
const silentFirst = new Map();
const early = simulateAndroidAudioRoute([], silentFirst);
assert.equal(early.use('th-TH'), true, 'no Thai TTS available initially chooses recorded audio');
early.setVoices([{lang:'th-TH'}]);
assert.equal(early.use('th-TH'), true, 'late Thai voice arrival does not switch recordings to TTS mid-test');
const navigated=simulateAndroidAudioRoute([{lang:'th-TH'}],silentFirst);
assert.equal(navigated.use('th-TH'), true, 'navigation keeps the route chosen at consent');
const nativeFirst=simulateAndroidAudioRoute([{lang:'th-TH'}],new Map());
assert.equal(nativeFirst.use('th-TH'), false, 'a ready Thai voice may use native TTS');
nativeFirst.setVoices([]);
assert.equal(nativeFirst.use('th-TH'), false, 'temporary getVoices() loss cannot switch route back to recordings');


// Override a matching Android or iOS voice list with consented JSSF context.
function simulatedConsentRoute(ua, voices){
  const sharedStorage={getItem(){return null;},setItem(){}};
  const w={navigator:{userAgent:ua},location:{search:'',pathname:'/arm-test.html'},URLSearchParams,
    sessionStorage:sharedStorage, document:{readyState:'loading',addEventListener(){}},
    speechSynthesis:{getVoices(){return voices;}},
    QuickStrokeDataContract:{getSessionContext(){return {appMode:'research',
      researchMetadata:{researchProfile:'community_remote_qr',consentStatus:'consented'}}}}};
  w.window=w;
  vm.runInNewContext(recordedAudio,w);
  return w.QuickStrokeThaiRecorded;
}
assert.equal(simulatedConsentRoute('Android Chrome',[{lang:'th-TH'}]).use('th-TH'),true,'Android JSSF always prefers recorded even with Thai TTS');
assert.equal(simulatedConsentRoute('iPhone Safari',[{lang:'th-TH'}]).use('th-TH'),false,'iOS JSSF always prefers native TTS');

console.log("PASS: first-use voice cues and JSSF retry history are deterministic");
