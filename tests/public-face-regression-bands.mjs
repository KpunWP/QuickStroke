import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const html=fs.readFileSync('face-test.html','utf8');
assert.equal(crypto.createHash('sha256').update(html.match(/<style>([^]*?)<\/style>/)[1]).digest('hex'),'117652cfe343b9387b8bfb2f4496cf2ed4677479343778dcf557d36f3384d807','Every original legacy stylesheet rule stays byte-for-byte unchanged');
for(const name of ['public-face','public-face-startup','public-face-active']){
 const css=fs.readFileSync(`assets/${name}.css`,'utf8');
 assert.equal(html.match(new RegExp(`<style id="${name}-style">\\n([^]*?)<\\/style>`))[1],css);
 for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(/display:grid/.test(match[2]))assert.match(match[1],/#public-face-presentation\s*$/,'No camera ancestor may become a presentation grid');
  if(match[1].includes('::before'))assert.match(match[1],/#public-face-presentation::before\s*$/,'No completion paint surface on camera ancestor');
 }
}
assert.equal((html.match(/id="public-face-presentation"/g)||[]).length,1);
const start=html.indexOf('<!-- PUBLIC FACE PRESENTATION WRAPPER -->'),end=html.indexOf('<!-- END PUBLIC FACE PRESENTATION WRAPPER -->');
const panel=html.slice(start,end);
for(const id of ['score-box','dashboard','public-face-startup'])assert.ok(panel.includes(`id="${id}"`));
for(const id of ['video-container','video','canvas','center-countdown'])assert.ok(!panel.includes(`id="${id}"`));
assert.match(panel,/style="display:contents"/,'Neutral Research/Dev wrapper; no new semantic landmark');
assert.doesNotMatch(fs.readFileSync('assets/public-face-active.css','utf8'),/grid-template|display:block/);
console.log('PASS: atomic offline CSS; grids/paint isolated to camera sibling; original camera DOM outside wrapper; no active body layout override');
