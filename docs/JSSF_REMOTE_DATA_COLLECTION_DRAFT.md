# QuickStroke JSSF remote-usability pilot — DATA COLLECTION DRAFT

**Status: NOT APPROVED / NOT LIVE.** No QR for live collection may be distributed until the project owner approves consent, eligibility, retention, server anti-abuse controls and an end-to-end upload/retry test. This is a nonclinical usability/reliability pilot using healthy/community volunteers, not stroke validation or patient recruitment.

## Intended separation
- **Public Mode:** remains ephemeral and sends nothing to the research backend.
- **Research clinic_supervised:** original in-person patient research workflow; unchanged and not running without relevant institutional approvals.
- **Research community_remote_qr:** new opt-in remote usability workflow. Remains disabled in the current app and server until release gates pass. Never merge nonclinical data into future patient-analysis cohorts.
- **Dev Mode:** engineering logs only, physically separated from research storage.

## Proposed on-screen Thai consent (draft, to review before release)
**โครงการทดสอบการใช้งาน QuickStroke สำหรับ JSSF (ไม่ใช่การตรวจวินิจฉัย)**

การเข้าร่วมนี้มีวัตถุประสงค์เพื่อศึกษาความสะดวกในการใช้งานและความเสถียรของระบบตรวจสัญญาณ FAST ในบุคคลทั่วไป ไม่ใช่การประเมินความแม่นยำในการวินิจฉัยโรค และไม่สามารถยืนยันได้ว่าผู้ใช้งานไม่มีภาวะสโตรก หากมีอาการที่สงสัยว่าเป็นสโตรก ให้หยุดทดสอบและติดต่อบริการฉุกเฉินทันที (ประเทศไทยโทร 1669)

หลังจากคุณกดยินยอม แอปจะสร้างรหัสแบบสุ่มและส่งข้อมูลผลการทดสอบแต่ละรายการ การทดสอบซ้ำ เวลาที่ใช้ และรหัสข้อผิดพลาดทางเทคนิคกลับสู่ฐานข้อมูลโครงการโดยอัตโนมัติ รวมถึงข้อมูลประเภทอุปกรณ์และเบราว์เซอร์อย่างคร่าว ๆ แอปไม่ส่งวิดีโอ ภาพใบหน้าดิบ ไฟล์เสียงดิบ บทพูดที่บันทึก หรือชื่อจริงของคุณ

โครงการนี้กำหนดผู้เข้าร่วม JSSF remote pilot อายุ 18 ปีขึ้นไป การเข้าร่วมเป็นความสมัครใจและสามารถหยุดได้ทุกเมื่อ การหยุดกลางทางอาจทำให้ข้อมูลเฉพาะขั้นตอนที่ส่งสำเร็จไปแล้วถูกเก็บไว้จนกว่าจะครบกำหนดหรือมีคำขอลบ

ผู้ดำเนินโครงการ: วัชรวิชย์ พงษ์ไพรัช และ สรกฤช ธัญญวรรณ์  
อาจารย์ที่ปรึกษา: พริ้วฝน เทียนศรี  
สถานศึกษา: โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย ฝ่ายมัธยม  
ช่องทางติดต่อ/ถอนความยินยอม: `kpunkfang@gmail.com` หรือ `kpun.wp@gmail.com` และปุ่มถอนความยินยอมในแอปเมื่อเปิดใช้งานจริง

ข้อมูลราย Session ในฐานข้อมูลหลักเก็บไว้ 90 วันนับจากวันที่สร้าง Session โดยมีงานลบอัตโนมัติทุกชั่วโมง ฐานข้อมูลหลักอยู่ใน Supabase region Singapore. Client อาจเก็บ outbox/withdrawal capability ใน IndexedDB เพื่อ retry; การถอนความยินยอมจะลบข้อมูล local ของ Session และขอให้ server ลบข้อมูลที่เกี่ยวข้อง. Local retention cleanup จะทำงานเมื่อผู้ใช้กลับมาเปิดเว็บอีกครั้ง.

