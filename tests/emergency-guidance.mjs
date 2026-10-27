import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read=f=>fs.readFileSync(f,'utf8');
const neutral='อาจพบแขนตก หากสงสัยสโตรก ติดต่อบริการฉุกเฉินในพื้นที่ทันที';
const old='อาจพบแขนตก หากสงสัยสโตรก โทร 1669 ทันที';
const helper=read('js/emergency-contacts.js');
assert.doesNotMatch(helper,/navigator|geolocation|sessionStorage|localStorage|fetch\(|setTimeout/);
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};}
 appendChild(e){e.parent=this;this.children.push(e)}
 setAttribute(k,v){this.attrs[k]=v}
 querySelector(){return this.children.find(e=>e.dataset.emergencyCountries)}
 remove(){this.parent.children=this.parent.children.filter(e=>e!==this)}
}
const context={window:{},document:{createElement:t=>new Element(t)}};vm.runInNewContext(helper,context);
for(const lang of ['th','en','ja','th-TH','en-US','ja-JP']){
 const parent=new Element('div');context.window.QuickStrokeEmergency.render(parent,lang);context.window.QuickStrokeEmergency.render(parent,lang);
 assert.equal(parent.children.length,1);const links=parent.children[0].children.filter(e=>e.tag==='a');
 assert.deepEqual(links.map(e=>e.href),['tel:1669','tel:119']);assert.deepEqual(links.map(e=>e.dataset.emergencyCountry),['TH','JP']);
 for(const e of links){assert.ok(e.textContent.includes(e.href.slice(4)));assert.match(e.style.cssText,/min-height:48px/)}
}
for(const file of ['index.html','result.html'])assert.equal(read(file).match(/<script id="emergency-contacts">\n([^]*?)<\/script>/)[1],helper,'Atomic helper: '+file);
assert.doesNotMatch(read('index.html').match(/function activateEmergencyCard\([^]*?\n\}/)[0],/location|tel:|lang\s*[!=]==/);
assert.doesNotMatch(read('result.html'),/function emergencyPhone|tel:\$\{phone\}|b.textContent = '1669'/);
const manifest=JSON.parse(read('audio/th/manifest.json'));assert.equal(manifest.clips[neutral],'arm_11_alert_local_emergency_v2.mp3');assert.equal(manifest.clips[old],undefined);
assert.doesNotMatch(read('js/thai-recorded-audio.js'),/['"]arm_11_alert\.mp3['"]/);
const source=read('js/thai-recorded-audio.js');const requested=[];
class Audio {
 constructor(){this.listeners={}}addEventListener(k,v){this.listeners[k]=v}removeEventListener(k){delete this.listeners[k]}pause(){}removeAttribute(){}
 play(){requested.push(this.src);queueMicrotask(()=>this.listeners.ended?.());return Promise.resolve()}
}
for(const ua of ['iPhone','Android Chrome','Android SamsungBrowser/'])for(const mode of ['public','research','dev']){
 const window={speechSynthesis:{getVoices:()=>[{lang:'th-TH'}]},QuickStrokeDevMode:{isEnabled:()=>false},QuickStrokeDataContract:{getSessionContext:()=>({appMode:mode,researchMetadata:{researchProfile:'community_remote_qr',consentStatus:'consented'}})}};
 const ctx={window,Audio,navigator:{userAgent:ua},location:{search:'',pathname:'/arm-test.html'},sessionStorage:{getItem:()=>null,setItem(){}},document:{baseURI:'https://fixture.test/',readyState:'loading',addEventListener(){}},URL,URLSearchParams,Map,Promise,setTimeout,clearTimeout,console};
 vm.runInNewContext(source,ctx);const player=window.QuickStrokeThaiRecorded;
 assert.equal(player.fileFor(neutral),'arm_11_alert_local_emergency_v2.mp3');assert.equal(player.fileFor(old),'arm_11_alert_local_emergency_v2.mp3','Old cached transcript cannot select old recording');
 assert.equal(await player.play(neutral),'ended');assert.equal(await player.play(old),'ended');
 const originalPlay=Audio.prototype.play;Audio.prototype.play=function(){requested.push(this.src);return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}))};assert.equal(await player.play(neutral),'blocked');Audio.prototype.play=originalPlay;

 if(ua==='iPhone')assert.equal(player.use('th-TH'),false);else if(mode==='research'||ua.includes('Samsung'))assert.equal(player.use('th-TH'),true);
}
assert.ok(requested.every(u=>u.endsWith('/audio/th/arm_11_alert_local_emergency_v2.mp3')));
const sw=read('service-worker.js');assert.match(sw,/quickstroke-pwa-v102/);assert.match(sw,/REQUIRED_OFFLINE_ASSETS[^]*?arm_11_alert_local_emergency_v2.mp3/);assert.match(source,/quickstroke-jssf-th-audio-v4/);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(hash('audio/th/arm_11_alert_local_emergency_v2.mp3'),'b99907a9d1c0b7d78302a145131c7ab2672d2a16ec9b15e4e965bb23567a4f7d');
assert.equal(hash('audio/th/arm_11_alert.mp3'),'7c88dca14c14cc161c6b600739c7e734777915ca0f41671b867aeb6dc3c3b9af','Never overwrite original recording');
console.log('PASS: explicit TH/JP destinations in all languages; no inference/persistence; atomic helpers; new/legacy transcript -> supplied new audio; synthetic platform/mode playback; cache versions; original audio unchanged. Human listening/device playback NOT verified.');
// Freeze non-emergency configuration, translations and player lifecycle functions.
const protectedHashes=JSON.parse(read('tests/fixtures/emergency-protected-hashes.json'));
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const configContext={window:{}};vm.runInNewContext(read('config.js'),configContext);assert.equal(configContext.window.QS_CONFIG.emergency,undefined);delete configContext.window.QS_CONFIG.assetVersions.localePack;assert.equal(digest(JSON.stringify(configContext.window.QS_CONFIG)),protectedHashes.config);
const thai=JSON.parse(read('locales/th-TH/ui.json'));for(const path of protectedHashes.changed){const [g,k]=path.split('.');delete thai[g][k]}assert.equal(digest(JSON.stringify(thai)),protectedHashes.thai);
for(const [name,next] of [['use','fileFor'],['stop','unlock'],['unlock',null],['play','addAudioTestControl']]){const a=source.indexOf('  function '+name+'('),b=next?source.indexOf('  function '+next+'(',a):source.indexOf("  document.addEventListener('pointerdown'",a);assert.equal(digest(source.slice(a,b)),protectedHashes.player[name],name+' lifecycle exact');}
const result=read('result.html'),renderHashes=JSON.parse(read('tests/fixtures/emergency-result-render-hashes.json'));
for(const [name,next]of [['renderSummary','moduleStatus'],['renderReminder','appendTechnicalRow']]){const a=result.indexOf('   function '+name+'('),b=result.indexOf('   function '+next+'(',a);assert.equal(digest(result.slice(a,b)),renderHashes[name],name+' approved emergency-only delta frozen');}

const completeThai=JSON.parse(read('locales/th-TH/ui.json'));
for(const [path,prefix] of Object.entries(protectedHashes.clinicalPrefixes)){const [group,key]=path.split('.');assert.equal(completeThai[group][key].split('หากสงสัย')[0],prefix);assert.ok(!completeThai[group][key].includes('1669'));}
