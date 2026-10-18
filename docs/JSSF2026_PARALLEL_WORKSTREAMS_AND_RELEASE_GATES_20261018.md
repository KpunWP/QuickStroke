# QuickStroke JSSF2026 — Parallel workstreams and release gates (2026-10-18)

Source constraints: Original kickoff doc on research/jssf-2026-poster-demo-kickoff-20261018; official JSSF 2026 https://www.jssf.online/information/itinerary and https://www.jssf.online/events/project-presentation. This is a planning note only; no runtime or production modifications.

## Hard external dates (JST)
- Oct 30 arrival
- Oct 31 / Nov 1: oral science project presentations, allotted 15 minutes presentation + 10 minutes questions. Host school provides Windows computers/projectors; presentation entirely in English; each school's order/room assigned on arrival.
- Nov 3: poster exhibition (itinerary lists 12:30 start). Times tentative.
- Nov 4 closing; Nov 5 departure.

## Internal delivery gates (ICT, proposed)
- Oct 18: split into separate conversations for Research/Poster, Engineering/Demo, Oral. All share this document and kickoff source. No one waits for Poster to finish.
- Oct 18–22: Poster metric selection + draft graphics; Web code audit and separate presenter plan; Oral script and slides structure. Controlled measurement tests as separately labeled engineering studies.
- Oct 23: Freeze poster source cohort, statistical methods, plots and annotated authentic images for print.
- Oct 25: Print-ready poster proof approved and submitted to printer.
- Oct 26–27: Public/Presenter EN/JA UAT with actual phones, fallback PWA/offline airplane tests and dry run; freeze app after checks.
- Oct 27–28: Complete and rehearse Oral 15-minute English talk plus 10-minute Q&A, ensure offline slide/video fallback.
- Oct 29: pack physical poster, adapters, charged devices, QR screenshots, duplicate USB/PDF/PPTX and manuals; no risky new production changes.
These are internal targets, not organizer deadlines.

## Workstream A — Research / Poster (this chat)
Read-only production Supabase analysis and defensible evidence figures, poster storyboard/artwork, publishing permissions for face images, freeze validated aggregate metrics. No change to JSSF consent or thresholds. Separate per-attempt data from independent participants and old/new software versions; nonclinical feasibility is not clinical validation. Need eventual clinician-labeled patient/control dataset for clinical thresholds, independent validation and optional ML.

## Workstream B — Public App + Presenter Demo (new engineering chat)
Scope: Inspect-before-mutate repo KpunWP/QuickStroke and deployment, Public Full/Individual path and results incl not-tested states, Presenter route isolated from Public/Research/Dev with current Face Mesh, Arm IMU drift graph, Speech ASR pipeline. Do not accidentally send public/presenter visitors to JSSF research ingestion. Languages EN first, JA+TH toggle, real ASR/TTS/localization UAT. PWA app shell/WASM/models offline pre-cache and real airplane-mode tests, with explicit exception that browser ASR may need network. Provide stand-alone phone-first presenter workflow if no TV/WiFi. Do not change any medical thresholds or existing JSSF Consent except separately reviewed necessity.
Start from existing kickoff branch. Create a NEW engineering child branch from agreed base (not concurrent writes to A docs), run tests/CI, open PR for review before merges; production requires explicit gate. No unreviewed deploy to production.

## Workstream C — Oral presentation (new slides chat)
15-minute English scientific narrative (motivating question; instrument design; face/arm/speech algorithm; nonclinical methods; rigorous signal evidence; reliability/failure modes; limitations; next clinical-validation plan). Prepare slides separate from physical poster. 10-minute Q&A including medical safety, ML/thresholds, left-right drift interpretation, version confounds, consent/privacy, speech failures, bias and reproducibility. Backup video/screenshots and PPTX/PDF; do not rely on live app or onsite WiFi. Distinguish oral timing from poster micro-pitch.

## Shared testing & QA
1. Controlled engineering: repeated rest/smile with reference annotations, stationary vs intentionally moved phone with angle reference, correctly/incompletely spoken phrase plus permission failures; anonymized/no participant identifiers; separate datasets, ethics/media consent.
2. Public app: real phone first, normal visitor, full vs individual, result not-tested handling, no research event upload.
3. Presenter: mesh live, orientation trace, phrase expected vs recognized; do not leak Dev controls, media or data.
4. Locale: English/Japanese UI, instruction audio, ASR text and error/result labels tested on real devices, not only JSON loaded.
5. PWA: first install online then airplane mode; distinguish features truly offline from service-dependent; provide prerecorded/screenshots backup.
6. Deadline gate: never delay printed poster for a last-minute code experiment.

## Branch hygiene
Research/poster doc branch: research/jssf-2026-poster-demo-kickoff-20261018. Engineering modifications get a separate child branch. Oral deck and poster are artifacts, not code. Avoid two parallel authors editing the same file/branch. Shared references: kickoff MD and this coordination file. Report each branch/PR/build and version for demos to prevent wrong screenshot or stale data.

## Open items
- Oral slot assignment: will be given after arrival; 15+10 minutes documented.
- Confirm printer size/specification and school/presenter names.
- Formal permission to publish volunteer's face photo; otherwise use consenting staged model or schematic.
- Whether phone/iPad can connect to external screen onsite is unknown; plan no-TV/no-WiFi fallback.

## Editorial update — AI positioning (2026-10-18)
Poster and Oral must show genuine AI use while keeping the project's core purpose: early human awareness and timely care-seeking for possible stroke warning signs. See [`JSSF2026_AI_POSITIONING_FOR_POSTER_AND_ORAL_20261018.md`](./JSSF2026_AI_POSITIONING_FOR_POSTER_AND_ORAL_20261018.md). Face uses ML-assisted landmark tracking; Speech uses browser ASR; Arm is IMU signal processing, **not a trained AI model**. Current multimodal decision logic is not a validated diagnostic AI classifier. This direction applies to the revised Poster Storyboard and the Oral deck based on `QuickStroke_Pitch_V3.pptx`. Other conversations must **re-read the shared document**; edits here do not directly message them.

## Privacy by Design: cross-team concept and verified caveat (2026-10-18)
**Required reading for Poster, Public/Presenter Demo, and Oral teams:** [`JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md`](./JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md). Privacy/data minimization is a defining product/research constraint: no stored raw face video, audio or transcripts in the consented research DB; limited derived measurements; Public mode has no JSSF research ingestion. **Important gap:** current Speech browser-default recognition is not guaranteed local; browser/vendor may transmit audio. Do not say “voice never leaves device” until on-device speech capability is verified on actual iOS/Android browsers or architecture changed. Presenter engineering track owns investigating and proposing a privacy-aligned solution; Poster/Oral must show the intended architecture *and* the current limitation honestly. This document coordinates the workstreams; it does not send messages into other ChatGPT conversations.
