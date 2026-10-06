import assert from "node:assert/strict";
import fs from "node:fs";

const arm=fs.readFileSync("arm-test.html","utf8");
const speech=fs.readFileSync("speech-test.html","utf8");

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
assert.match(
  speech,
  /phase = 'READY_CUE';[\s\S]*await speakSpeechCue\(speechCueText\(\)\);[\s\S]*await sleep\(180\);[\s\S]*phase = 'RECORDING';[\s\S]*recordingStartedMs = performance\.now\(\)/
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

console.log("PASS: Arm confirmation cues and Speech start cue timing are deterministic");
