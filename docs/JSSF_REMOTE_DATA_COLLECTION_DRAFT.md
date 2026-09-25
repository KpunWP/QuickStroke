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

คุณสามารถหยุดการทดสอบได้ทุกเมื่อ การหยุดกลางทางอาจทำให้มีข้อมูลเฉพาะขั้นตอนที่ทำเสร็จแล้วถูกบันทึกไว้ หากต้องการถอนความยินยอมและลบผลการทดสอบที่ส่งไปแล้ว จะมีช่องทางถอนความยินยอม [ระบุวิธีติดต่อ/ปุ่มหลังพัฒนาให้เสร็จ] ข้อมูลจะเก็บไว้ [กำหนดระยะเวลาและผู้รับผิดชอบก่อนเผยแพร่]

[ ] ฉันอ่านและยินยอมให้เก็บและส่งข้อมูลการทดสอบตามรายละเอียดข้างต้น
[ ] ฉันยืนยันว่ามีอายุ 18 ปีขึ้นไป (ข้อเสนอสำหรับรอบแรก; ต้องตัดสินใจใหม่หากจะรับผู้เยาว์)

**Do not display this draft as final consent until every bracketed item is completed and approved.**

## Implemented staging work
- Supabase Project: `quickstroke-jssf` (Singapore).
- Protected tables: `public.jssf_remote_sessions`, `public.jssf_remote_events`. Both use RLS with no anonymous/authenticated privileges.
- Edge Function: `jssf-remote-ingest`, default-disabled unless server environment variables explicitly enable it.
- Strict ingestion event sanitizer; no raw media fields accepted; batch event IDs are idempotent.
- `/enroll` can mint a random Study ID and short-lived session upload token **only when enabled and current consent is submitted**.
- `/events` requires the per-session upload token; `/withdraw` is intended to remove remote events.
- No client-side automatic syncing is connected yet. No JSSF QR released. No changes to main.

## Required before enabling or distributing any QR
1. Review/approve the consent notice, age group, retention period and withdrawal method.
2. Add server-side abuse protection / public endpoint rate limiting and test withdrawal atomicity.
3. Set server-only `JSSF_CONSENT_VERSION`, `JSSF_ALLOWED_ORIGINS` (exact deployment origin), `JSSF_REMOTE_ENABLED` only after acceptance tests.
4. Implement opt-in `community_remote_qr` UI, durable per-session queue, and client-side hooks after Face/Arm/Speech module completion.
5. Test upload, duplicate retry/idempotency, disconnection and delayed reconnection, incomplete sessions, consent refusal/withdrawal, public/research/dev isolation.
6. Approve a **stable and publicly accessible** Vercel domain and release branch; temporary SSO-bypassing Preview share links are not event QR links.
