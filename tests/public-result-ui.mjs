import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const html=fs.readFileSync(new URL('../result.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/public-result.css',import.meta.url),'utf8');
assert.match(html, /<link href="assets\/public-result\.css" rel="stylesheet"\/>/);
function source(name){const m=html.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n   \\}`));assert.ok(m,name);return m[0];}
// Every existing script byte is frozen: only the presentation helper and one
// render call may differ from the approved Home branch's Result implementation.
let normalized=html.replace(/   \/\/ Presentation only: use the already recovered session, never query mode\.\n[^]*?(?=   async function buildResult\()/,'').replace('     updatePublicResultPresentation(CURRENT);\n','');
const scripts=[...normalized.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const expected='bc86600becbac0eaa79f983c3ead2769d4a306ef5f8e140ceb6b7ab254cdbf79';
assert.equal(crypto.createHash('sha256').update(scripts).digest('hex'),expected,'Existing Result interpretations, recovery, persistence, TTS and handlers must remain byte-identical');
for(const rule of css.split('}').filter(x=>x.trim()))assert.match(rule.trim(),/^(?:\/\*[^]*?\*\/\s*)?html\[data-result-public="1"\]/,'All styles are Public-scoped');
assert.doesNotMatch(source('updatePublicResultPresentation'),/sessionStorage|localStorage|fetch\(|finalize|setTimeout|location\./);
for(const mode of ['public','research','dev'])for(const scope of ['combined','individual'])for(const count of [0,1,2,3]){
 const completion={hidden:true,textContent:''},viewport={content:'legacy'};
 const tiles=Array.from({length:3},()=>({children:[],querySelector:()=>({}),appendChild(e){this.children.push(e)}}));
 const ctx=vm.createContext({MODULES:['face','arm','speech'],T:{completionShort:'{n}/3 complete',validityInvalid:'Unable to assess'},isPublicResultSession:()=>mode==='public',document:{documentElement:{dataset:{}},querySelector:()=>viewport,getElementById:()=>completion,querySelectorAll:()=>tiles,createElement:()=>({})}});
 vm.runInContext(source('updatePublicResultPresentation'),ctx);
 ctx.fixture={scope,valid:Array(count).fill('valid'),invalid:['speech']};vm.runInContext('updatePublicResultPresentation(fixture)',ctx);
 assert.equal(ctx.document.documentElement.dataset.resultPublic,mode==='public'?'1':'0');
 assert.equal(completion.hidden,mode!=='public'||scope==='individual'||count!==3);
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
console.log('PASS: Result script freeze, Public-only presentation/zoom, completion vs validity, five states and full/individual scopes');
