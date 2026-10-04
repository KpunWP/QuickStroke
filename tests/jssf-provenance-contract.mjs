import fs from "node:fs";
import assert from "node:assert/strict";

const config=fs.readFileSync("config.js","utf8");
const client=fs.readFileSync("js/jssf-remote-sync.js","utf8");
const edge=fs.readFileSync("supabase/functions/jssf-remote-ingest/index.ts","utf8");
const migration=fs.readFileSync("supabase/migrations/20261004062000_jssf_data_collection_phase.sql","utf8");
const contract=fs.readFileSync("js/data-contract.js","utf8");

assert.match(config,/buildId:\s*"20261004-jssf-pilot-freeze-v1"/);
assert.match(config,/dataCollectionPhase:\s*"jssf_pilot"/);
assert.match(client,/dataCollectionPhase:cfg\.dataCollectionPhase/);
assert.match(client,/\["engineering_preflight","jssf_pilot"\]\.includes\(cfg\.dataCollectionPhase\)/);
assert.match(client,/old\.dataCollectionPhase!==cfg\.dataCollectionPhase/);
assert.match(edge,/Invalid dataCollectionPhase/);
assert.match(edge,/data_collection_phase:dataCollectionPhase/);
assert.match(migration,/data_collection_phase text/);
assert.match(migration,/engineering_preflight/);
assert.match(migration,/jssf_pilot/);
assert.match(contract,/moduleVersion: 'speech-prepilot-1\.9\.0'/);
assert.match(contract,/algorithmVersion: 'speech-browser-asr-1\.5\.0'/);
assert.match(contract,/resultSchemaVersion: 'speech-result-1\.4\.2'/);
assert.match(contract,/researchPayloadVersion: 'speech-research-0\.5\.2'/);

console.log("PASS: JSSF build and collection-phase provenance are explicit and machine-readable");
