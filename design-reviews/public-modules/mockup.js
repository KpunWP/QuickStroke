'use strict';
// Presentation simulator only. No application scripts, persisted sessions, media,
// timers, research storage or network submission APIs are imported or invoked.
const STATES={result:['completed','incomplete','unable','urgent'],face:['instructions','camera','countdown','capture','result','unable','permission'],arm:['left','countdown','measure','transition','right','completion','retry'],speech:['instructions','countdown','listening','retry','unable','permission','result']};
const ICONS={face:'<circle cx="16" cy="16" r="11"/><path d="M11 13h.1m9.8 0h.1M11 19q5 5 10 0"/>',arm:'<path d="M7 25h13c4 0 6-3 5-7l-2-8-3-3-4 2 2 5 2 1v4h-7l-3-4-4 1 1 9Z"/><path d="m16 9 2 2 4-1M14 19q0-4 4-4"/>',speech:'<path d="M7 7h18v14H15l-6 5v-5H7Z"/><path d="M12 12h8m-8 4h5"/>'};
const warning='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>';
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 14 8-14 8Z"/></svg>';
const mic='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="17" y="5" width="14" height="25" rx="7"/><path d="M11 23a13 13 0 0 0 26 0M24 36v8m-8 0h16"/></svg>';
const params=new URLSearchParams(location.search);
let language=COPY[params.get('lang')]?params.get('lang'):'en';
let moduleName=STATES[params.get('module')]?params.get('module'):'result';
let state=STATES[moduleName].includes(params.get('state'))?params.get('state'):STATES[moduleName][0];
let enlarged=params.get('text')==='200';
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function t(section,key){if(typeof COPY[language]?.[section]?.[key]!=='string')throw new Error('Missing review copy '+language+'/'+section+'.'+key);return COPY[language][section][key];}
const icon=name=>`<span class="icon" aria-hidden="true"><svg viewBox="0 0 32 32">${ICONS[name]}</svg></span>`;
const badge=()=>`<div class="review-badge">${esc(t('review','badge'))}</div>`;
const synthetic=()=>`<p class="caption">${esc(t('review','data'))}</p>`;
const pill=(label)=>`<span class="state-pill"><span class="state-dot" aria-hidden="true"></span>${esc(label)}</span>`;
function actions(label,nextModule,nextState,secondary){const actionIcon=label===t('speech','btnStop')?'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>':play;return `<div class="actions"><button class="primary" data-go="${nextModule}" data-state="${nextState}">${actionIcon}<span>${esc(label)}</span></button>${secondary?`<button class="secondary" data-go="${secondary[1]}" data-state="${secondary[2]}">${esc(secondary[0])}</button>`:''}<a class="secondary link" href="gallery.html">${esc(t('result','home'))}</a></div>`;}
function safety(){return `<aside class="emergency" aria-label="${esc(t('index','notDiagnosis'))}">${warning}<div>${t('index','emergency')}</div></aside><p class="legal">${esc(t('index','notDiagnosis'))}</p>`;}
function progress(){const current=['face','arm','speech'].indexOf(moduleName);return `<div class="progress" aria-label="${esc(t('result','completionShort').replace('{n}',Math.max(0,current)))}">${['face','arm','speech'].map((name,i)=>`<span class="${i===current?'current':i<current?'done':''}">${i<current?'✓ ':''}${esc(t('index',name))}</span>`).join('')}</div>`;}
function heading(title,desc){return `<div class="page-title"><h1>${esc(title)}</h1>${desc?`<p class="guide">${esc(desc)}</p>`:''}</div>`;}
function camera(){return `<div class="camera-card"><div class="camera" role="img" aria-label="${esc(t('review','camera'))}"><svg class="portrait" viewBox="0 0 400 300" aria-hidden="true"><defs><linearGradient id="shirt" x2="0" y2="1"><stop stop-color="#e7eff6"/><stop offset="1" stop-color="#a6bdcf"/></linearGradient></defs><path d="M82 300q5-72 82-82h72q78 10 82 82" fill="url(#shirt)"/><path d="M179 190h42v44q-20 18-42 0" fill="#c79779"/><ellipse cx="200" cy="130" rx="58" ry="79" fill="#d8ab8c"/><path d="M142 126q-14-85 61-88 66 7 57 88l-15-43q-44 7-79-7Z" fill="#263b48"/><path d="M164 120q11-7 20-1m32 0q11-6 20 1" stroke="#614d43" fill="none" stroke-width="4" stroke-linecap="round"/><ellipse cx="176" cy="132" rx="3" ry="3.5" fill="#293940"/><ellipse cx="224" cy="132" rx="3" ry="3.5" fill="#293940"/><path d="m200 138-5 21 10 0m-22 19q17 10 34 0" stroke="#a17159" stroke-width="3" fill="none" stroke-linecap="round"/></svg></div><span class="camera-label">${esc(t('review','camera'))}</span></div>`;}
function countdown(number,label){return `<section class="countdown-panel"><div class="countdown">${number}</div><p>${esc(label)}</p></section>`;}
function resultScreen(){
 const urgent=state==='urgent',unable=state==='unable',incomplete=state==='incomplete'||unable;
 const title=incomplete?'stateIncompleteTitle':urgent?'stateUrgentTitle':'stateReviewTitle';
 const description=incomplete?'stateIncompleteDesc':urgent?'stateUrgentDesc':'stateReviewDesc';
 const count=unable?2:incomplete?1:3;
 const statuses=unable?['moduleOk','moduleOk','validityInvalid']:incomplete?['moduleOk','notTested','notTested']:urgent?['moduleBad','moduleOk','moduleOk']:['moduleReview','moduleOk','moduleOk'];
 const next=incomplete?'nextIncomplete':urgent?'nextUrgent':'nextReview';
 return badge()+`<section class="card summary ${state}"><p class="eyebrow">${esc(t('result','summaryKicker'))}</p><div class="completion">${check}${esc(t('result','completionShort').replace('{n}',count))}</div><h1>${esc(t('result',title))}</h1><p class="guide">${esc(t('result',description))}</p>${synthetic()}</section>${urgent?safety():''}<div class="module-list">${['face','arm','speech'].map((m,i)=>`<div class="module-row">${icon(m)}<div><div class="module-name">${esc(t('index',m))}</div><div class="module-status ${statuses[i]==='moduleReview'?'warn':statuses[i]==='moduleBad'?'danger':''}">${statuses[i]==='moduleOk'?'✓ ':statuses[i]==='moduleBad'?'! ':statuses[i]==='validityInvalid'?'— ':''}${esc(t('result',statuses[i]))}</div></div></div>`).join('')}</div><section class="card"><p>${esc(t('result',next))}</p></section>`+(urgent?'':safety())+actions(t('result',incomplete?'continueTests':'retryAll'),incomplete?'speech':'face','instructions');
}
function faceScreen(){
 const urgent=state==='result'&&params.get('urgent')==='1';
 const labels={instructions:'step1',camera:'step1',countdown:'step1',capture:'smileVoice',result:'faceAbnormal',unable:'faceUnableAssess'};
 const instruction=state==='permission'?t('permissions','blockedCamera'):urgent?t('face','critical'):t('face',labels[state]);
 const passive=['countdown','capture'].includes(state);
 const button=passive?'':urgent?`<button class="face-urgent-action" data-face-emergency>${esc(t('result',language==='th'?'emergencyThailand':'emergencyLocal'))}</button>`:`<button class="primary" data-go="${state==='result'?'arm':'face'}" data-state="${state==='instructions'?'camera':state==='camera'?'countdown':state==='result'?'left':'instructions'}">${esc(t(state==='permission'?'permissions':'face',state==='permission'?'retryBtn':state==='unable'?'retryBtn':state==='result'?'navNext':'startBtn'))}</button>`;
 return `<div class="face-backdrop" aria-hidden="true"></div><div class="face-experience" data-face-state="${state}"><section class="face-instruction ${state==='permission'||urgent?'glass':''}"><h1>${esc(instruction)}</h1></section><section class="face-stage" aria-label="${esc(t('review','camera'))}"><div class="face-clear-zone">${camera().replace('viewBox="0 0 400 300"','viewBox="100 25 200 250"')}</div></section><div class="face-bottom">${state==='countdown'?'<div class="face-countdown" aria-label="5"><span>5</span></div>':''}${state==='permission'?`<p class="face-permission-note">${esc(t('permissions','privacyCameraNote'))}</p>`:''}${state==='unable'?`<p class="face-error-help">${esc(t('face','invalidHelp'))}</p>`:''}<div class="face-controls">${button}</div>${state==='result'?`<p class="face-result-note">${esc(t('review','data'))}</p>`:''}</div></div>`;
}
function armScreen(){
 let body=badge()+progress();const right=state==='right',done=state==='completion',transition=state==='transition';
 body+=heading(t('index','arm'))+`<div class="stepper"><span class="${!right&&!done?'current':'done'}">${esc(t('arm','armLeft'))}</span><span class="${right?'current':done?'done':''}">${esc(t('arm','armRight'))}</span></div>`;
 if(done)return body+`<section class="card"><h2>${esc(t('arm','finalOk'))}</h2><p>${esc(t('arm','finalOkSub'))}</p>${synthetic()}</section>`+actions(t('arm','navNext'),'speech','instructions',[t('arm','btnRetryArm'),'arm','left'])+safety();
 if(transition)return body+`<section class="card"><h2>${esc(t('arm','instrDone_left'))}</h2><p class="guide">${esc(t('arm','instrWait_right'))}</p></section>`+actions(t('arm','btnNext'),'arm','right')+safety();
 if(state==='retry')return body+`<section class="card"><h2>${esc(t('arm','instrRetryWrist'))}</h2><p>${esc(t('arm','subRetryWrist'))}</p>${synthetic()}</section>`+actions(t('arm','btnRetryArm'),'arm','left')+safety();
 if(state==='countdown'||state==='measure')return body+heading(t('arm',state==='measure'?'instrMeasure':'instrCalib'),t('arm',state==='measure'?'subMeasure':'subCalib'))+countdown(state==='measure'?'8':'3',t('arm','guideNote'))+safety();
 body+=heading(t('arm',right?'instrWait_right':'instrWait_left'),t('arm',right?'subWait_right':'subWait_left'))+`<figure class="guide-portrait"><img src="assets/arm-${right?'right':'left'}.webp" alt="${esc(t('arm',right?'subWait_right':'subWait_left'))}"><figcaption>${esc(t('arm','guideNote'))}</figcaption></figure>`;
 return body+actions(t('arm',right?'btnConfirmStart_right':'btnConfirmStart_left'),'arm',right?'completion':'countdown')+safety();
}
function speechScreen(){
 let body=badge()+progress()+heading(t('index','speech'));
 if(state==='permission')return body+`<section class="card"><h2>${esc(t('permissions','blockedTitle'))}</h2><p>${esc(t('permissions','blockedMic'))}</p><p class="caption">${esc(t('permissions','privacyMicNote'))}</p></section>`+actions(t('permissions','retryBtn'),'speech','instructions')+safety();
 if(['retry','unable'].includes(state))return body+`<section class="card"><h2>${esc(t('speech',state==='unable'?'displayIndeterminateTitle':'voiceButNoText'))}</h2><p class="guide">${esc(t('speech','subInvalid'))}</p>${synthetic()}</section>`+actions(t('speech','btnRetry'),'speech','instructions')+safety();
 if(state==='result')return body+`<section class="card"><h2>${esc(t('speech','displayNoAlertTitle'))}</h2><p>${esc(t('speech','displayNoAlertSummary'))}</p>${synthetic()}</section>`+actions(t('speech','fastResult'),'result','completed',[t('speech','btnRetry'),'speech','instructions'])+safety();
 if(state==='instructions')body+=`<section class="card"><h2>${esc(t('speech','hint'))}</h2><p class="phrase">${esc(t('speech','target'))}</p><p class="caption">${esc(t('permissions','privacyMicNote'))}</p></section>`;
 if(state==='countdown')body+=`<section class="card"><p>${esc(t('speech','preparePrompt'))}</p></section>`+countdown('3',t('speech','hint'));
 if(state==='countdown')return body+safety();
 if(state==='listening')body+=`<section class="card listening"><div class="mic-visual">${mic}</div><div style="text-align:center">${pill(t('speech','listening'))}</div><p class="phrase">${esc(t('speech','target'))}</p><p>${esc(t('speech','listeningPrompt'))}</p><div class="transcript"><p>${esc(t('speech','target'))}</p><p class="caption">${esc(t('speech','phraseExact'))}</p></div>${synthetic()}</section>`;
 return body+actions(t('speech',state==='listening'?'btnStop':'btnStart'),'speech',state==='instructions'?'countdown':state==='countdown'?'listening':'result')+safety();
}
function render(){
 document.body.classList.toggle('face-mode',moduleName==='face');
 document.body.classList.toggle('face-active',moduleName==='face'&&['camera','countdown','capture'].includes(state));
 document.documentElement.lang={en:'en-US',th:'th-TH',ja:'ja-JP'}[language];document.documentElement.classList.toggle('large',enlarged);
 document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===language?'true':'false'));
 document.getElementById('module-select').innerHTML=Object.keys(STATES).map(m=>`<option value="${m}" ${moduleName===m?'selected':''}>${m}</option>`).join('');
 document.getElementById('state-select').innerHTML=STATES[moduleName].map(s=>`<option value="${s}" ${state===s?'selected':''}>${s}</option>`).join('');
 document.getElementById('large-text').checked=enlarged;
 let content;
 content=({result:resultScreen,face:faceScreen,arm:armScreen,speech:speechScreen})[moduleName]();
 document.getElementById('screen').innerHTML=content;document.getElementById('simulation').textContent=t('review','notice');
 document.querySelector('[data-face-emergency]')?.addEventListener('click',()=>alert(t('review','notice')));
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go,b.dataset.state)));
 const url=new URL(location.href);for(const[k,v]of Object.entries({module:moduleName,state,lang:language,text:enlarged?'200':'100'}))url.searchParams.set(k,v);history.replaceState(null,'',url);
}
function navigate(m,s){moduleName=m;state=s;render();window.scrollTo(0,0);}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{language=b.dataset.lang;render();}));
document.getElementById('module-select').addEventListener('change',e=>navigate(e.target.value,STATES[e.target.value][0]));
document.getElementById('state-select').addEventListener('change',e=>navigate(moduleName,e.target.value));
document.getElementById('next-state').addEventListener('click',()=>navigate(moduleName,STATES[moduleName][(STATES[moduleName].indexOf(state)+1)%STATES[moduleName].length]));
document.getElementById('large-text').addEventListener('change',e=>{enlarged=e.target.checked;render();});
render();
