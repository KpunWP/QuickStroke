import assert from "node:assert/strict";
import fs from "node:fs";

const arm=fs.readFileSync("arm-test.html","utf8");
const speech=fs.readFileSync("speech-test.html","utf8");
const face=fs.readFileSync("face-test.html","utf8");
const result=fs.readFileSync("result.html","utf8");
const th=JSON.parse(fs.readFileSync("locales/th-TH/ui.json","utf8"));

// Arm: the initial screen is intentionally silent. The visible button
// "ยืนยันแขนซ้ายและเริ่ม" is the instruction; TTS begins only after a user gesture.
assert.doesNotMatch(arm,/กดยืนยันใช้แขนซ้าย/);
assert.doesNotMatch(arm,/armSideConfirmationVoice/);
assert.match(arm,/function rightArmConfirmationVoice\(\)/);
assert.match(arm,/กดยืนยันใช้แขนขวา/);

// After left-arm completion, lower-arm cue finishes first, then a short pause,
// then the right-arm confirmation cue. If the participant starts the next arm
// immediately, startWait/speakNow may cancel the queued reminder safely.
assert.match(
  arm,
  /if \(arm === 'left'\) \{[\s\S]*speakNow\(T\.vDone, \(\) => \{[\s\S]*setTimeout\(\(\) => \{[\s\S]*phase === 'BETWEEN' && arm === 'left'[\s\S]*speak\(rightArmConfirmationVoice\(\)\)[\s\S]*\}, 700\)/
);

// Speech: cue is a separate non-recording phase. ASR/VAD timing starts only
// after system TTS finishes, preventing the app's own voice from contaminating
// transcript/acoustic research data.
assert.match(speech,/READY_CUE/);
assert.match(speech,/function speechCueText\(\)/);
assert.match(speech,/เตรียมพูด รอเสียงสัญญาณก่อนเริ่มพูด/);
assert.match(speech,/function speakSpeechCue\(text\)/);
assert.match(speech,/function primeSpeechCue\(\)/);
assert.match(speech,/primeSpeechCue\(\);[\s\S]*retryStarting = true/);
assert.match(
  speech,
  /phase = 'READY_CUE';[\s\S]*const cueStatus = await speakSpeechCue\(speechCueText\(\)\);[\s\S]*cueStatus === 'ended' \? 180 : 80[\s\S]*phase = 'RECORDING';[\s\S]*recordingStartedMs = null/
);
assert.match(
  speech,
  /recognition\.onaudiostart = \(\) => \{[\s\S]*markSpeechRecognitionReady\('audio_start'\)/
);
assert.match(
  speech,
  /function markSpeechRecognitionReady\(source = 'audio_start'\)[\s\S]*recordingStartedMs = performance\.now\(\)[\s\S]*T\.speakNowPrompt/
);
assert.match(
  speech,
  /phase === 'CALIBRATING' \|\| phase === 'READY_CUE'[\s\S]*speechSynthesis\?\.cancel/
);

// The preparation cue finishes before recognition starts. "Speak now" is not
// exposed until SpeechRecognition confirms that the audio input is ready.
const cueIndex=speech.indexOf("await speakSpeechCue(speechCueText())");
const recordIndex=speech.indexOf("phase = 'RECORDING';", cueIndex);
const asrIndex=speech.indexOf("beginSpeechRecognition()", recordIndex);
const audioReadyIndex=speech.indexOf("markSpeechRecognitionReady('audio_start')");
assert.ok(cueIndex>=0 && recordIndex>cueIndex && asrIndex>recordIndex);
assert.ok(audioReadyIndex>=0);

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
