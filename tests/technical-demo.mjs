import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import vm from 'node:vm';
import {restoreTechnicalDemo} from './technical-demo-boundaries.mjs';
const base='82cf095eaf47581283cdf28b789d80a48fc90268';
const plan=JSON.parse(fs.readFileSync('tests/fixtures/technical-demo-patch.json','utf8'));
for(const[file,ops]of Object.entries(plan)){
 const text=fs.readFileSync(file,'utf8');
 for(const op of ops)assert.equal(text.split(op.after).length,2,'One exact allowlisted block: '+file);
 assert.equal(restoreTechnicalDemo(text,file),cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),'All original engine/UI/audio/research bytes retained: '+file);
}
for(const file of ['index.html','result.html','service-worker.js','config.js','js/dev-mode.js','js/app-mode.js','js/data-contract.js','js/research-store.js','js/jssf-remote-sync.js','js/thai-recorded-audio.js','locales/th-TH/ui.json','locales/en-US/ui.json','locales/ja-JP/ui.json','audio/th/arm_11_alert_local_emergency_v2.mp3'])assert.ok(fs.readFileSync(file).equals(cp.execFileSync('git',['show',base+':'+file])),file+' unchanged');
const source=fs.readFileSync('js/technical-demo.js','utf8');
assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|\.logEvent|addTechnicalEvent|\.getUserMedia|new .*Recognition|Landmarker|\.speak\(|\.play\(|drawImage|getImageData|toDataURL|JSON\.stringify/);
for(const dev of [true,false])for(const mode of ['public','research','dev',undefined])for(const role of ['engineering_only','public_ephemeral','research_candidate',undefined])for(const context of ['public','research','dev',undefined]){
 const w={QuickStrokeDevMode:{isEnabled:()=>dev},QuickStrokeAppMode:{resolveMode:()=>mode,getAnalysisRole:()=>role},QuickStrokeDataContract:{getSessionContext:()=>({appMode:context})}};
 vm.runInNewContext(source,{window:w});
 assert.equal(!!w.QuickStrokeTechnicalDemo,dev&&mode==='dev'&&role==='engineering_only'&&!['public','research'].includes(context));
}
assert.match(source,/points.length>60/);assert.match(source,/setInterval\(tick,200\)/);assert.match(source,/if \(fresh&&finite\(s.current\)\)/);
assert.match(plan['speech-test.html'].map(x=>x.after).join('\n'),/if \(isCurrentRun\(\)\).*speechResult\(bestTranscript\)/);
console.log('PASS: exact baseline preservation outside explicitly inventoried projections, 128 mode gates, no new persistence/network/media/engines, bounded sampled graph, original SW/locales/audio unchanged.');
