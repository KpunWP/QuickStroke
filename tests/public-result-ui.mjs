import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restorePowerWords} from './power-words-boundaries.mjs';
import {restoreResultEmergency} from './emergency-boundaries.mjs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const html=restorePowerWords(fs.readFileSync(new URL('../result.html',import.meta.url),'utf8'),'result.html');
const css=fs.readFileSync(new URL('../assets/public-result.css',import.meta.url),'utf8');
const bundled=html.match(/<style id="public-result-style">\n([^]*?)<\/style>/);
assert.ok(bundled,'Public Result CSS must travel atomically with cached HTML');
assert.equal(bundled[1],css,'Bundled CSS must exactly match the reviewed stylesheet source');
assert.doesNotMatch(html,/<link[^>]+href="assets\/public-result\.css"/);
function source(name){const m=html.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n   \\}`));assert.ok(m,name);return m[0];}
// Every existing script byte is frozen: only the presentation helper and one
// render call may differ from the approved Home branch's Result implementation.
let normalized=restoreResultEmergency(html).replace(/   \/\/ Presentation only: use the already recovered session, never query mode\.\n[^]*?(?=   async function buildResult\()/,'').replace('     updatePublicResultPresentation(CURRENT);\n','');
const scripts=[...normalized.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const expected='bc86600becbac0eaa79f983c3ead2769d4a306ef5f8e140ceb6b7ab254cdbf79';
assert.equal(crypto.createHash('sha256').update(scripts).digest('hex'),expected,'Existing Result interpretations, recovery, persistence, TTS and handlers must remain byte-identical');
for(const rule of css.split('}').filter(x=>x.trim()))assert.match(rule.trim(),/^(?:\/\*[^]*?\*\/\s*)?html\[data-result-public="1"\]/,'All styles are Public-scoped');
assert.doesNotMatch(source('updatePublicResultPresentation'),/sessionStorage|localStorage|fetch\(|finalize|setTimeout|location\./);
for(const mode of ['public','research','dev'])for(const scope of ['combined','individual'])for(const count of [0,1,2,3]){
 const completion={hidden:true,textContent:''},grid={dataset:{}},viewport={content:'legacy'};
 const tiles=Array.from({length:3},()=>({children:[],querySelector:s=>s==='.module-history'?null:{},setAttribute(){},appendChild(e){this.children.push(e)}}));
 const ctx=vm.createContext({MODULES:['face','arm','speech'],T:{completionShort:'{n}/3 complete',validityInvalid:'Unable to assess'},isPublicResultSession:()=>mode==='public',document:{documentElement:{dataset:{}},querySelector:()=>viewport,getElementById:id=>id==='module-grid'?grid:completion,querySelectorAll:()=>tiles,createElement:()=>({})}});
 vm.runInContext(source('updatePublicResultPresentation'),ctx);
 ctx.fixture={scope,data:{},valid:Array(count).fill('valid'),invalid:['speech']};vm.runInContext('updatePublicResultPresentation(fixture)',ctx);
 assert.equal(ctx.document.documentElement.dataset.resultPublic,mode==='public'?'1':'0');
 assert.equal(completion.hidden,mode!=='public'||scope==='individual'||count!==3);
 assert.equal(grid.dataset.resultComplex,mode==='public'?'0':undefined);
 assert.equal(tiles[2].children.length,mode==='public'?1:0);
 assert.equal(viewport.content.includes('user-scalable=no'),mode!=='public');
}
const fixtures=[
 ['noData',{},'full',null,'noData'],
 ['incomplete',{face:{riskLevel:'ok'}},'full',null,'incomplete'],
 ['unable',{face:{riskLevel:'ok'},arm:{riskLevel:'ok'},speech:{riskLevel:'invalid'}},'full',null,'incomplete'],
 ['ok',{face:{riskLevel:'ok'},arm:{riskLevel:'ok'},speech:{riskLevel:'ok'}},'full',null,'ok'],
 ['review',{face:{riskLevel:'warn'},arm:{riskLevel:'ok'},speech:{riskLevel:'ok'}},'full',null,'review'],
 ['urgentPartial',{face:{riskLevel:'bad'}},'full',null,'urgent'],
 ['urgentComplete',{face:{riskLevel:'bad'},arm:{riskLevel:'ok'},speech:{riskLevel:'ok'}},'full',null,'urgent'],
 ['individualMissing',{},'individual','speech','noData'],
 ['individualInvalid',{speech:{riskLevel:'invalid'}},'individual','speech','incomplete'],
 ['individualOk',{speech:{riskLevel:'ok'}},'individual','speech','ok'],
 ['individualReview',{speech:{riskLevel:'warn'}},'individual','speech','review'],
 ['individualUrgent',{speech:{riskLevel:'bad'}},'individual','speech','urgent']
];
for(const[name,data,mode,sourceModule,state]of fixtures){
 const stored=new Map([['fast_mode',mode],['fast_result_source',sourceModule]]);
 const ctx=vm.createContext({MODULES:['face','arm','speech'],QUERY_PARAMS:new URLSearchParams(),sessionStorage:{getItem:k=>stored.get(k)||null},RESULT_DATA_CONTEXT:{modules:data},WEIGHTS:{face:.4,arm:.4,speech:.2},SINGLE_POSITIVE_OVERRIDE:true});
 for(const fn of ['moduleScore','moduleClass','moduleIsUsable','moduleResearchScoreIsUsable','requestedResultSource','calculate'])vm.runInContext(source(fn),ctx);
 const r=vm.runInContext('calculate()',ctx);assert.equal(r.state,state,name);assert.equal(r.scope,sourceModule?'individual':'combined',name);
}
assert.match(css,/repeat\(auto-fit,minmax/);
assert.match(css,/data-result-complex="1"/);
console.log('PASS: Result script freeze, Public-only presentation/zoom, completion vs validity, five states and full/individual scopes');
