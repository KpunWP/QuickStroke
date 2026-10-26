import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
const html=fs.readFileSync('face-test.html','utf8'),css=fs.readFileSync('assets/public-face.css','utf8');
const original=html.replace(/\/\* PUBLIC FACE STARTUP PRESENTATION[^]*?\/\* END PUBLIC FACE STARTUP PRESENTATION \*\/\n\n/,'').replace(/<script id="public-face-mode">[^]*?<\/script>\n/,'');
const scripts=[...original.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map(m=>m[1]).join('\n');
assert.equal(crypto.createHash('sha256').update(scripts).digest('hex'),'4f8a184891c9eba1101a12b3c30504bbd7dd854b58be18333b8603dabda0d52e','Every pre-existing Face script stays byte-for-byte frozen, including camera, MediaPipe, geometry, countdown, cues, retry, storage and navigation');
assert.equal(html.match(/<style id="public-face-style">\n([^]*?)<\/style>/)[1],css,'Atomic inline offline CSS delivery');
for(const rule of css.split('}').filter(s=>s.trim()))assert.match(rule.trim(),/^(?:\/\*[^]*?\*\/\s*)?html\[data-face-public="1"\]/,'Every new selector is Public-scoped');
assert.doesNotMatch(css,/#video(?:\W|$)|#canvas(?:\W|$)|#video-container(?:\W|$)|object-fit|scaleX|clip-path|mask:/,'Do not restyle, crop, mirror or mask acquisition/display surfaces');
const gate=html.match(/<script id="public-face-mode">([^]*?)<\/script>/)[1];
for(const mode of ['public','research','dev',undefined])for(const dev of [true,false])for(const search of ['','?mesh=1']){const meta={content:'original'},ctx=vm.createContext({URLSearchParams,document:{documentElement:{dataset:{}},querySelector:()=>meta},window:{location:{search},QuickStrokeAppMode:{resolveMode:()=>mode},QuickStrokeDevMode:{isEnabled:()=>dev}}});vm.runInContext(gate,ctx);const pub=mode==='public'&&!dev&&!search;assert.equal(ctx.document.documentElement.dataset.facePublic,pub?'1':'0');assert.equal(meta.content,pub?'width=device-width, initial-scale=1.0, viewport-fit=cover':'original')}
assert.doesNotMatch(gate,/setItem|removeItem|addEventListener|MutationObserver|setInterval|setTimeout|fetch|getUserMedia|Landmarker/);
for(const asset of ['models/tasks-vision/vision_bundle.mjs','models/wasm/vision_wasm_internal.wasm','models/face_landmarker.task','models/hand_landmarker.task'])assert.ok(fs.statSync(asset).size>1000,asset);
console.log('PASS: frozen Face/camera/model/landmark/threshold/timer/audio/retry/navigation scripts; no surface styling; Public-only gate preserves Research/Dev/mesh; atomic offline CSS');
