import fs from 'node:fs';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {restoreCompactEmergency} from './compact-emergency-boundaries.mjs';
const base='9ae7b0f2aa340bba2aecc125b7d41d8c60558d11';
const changes=JSON.parse(fs.readFileSync('tests/fixtures/compact-emergency-patch.json','utf8'));
for(const f of Object.keys(changes)) {
 const actual=fs.readFileSync(f,'utf8');
 const priorLanguage = "  return sessionStorage.getItem('fast_lang') || window.QS_CONFIG?.defaultLang || 'th';\n}";
 const newLanguage = "  if (isOrdinaryPublicHome()) {\n    const selected = sessionStorage.getItem('quickstroke_public_home_language');\n    return ['th', 'en', 'ja'].includes(selected) ? selected : 'en';\n  }\n  return sessionStorage.getItem('fast_lang') || window.QS_CONFIG?.defaultLang || 'th';\n}";
 const legacyCountry = "selectedCountry() || (exhibition && key !== 'th' ? 'JP' : 'TH')";
 const newCountry = "selectedCountry() || (key === 'th' ? 'TH' : 'JP')";
 const countryRestored = actual.replace(newCountry,legacyCountry);
 const normalized = f === 'index.html' ? countryRestored.replace(newLanguage,priorLanguage) : f === 'service-worker.js' ? countryRestored.replace('quickstroke-pwa-v107','quickstroke-pwa-v105') : countryRestored;
 assert.equal(restoreCompactEmergency(normalized,f),cp.execFileSync('git',['show',base+':'+f],{encoding:'utf8'}),f+' exact baseline outside inventoried presentation substitutions');
 for(const op of changes[f])assert.ok(actual.includes(f === 'service-worker.js' ? op.after.replace('quickstroke-pwa-v105','quickstroke-pwa-v107') : op.after),f+' intended replacement present');
}
for(const f of ['face-test.html','arm-test.html','speech-test.html','config.js','js/thai-recorded-audio.js','audio/th/manifest.json','audio/th/arm_11_alert_local_emergency_v2.mp3','jssf-consent.html','js/app-mode.js','js/jssf-remote-sync.js','locales/th-TH/ui.json','locales/en-US/ui.json','locales/ja-JP/ui.json'])
 assert.deepEqual(fs.readFileSync(f),cp.execFileSync('git',['show',base+':'+f]),f+' unchanged');
const helper=fs.readFileSync('js/emergency-contacts.js','utf8');
assert.doesNotMatch(helper,/navigator|geolocation|fetch\(|localStorage|setTimeout|setInterval/);
assert.match(helper,/quickstroke_public_emergency_country/);
assert.match(helper,/selectedCountry\(\) \|\| \(exhibition && key !== 'th' \? 'JP' : 'TH'\)/);
for(const f of ['index.html','result.html'])assert.equal(fs.readFileSync(f,'utf8').match(/<script id="emergency-contacts">\n([^]*?)<\/script>/)[1],helper);
assert.match(fs.readFileSync('service-worker.js','utf8'),/quickstroke-pwa-v107/);
console.log('PASS: exact four-file runtime whitelist; Public-only explicit country choice; unchanged engines, audio, locales, Research/Dev; atomic inline helpers; v105 cache.');

// Real helper behavior under denied or invalid tab storage, without browser/media APIs.
const {default:vm}=await import('node:vm');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.isConnected=true;}
 appendChild(el){el.parent=this;this.children.push(el);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){this.events[k]=fn;}
 querySelector(){return this.children.find(e=>e.dataset.emergencyCountries);}
 remove(){this.isConnected=false;this.parent.children=this.parent.children.filter(e=>e!==this);}
}
for(const blocked of [false,true]) {
 const storage={getItem(){if(blocked)throw Error('denied');return 'INVALID';},setItem(){if(blocked)throw Error('denied');}};
 const ctx={window:{sessionStorage:storage},document:{createElement:t=>new Element(t)}};vm.runInNewContext(helper,ctx);
 const render=(lang,jssf=false)=>{const p=new Element('div');return ctx.window.QuickStrokeEmergency.render(p,lang,{publicCompact:true,jssfExhibition:jssf});};
 const en=render('en');assert.equal(en.children[0].href,'tel:1669','ordinary default independent of language');
 const ja=render('ja',true);assert.equal(ja.children[0].href,'tel:119','JSSF default preserved');
 const picker=en.children[1].children[1];picker.value='JP';picker.events.change();assert.equal(en.children[0].href,'tel:119');
 picker.value='TH';picker.events.change();assert.equal(ja.children[0].href,'tel:1669','all mounted groups sync');assert.equal(render('ja',true).children[0].href,'tel:1669','manual choice survives language/exhibition changes');
 const parent=new Element('div');ctx.window.QuickStrokeEmergency.render(parent,'en',{publicCompact:false});assert.deepEqual(parent.children[0].children.filter(e=>e.tag==='a').map(e=>e.href),['tel:1669','tel:119'],'nonPublic path unchanged');
}
console.log('PASS: blocked/invalid storage; same-page synchronization; explicit choice priority; nonPublic legacy path.');
