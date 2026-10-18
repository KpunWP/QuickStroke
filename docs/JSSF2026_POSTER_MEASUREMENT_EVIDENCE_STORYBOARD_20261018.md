# QuickStroke JSSF 2026 — Measurement Evidence & Poster Storyboard v1
**Date:** 2026-10-18 (Asia/Bangkok)  
**Branch:** research/jssf-2026-poster-demo-kickoff-20261018  
**Priority:** Poster for printer target 2026-10-25  
**Status:** Research-design working note. Data exploration only; no clinical performance claim. No application runtime/schema/threshold changes.

## Central scientific proposition
QuickStroke combines three *observable*, phone-captured signal tasks (face movement, phone-orientation change during arm hold, browser speech recognition). The current JSSF nonclinical pilot can test **technical measurement capture, task evaluability, failure modes, signal distributions and exploratory within-session consistency**; it **cannot** establish sensitivity, specificity, accuracy in detecting stroke, a normal physiological range, or optimized clinical cutoffs.

**High-priority future research question (explicitly flagged):** Obtain ethically collected **clinically labeled data from real patients and appropriate controls**, with clinician-adjudicated reference labels, to develop and *externally validate* clinically meaningful decision thresholds and (if justified) ML classification. Machine learning is an option, not a prerequisite for determining a threshold. Plan for sample size, device confounding, subgroup performance, false-negative risk, participant consent, hospital ethics review, and locked external validation. Existing thresholds remain provisional engineering rules; don't change without evidence and review.

## Preliminary Supabase inspection (read-only)
Source: production Supabase project `pzzjfnfwppdeketjdhfo`, public.jssf_remote_sessions and public.jssf_remote_events; cohort `data_collection_phase='jssf_pilot'`. Queried 2026-10-18. Only aggregates; sessions/attempts may repeat; cannot treat as independent people.
- **136** pilot sessions: **121 completed**, **15 active** (89.0% session completion). Engineering-preflight separate (26 sessions) and **excluded**.
- **729** test-attempt events: **156 Face**, **297 Arm**, **276 Speech**.
- Attempt status: Face **136 valid / 16 invalid / 4 not_evaluable**; Arm **283 valid / 13 invalid / 1 not_evaluable**; Speech **190 valid / 27 invalid / 59 not_evaluable**. Rates are **per attempt**, not per volunteer or clinical correctness; retries bias denominators.
- Research payloads present: Face **113/156 attempts** (and **104/136 valid Face attempts**), Arm **297/297**, Speech **275/276**.
- For valid attempts, provisional descriptive percentiles (10th/median/90th):
  - Face `faceResearch.smile.representativeAsym`: **0.009 / 0.025 / 0.067** from 104 metric-bearing valid Face attempts. Units are internal/normalized; inspect algorithm before interpretation.
  - Face `faceResearch.smile.weakSideRatio`: **0.874 / 0.952 / 0.988** (104 valid attempts with metrics).
  - Arm `armResearch.measurement.finalDriftMaxDeg`: **0.297° / 0.707° / 3.197°** (283 valid attempts). Phone-orientation drift ≠ measured arm-muscle strength or clinical deficit.
  - Arm `armResearch.posture.baselineStableSpreadDeg`: **0.068° / 0.179° / 0.966°** (283 valid attempts).
  - Speech `speechResearch.phrase.similarity`: **1.0 / 1.0 / 1.0** for 190 valid attempts; this is conditioned on the validity gate and is **not evidence of dysarthria-detection accuracy**.
- Arm bounded trace array exists; across all 297 pilot Arm attempts, trace has 0–21 samples/bins, median 20. Fields include `tMs`, `driftDeg`, `driftMaxDeg`, `sensorFresh`. Potentially useful for an **anonymized example trace** or composite after QC.
- Speech technical events are telemetry rather than all failures. Avoid counting every ASR iOS shutdown as an error; distinguish actual failure codes from normal state transitions.
- Major confounding: **124/136 pilot sessions were app v1.0.21**; don't claim this sample validates v1.0.30 or final demo engine. Repeated sessions are not unique volunteers. Study IDs likewise are per session.

