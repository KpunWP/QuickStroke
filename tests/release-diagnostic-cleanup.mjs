import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const html=fs.readFileSync('face-test.html','utf8');
for(const f of ['js/face-layout-debug.js','api/face-layout-debug-gate.js'])assert.equal(fs.existsSync(f),false,'No diagnostic runtime/API shipped: '+f);
assert.doesNotMatch(html,/faceLayoutDebug|face-layout-debug|qs-face-layout-debug|buildFaceABSummary|qs-face-layout-ab|public-face-layout-debug-loader/);
// Approved integrated HTML must be exact after removing ONLY the diagnostic loader.
assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'40f6e7db38f6e4a5058321badc32a3b44038110a11fbf76ffdbd561837a60324','Accepted Face HTML/engines/styles/handlers unchanged except loader removal');
for(const id of ['public-face-style','public-face-startup-style','public-face-active-style'])assert.ok(html.includes('id="'+id+'"'));
assert.ok(html.includes('id="public-face-presentation"'));
console.log('PASS: diagnostic runtime/API/experiments absent; exact accepted Face code except loader removal; no clinical/camera/audio/navigation edits');

// Release cleanup cannot silently alter other modules, emergency policy or data handling.
const frozen={
  "index.html": "ba7d646e20e86ec995ed83e64220a6eda8ebaec2529429d845bafbec117faa6f",
  "result.html": "33eb5b2aa012780631f135320d8d39f2c3b0a7a45c5cf47e7b450dca62a6bb20",
  "arm-test.html": "f0335abb56df70aa7bdd3d3190916f60379e875d2a86484798a28b1a8ea4df90",
  "speech-test.html": "4ca0df126c851038b219234681f576f9c05412b455bc0a08e40f87bddb5b3da3",
  "js/languages.js": "bdffbec734711748f837e65af1e87530c830514a32a84780818ed0198e1f1c5f",
  "config.js": "7d357d53585bb4fd93ce4ad5530ee699ff7080aa3919fe6c2bbfa9ff9e660f46",
  "service-worker.js": "681e1c58deb27d488821329ccd98705e430225efba6f6b69f60169746ea01743",
  "js/app-mode.js": "e148e59f294781bcb1c5f5adae2c6b7fdee6e704982f45b30f59a203bc5497e5",
  "js/research-store.js": "571ed81faa4d0b3dfd6f6d034deaf09c9c2c37c713c5a86c1d4142f1296f45cd",
  "js/jssf-remote-sync.js": "e686192a1992a6aa2fe6357a10528310da0e74a2e2637776e269eec34be6c13b",
  "locales/th-TH/ui.json": "fc0c502267b360825af23c4ab73fa052fa23a75bbcdb08d70cb3ef8b4676ab9a",
  "locales/en-US/ui.json": "d28a897d4e65ba3bce23633bb26c99e7af87c050723d9a2907d7223b6c3ab835",
  "locales/ja-JP/ui.json": "4fbdcf25f76ec6631bd83660fa2244c69e0a83da42f773cbca39936e8e80a92e"
};
for(const [file,expected] of Object.entries(frozen))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected,file+' remains exact accepted source');
