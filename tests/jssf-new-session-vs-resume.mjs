import assert from 'node:assert/strict';
import fs from 'node:fs';
const consent=fs.readFileSync(new URL('../jssf-consent.html',import.meta.url),'utf8');
assert.match(consent,/async function begin\(\)[\s\S]*?await ensureRemoteSession\(\{forceNew:true\}\)/,'Start must always create a new JSSF session even if resume discovery misses old one');
assert.match(consent,/async function resumeExisting\(\)[\s\S]*?getRemoteResumeBundle\(resumeCandidate\.clientSessionId\)/,'Resume must remain explicit and continue the existing session');
assert.match(consent,/function ensureRemoteSession\(\{forceNew=false\}=\{\}\)[\s\S]*?if\(forceNew \|\| !isReusableRemoteContext\(context\)\)/,'Fresh session must bypass reusable local context');
console.log('PASS: JSSF explicit new session vs resume contract');
