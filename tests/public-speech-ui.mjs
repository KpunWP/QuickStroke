import {restoreModuleAccents} from './public-module-accent-boundaries.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restorePowerWords} from './power-words-boundaries.mjs';
import crypto from 'node:crypto';
import vm from 'node:vm';
const html=restorePowerWords(fs.readFileSync('speech-test.html','utf8'),'speech-test.html'),css=restoreModuleAccents(fs.readFileSync('assets/public-speech.css','utf8'),'assets/public-speech.css');
const original=html.replace(/<script id="public-speech-mode">[^]*?<\/script>\n/,'');
const scripts=[...original.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map(m=>m[1]).join('\n');
assert.equal(crypto.createHash('sha256').update(scripts).digest('hex'),'2c007c8e21f9b8b8daf6f9a9036ca608567c2057980a0e1d0a5c8edc7d5abe28','Every pre-existing Speech script remains byte-for-byte frozen');
assert.equal(html.match(/<style id="public-speech-style">\n([^]*?)<\/style>/)[1],css,'Atomic inline CSS delivery for existing offline HTML strategy');
for(const rule of css.split('}').filter(s=>s.trim()))assert.match(rule.trim(),/^(?:\/\*[^]*?\*\/\s*)?html\[data-speech-public="1"\]/,'Every CSS selector is Public-scoped');
const gate=html.match(/<script id="public-speech-mode">([^]*?)<\/script>/)[1];
for(const mode of ['public','research','dev',undefined])for(const dev of [true,false]){const viewport={content:'original'},ctx=vm.createContext({document:{documentElement:{dataset:{}},querySelector:()=>viewport},window:{QuickStrokeAppMode:{resolveMode:()=>mode},QuickStrokeDevMode:{isEnabled:()=>dev}}});vm.runInContext(gate,ctx);assert.equal(ctx.document.documentElement.dataset.speechPublic,mode==='public'&&!dev?'1':'0');assert.equal(viewport.content,mode==='public'&&!dev?'width=device-width, initial-scale=1.0, viewport-fit=cover':'original')}
assert.doesNotMatch(gate,/setItem|removeItem|addEventListener|setTimeout|setInterval|fetch|speechSynthesis|getUserMedia/);
assert.equal(JSON.parse(fs.readFileSync('locales/en-US/ui.json')).speech.target,'The sky is blue today');
assert.doesNotMatch(css,/#metrics-box|#speech-card-rate|#domain-rate-row|#dev-|#debug-|#rb-score/,'Existing pilot/technical visibility policies remain authoritative');
console.log('PASS: frozen Speech engines/cues/navigation/ASR, Public-only fail-closed gate, untouched phrase, atomic CSS and preserved pilot/diagnostic visibility');
