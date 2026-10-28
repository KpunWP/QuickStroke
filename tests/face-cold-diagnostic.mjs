import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {parts,activate} from '../js/face-cold-diagnostic.mjs';
const read=p=>fs.readFileSync(p,'utf8'), html=read('face-test.html');
const loader=html.match(/\n\/\* FACE COLD DIAGNOSTIC START[^]*?\/\* FACE COLD DIAGNOSTIC END \*\/\n/g);
assert.equal(loader.length,1);
assert.equal(crypto.createHash('sha256').update(html.replace(loader[0],'')).digest('hex'),'36d4c1ec58ee3829471b1a031fddc12c26b0a49aa039934b7c9bafca086e8d41','Entire accepted Face page, styles, engines, timers, handlers and completion panel unchanged outside explicit loader');
assert.match(loader[0],/faceColdStartDebug.*=== '1'/);assert.match(loader[0],/dataset.facePublic === '1'/);assert.match(loader[0],/!FACE_DEV_MODE/);
const helper=read('js/face-cold-diagnostic.mjs');
assert.doesNotMatch(helper,/sessionStorage|localStorage|indexedDB|sendBeacon|WebSocket|toDataURL|toBlob|console\.|innerHTML|setInterval|setTimeout|\.srcObject|\.getTracks|\.play\(|\.pause\(/);
assert.equal((helper.match(/fetch\(/g)||[]).length,1);assert.match(helper,/method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error'/);
assert.match(helper,/events.length<48/);assert.match(helper,/180000/);assert.match(helper,/gapCount\+\+<8/);assert.match(helper,/rafCount>=12/);
const code=read('api/face-cold-debug-gate.js');
function request(env,headers={},url='/?faceColdStartDebug=1',method='POST'){
 const module={exports:{}};vm.runInNewContext(code,{module,process:{env},URL});let status,body;
 const res={setHeader(){},status(s){status=s;return this},end(){},json(b){body=b}};
 module.exports({headers:{host:'immutable.vercel.app',...headers},url,method},res);return{status,body};
}
const env={VERCEL:'1',VERCEL_ENV:'preview',VERCEL_URL:'immutable.vercel.app',VERCEL_GIT_COMMIT_SHA:'a'.repeat(40)};
assert.equal(request(env).status,200);
for(const e of [{...env,VERCEL_ENV:'production'},{...env,VERCEL_TARGET_ENV:'staging'},{...env,VERCEL_URL:'custom.example'},{...env,VERCEL_GIT_COMMIT_SHA:''},{}])assert.equal(request(e).status,404);
for(const h of [{host:'alias.vercel.app'},{'sec-fetch-site':'cross-site'}])assert.equal(request(env,h).status,404);
assert.equal(request(env,{},'/').status,404);assert.equal(request(env,{},undefined,'GET').status,405);assert.equal(request(env,{'content-length':'2'}).status,400);
assert.equal(request(env,{'transfer-encoding':'chunked'}).status,400);
let calls=0;globalThis.location={search:'',hostname:'immutable.vercel.app'};globalThis.fetch=async()=>{calls++;throw Error()};
await activate({allowed:()=>true});assert.equal(calls,0);
location.search='?faceColdStartDebug=1&entry=cold';await activate({allowed:()=>false});assert.equal(calls,0);
await activate({allowed:()=>true});assert.equal(calls,1,'Failure stays closed');
for(const lines of [Array(48).fill('1234567890'),Array(48).fill('x'.repeat(120))]){const chunks=parts(lines);assert.ok(chunks.every(x=>x.length<=2800));assert.equal(chunks.join(''),lines.join('\n')+'\n');}
console.log('PASS default/no-flag and Research fail closed; immutable Preview-only empty POST gate; entire accepted page frozen; bounded local-only privacy whitelist; summary parts retain every line');
