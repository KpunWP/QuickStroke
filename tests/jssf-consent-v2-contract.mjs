import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const config=read("config.js");
const consent=read("jssf-consent.html");
const sw=read("service-worker.js");
const edge=read("supabase/functions/jssf-remote-ingest/index.ts");
const docs=read("docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md");

assert.match(config,/consentVersion:\s*"JSSF-REMOTE-2026-10-04-v3"/);
assert.match(consent,/สำหรับขั้นตอน Speech ระบบอาจส่ง/);
assert.match(consent,/ระยะเวลาที่ตรวจพบการพูด/);
assert.match(consent,/ความใกล้เคียงของคำพูดกับประโยคทดสอบ/);
assert.match(consent,/สัดส่วนความครบถ้วนของผลถอดเสียง/);
assert.match(consent,/อัตราการพูด/);
assert.match(consent,/ไม่ส่งข้อความที่ผู้เข้าร่วมพูดจริง/);
assert.match(consent,/ไม่ส่งไฟล์เสียงดิบ/);
assert.match(consent,/ไม่ส่งข้อมูลเสียงดิบแบบต่อเนื่อง/);
assert.match(consent,/รุ่นหลักของระบบปฏิบัติการ/);
assert.match(consent,/รุ่นหลักของเบราว์เซอร์/);
assert.match(consent,/ชื่อรุ่นอุปกรณ์เฉพาะเมื่อเบราว์เซอร์เปิดเผย/);
assert.match(consent,/raw User-Agent ทั้งข้อความ/);
console.log("PASS: consent v3 explicitly discloses bounded derived Speech telemetry and exclusions");

assert.match(sw,/Offline-Ready Face \+ Speech Edition \(v66\)/);
assert.match(sw,/const CACHE_NAME = "quickstroke-pwa-v78"/);
assert.match(sw,/\/jssf-consent\.html/);
assert.match(sw,/\/config\.js/);
console.log("PASS: service worker cache generation is bumped for coordinated consent/config refresh");

assert.match(edge,/const RELEASE_CONSENT_VERSION = "JSSF-REMOTE-2026-10-04-v3"/);
assert.match(edge,/const SPEECH_TELEMETRY_CONSENT_VERSIONS = new Set/);
assert.match(edge,/JSSF-REMOTE-2026-10-04-v2/);
assert.match(edge,/const RELEASE_CONSENT_VERSION = "JSSF-REMOTE-2026-10-04-v3"/);
assert.match(edge,/return value === RELEASE_CONSENT_VERSION/);
assert.match(edge,/consentVersionAccepted\(body\.consentVersion\)/);
assert.match(edge,/consent_version:body\.consentVersion/);
assert.match(edge,/\.select\("id,status,expires_at,consent_version"\)/);
assert.match(edge,/enforceConsentScopedEventPayload/);
assert.match(edge,/SPEECH_TELEMETRY_CONSENT_VERSIONS\.has\(sessionConsentVersion\)/);
console.log("PASS: Edge locks new enrollment to v3 and scopes Speech telemetry to v2 consent");

assert.match(docs,/JSSF-REMOTE-2026-10-04-v3/);
assert.match(docs,/New enrollment is now server-locked to v3 only/);
console.log("PASS: release documentation records v3-only enrollment");
