import fs from 'node:fs';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
const plan=JSON.parse(fs.readFileSync('tests/fixtures/demo-home-speech-correction.json','utf8'));
for(const [file,ops]of Object.entries(plan)){
 let source=fs.readFileSync(file,'utf8');
 for(const op of [...(JSON.parse(fs.readFileSync('tests/fixtures/demo-speech-controls-correction.json','utf8'))[file]||[])].reverse()){assert.equal(source.split(op.after).length,2);source=source.replace(op.after,op.before);}
 for(const op of [...ops].reverse()){assert.equal(source.split(op.after).length,2,file+' exact correction');source=source.replace(op.after,op.before);}
 assert.equal(source,cp.execFileSync('git',['show','429b3509c20aa36a8cbe698263b53421dfacba9d:'+file],{encoding:'utf8'}),file+' every other engine/audio/value/navigation byte unchanged');
}
for(const f of ['js/app-mode.js','js/demo-public-presentation.js','js/emergency-contacts.js','face-test.html','arm-test.html','result.html','service-worker.js','js/data-contract.js','js/languages.js'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','429b3509c20aa36a8cbe698263b53421dfacba9d:'+f],{encoding:'utf8'}),f+' unchanged');
console.log('PASS: Home display initialization/emergency and Speech presentation-only allowlist; all other runtime bytes unchanged.');
const controls=JSON.parse(fs.readFileSync('tests/fixtures/demo-speech-controls-correction.json','utf8'));
assert.deepEqual(Object.keys(controls).sort(),['js/technical-demo.js','speech-test.html']);
for(const [file,ops] of Object.entries(controls)){
 let source=fs.readFileSync(file,'utf8');
 for(const op of [...ops].reverse()){assert.equal(source.split(op.after).length,2,file+' exact control-only correction');source=source.replace(op.after,op.before);}
 assert.equal(source,cp.execFileSync('git',['show','1e83ea333ac8b0776e5664dea8c0c36ca1c3feec:'+file],{encoding:'utf8'}),file+' scalar/ASR/audio/Retry functions unchanged');
}
for(const file of ['index.html','face-test.html','arm-test.html','result.html','service-worker.js'])assert.equal(fs.readFileSync(file,'utf8'),cp.execFileSync('git',['show','1e83ea333ac8b0776e5664dea8c0c36ca1c3feec:'+file],{encoding:'utf8'}),file+' latest accepted Home/other modules/offline unchanged');
console.log('PASS: exact Speech-only UI correction from 1e83; original controls/actions, Home, Face, Arm, Result and SW unchanged.');
