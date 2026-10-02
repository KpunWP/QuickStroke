# JSSF Remote Recruitment Runbook

Status: production operational checklist for release `v1.0.21-jssf-remote-v1`.

## Participant URLs
- Entry / consent: https://quickstroke.vercel.app/jssf-consent.html
- Withdrawal: https://quickstroke.vercel.app/jssf-withdraw.html
- Stable app domain: https://quickstroke.vercel.app

Use only the stable production domain in participant-facing QR codes. Do not use Vercel Preview URLs.

## Before distributing a QR
1. Open the production consent URL on a normal browser and confirm the page changes from its fail-closed placeholder to the live state.
2. Confirm the badge says recruitment is open for age 18+ and both consent checkboxes can be enabled.
3. Confirm the consent version shown is `JSSF-REMOTE-2026-10-02-v1`.
4. Confirm the production Edge health endpoint reports `ok:true` and `collectionEnabled:true`.
5. Confirm the withdrawal page loads from the stable production domain.
6. Confirm no real participant data is already present unexpectedly in the production JSSF tables.
7. Do not expose server secrets, capability tokens, Supabase service-role keys, or developer admission credentials.

## Participant flow
1. Participant scans the QR and lands directly on `/jssf-consent.html`.
2. Participant reads the project information, confirms age 18+, and gives consent.
3. The app creates a random Study ID only after consent and starts the remote Research session.
4. Participant completes Face → Arm → Speech → Result.
5. At Result, participant finishes the collection session.
6. If the participant wants to withdraw, use `/jssf-withdraw.html` on the same device when possible, or use the listed project email fallback.

## Operator checks during collection
- Do not manually convert a Public, Clinic, or Dev session into a JSSF remote session.
- Do not record names, phone numbers, national IDs, raw face images/video, raw audio, or transcripts in the JSSF dataset.
- Treat incomplete or interrupted sessions as usability/reliability data only.
- QuickStroke is not a diagnostic tool; suspected stroke symptoms should bypass the study flow and use emergency care instructions.

## Stop conditions
Pause QR distribution and investigate before accepting more participants if any of these occur:
- consent page remains fail-closed unexpectedly;
- production health reports collection disabled;
- enrollment repeatedly fails for otherwise eligible users;
- raw media or direct identifiers appear in remote payloads;
- withdrawal cannot delete a session;
- duplicate completion events appear;
- Public / Clinic / Dev data appears in the JSSF remote backend;
- a release or deployment unexpectedly changes the consent version or production origin.

## End-of-session / daily checks
- Confirm newly completed sessions show one `session_completed` event.
- Confirm withdrawal requests remove the target session and related events.
- Review only sanitized technical/usability data needed for the project.
- Record operational incidents separately from participant data.
- Keep the 90-day primary PostgreSQL retention policy enabled.

## Release reference
- GitHub release/tag: `v1.0.21-jssf-remote-v1`
- Release commit: `e880c68586e832fc0a06deca287d6944904862f4`
