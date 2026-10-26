import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {summaryFixture} from './fixtures/face-layout-summary.mjs';
const source=fs.readFileSync('js/face-layout-debug.js','utf8');
const {buildFaceLayoutSummary}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const report=summaryFixture(),original=JSON.stringify(report);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o)}return o};
freeze(report);const parts=buildFaceLayoutSummary(report);assert.equal(JSON.stringify(report),original);
for(const s of parts)assert.ok(s.length<=3000,`Part too long: ${s.length}`);
assert.ok(parts.length<=2);const text=parts.join('\n');assert.ok(text.length>=1500);
for(const token of ['Before Start','After Start','Bands visible','Completion/result','390x696','480x640','position=absolute','fit=cover','overflow','background','State:','Over-video candidates']){
 assert.ok(text.includes(token),token);
}
assert.equal(text.includes('PRIVATE_HOST_TOKEN'),false);
const missing=summaryFixture();missing.snapshots=missing.snapshots.filter(s=>s.kind==='before-start');
const absent=buildFaceLayoutSummary(missing).join('\n');for(const label of ['After Start','Bands visible (latest)','Completion/result (latest)'])assert.ok(absent.includes(label+': MISSING'));
// A changed/long scene must retain complete stages in a second explicit part, not trim them.
const large=summaryFixture();for(const [i,s]of large.snapshots.entries()){
 s.state.classes=i%2?['screening-active','notice-status','notice-pose','notice-smile']:['start-ready','result-visible','pose-warning-visible','smile-prompt-visible'];
 s.elements['video-container'].cs=large.css.values.push(['block',i%2?'fixed':'relative','fill',`${i}% ${i}%`,'scroll','auto',`rgba(${i}, 0, 0, 0.5)`,'1','visible'])-1;
 for(const id of ['canvas','dashboard','score-box','public-face-startup','no-face-banner'])s.elements[id]={r:[0,0,390,696],cs:2};
 s.bodyPseudo={before:{contentPresent:true},after:{contentPresent:true}};s.ui={r:[0,0,390,696],expanded:true};
}
const split=buildFaceLayoutSummary(large);assert.equal(split.length,2);split.forEach(s=>assert.ok(s.length<=3000,s.length));
for(const label of ['Before Start','After Start ~250ms','After Start ~1s','Bands visible (latest)','Completion/result (latest)'])assert.ok(split.join('\n').includes(label));
const privateData=summaryFixture();privateData.build.sha='PRIVATE_SHA_TOKEN';privateData.tool='PRIVATE_TOOL_TOKEN';privateData.snapshots[0].state.classes.push('PRIVATE_CLASS_TOKEN');privateData.css.values[0][6]='url(PRIVATE_URL_TOKEN)';privateData.participantId='PRIVATE_ID_TOKEN';privateData.snapshots[0].score='PRIVATE_SCORE_TOKEN';
const safe=buildFaceLayoutSummary(privateData).join('\n');assert.equal(/PRIVATE_|https?:|deviceId|sessionId|participantId/.test(safe),false);
// Freeze the original JSON-copy listener, gate and sampling section against PR #118.
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const jsonHandler=source.slice(source.indexOf("  shadow.getElementById('copy').addEventListener"),source.indexOf('  let summaryParts'));
assert.equal(hash(jsonHandler),'83a52c7db1df22a9fdd97f5d4eeb807523e211be34034451fc7784bd70044700');
console.log(`PASS: pure summary; required/missing stages; readable CSS/deltas/layers; compact ${parts.map(p=>p.length).join('+')} chars; two-part boundary; privacy and unchanged JSON copy`);
