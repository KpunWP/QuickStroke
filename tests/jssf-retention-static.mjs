import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const sql=read("supabase/migrations/20260926050906_jssf_90_day_primary_db_retention.sql");
const consent=read("jssf-consent.html");
const faceTelemetry=read("supabase/migrations/20261003084500_jssf_face_research_telemetry.sql");
const config=read("config.js");
const sw=read("service-worker.js");
const doc=read("docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md");

assert.match(sql,/CREATE EXTENSION IF NOT EXISTS pg_cron/i);
assert.match(sql,/DELETE FROM public\.jssf_remote_sessions\s+WHERE created_at <= now\(\) - interval '90 days'/i);
assert.match(sql,/0 \* \* \* \*/);
assert.match(sql,/REVOKE ALL ON FUNCTION quickstroke_private\.purge_expired_jssf_sessions/i);
assert.match(read("supabase/migrations/20260925050745_create_jssf_remote_nonclinical_staging_schema.sql"),
  /REFERENCES public\.jssf_remote_sessions\(id\) ON DELETE CASCADE/);
console.log("PASS: hourly primary database retention removes sessions and cascades to events");

assert.match(consent,/90 วันนับจากวันที่สร้างรอบการทดสอบ/);
assert.match(consent,/อุปกรณ์อาจเก็บข้อมูลบางส่วนไว้ชั่วคราว/);
assert.match(consent,/18 ปีขึ้นไป/);
assert.match(consent,/ยังไม่เปิดรับสมัครหรือเก็บข้อมูลจากบุคคลทั่วไป/);
assert.match(consent,/ค่าตัวเลขที่ระบบคำนวณจากการวัดเป็นช่วงเวลา/);
assert.match(consent,/ไม่ส่งภาพหรือวิดีโอดิบ/);
assert.match(faceTelemetry,/face_research_attempt/);
assert.match(faceTelemetry,/face_research_samples/);
assert.match(faceTelemetry,/ON DELETE CASCADE|CASCADE across every research event/i);
assert.match(consent,/disabled aria-disabled="true"/);
assert.match(config,/retentionDays: 90/);
assert.match(config,/enabled: true,[\s\S]*consentApproved: true,[\s\S]*agePolicyApproved: true,[\s\S]*retentionPolicyApproved: true/);
// Cache may advance independently of the 90-day retention policy.
// Require the JSSF offline shell and at least the withdrawal-preview cache version.
const cacheVersion=sw.match(/^const CACHE_NAME = "quickstroke-pwa-v(\d+)";/m);
assert.ok(cacheVersion && Number(cacheVersion[1]) >= 44,
  "JSSF service-worker cache must be at least v44");
assert.match(sw,/"\/jssf-consent\.html"/);
assert.match(sw,/"\/jssf-withdraw\.html"/);
assert.match(sw,/"\/js\/jssf-remote-sync\.js"/);
assert.match(doc,/90-day \*\*primary PostgreSQL\*\* retention/);
console.log("PASS: Thai consent, documentation and feature gate reflect 90-day policy without live recruitment");