[ ] ฉันยืนยันว่าฉันมีอายุ 18 ปีขึ้นไป
[ ] ฉันอ่านและยินยอมให้เก็บและส่งข้อมูลการทดสอบตามรายละเอียดข้างต้น

**Do not display this draft as final consent until the project owner/advisor has approved the wording and the hosted release gates are complete.**

## Implemented staging work
- Supabase Project: `quickstroke-jssf` (Singapore).
- Protected tables: `public.jssf_remote_sessions`, `public.jssf_remote_events`. Both use RLS with no anonymous/authenticated privileges.
- Edge Function: `jssf-remote-ingest`, default-disabled unless server environment variables explicitly enable it.
- Strict ingestion event sanitizer; no raw media fields accepted; batch event IDs are idempotent.
- `/enroll` can mint a random Study ID and short-lived session upload token **only when enabled and current consent is submitted**.
- `/events` requires the per-session upload token. `/withdraw` now calls `public.withdraw_jssf_session(uuid,text)` under `service_role` to delete the entire Session and all related Events **atomically**. The anonymous REST roles have no permission to invoke this RPC. After an acknowledgement is lost, the API can safely acknowledge that the Session no longer exists while rejecting an invalid token for an existing Session.
- Consent preview: `jssf-consent.html` is linked from `index.html`. Eligibility is now set to 18+, withdrawal contacts are defined, and browser/primary-database retention behavior is described. Consent controls remain deliberately disabled until final wording approval and hosted release gates are complete.
- Opt-in durable outbox: `js/jssf-remote-sync.js` is now loaded on index, Face, Arm, Speech and Result. Canonical Research lifecycle events are dispatched only after local IndexedDB commits; only approved `community_remote_qr` sessions may enqueue sanitized remote events.
- Client supports enrollment, idempotent outbox, queued offline delivery, acknowledgement persistence, automatic retry when online, and recovery on subsequent page views. No activation occurs while `jssfRemote.enabled=false` and approval gates are unresolved.
- Dependency-free synthetic tests: `node tests/jssf-remote-client.mjs`, `node tests/jssf-remote-staging.mjs`, `node tests/jssf-remote-sync-flow.mjs`.
- **Real iPhone Safari IndexedDB gate passed on 2026-10-01** using the local-only harness `tests/jssf-safari-indexeddb.html` and the production `js/jssf-remote-sync.js` client: enrollment credential persisted, an offline event remained queued across a real Safari reload, reconnect flush acknowledged once without duplicate upload, and an offline withdrawal survived reload then resumed to completion. The harness mocks network calls in-page and does **not** contact Supabase Cloud or replace a hosted HTTPS end-to-end test.
- **Real iPhone Safari full browser-flow gate passed on 2026-10-01** against the local HTTPS synthetic backend: JSSF Consent → Face → Arm → Speech → Result completed successfully; the Research session finalized and locked; after closing the tab the real Withdrawal page recovered the same Study ID from IndexedDB without relying on sessionStorage and completed local + synthetic-remote withdrawal. A MIME issue in the temporary local HTTPS test server for `.mjs` was corrected; production app files were not changed for that fix.
- **Multi-Study-ID Safari recovery gate passed on 2026-10-01** with two synthetic enrollments stored in real Safari IndexedDB. The real Withdrawal page exposed both recoverable Study IDs. This confirms multi-enrollment recovery logic, while the separate many-enrollment Withdrawal UX item below remains a release blocker.
- **Mode-isolation regression passed on 2026-10-01**: automated Public / clinic_supervised / Dev regression suites passed, followed by real Safari browser checks for Public, Clinic Research and Dev flows. Public stayed non-JSSF, clinic_supervised stayed separate from community_remote_qr, and Dev remained engineering-only.
- Closed Step 6 **local HTTP** Edge handler test: `node tests/jssf-edge-handler-http-e2e.mjs`. It serves the actual Edge Function handler over loopback (`127.0.0.1`) with a fake isolated database and synthetic policy parameters inside Node only. It checks disabled deployment gates, consent/origin, token hashing, Face/Arm/Speech summaries, idempotent uploads, completion, unauthorized withdrawal and deletion while collection is paused. **This is not a deployed Supabase HTTP E2E test.** No live collection configuration changes are required.
- 90-day **primary PostgreSQL** retention is implemented with an hourly `pg_cron` cleanup under `quickstroke_private`. Deleting parent Sessions cascades to JSSF Events. The live synthetic rollback test confirmed old session/event deletion, fresh-session preservation and zero residual test rows.
- `jssf-withdraw.html` is a **disabled-preview** withdrawal page. The JSSF-specific IndexedDB queue now retains a withdrawal capability only as needed for offline retry. Research IndexedDB erasure verifies `community_remote_qr` and deletes its records transactionally by `screeningSessionId`, protecting clinical and Dev stores. After reopening the app, eligible queued withdrawals retry when the network is back. Credentials saved for JSSF are purged at 90 days **on the next app visit**, not automatically while a device never revisits.
- Supabase main database erasure does **not** imply immediate deletion of every provider infrastructure log. The project currently uses Supabase Free; scheduled daily database backups/PITR are not enabled for this project. The user-facing consent now states the Singapore primary region, browser retention behavior, and alternative withdrawal contact channel.
- Server-side abuse protection is implemented locally with a database-backed per-route rate limiter, HMAC-SHA256 client buckets (no raw IP storage), `429 Retry-After`, service-role-only RPC access, and fail-closed activation when `JSSF_RATE_LIMIT_SECRET` is absent. Fake Edge and real local Edge Runtime + PostgreSQL E2E both passed after the final rate-limit ordering/hardening changes.
- No JSSF QR released. No changes to `main`. Hosted collection remains disabled; the local test gate was closed again after verification.

