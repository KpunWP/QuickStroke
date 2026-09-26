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

คุณสามารถหยุดการทดสอบได้ทุกเมื่อ การหยุดกลางทางอาจทำให้มีข้อมูลเฉพาะขั้นตอนที่ทำเสร็จแล้วถูกบันทึกไว้ หากต้องการถอนความยินยอมและลบผลการทดสอบที่ส่งไปแล้ว จะมีช่องทางถอนความยินยอม [ระบุวิธีติดต่อ/ปุ่มหลังพัฒนาให้เสร็จ] ข้อมูลราย Session ในฐานข้อมูลหลักเก็บไว้ 90 วันนับจากวันที่สร้าง Session โดยมีงานลบอัตโนมัติทุกชั่วโมง [ระบุผู้รับผิดชอบและช่องทางถอนความยินยอมก่อนเผยแพร่] และต้องตรวจมาตรการสำหรับข้อมูลบนอุปกรณ์กับสำเนาสำรองแยกต่างหาก

[ ] ฉันอ่านและยินยอมให้เก็บและส่งข้อมูลการทดสอบตามรายละเอียดข้างต้น
[ ] ฉันยืนยันว่าตรงตามเกณฑ์อายุที่โครงการกำหนด [ยังไม่กำหนดเกณฑ์อายุและยังไม่เปิดให้ยินยอมจริง]

**Do not display this draft as final consent until every bracketed item is completed and approved.**

## Implemented staging work
- Supabase Project: `quickstroke-jssf` (Singapore).
- Protected tables: `public.jssf_remote_sessions`, `public.jssf_remote_events`. Both use RLS with no anonymous/authenticated privileges.
- Edge Function: `jssf-remote-ingest`, default-disabled unless server environment variables explicitly enable it.
- Strict ingestion event sanitizer; no raw media fields accepted; batch event IDs are idempotent.
- `/enroll` can mint a random Study ID and short-lived session upload token **only when enabled and current consent is submitted**.
- `/events` requires the per-session upload token. `/withdraw` now calls `public.withdraw_jssf_session(uuid,text)` under `service_role` to delete the entire Session and all related Events **atomically**. The anonymous REST roles have no permission to invoke this RPC. After an acknowledgement is lost, the API can safely acknowledge that the Session no longer exists while rejecting an invalid token for an existing Session.
- Consent preview: `jssf-consent.html` is linked from `index.html`. Consent checkbox and start button are disabled while eligibility and retention are unresolved.
- Opt-in durable outbox: `js/jssf-remote-sync.js` is now loaded on index, Face, Arm, Speech and Result. Canonical Research lifecycle events are dispatched only after local IndexedDB commits; only approved `community_remote_qr` sessions may enqueue sanitized remote events.
- Client supports enrollment, idempotent outbox, queued offline delivery, acknowledgement persistence, automatic retry when online, and recovery on subsequent page views. No activation occurs while `jssfRemote.enabled=false` and approval gates are unresolved.
- Dependency-free synthetic tests: `node tests/jssf-remote-client.mjs`, `node tests/jssf-remote-staging.mjs`, `node tests/jssf-remote-sync-flow.mjs`. A mock-only offline/enrollment/recovery test does **not** replace a real iPhone-to-Supabase end-to-end test.
- 90-day **primary PostgreSQL** retention is implemented with an hourly `pg_cron` cleanup under `quickstroke_private`. Deleting parent Sessions cascades to JSSF Events. The live synthetic rollback test confirmed old session/event deletion, fresh-session preservation and zero residual test rows.
- `jssf-withdraw.html` is a **disabled-preview** withdrawal page. The JSSF-specific IndexedDB queue now retains a withdrawal capability only as needed for offline retry. Research IndexedDB erasure verifies `community_remote_qr` and deletes its records transactionally by `screeningSessionId`, protecting clinical and Dev stores. After reopening the app, eligible queued withdrawals retry when the network is back. Credentials saved for JSSF are purged at 90 days **on the next app visit**, not automatically while a device never revisits.
- Supabase main database erasure does **not** erase provider-managed backups or infrastructure logs. Explicit backup retention and user-facing contact/alternative withdrawal channels still require review before launch.
- No JSSF QR released. No changes to `main`. Supabase ingest function is deployed but `JSSF_REMOTE_ENABLED` is not configured.

## Required before enabling or distributing any QR
1. Review/approve the final consent notice, age group, withdrawal contact, local browser deletion and backup-handling policy. Primary PostgreSQL retention is fixed at 90 days from server-created Session time.
2. Add server-side abuse protection / public endpoint rate limiting. Atomic withdrawal and database-side synthetic rollback checks are done; run live authenticated Edge HTTP E2E, offline resume and real Safari IndexedDB tests before accepting volunteers.
3. Set server-only `JSSF_CONSENT_VERSION`, `JSSF_ALLOWED_ORIGINS` (exact deployment origin), `JSSF_REMOTE_ENABLED` only after acceptance tests. Keep app `jssfRemote.enabled=false` and `retentionPolicyApproved=false` until the full collection notice and all retention surfaces are approved.
4. After actual eligible population, contact, consent and backup/local-retention policies are approved, replace disabled draft with a final informed-consent flow, enable `community_remote_qr` in `js/app-mode.js` and `js/research-policy.js`, configure explicit server policy gates and verify enrollment. Durable outbox, local cleanup and post-commit hooks are implemented but deliberately inactive.
5. Test upload, duplicate retry/idempotency, disconnection and delayed reconnection, incomplete sessions, consent refusal/withdrawal, public/research/dev isolation.
6. Approve a **stable and publicly accessible** Vercel domain and release branch; temporary SSO-bypassing Preview share links are not event QR links.
