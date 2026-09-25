// Thai emergency TTS pronunciation checks; this is text processing, not an audio/device test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const context = {
  console,
  localStorage: { getItem() { return null; }, setItem() {} },
  navigator: { language: 'th-TH' }
};
context.window = context;
vm.runInNewContext(read('js/i18n.js'), context, { filename:'js/i18n.js' });
const pronounce = context.QuickStrokeI18n.prepareSpeechText;
assert.equal(typeof pronounce, 'function');

const thaiSafetyPrompt = 'อาจพบแขนตก หากสงสัยสโตรก โทร 1669 ทันที';
assert.equal(
  pronounce(thaiSafetyPrompt, 'th-TH'),
  'อาจพบแขนตก หากสงสัยโรคหลอดเลือดสมอง โทร หนึ่ง หก หก เก้า ทันที'
);
assert.equal(pronounce('สงสัยสโตรก? โทร 1669', 'th'), 'สงสัยโรคหลอดเลือดสมอง? โทร หนึ่ง หก หก เก้า');
assert.equal(pronounce('1669', 'th-TH'), 'หนึ่ง หก หก เก้า');
assert.equal(pronounce('โทร 11669 หรือ 16690', 'th-TH'), 'โทร 11669 หรือ 16690');
assert.equal(pronounce(thaiSafetyPrompt, 'en-US'), thaiSafetyPrompt);
assert.equal(pronounce(thaiSafetyPrompt, 'ja-JP'), thaiSafetyPrompt);

for (const file of ['arm-test.html', 'face-test.html']) {
  assert.match(
    read(file),
    /const spokenText = window\.QuickStrokeI18n\?\.prepareSpeechText\?\.\(txt, lang\) \?\? txt;[\s\S]*?new SpeechSynthesisUtterance\(spokenText\)/,
    `${file}: TTS must use normalized speech rather than visual text`
  );
}
assert.match(read('service-worker.js'), /const CACHE_NAME = "quickstroke-pwa-v42";/);
assert.match(read('config.js'), /buildId: "20260925-jssf-remote-staging-v1"/);

console.log('PASS: Thai speech uses clear stroke terminology and spoken digit-by-digit 1669');
console.log('PASS: English/Japanese and unrelated numbers remain unchanged');
console.log('PASS: Arm/Face TTS share pronunciation helper; refreshed service worker and build');
