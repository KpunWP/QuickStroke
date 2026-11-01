import fs from 'node:fs';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
const base='7942ebb283de0ae8d24af97016780c78e1ac89ce';
const plan=JSON.parse(fs.readFileSync('tests/fixtures/demo-result-emergency-correction.json','utf8'));
assert.deepEqual(Object.keys(plan),['result.html']);assert.equal(plan['result.html'].length,2);
let html=fs.readFileSync('result.html','utf8');
for(const op of [...plan['result.html']].reverse()){
 assert.equal(op.after,op.before.replace('publicCompact: isPublicResultSession(),','publicCompact: isPublicResultSession() || globalThis.QuickStrokeDemoPresentation?.enabled?.() === true,'));
 assert.equal(html.split(op.after).length,2);html=html.replace(op.after,op.before);
}
assert.equal(html,cp.execFileSync('git',['show',base+':result.html'],{encoding:'utf8'}),'Every other Result byte, including interpretation, recovery, warnings and navigation, unchanged');
for(const file of ['index.html','face-test.html','arm-test.html','speech-test.html','js/technical-demo.js','js/demo-public-presentation.js','js/emergency-contacts.js','js/app-mode.js','js/dev-mode.js','js/data-contract.js','service-worker.js','locales/th-TH/ui.json','locales/en-US/ui.json','locales/ja-JP/ui.json','audio/th/arm_11_alert_local_emergency_v2.mp3'])assert.ok(fs.readFileSync(file).equals(cp.execFileSync('git',['show',base+':'+file])),file+' unchanged');
const build=html.slice(html.indexOf('   async function buildResult()'));
assert.ok(build.indexOf('await ensureResultDataContext()')<build.indexOf('renderSummary(CURRENT)'));
assert.ok(build.indexOf('await ensureResultDataContext()')<build.indexOf('renderReminder(CURRENT)'));
console.log('PASS: exactly two compact-eligibility edits; recovered Result mode precedes emergency rendering; all helpers, warnings, engines, audio, modes and SW byte-identical.');
