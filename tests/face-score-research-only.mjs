import assert from "node:assert/strict";
import fs from "node:fs";

const face=fs.readFileSync(new URL("../face-test.html",import.meta.url),"utf8");
const result=fs.readFileSync(new URL("../result.html",import.meta.url),"utf8");
const config=fs.readFileSync(new URL("../config.js",import.meta.url),"utf8");

// Numeric score remains in the research/result payload.
assert.match(face,/clinicalScore:\s*validityStatus === 'valid' \? score : null/);
assert.match(face,/score:\s*validityStatus === 'valid' \? score : 0/);
assert.match(face,/function asymToScore\(asym\)/);

// Public Face UI must prefer categorical status; only Dev Mode may show the number.
const finishStart=face.indexOf("function saveAndShow");
const finishEnd=face.indexOf("/* ───────────── camera",finishStart);
const finish=face.slice(finishStart,finishEnd);
assert.match(finish,/const userFacingCategory/);
assert.match(finish,/scoreNum\.textContent = FACE_DEV_MODE/);
assert.match(finish,/\? score \+ ' ' \+ FL\.resultScore/);
assert.match(finish,/: userFacingCategory/);
assert.match(finish,/sl\.style\.display = FACE_DEV_MODE \? '' : 'none'/);

// Language refresh must not re-expose the number outside Dev Mode.
const langStart=face.indexOf("function applyFaceLang");
const langEnd=face.indexOf("function setFaceCard",langStart);
const lang=face.slice(langStart,langEnd);
assert.match(lang,/FACE_DEV_MODE && typeof saved\.score==='number'/);
assert.match(lang,/: category/);

// Combined result page already keeps numeric scores in research details only.
assert.match(result,/Numeric module scores remain available for research summaries only/);
assert.match(result,/weightedScoreUsedForUserFacingDecision:\s*false/);
assert.match(result,/technicalDisclaimer/);

assert.match(config,/version:\s*"face-prepilot-1\.6\.0"/);
assert.match(config,/algorithmVersion:\s*"face-asymmetry-1\.6\.0"/);

console.log("PASS: numeric Face score remains analyzable but is hidden from normal user-facing interpretation");
