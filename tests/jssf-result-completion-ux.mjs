import fs from "node:fs";
import assert from "node:assert/strict";

const result=fs.readFileSync("result.html","utf8");
const config=fs.readFileSync("config.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");

assert.match(config,/buildId:\s*"20261005-jssf-terminal-v2"/);
assert.match(sw,/quickstroke-pwa-v68/);
assert.match(result,/id="jssf-submit-bar"/);
assert.match(result,/id="jssf-submit-button"/);
assert.match(result,/ส่งผลและจบการทดสอบ/);
assert.match(result,/position:fixed/);
assert.match(result,/isRemoteJssfResultSession/);
assert.match(result,/exportButton\.hidden = true/);
assert.match(result,/action\(primary, '', null, true\)/);
assert.match(result,/action\(secondary, '', null, true\)/);
assert.match(result,/จบการทดสอบแล้ว/);
assert.match(result,/ขอบคุณสำหรับการเข้าร่วมการทดสอบค่ะ/);
assert.match(result,/สามารถปิดหน้านี้ได้/);
assert.match(result,/speakJssfCompletionOnce/);
assert.match(result,/SpeechSynthesisUtterance/);
assert.match(result,/showJssfTerminalState/);
assert.match(result,/hideParticipantResultActions/);
assert.doesNotMatch(result,/sessionStatus === 'finalized'\) \{\s*action\(primary, T\.home \|\| 'กลับหน้าหลัก', goHome\)/);
assert.match(result,/if \(!isRemoteJssf\) \{[\s\S]*confirm\(/);
console.log("PASS: JSSF result page has participant-first fixed submit flow and hides research-only controls");
