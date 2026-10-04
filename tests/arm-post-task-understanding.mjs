import fs from "node:fs";
import assert from "node:assert/strict";

const arm=fs.readFileSync("arm-test.html","utf8");
const remote=fs.readFileSync("js/jssf-remote-sync.js","utf8");
const edge=fs.readFileSync("supabase/functions/jssf-remote-ingest/payload.mjs","utf8");

assert.match(arm,/ARM_PROTOCOL_UNDERSTANDING_VERSION = 'arm-protocol-understanding-1\.1\.0'/);
assert.match(arm,/หลังจากทำการทดสอบแล้ว คุณเข้าใจวิธีทดสอบแขนหรือไม่\?/);
assert.match(arm,/timing:'post_task'/);

const handleBtn=arm.match(/function handleBtn\(\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.doesNotMatch(handleBtn,/showArmUnderstandingPrompt\(\)/,"Arm understanding must not be asked before the test starts");

const showFinal=arm.match(/function showFinal\(\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.match(showFinal,/armResearchModeActive\(\) && !armProtocolUnderstanding[\s\S]*phase = 'POST_TASK_QUESTION'[\s\S]*showArmUnderstandingPrompt\(\)/);
assert.ok(showFinal.indexOf("POST_TASK_QUESTION") < showFinal.indexOf("phase = 'DONE'"),"Post-task question must occur before finalization");

const answer=arm.match(/function answerArmProtocolUnderstanding\(answer\) \{[\s\S]*?\n\}/)?.[0] || "";
assert.match(answer,/phase === 'POST_TASK_QUESTION'[\s\S]*showFinal\(\)/);

assert.match(arm,/protocolUnderstanding:armProtocolUnderstandingCopy\(\)/);
assert.match(arm,/finalizeModuleRun\(moduleRunId,[\s\S]*protocolUnderstanding:armProtocolUnderstandingCopy\(\)/);

assert.match(remote,/function runPayload\(record\)[\s\S]*record\.module==="arm"[\s\S]*timing:record\.protocolUnderstanding\.timing==="post_task"/);
assert.match(remote,/protocolUnderstanding:understanding/);
assert.match(edge,/module !== "arm"[\s\S]*armProtocolUnderstandingAnswer[\s\S]*new Set\(\["post_task"\]\)/);

console.log("PASS: Arm protocol-understanding question is post-task and module-level research metadata");
