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

## Approved human-centered narrative (2026-10-18)
**Purpose / user framing:** People may recognize a Face–Arm–Speech warning sign yet remain uncertain whether it is serious enough to seek care. This hesitation is the human problem; knowledge of FAST is not universal, so never claim 'everyone knows the signs'. QuickStroke's mission is to support awareness and a more structured, timely **decision to seek emergency medical care**, not to decide whether someone definitely has or does not have a stroke. The accessible instrument is the smartphone already in many people's pockets.

**Central storyline (approved direction):** *Uncertain warning sign → need to act → accessible smartphone → guided Face/Arm/Speech observations → evidence-led engineering study → limits and path toward validation*. Use a **hybrid emotional/scientific hook**: a small, compelling human uncertainty statement immediately adjacent to a large authentic 3-modality measurement visualization. Avoid presenting a self-test as a required step before seeking care.

**Potential English poster hook:**
> "Is this a stroke warning sign—or something else?"  
> "When warning signs are uncertain, deciding to act can be difficult."

**Core mission statement (draft):**
> "QuickStroke explores how a smartphone can guide observation of facial movement, arm-related phone motion, and speech tasks—supporting awareness and timely decisions to seek medical help, without claiming to diagnose or rule out stroke."

**Safety guardrail (mandatory, clear, near use case/demo QR):**
> "If stroke is suspected or sudden warning signs appear, call emergency services immediately. Do not delay seeking care to use this app. A normal-looking result cannot rule out stroke."

**Do NOT claim**: measured reduction in decision time, increased timely hospital arrival, proven clinical triage effectiveness, patient diagnosis, or universal access. These remain potential benefits/research goals, not demonstrated Pilot outcomes. Current Pilot supports technical observations, data quality and nonclinical feasibility; objective requires real-world clinical evaluation to demonstrate decision impact.

**Scene sequence change:**
1. *Human uncertainty and urgency*: brief hook and explicit goal of early action; avoid alarming diagnoses.
2. *Accessible scientific response*: one phone / Face+Arm+Speech / quality-checked measurements, with clear statement that this is not a diagnosis.
3. *How signals are captured*: authentic Face mesh, actual phone drift orientation and trace, ASR transcript/coverage.
4. *Pilot protocol*: nonclinical normal-adult volunteers, version and attempt caveats.
5. *Measured technical evidence*: valid vs not-evaluable; actual distributions and controlled tests if verified.
6. *What is and is not proven*: technical feasibility, sensor/runtime issues, no patient labels or diagnostic cutoffs.
7. *Path to responsible use*: clinical/patient-reference studies and optional ML, plus app demonstration and never-delay-care warning.

**Visual guidance:** The first 15–20% of poster should juxtapose a concise human decision dilemma and one visually prominent phone/measurement hero. Keep emotionally engaging copy very short, so the scientific content remains the poster's visual focus. The Face/Arm/Speech signals and Pilot evidence dominate the middle. Safety/validation are distinct at the bottom.


## Public science-fair entry point: name STROKE before the sensors
**Visitor audience:** This is a mixed-discipline international student science fair, NOT a medical conference. A passing visitor may have no prior idea what QuickStroke is, what FAST means or why Face/Arm/Speech are connected. Avoid opening with technical terms or a generic three-sensor diagram without medical context.

**Mandatory first-glance hierarchy (approximately 3–5 seconds to orient, design aspiration to test, not a measured outcome):**
1. Make **STROKE** unmistakable in the main headline, with QuickStroke project identity immediately alongside.
2. In one accessible sentence: a stroke is a time-critical medical emergency affecting the brain. No lengthy medical background.
3. Display and briefly label the FAST warning-sign relationship: **Face drooping → Arm weakness → Speech difficulty → Time to seek emergency help**. Show that these are examples of sudden warning signs, not an exhaustive list.
4. State the motivation: warning signs may be recognized yet remain uncertain or ambiguous in a real situation; indecision can delay seeking help. Do not claim everyone knows FAST.
5. Only *then* introduce the accessible smartphone as a way to guide observation and support awareness/action; this is a research goal, **not a demonstrated reduction in hospital arrival time or clinically validated triage**.

**Suggested upper-panel copy (draft, subject to design/edit):**
- Title: **QUICKSTROKE — STROKE Warning Signs, One Smartphone**
- Human hook: **Recognizing a warning sign is one thing. Deciding to act can be harder.**
- Bridge: **Face drooping. Arm weakness. Speech difficulty. Time matters.**
- Research prompt: **Can a smartphone guide observation of these signs and support faster decisions to seek care?** State this as a question/goal, not a proven impact.
- Safety near QR: **Suspected stroke is an emergency: seek emergency medical care immediately. Do not wait for QuickStroke or use its results to rule out stroke.**

**Art direction:** The top 15–20% of the physical poster must tell a non-medical visitor what condition this concerns before showing technical proof. A concise mini FAST explainer plus human dilemma bridges to a powerful, authentic Face Mesh / Arm Drift / Speech Recognition hero below. Avoid a dense medical textbook introduction, alarmist stock imagery and false reassurance. Test first-glance recognition on unfamiliar school students; ask them, without prompting, what the project is about and what they should do if symptoms are sudden.

**Storyboard dependency:** Scene 1 explicitly identifies stroke and FACE/ARM/SPEECH warning signs; Scene 2 introduces the decision-support mission; Scene 3 shows the actual measurement techniques; Scenes 4–7 proceed with nonclinical evidence, limitations and future clinical study. Do not replace the overarching human impact with a technology-first opening.
