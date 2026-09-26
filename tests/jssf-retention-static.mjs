import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const sql=read("supabase/migrations/20260926_jssf_90_day_primary_db_retention.sql");
const consent=read("jssf-consent.html");
const config=read("config.js");
const sw=read("service-worker.js");
const doc=read("docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md");

assert.match(sql,/CREATE EXTENSION IF NOT EXISTS pg_cron/i);
assert.match(sql,/DELETE FROM public\.jssf_remote_sessions\s+WHERE created_at <= now\(\) - interval '90 days'/i);
assert.match(sql,/0 \* \* \* \*/);
assert.match(sql,/REVOKE ALL ON FUNCTION quickstroke_private\.purge_expired_jssf_sessions/i);
assert.match(read("supabase/migrations/20260925_jssf_remote_nonclinical_staging.sql"),
  /REFERENCES public\.jssf_remote_sessions\(id\) ON DELETE CASCADE/);
console.log("PASS: hourly primary database retention removes sessions and cascades to events");

assert.match(consent,/90 วัน นับจากวันที่ระบบสร้าง Session/);
assert.match(consent,/ข้อมูลที่อยู่ในเบราว์เซอร์และสำเนาสำรอง/);
assert.match(consent,/ยังไม่ได้กำหนดกลุ่มอายุ/);
assert.match(consent,/disabled aria-disabled="true"/);
assert.match(config,/retentionDays: 90/);
assert.match(config,/enabled: false,[\s\S]*consentApproved: false,[\s\S]*agePolicyApproved: false,[\s\S]*retentionPolicyApproved: false/);
assert.match(sw,/quickstroke-pwa-v43/);
assert.match(doc,/90-day \*\*primary PostgreSQL\*\* retention/);
console.log("PASS: Thai consent, documentation and feature gate reflect 90-day policy without live recruitment");
