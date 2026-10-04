# JSSF Event-Day Runbook — Pilot Freeze v1

## Release

- Participant entry URL: https://quickstroke.vercel.app/jssf-consent.html
- Build: `20261004-jssf-pilot-freeze-v3`
- Collection phase: `jssf_pilot`
- Consent: `JSSF-REMOTE-2026-10-04-v3`
- Intended population: adults 18+ in a nonclinical community usability/reliability pilot.
- QuickStroke is a screening/research prototype, not a diagnostic test.

## Recruitment target

Operational target: **50–100 completed participant sessions if feasible**.

This target is appropriate for obtaining useful pilot evidence about:
- completion and invalid/retry rates,
- usability/comprehension,
- device/browser distribution,
- Face/Arm/Speech metric distributions in a community sample,
- technical failures and missingness.

It is **not** a clinical validation sample and must not be used to claim stroke sensitivity, specificity, diagnostic accuracy, or clinically validated cutoffs.

## What link to distribute

Distribute only:

`https://quickstroke.vercel.app/jssf-consent.html`

Do not direct remote participants to the root index page. The index contains Public/clinic Research Mode setup intended for other workflows and creates unnecessary decision burden.

## Participant flow

1. Open the JSSF consent page in the phone browser.
2. If an in-app browser is detected and the page requests an external browser, open in Safari/Chrome.
3. Confirm age 18+.
4. Read and accept consent.
5. Start the test.
6. Complete Face.
7. Complete Arm left and right.
8. Complete Speech.
9. Review result.
10. Finalize/send the research session.
11. If desired later, use the withdrawal page to withdraw/delete the remote session.

## Recommended participant instruction

Keep external instruction deliberately short:

> เปิดลิงก์ด้วยโทรศัพท์ อ่านข้อมูลและยินยอมก่อนเริ่ม จากนั้นทำตามคำแนะนำบนหน้าจอจนจบทั้ง Face, Arm และ Speech และกดส่งผลเมื่อเสร็จ หากมีอาการที่สงสัยสโตรกจริง ให้หยุดการทดสอบและติดต่อบริการฉุกเฉินทันที

Do not coach participants through individual measurement steps unless the research protocol explicitly intends supervised assistance. Unprompted self-administration difficulty is useful usability evidence.

## Arm-specific operational note

Arm laterality is participant-confirmed, not sensor-verified.

Do not add a new camera/gyroscope gesture during this pilot. The participant should follow the current on-screen instruction and hold the phone in the requested hand using the current phone-facing convention.

If an observer notices the participant using the wrong hand, record the occurrence separately rather than silently correcting it if the objective is self-administration usability. If safety or study protocol requires assistance, document that assistance.

## Before distribution

Confirm:
- production URL returns successfully,
- config build ID is `20261004-jssf-pilot-freeze-v3`,
- `dataCollectionPhase = jssf_pilot`,
- consent version is v3,
- remote collection is enabled,
- no new engineering/preflight session is mislabeled as pilot,
- withdrawal page remains reachable.

## During recruitment

Suggested monitoring cadence:
- after the first 3–5 participants,
- again around 10,
- then approximately every 20–25 completed participants.

Monitor aggregate counts only unless debugging a specific participant-reported failure:
- total enrollments,
- completed sessions,
- active/abandoned sessions,
- Face/Arm/Speech completion,
- invalid/retry frequencies,
- platform/browser mix,
- remote ingestion errors.

Do not tune thresholds during ongoing pilot collection unless a release-blocking defect is found. Any logic change requires a new build/version and should define a new analysis cohort.

## Stop / pause criteria

Pause recruitment if any of the following occurs repeatedly:
- consent/enrollment cannot start,
- sessions cannot finalize,
- one module fails systematically on a common device/browser,
- remote events are not reaching Supabase,
- data are being labeled with the wrong collection phase/build,
- a privacy/data-governance defect is identified.

A single participant usability difficulty is not by itself a reason to change the build; record it and assess frequency.

## Known limitations to disclose internally

- Face/Arm/Speech numeric thresholds are pre-pilot/project-specific and are not clinically validated cutoffs.
- Arm laterality is participant-confirmed, not sensor-verified.
- Speech browser ASR is not equivalent to clinician-rated dysarthria.
- Speech rate is research-only and does not affect the screening observation.
- Community pilot data cannot establish stroke sensitivity/specificity.

## End-of-day

Record:
- number enrolled,
- number completed/finalized,
- number active/abandoned,
- major device/browser issues,
- participant-reported comprehension issues,
- any operator assistance,
- any withdrawal/deletion requests.

Do not merge engineering/preflight sessions into the pilot analysis cohort.


## Device/runtime provenance note

Consent v3 discloses collection of coarse device/runtime metadata for reliability analysis. The project may store OS/browser major versions, device class, and browser-exposed model when available. Raw User-Agent and persistent device identifiers are not stored.
