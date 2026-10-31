import fs from 'node:fs';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
const plan=JSON.parse(fs.readFileSync('tests/fixtures/demo-home-speech-correction.json','utf8'));
for(const [file,ops]of Object.entries(plan)){
 let source=fs.readFileSync(file,'utf8');
 for(const op of [...ops].reverse()){assert.equal(source.split(op.after).length,2,file+' exact correction');source=source.replace(op.after,op.before);}
 assert.equal(source,cp.execFileSync('git',['show','429b3509c20aa36a8cbe698263b53421dfacba9d:'+file],{encoding:'utf8'}),file+' every other engine/audio/value/navigation byte unchanged');
}
for(const f of ['js/app-mode.js','js/demo-public-presentation.js','js/emergency-contacts.js','face-test.html','arm-test.html','result.html','service-worker.js','js/data-contract.js','js/languages.js'])assert.equal(fs.readFileSync(f,'utf8'),cp.execFileSync('git',['show','429b3509c20aa36a8cbe698263b53421dfacba9d:'+f],{encoding:'utf8'}),f+' unchanged');
console.log('PASS: Home display initialization/emergency and Speech presentation-only allowlist; all other runtime bytes unchanged.');
