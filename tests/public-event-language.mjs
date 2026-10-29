import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function source(name) {
  const match = html.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`));
  assert.ok(match, name);
  return match[0];
}
function fixture({ search = '', mode = 'public', staff = false, stored = {} } = {}) {
  const data = new Map(Object.entries(stored));
  const ctx = vm.createContext({
    URLSearchParams, console, location:{ search }, lang:'th',
    LOCALE_MAP:{ th:'th-TH', en:'en-US', ja:'ja-JP' },
    APP_MODE:{ resolveMode:() => mode },
    sessionStorage:{ getItem:k => data.get(k) ?? null, setItem:(k,v) => data.set(k,v) },
    document:{ documentElement:{ dataset:{ qsStaffEntry:staff ? '1' : '0' } }, querySelectorAll:() => [] },
    window:{ QS_CONFIG:{ defaultLang:'th' }, QuickStrokeI18n:{ setLocale:async locale => locale } },
    updateEmergencyAction(){}, updateProgress(){}, updateGlobalDevModeUi(){}
  });
  for (const name of ['isOrdinaryPublicHome','homeInitialLanguage','setLang']) vm.runInContext(source(name),ctx);
  return { ctx, data, initial:() => vm.runInContext('homeInitialLanguage()',ctx), set:(lang,initializing=false) => vm.runInContext(`setLang('${lang}', { initializing:${initializing} })`,ctx) };
}
const event = '?event=jssf2026';
assert.equal(fixture().initial(),'en','Ordinary Public Home defaults to English');
assert.equal(fixture({stored:{fast_lang:'ja'}}).initial(),'en','Shared language must not override new Public default');
assert.equal(fixture({search:event}).initial(),'en');
for (const inherited of ['th','ja','en']) {
  const f=fixture({search:event,stored:{fast_lang:inherited}});
  assert.equal(f.initial(),'en','Legacy/Research language cannot override fresh event entry');
  await f.set(f.initial(),true);
  assert.equal(f.data.get('fast_lang'),'en','Module handoff');
  assert.equal(f.data.has('quickstroke_public_home_language'),false,'Initialization is not a user choice');
  for (const selected of ['th','en','ja']) {
    await f.set(selected);
    f.ctx.location.search='';
    assert.equal(f.initial(),selected,'Returning Home without event query');
    const reload=fixture({stored:Object.fromEntries(f.data)});
    assert.equal(reload.initial(),selected,'Reload retains Public choice');
    reload.data.set('fast_lang','th');
    assert.equal(reload.initial(),selected,'Consent cannot overwrite dedicated Public choice');
  }
}
for (const mode of ['research','dev']) {
  const f=fixture({search:event,mode,staff:true,stored:{fast_lang:'th',quickstroke_public_event:'jssf2026',quickstroke_public_home_language:'ja'}});
  assert.equal(f.initial(),'th','Protected/staff entry retains legacy language');
  await f.set('en');
  assert.equal(f.data.get('quickstroke_public_home_language'),'ja','Staff cannot overwrite Public preference');
}
const protectedRecovery=fixture({search:event,mode:'research',stored:{fast_lang:'th'}});
assert.equal(protectedRecovery.initial(),'th');
assert.equal(protectedRecovery.data.has('quickstroke_public_event'),false);
assert.equal(fixture({search:'?event=other',stored:{fast_lang:'ja'}}).initial(),'en');
assert.equal(fixture({search:event,stored:{quickstroke_public_home_language:'invalid'}}).initial(),'en');
assert.match(html,/const initialLang = homeInitialLanguage\(\)/);
assert.match(html,/setLang\(initialLang, \{ initializing:true \}\)/);
for (const file of ['face-test.html','arm-test.html','speech-test.html','result.html']) {
  const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.match(source,/sessionStorage.getItem\(['"]fast_lang['"]\)/,`${file} reads existing handoff`);
}
console.log('PASS: explicit event default, general default, TH/EN/JA selection/reload/return, inherited Research language isolation, protected recovery, staff isolation and module handoff contract');
// Execute the unchanged downstream language readers/initializers with inert locale
// loaders, so no media acquisition or Research persistence can run in this check.
function downstreamSource(file,name) {
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const match=text.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n[ \\t]*\\}`));
  assert.ok(match,`${file}/${name}`);
  const start=text.indexOf(match[0]);
  const opening=text.indexOf('{',start);
  let depth=1,end=opening+1;
  while(depth && end<text.length) {
    if(text[end]==='{')depth++;
    if(text[end]==='}')depth--;
    end++;
  }
  return text.slice(start,end);
}
for (const language of ['th','en','ja']) {
  const calls=[];
  const context=vm.createContext({
    sessionStorage:{getItem:()=>language},localStorage:{getItem:()=> 'th'},navigator:{language:'th'},
    window:{QuickStrokeLanguages:{normalise:code=>code}},
    normaliseArmLang:code=>code,SPEECH_LOCALE_MAP:{th:'th-TH',en:'en-US',ja:'ja-JP'},
    selectLang:async code=>{calls.push(code);return true;}
  });
  vm.runInContext(downstreamSource('face-test.html','getPreferredFaceLang'),context);
  assert.equal(vm.runInContext('getPreferredFaceLang()',context),language);
  vm.runInContext(downstreamSource('result.html','savedLang'),context);
  assert.equal(vm.runInContext('savedLang()',context),language);
  for (const [file,name] of [['arm-test.html','initArmLanguage'],['speech-test.html','initSpeechLanguage']]) {
    vm.runInContext(downstreamSource(file,name),context);
    await vm.runInContext(`${name}()`,context);
    assert.equal(calls.at(-1),language,`${file} handoff`);
  }
}
console.log('PASS: unchanged Face/Arm/Speech/Result language initialization uses TH/EN/JA Home handoff');
