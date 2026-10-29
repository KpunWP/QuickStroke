import fs from 'node:fs';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import {restoreModuleAccents} from './public-module-accent-boundaries.mjs';
const base='4f1cbe59b26080913c803dff5ad99788e9f1c3f2';
const blocks=JSON.parse(fs.readFileSync('tests/fixtures/public-module-accents.json','utf8'));
for(const [file,block] of Object.entries(blocks)){
 const actual=fs.readFileSync(file,'utf8');assert.equal(actual.split(block).length,2,file+' one exact identity block');
 assert.equal(restoreModuleAccents(actual,file),cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}),file+' every original byte unchanged');
 for(const match of block.matchAll(/([^{}]+)\{([^{}]+)\}/g)){
  assert.match(match[1],/html\[data-(?:qs-staff-entry="0"|(?:face|arm|speech|result)-public="1")\]/);
  for(const declaration of match[2].split(';').filter(Boolean))assert.match(declaration,/^(?:color|background-color|border-top-color):#[0-9A-F]{6}(?:!important)?$/);
  assert.doesNotMatch(match[1],/#video|#canvas|#center-countdown|#mic-circle|#score|#final-banner|#instr|#action|button|:active|:focus|:disabled/);
 }
}
assert.equal(restoreModuleAccents(fs.readFileSync('service-worker.js','utf8'),'service-worker.js'),cp.execFileSync('git',['show',base+':service-worker.js'],{encoding:'utf8'}));
for(const [style,html] of [['public-face-startup','face-test.html'],['public-arm','arm-test.html'],['public-speech','speech-test.html'],['public-result','result.html']])assert.equal(fs.readFileSync(html,'utf8').match(new RegExp('<style id="'+style+'-style">\\n([^]*?)</style>'))[1],fs.readFileSync('assets/'+style+'.css','utf8'));
// Contrast: module icons are non-text (3:1); Arm/Speech heading text requires 4.5:1.
function luminance(hex){const rgb=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [fg,bg]of [['0D9488','F0FDFA'],['2563EB','EFF6FF'],['7C3AED','F5F3FF'],['0D9488','102639']])assert.ok(contrast(fg,bg)>=3);
assert.ok(contrast('2563EB','FFFFFF')>=4.5);
for(const bg of ['F4F7FA','FFFFFF','E4EFFC'])assert.ok(contrast('7C3AED',bg)>=4.5);
console.log('PASS: exact color-only whitelist, untouched original pages/styles/JS/text, atomic inline CSS, contrast and v108-only asset migration.');
