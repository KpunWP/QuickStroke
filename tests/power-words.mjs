import {restoreCompactEmergency} from './compact-emergency-boundaries.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import vm from 'node:vm';
import {restorePowerWords,restorePowerLocale} from './power-words-boundaries.mjs';
const read=f=>fs.readFileSync(f,'utf8'), hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const plan=JSON.parse(read('docs/jssf-power-words-plan.json')),base=JSON.parse(read('tests/fixtures/power-words-baseline.json'));
for(const [file,sha] of Object.entries(base)){
 const raw=read(file);
 const restored=file.startsWith('locales/')?JSON.stringify(restorePowerLocale(JSON.parse(raw),file.split('/')[1]),null,2)+'\n':restorePowerWords(raw,file);
 assert.equal(hash(restored),sha,file+' frozen except exact inventoried text/version changes');
}
for(const [file,ops] of Object.entries(plan.source))for(const op of ops){assert.ok(restoreCompactEmergency(read(file),file).includes(op.after),file+' explicit new text present');}
const packs=['th-TH','en-US','ja-JP'].map(l=>JSON.parse(read('locales/'+l+'/ui.json')));
for(let i=0;i<packs.length;i++){
 const pack=packs[i],lang=['th-TH','en-US','ja-JP'][i];
 for(const r of plan.locale.filter(r=>r.locale===lang)){let v=pack;for(const k of r.key.split('.'))v=v[k];assert.equal(v,r.new,r.key);}
 assert.equal(pack.arm.vFinalBad,i===0?'อาจพบแขนตก หากสงสัยสโตรก ติดต่อบริการฉุกเฉินในพื้นที่ทันที':i===1?'Possible arm drift. If stroke is suspected, call emergency services now.':'腕下垂の可能性があります。脳卒中が疑われる場合は直ちに救急通報してください。');
 assert.ok(pack.speech.retryingIncomplete);assert.ok(pack.face.lookUp.startsWith('⬆️'));assert.ok(pack.face.lookDown.startsWith('⬇️'));
 const s=read('speech-test.html'),helper=s.match(/function speechUiText\(key\) \{[^]*?\n\}/)[0];
 assert.doesNotMatch(helper,/setItem|setTimeout|setInterval|\.start\(|\.stop\(|\.play\(|fetch|recognition|phase\s*=/);
 for(const mode of ['public','research','dev']){
  const ctx={document:{documentElement:{dataset:{speechPublic:mode==='public'?'1':'0'}}},T:pack.speech};vm.runInNewContext(helper+';globalThis.get=speechUiText',ctx);
  assert.equal(ctx.get('displayNoAlertTitle'),mode==='public'?pack.speech.publicUi.displayNoAlertTitle:pack.speech.displayNoAlertTitle);
  assert.equal(ctx.get('displayNoAlertSummary'),mode==='public'?'':pack.speech.displayNoAlertSummary);
 }
 for(const key of ['displayNoAlertTitle','displayAttentionTitle','displayIndeterminateTitle','resultInvalid','micAccessError','speechApiUnavailable','recognitionRecovery','detailsResearchNote'])assert.doesNotMatch(pack.speech.publicUi[key],/\bitem\b|\bflag\b|ASR|pre-pilot|prepilot|JSON/i);
 assert.doesNotMatch(pack.speech.publicUi.fastIncomplete,/Complete all 3|ทำให้ครบ|すべて実施/);
}
assert.equal(hash(fs.readFileSync('audio/th/arm_11_alert_local_emergency_v2.mp3')),'b99907a9d1c0b7d78302a145131c7ab2672d2a16ec9b15e4e965bb23567a4f7d');
assert.ok(!fs.existsSync('api/face-cold-debug-gate.js'));
console.log('PASS: exact copy/version whitelist; entire original pages/engines/assets restored to PR124 hashes; Public-only wording; unchanged Research/Dev originals; approved EN/JA urgency; Thai MP3/map/manifest and phrase variants frozen; safety text; complete locales; no diagnostics.');