## Storyboard — what the poster should prove
1. **Why:** Every minute matters; early awareness of visible warning signs is valuable, but this app is not diagnostic. Visual: human story and compact context. No unsourced claims or scary stock medical imagery.
2. **Research question / instrument:** Can one smartphone guide Face–Arm–Speech tasks and capture meaningful, quality-checked derived signals in routine browsers? Visual: one phone → three measurements → quality filter → user result. Differentiate measurement signal from a clinical prediction.
3. **Face evidence:** User instructed to smile; privacy-consented real example with mesh overlay + simple movement/symmetry schematic; plot of resting/smile asymmetry and valid tracking measurements, excluding unassessable data. Show comparison against controlled task references only if tested.
4. **Arm evidence:** Original left/right instruction illustration + phone orientation arrow (never imply direct anatomical joint-angle measurement) + authentic time-based drift trace and left/right comparability / sensor-quality check after QC.
5. **Speech evidence:** Mic-ready → say an actual app phrase → browser ASR transcript → full-phrase/coverage validity. Use an explicit UI-derived annotated flow rather than decorative soundwave claimed as measured acoustics; voice-rate metric is not currently a clinically validated measure.
6. **Pilot study / results:** A clear quality funnel by module (attempts → valid → usable derived signal) plus modest build/device splits; avoid 89% as a proxy for clinical performance. Explain repeated attempts and version effects.
7. **Limitations / next study:** Nonclinical volunteers, unknown/limited unique-person deduplication, provisional thresholds, speech permission/runtime issues, no clinically labeled patient data. Next: controlled repeats and gold-standard references; clinician-labeled patient/control study; predefined validation, safe deployment.
8. **Impact and engagement:** Live Public demo QR (not Consent), value to human decision-making and future workflow studies. Strong safety statement: cannot diagnose or rule out stroke.

## Priority research figures (draft, contingent on QA)
- **Figure A (main):** Three-mode measurement pipeline with authentic annotated visuals (Face mesh, Arm IMU trace, Speech transcript).
- **Figure B:** Attempt validity/evaluability by module; denominators shown, session-vs-attempt explained.
- **Figure C:** Face representative asymmetry distribution *only* across valid metric-bearing attempts; exclude old/missing payloads; display n and software builds.
- **Figure D:** Arm valid drift distributions split left/right, and an anonymized time trace; quality and sampling spread.
- **Figure E:** Speech recognition completion / retry / ASR failure modes, stratified by OS/build; not clinical speech impairment.
- Supplement/QR detailed methodology: trace availability, sample distributions, build-specific caveats and full methods.

## Validation rules before any chart is printed
1. Define denominator: unique volunteer (if supportable), session, module-run, attempt, or sample-bin.
2. Disentangle left/right, retries and repeated module-runs; use participant/session clusters for uncertainty estimates.
3. Exclude engineering_preflight; inspect app version, schemaVersion, validity and missingness per metric.
4. Distinguish signal evidence (sensor tracking/derived measures) from construct validity (task reference) and clinical validity (diagnosis).
5. Never select only clean attempts to claim a whole-pilot success rate. For distributions explain conditional subset and report capture failure separately.
6. Do not fabricate ground truth or mock waveform in a purported evidence figure.
7. Mask IDs and never export raw/identifiable face, audio, device IDs or transcripts from participants.

## Needed, not blocking initial work
- Actual metric definitions in repo / algorithm owner review for normalized Face values, Arm reference axis, validity rule and Speech phrase mapping.
- Permission to use a **new photo of a consenting adult** with Face Mesh, or a pre-approved non-identifying schematic (prior pilot consent does not itself grant publicity rights).
- Controlled reference-task captures: stationary vs intentionally moved phone with ground truth, repeated smile/rest under stable conditions, and correctly read vs deliberately incomplete speech phrase. Keep explicitly labeled as engineering demonstrations, not clinical validation.
- Author/school/adviser credits and formal printer specifications.

## Change policy
This is a document-only research-branch change. **No changes to production, JSSF Consent, database schema, clinical thresholds or public app.** A future code change requires inspect → research branch → testing/CI → reviewed PR before merge.

## Additional exploratory checks, 2026-10-18 (read-only)
- Arm: **155 left-arm attempts (144 valid)** and **142 right-arm attempts (139 valid)**; median valid phone-drift **0.720° left** vs **0.675° right**, 90th percentile **3.604° left** vs **2.933° right**. These are descriptive unpaired attempt summaries, **not proof of left/right equivalence or reliability**. Future chart: session-paired valid measurements, then check device/build and interval consistency.
- Speech: Android Chrome **33/33 valid attempts**, Android Samsung Internet **2/2**, iOS Chrome **2/3**, iOS Safari **153/238**. Android subsamples are small and builds/retries differ; **do not** infer intrinsic OS reliability without stratification. Highlight quality as a research question.
- Non-valid Speech attempt reason codes (counts are attempts, not volunteers): `DEAD_MIC_DETECTED` **45**; `NO_VOICE` **14**; `I18N_LOAD_FAILED` **5**; `VOICE_NOT_RECOGNIZED` **5**; other reasons less frequent. Reason codes are client-derived technical classifications requiring independent failure review.
- Face non-valid attempt reasons include `INSUFFICIENT_VALID_FRAMES` **8**, `NO_FACE_TIMEOUT` **5**, and `NO_SMILE_DETECTED` **2**. Arm non-valid reasons include `UNCERTAIN_MOVEMENT` **13**. These support evidence of quality-control gating, not clinical accuracy.
