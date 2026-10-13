import assert from "node:assert/strict";
import fs from "node:fs";

const arm=fs.readFileSync("arm-test.html","utf8");
const speech=fs.readFileSync("speech-test.html","utf8");
const face=fs.readFileSync("face-test.html","utf8");
const result=fs.readFileSync("result.html","utf8");
const th=JSON.parse(fs.readFileSync("locales/th-TH/ui.json","utf8"));
assert.match(speech,/#domain-rate-row\{display:none!important;\}/);
assert.match(speech,/setDomainStatus\('quality', qualityStatusClass, qualityStatusText, true\)/);
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

assert.match(arm,/function armStepOneVoice\(side\)/);
const btnFlow=arm.slice(arm.indexOf("function handleBtn()"),arm.indexOf("function handleBtn()")+6000);
assert.match(btnFlow,/setArmGuideStage\('left', 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\('left', 2\)/);
assert.match(btnFlow,/setArmGuideStage\('right', 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\('right', 2\)/);
assert.match(arm,/setArmGuideStage\(arm, 2\);\s*showArmGuide\(\);\s*showArmOuterGuideCopy\(arm, 2\)/);

assert.match(arm,/setArmTtsStatus\('initial-auto-'\+status\)/);
assert.match(arm,/speak\(rightArmConfirmationVoice\(\)\)/);

const armRecordedManifest=fs.readFileSync('js/thai-recorded-audio.js','utf8');
for (const [phrase,file] of [
  ['ถือโทรศัพท์ด้วยมือซ้ายตามภาพ แล้วกดยืนยันเพื่อเริ่มทดสอบ','arm_12_left_start.mp3']
]) {
  assert.ok(armRecordedManifest.includes(phrase) && armRecordedManifest.includes(file),'recorded prompt must be mapped');
  assert.ok(fs.existsSync('audio/th/'+file),file+' must exist before merging for Android/Consent preload');
}
assert.match(armRecordedManifest,/QuickStrokeDevMode\?\.isEnabled\?\.\(\) !== true/,'debug sound-test button only in Dev');

// Speech: the pre-recognition phase uses visual 3-2-1 instead of TTS,
// and "speak now" appears only after SpeechRecognition confirms audio capture.
assert.match(speech,/READY_CUE/);
assert.match(speech,/function speechCueText\(\)/);
assert.match(speech,/function speakSpeechCue\(text\)/);
assert.match(speech,/function primeSpeechCue\(\)/);
assert.match(speech,/for \(const count of \[3,2,1\]\)/);
assert.match(speech,/function playVisualCountdownBeep\(\)/);
assert.match(speech,/ctx\.state!=='running'/);
assert.match(speech,/gain\.gain\.exponentialRampToValueAtTime\(0\.0001,t\+0\.13\)/);
assert.match(speech,/\$\('mic-icon'\)\.textContent = String\(count\);\s*playVisualCountdownBeep\(\);/);

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
assert.ok(recordedAudio.includes(voiceText), 'instruction must be mapped in recorded audio manifest');
assert.ok(recordedAudio.includes('speech_02_instruction.mp3'));
assert.ok(fs.existsSync("audio/th/speech_02_instruction.mp3"), 'approved instruction MP3 must be uploaded to GitHub before release');
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

console.log("PASS: first-use voice cues and JSSF retry history are deterministic");
