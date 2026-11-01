import fs from 'node:fs';
import cp from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base='bde5ead8904a8a9fe385a5b45b842d89a0ff3a29';
const plan=JSON.parse(fs.readFileSync('tests/fixtures/demo-public-presentation-patch.json','utf8'));
for(const [file,ops] of Object.entries(plan)){
 let text=fs.readFileSync(file,'utf8');
 for(const op of [...ops].reverse()){assert.equal(text.split(op.after).length,2,file+' exact visual allowlist');text=text.replace(op.after,op.before);}
 assert.equal(text,cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),file+' every other byte, including all engines, audio and navigation, unchanged');
}
const source=fs.readFileSync('js/demo-public-presentation.js','utf8');
assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|getUserMedia|Recognition|\.speak\(|\.play\(|setTimeout|setInterval|requestAnimationFrame/);
for(const dev of [false,true])for(const mode of ['public','research','dev',undefined])for(const role of ['engineering_only','public_ephemeral','research_candidate',undefined])for(const context of ['public','research','dev',undefined]){
 const w={QuickStrokeDevMode:{isEnabled:()=>dev},QuickStrokeAppMode:{resolveMode:()=>mode,getAnalysisRole:()=>role},QuickStrokeDataContract:{getSessionContext:()=>({appMode:context})}};
 let markers={},appended=[],removed=0;
 const viewport={content:'original'};
 const rule={selectorText:'html[data-face-public="1"] #video',cssText:'html[data-face-public="1"] #video { object-fit: cover; }'};
 const d={documentElement:{dataset:markers},querySelector:()=>viewport,querySelectorAll:()=>[{sheet:{cssRules:[rule,{cssText:'@media (max-width:430px) {ignored}',cssRules:[rule]}]}}],createElement:()=>({remove(){removed++;}}),head:{append(x){appended.push(x);}}};
 w.addEventListener=()=>{};
 vm.runInNewContext(source,{window:w,document:d,location:{pathname:'/face-test.html'}});
 const eligible=dev&&mode==='dev'&&role==='engineering_only'&&!['public','research'].includes(context);
 assert.equal(w.QuickStrokeDemoPresentation.enabled(),eligible);
 assert.equal(markers.demoPresentation,eligible?'face':undefined);
 assert.equal(appended.length,eligible?1:0);
 if(eligible){assert.match(appended[0].textContent,/html\[data-demo-presentation="face"\] #video/);assert.match(appended[0].textContent,/@media/);assert.doesNotMatch(appended[0].textContent,/data-face-public/);w.QuickStrokeDevMode.isEnabled=()=>false;assert.equal(w.QuickStrokeDemoPresentation.apply(),false);assert.equal(removed,1);assert.equal(viewport.content,'original');assert.equal(markers.demoPresentation,undefined);}
}
for(const file of ['js/app-mode.js','js/dev-mode.js','js/data-contract.js','js/languages.js','js/research-policy.js','js/research-store.js','js/emergency-contacts.js','assets/public-face.css','assets/public-face-startup.css','assets/public-face-active.css','assets/public-arm.css','assets/public-speech.css','assets/public-result.css','service-worker.js','js/thai-recorded-audio.js','locales/th-TH/ui.json','locales/en-US/ui.json','locales/ja-JP/ui.json'])assert.equal(fs.readFileSync(file,'utf8'),cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),file+' unchanged');
console.log('PASS: exact five-page visual allowlist; all remaining runtime bytes frozen; 128 strict eligibility cases; original SW/locales/mode helpers; nested responsive CSS projection and teardown; no media/network/storage/timing APIs.');
