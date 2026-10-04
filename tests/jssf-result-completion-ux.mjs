import fs from "node:fs";
import assert from "node:assert/strict";

const result=fs.readFileSync("result.html","utf8");
const config=fs.readFileSync("config.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");

assert.match(config,/buildId:\s*"20261004-jssf-pilot-freeze-v5"/);
assert.match(sw,/quickstroke-pwa-v66/);
assert.match(result,/id="jssf-submit-bar"/);
assert.match(result,/id="jssf-submit-button"/);
assert.match(result,/ส่งผลและจบการทดสอบ/);
assert.match(result,/position:fixed/);
assert.match(result,/isRemoteJssfResultSession/);
assert.match(result,/exportButton\.hidden = true/);
assert.match(result,/action\(primary, '', null, true\)/);
assert.match(result,/action\(secondary, '', null, true\)/);
assert.match(result,/✓ ส่งผลเรียบร้อยแล้ว คุณสามารถปิดหน้านี้ได้/);
assert.match(result,/if \(!isRemoteJssf\) \{[\s\S]*confirm\(/);
console.log("PASS: JSSF result page has participant-first fixed submit flow and hides research-only controls");
