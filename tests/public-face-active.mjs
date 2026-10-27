import assert from 'node:assert/strict';
import fs from 'node:fs';
import {restoreReferences} from './emergency-boundaries.mjs';
import crypto from 'node:crypto';
const html=restoreReferences(fs.readFileSync('face-test.html','utf8'),'face-test.html'),css=fs.readFileSync('assets/public-face-active.css','utf8');
// Presentation wrapper and CSS are separately checked; freeze every original node/script.
const normalize=s=>s.replace(/<style\b[^>]*>[^]*?<\/style>/g,'').replace('<!-- PUBLIC FACE PRESENTATION WRAPPER -->\n<div id="public-face-presentation" style="display:contents">\n','').replace('</div><!-- END PUBLIC FACE PRESENTATION WRAPPER -->\n','');
assert.equal(crypto.createHash('sha256').update(normalize(html)).digest('hex'),'72eedd4d29cc3ea9a367b4babda1e2a45dd008c8701bf1f9f63d6bdab3adffe1','Original DOM/scripts remain frozen after removing the two presentation wrapper tags and CSS');
assert.equal(html.match(/<style id="public-face-active-style">\n([^]*?)<\/style>/)[1],css);
const scope='html[data-face-public="1"] body.screening-active:not(.result-visible):not(:has(#dashboard.pulse))';
for(const rule of css.split('}').filter(x=>x.trim()))assert.ok(rule.replace(/\/\*[^]*?\*\//g,'').trim().startsWith(scope));
assert.doesNotMatch(css,/scaleX|#canvas|visibility:|display:none|animation:|filter:blur\([^0n]|z-index:/);
assert.doesNotMatch(css,/#video(?:-container)?\b/);assert.match(css,/top:50%/);assert.match(css,/color:rgba\(255,255,255,\.85\)/);assert.match(css,/pointer-events:none/);
console.log('PASS: original DOM/scripts frozen except two wrapper tags; Public camera geometry inherited; Bold centered countdown unchanged');
