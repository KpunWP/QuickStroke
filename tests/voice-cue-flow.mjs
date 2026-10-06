import assert from "node:assert/strict";
import fs from "node:fs";

const arm=fs.readFileSync("arm-test.html","utf8");
const speech=fs.readFileSync("speech-test.html","utf8");
const face=fs.readFileSync("face-test.html","utf8");
const result=fs.readFileSync("result.html","utf8");
const th=JSON.parse(fs.readFileSync("locales/th-TH/ui.json","utf8"));

// Arm: passive first guide speaks the side-confirmation cue.
assert.match(arm,/function armSideConfirmationVoice\(side\)/);
assert.match(arm,/กดยืนยันใช้แขนซ้าย/);
assert.match(arm,/กดยืนยันใช้แขนขวา/);
assert.match(
  arm,
  /primeSpeechEngine\(\)\.then\(\(\) => \{[\s\S]*phase === 'IDLE'[\s\S]*speakNow\(armSideConfirmationVoice\('left'\)\)/
);

// After left-arm completion, lower-arm cue finishes first, then a short pause,
// then the right-arm confirmation cue. If the participant starts the next arm
// immediately, startWait/speakNow may cancel the queued reminder safely.
assert.match(
  arm,
  /if \(arm === 'left'\) \{[\s\S]*speakNow\(T\.vDone, \(\) => \{[\s\S]*setTimeout\(\(\) => \{[\s\S]*phase === 'BETWEEN' && arm === 'left'[\s\S]*speak\(armSideConfirmationVoice\('right'\)\)[\s\S]*\}, 700\)/
);

// Speech: cue is a separate non-recording phase. ASR/VAD timing starts only
// after system TTS finishes, preventing the app's own voice from contaminating
// transcript/acoustic research data.
assert.match(speech,/READY_CUE/);
assert.match(speech,/function speechCueText\(\)/);
assert.match(speech,/เริ่มพูดได้/);
assert.match(speech,/function speakSpeechCue\(text\)/);
assert.match(speech,/function primeSpeechCue\(\)/);
assert.match(speech,/primeSpeechCue\(\);[\s\S]*retryStarting = true/);
assert.match(
  speech,
  /phase = 'READY_CUE';[\s\S]*const cueStatus = await speakSpeechCue\(speechCueText\(\)\);[\s\S]*cueStatus === 'ended' \? 180 : 80[\s\S]*phase = 'RECORDING';[\s\S]*recordingStartedMs = performance\.now\(\)/
);
assert.match(
  speech,
  /phase === 'CALIBRATING' \|\| phase === 'READY_CUE'[\s\S]*speechSynthesis\?\.cancel/
);

// Ensure system TTS starts before recognition and does not interrupt itself on
// early participant speech. User audio is accepted only after the cue ends.
const cueIndex=speech.indexOf("await speakSpeechCue(speechCueText())");
const recordIndex=speech.indexOf("phase = 'RECORDING';", cueIndex);
const asrIndex=speech.indexOf("beginSpeechRecognition()", recordIndex);
assert.ok(cueIndex>=0 && recordIndex>cueIndex && asrIndex>recordIndex);

// Full-flow Face -> Arm transition must navigate first. The Face page must not
// speak the Arm confirmation cue; Arm owns the cue after its guide has painted.
assert.doesNotMatch(face,/function nextArmConfirmationVoice\(\)/);
assert.doesNotMatch(face,/speakFacePromise\(nextArmConfirmationVoice\(\)\)/);
assert.match(face,/window\.location\.href=target/);
assert.match(
  arm,
  /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*primeSpeechEngine\(\)\.then[\s\S]*speakNow\(armSideConfirmationVoice\('left'\)\)/
);

// Remote JSSF result preserves prior not-evaluable attempts as retry history
// without converting them into abnormal clinical evidence.
assert.match(result,/historicalInvalidRetained/);
assert.match(result,/invalidHistoryCount/);
assert.match(result,/modulePriorInvalid/);
assert.equal(th.result.modulePriorInvalid,"เคยประเมินไม่ได้และทดสอบซ้ำ {n} ครั้ง");

console.log("PASS: first-use voice cues and JSSF retry history are deterministic");