## Required before enabling or distributing any QR
1. Final project-owner/advisor review of the consent wording is still required. The working policy is now: JSSF remote participants age 18+, named project contacts, in-app withdrawal plus email fallback, 90-day primary PostgreSQL retention, Singapore primary database region, and disclosed browser/provider retention limitations.
2. Server-side abuse protection / public endpoint rate limiting is implemented and passed local real Edge Runtime + PostgreSQL E2E. Offline resume and real iPhone Safari IndexedDB persistence/withdrawal tests are also complete. Before accepting volunteers, still perform a hosted authenticated HTTPS Edge E2E only when an approved deployment/test environment is available; do not enable hosted collection merely to satisfy this test.
3. Set server-only `JSSF_CONSENT_VERSION`, `JSSF_ALLOWED_ORIGINS` (exact deployment origin), `JSSF_REMOTE_ENABLED` only after acceptance tests. Keep app `jssfRemote.enabled=false` and `retentionPolicyApproved=false` until the full collection notice and all retention surfaces are approved.
4. After actual eligible population, contact, consent and backup/local-retention policies are approved, replace disabled draft with a final informed-consent flow, enable `community_remote_qr` in `js/app-mode.js` and `js/research-policy.js`, configure explicit server policy gates and verify enrollment. Durable outbox, local cleanup and post-commit hooks are implemented but deliberately inactive.
5. Test upload, duplicate retry/idempotency, disconnection and delayed reconnection, incomplete sessions, consent refusal/withdrawal, public/research/dev isolation.
6. Approve a **stable and publicly accessible** Vercel domain and release branch; temporary SSO-bypassing Preview share links are not event QR links.
7. **Withdrawal UX release blocker for many local enrollments:** the current page lists every recoverable Study ID in one native `<select>`. Multi-Study recovery works, but this does not scale safely when a shared device accumulates dozens or hundreds of long Study IDs. Before release, replace the long dropdown with a searchable/recent-first chooser (for example: 1 enrollment = auto-select; small counts = simple list; larger counts = search/filter), show enough date/time context to distinguish sessions, and keep only safe metadata visible. The user must be able to identify the intended session without guessing.
