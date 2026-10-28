import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restorePowerWords} from './power-words-boundaries.mjs';
import crypto from 'node:crypto';
import vm from 'node:vm';
const html=restorePowerWords(fs.readFileSync('arm-test.html','utf8'),'arm-test.html'),css=fs.readFileSync('assets/public-arm.css','utf8');
const normalize=s=>[...s.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const withoutPublic=html.replace(/<script id="public-arm-(?:mode|assets)">[^]*?<\/script>\n/g,'');
assert.equal(crypto.createHash('sha256').update(normalize(withoutPublic)).digest('hex'),'81b0b6c02ff9e7bf6264ff41f517a5c9ec00f5ce4743ccfe1277f40abfe87de5','Every pre-existing Arm script byte must remain frozen');
assert.equal(html.match(/<style id="public-arm-style">\n([^]*?)<\/style>/)[1],css,'Atomic HTML/CSS delivery');
for(const rule of css.split('}').filter(s=>s.trim()))assert.match(rule.trim(),/^(?:\/\*[^]*?\*\/\s*)?html\[data-arm-public="1"\]/,'Public scoped styles');
const modeScript=html.match(/<script id="public-arm-mode">([^]*?)<\/script>/)[1];
for(const mode of ['public','research','dev'])for(const dev of [true,false]){
 const viewport={content:'unchanged'},ctx=vm.createContext({document:{documentElement:{dataset:{}},querySelector:()=>viewport},window:{QuickStrokeAppMode:{resolveMode:()=>mode},QuickStrokeDevMode:{isEnabled:()=>dev}}});vm.runInContext(modeScript,ctx);
 assert.equal(ctx.document.documentElement.dataset.armPublic,mode==='public'&&!dev?'1':'0');
 assert.equal(viewport.content,mode==='public'&&!dev?'width=device-width, initial-scale=1.0, viewport-fit=cover':'unchanged');
}
const assets=JSON.parse(html.match(/const guideAssets = (\{[^]*?\});/)[1]);assert.equal(Object.keys(assets).length,6);
for(const[p,data]of Object.entries(assets))assert.ok(Buffer.from(data.split(',')[1],'base64').equals(fs.readFileSync(p)),p+' exact approved image bytes');
assert.match(css,/#drift-wrap\{display:none!important\}/);
assert.doesNotMatch(modeScript,/setItem|removeItem|addEventListener|setInterval|setTimeout/);
console.log('PASS: Arm engine/audio/state-machine script freeze; Public/Research/Dev isolation; exact guide assets and atomic offline CSS/images; no Public angle gauge');
