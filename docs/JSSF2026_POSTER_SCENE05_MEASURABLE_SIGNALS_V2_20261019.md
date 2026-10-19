# JSSF 2026 Poster — Scene 05 V2: Measurable Signals, Feasibility and Usability
**Decision:** Owner approved revised scene direction 2026-10-19. **Status:** text & layout candidate; NOT a clinical validation result nor final print.
**Prior Scene 05:** `docs/JSSF2026_POSTER_SCENE05_SCIENTIFIC_EVIDENCE_V1_20261019.md`. **Branch:** `research/jssf-2026-poster-demo-kickoff-20261018`.

## Primary research question
**WHAT CAN A SMARTPHONE BROWSER MEASURE?**
**THREE SIGNALS. THREE ENGINEERING MEASUREMENTS.**
The pilot is aimed at the *feasibility* of browser-based signal capture, usable task/quality metadata, failure modes and distributions, rather than diagnosis. Face/Arm/Speech metrics are exploratory **proxy signals** and no clinical thresholds or diagnostic accuracy were established.

## Hierarchy (owner-approved)
1. **Main** — specific measurement and what each numeric value tells us.
2. **Second** — operational meaning in terms of technical feasibility, evaluability and quality (distinguish feasibility from measured repeatability or accuracy).
3. **Supporting** — attempt-level obtainability rates, missingness/failure reasons, retries.
4. **Bridge** — clinical comparison and prospective reference measurement is future work.

## Print candidate copy (to refine for brevity)
**05 / WHAT CAN A SMARTPHONE BROWSER MEASURE?**
*From guided tasks to measurable signals — the clinical reference comes next.*

**FACE · Camera + MediaPipe landmark tracking**
- **Signal:** normalized smile asymmetry index, with mouth visibility / valid-frame tracking quality.
- **Example of pilot measurement:** median **0.025** (unitless index; n=104 valid attempts that also contain the specific Face research metrics), exploratory P10–P90 **0.009–0.067**.
- **What it tells us:** landmark tracking in a browser produces a quantified left–right facial movement feature while monitoring observation quality.
- **Not established:** clinical abnormality thresholds, facial-palsy diagnostic sensitivity, repeatability under a controlled reference protocol. The index is algorithm-dependent and can combine blendshape / normalized geometry / gating.

**ARM · Device IMU / browser motion sensors**
- **Signal:** phone orientation drift over a guided hold; baseline stability and sensor quality.
- **Example of pilot measurement:** median maximum phone drift **0.707°** (n=283 technically valid arm attempts); P10–P90 **0.297°–3.197°**.
- **What it tells us:** a smartphone browser can record a time-indexed orientation signal and summarize deviation during the task.
- **Not established:** actual anatomical arm-drop angle, muscle weakness, accurate external reference angle, repeatability across phones.
- For poster artwork: prefer a **real, QC-confirmed drift-versus-time trace**, not simply “stable signal” claim.

**SPEECH · Browser ASR**
- **Signal:** prompted transcript completeness / phrase coverage, ASR availability, and technical readiness/quality.
- **Current feasibility evidence:** **190/276** speech attempts technically valid (**68.8%**); quality categories 78 acceptable, 112 limited, 86 unusable (these are not diagnostic categories).
- **What it tells us:** browser speech recognition can yield a structured phrase-observation signal, but capture/evaluability varies; some technically valid attempts are quality-limited.
- **Not established:** dysarthria detection, clinical phonetic impairment, speech-recognition accuracy against manually labeled transcript across entire sample.
- Public browser speech may use a vendor-operated network service; no raw audio or transcript retained in QuickStroke research DB. Local Whisper is experimental Presenter-only, pending validated offline run.

## Supporting obtainability strip (NOT main story)
| Module | Technically valid / attempts | Rate |
|---|---:|---:|
| Face | 136/156 | 87.2% |
| Arm | 283/297 | 95.3% |
| Speech | 190/276 | 68.8% |
**Caption:** “Technical validity of repeated attempts, not independent volunteers, and not clinical diagnostic accuracy. Module quality gates differ.” Session count = 136, 121 completed in snapshot; engineering preflight excluded.

## Consent/version limitation critical to Face interpretation
Consent v3 pilot: 27 sessions and 41 Face attempt events; **zero Face research payloads** because scope excluded those fields. Consent v4: 109 sessions, 115 Face attempts, 113 with bounded Face research fields. Face analytic subset 104 valid metric-bearing Face attempts. Missing v3 research payload is **structural consent-related missingness**, not a camera failure. Never relabel as such.

## Artwork wireframe v2
Concept export produced for review:
- `QuickStroke_JSSF_Scene05_Measurable_Signals_v2.svg` (vector)
- `QuickStroke_JSSF_Scene05_Measurable_Signals_v2.png` (preview)
Three color-aligned Face / Arm / Speech columns show *signal → numeric pilot example → operational interpretation → clinical unknowns*. Lower 3-bar strip shows relative technical obtainability, with labeled numerator/denominator.
These file names denote local artwork exported in this ChatGPT task, not files automatically committed to GitHub. They are not yet the full poster artwork, and the Face/Arm distributions and approved controlled IMU trace remain to be inserted.

## Editorial safety checks
- Do not assert that the pilot *proved precise measurements* versus a reference: no comparative standard was collected.
- Do not use “reliable” as a property of Face/Arm measurement stability until repeatability is quantified under controlled protocol. Use “measurable”, “technically obtainable”, “interpretable signal”, and “quality tracked”.
- Don't use valid fraction to imply no symptoms/clinical pass rate; don't claim “100% accurate” ASR from phrase similarity conditioned on a valid attempt.
- Metrics are algorithm- and version-dependent; no population generalization or sensor calibration study.
- “Human decision support” is the design goal, **not an assessed intervention outcome**.
- Suspected stroke is an emergency: immediate care without waiting for any app.
- Without separate face publication permission and image/frame alignment, use schematic, not nonconsented participant face.

## Next iterations
1. Replace central large numeral-only placeholders with **actual distribution** of Face asymmetry and phone drift, with n and P10/P50/P90, or a QA-passed real time-series demonstration.
2. Give Speech equal visual interest by plotting complete/partial/not-evaluable and root-reason categories rather than implying clinical abnormality.
3. Integrate into true poster dimensions, with Scene 04 band condensed if needed; improve typographic scale and verify international readability.
4. Freeze cohort and rerun source queries before print, version- and consent-aware.
