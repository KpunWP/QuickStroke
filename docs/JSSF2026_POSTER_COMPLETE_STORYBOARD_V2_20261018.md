# QuickStroke · JSSF 2026 — Complete Scientific Poster Storyboard v2
**Date:** 2026-10-18 | **Workstream:** Research & Poster (A)  
**Status:** Editorial / scientific storyboard for review; not artwork, approved charts, or printer master.  
**Source:** Previous kickoff and evidence notes on branch `research/jssf-2026-poster-demo-kickoff-20261018`; read-only pilot exploration of production Supabase project `pzzjfnfwppdeketjdhfo`.  
**Print target:** October 25, 2026. Board/poster dimensions require final selection and printer confirmation; existing A0 draft is not definitive.

## One-sentence story
A **stroke** is an emergency, but its warning signs can leave people uncertain. We developed QuickStroke, an accessible smartphone **research prototype** that guides observation of Face, Arm and Speech signals. We collected nonclinical pilot data to examine whether its measurements can be obtained and quality-checked, while openly recognizing that diagnostic thresholds, patient accuracy and actual changes in emergency-seeking behavior remain to be established.

## Audience and scientific honesty
The first viewer is an international *general-science* student, not a neurologist. First glance must identify STROKE; first 10 seconds explain F/A/S/T; the remaining poster must substantiate the *engineering* rather than repeat medical background. If sudden stroke signs are suspected, emergency medical care must be sought immediately **without using/waiting for the app**; a normal-looking result cannot rule out stroke. FAST summarizes representative warning signs, not all stroke symptoms (balance/vision changes also matter). Keep clinical action distinct from using a demonstration.

## Preferred first-glance hierarchy and hero copy
- Identity: **QUICKSTROKE** | Science / Research Prototype
- Largest semantic word: **STROKE**
- Primary headline (draft): **STROKE WARNING SIGNS. ONE SMARTPHONE.**
- Emotional question (short): **Recognizing the signs is one thing. Deciding to act can be harder.**
- Scientific bridge: **Can smartphone sensors capture useful, interpretable observations of Face, Arm and Speech warning signs?**
- Clear urgent safety microline near FAST: **Sudden stroke warning signs? Seek emergency help immediately. Do not wait for the app.**
- Subtitle: **A nonclinical pilot of a browser-based guided observation system—not a diagnostic test.**

## Scene 1 — STROKE: why quick action matters
**Job for visitor:** Understand within seconds that the project concerns a time-critical brain emergency, and what Face/Arm/Speech have to do with it.
**Story beat:** People may recognize a warning sign but still hesitate. This motivates research into support for awareness and timely *human* action, without assuming universal FAST knowledge.
**English poster copy (draft):**
> **STROKE: WHEN EVERY MINUTE MATTERS**  
> Stroke is a medical emergency involving a blocked blood supply to the brain or a burst blood vessel. Warning signs may appear suddenly.  
> **FACE** drooping · **ARM** weakness · **SPEECH** difficulty · **TIME** to call emergency services.
> Recognizing a sign is one thing. Deciding to act can be harder.
**Visual:** Four clean FAST cues (face, arm, speech, urgent response) with perhaps one small contextual head/brain silhouette; no hospital stock-photo hero and no dense stroke statistics. Add “Other signs can include sudden vision or balance changes” in small type.
**Evidence:** Medical-warning-sign explanation from CDC/ASA; do not insert a 4.5-hour clock as a universal treatment cutoff.
**Transition:** If the goal is timely awareness, could an already accessible instrument help structure observation?
**Area guide:** ~13% of page, merged visually into Scene 2 rather than boxed off.

## Scene 2 — Why QuickStroke: a phone for guided observation
**Job:** Understand project motivation and the interface-to-action concept, not a diagnosis claim.
**English poster copy (draft):**
> **FROM UNCERTAINTY TO INFORMED ACTION**  
> QuickStroke explores how a smartphone can guide structured observations of facial movement, phone motion during arm-holding tasks, and a spoken phrase.  
> **Technology to support human decisions—not replace medical judgment.**
**Visual:** One central phone with three light pathways Camera / Motion Sensors / Browser Speech Recognition. Subtle ribbon “Observe → Evaluate signal quality → Explain result” ending in a *human decision* icon, not a green “stroke negative” tick. Emergency action bypasses app: put a clear arrow “Suspected stroke → Emergency services (no app needed).”
**Evidence:** Working Public app concept, no evidence that the current prototype shortens real-world decision-to-care time.
**Transition:** What does the phone measure in each module?
**Area guide:** ~9%.

## Scene 3 — Inside the instrument (main visual)
**Job:** In one glance see the real technical mechanism and exactly what is measured.
**Poster heading:**
> **THREE TASKS. THREE MEASURABLE SIGNALS.**
**Face panel**
- **Visible copy:** “Smile → Facial landmarks → Left/right mouth movement and tracking quality.”
- **Hero visual:** Large real adult face with consent for *publication*, photographed for the poster (not reused from pilot research without media consent), true MediaPipe Mesh overlay, small marked left/right mouth movement illustration and short quality cue.
- **Scientific distinction:** Relative motion/asymmetry and tracking quality are derived; not a measured neurological diagnosis. Do not label a posed face “stroke patient.”
**Arm panel**
- **Visible copy:** “Raise and hold → Phone orientation over time → Drift estimate.”
- **Hero visual:** Existing verified left/right instruction pose, illustrated phone orientation change, and one *authentic, QC-checked* bounded time trace in degrees. Explain clearly that phone orientation change is **not direct measurement of arm-muscle strength or anatomical joint angle**.
- **Scientific distinction:** Use a sample trace with time axis, degrees, side, app version and label “example technical trace”; not a fabricated smooth waveform.
**Speech panel**
- **Visible copy:** “Repeat a phrase → Browser speech recognition → Recognized text and phrase coverage.”
- **Hero visual:** Mic-ready indicator, precisely the app's actual *current* displayed phrase, expected vs recognized string and completeness indicator, with a small “no transcript” state alongside. Use a consented demonstration, not a stored participant transcript.
- **Scientific distinction:** No claim of clinical dysarthria detection or acoustic analysis; decorative audio waveform must not be presented as recorded signal.
**Visual strategy:** Three generous vertical science panels with same anatomy: action at top, actual measurement in middle, compact derived metric/quality cue at bottom. Coordinate palette by modality, repeat same colors in Scene 5 charts.
**Evidence:** Repo algorithms and properly captured examples to be verified by engineering track; sensor values and existing bounded telemetry.
**Transition:** We can display measurable signals—but how much of the pilot data is actually evaluable?
**Area guide:** ~30%.

## Scene 4 — How we investigated (methods without a wall of text)
**Job:** Establish a scientific nonclinical study rather than only showing a functioning website.
**English poster copy (draft):**
> **A NONCLINICAL SMARTPHONE PILOT**  
> Consenting adult volunteers used browser-based Face, Arm, and Speech tasks. We examined task completion, measurement quality, signal distributions, retries, and device-related issues. Technical records contain derived metrics—not raw face images or audio.
**Visual:** A 4-node scientific pipeline “Consent & guided task → Sensor capture → Validity/quality checks → Aggregated research metrics”; underneath a tiny cohort note “136 pilot session records · 121 completed · 729 test attempts [snapshot Oct 18, 2026]”.
**Cohort warning:** Repeated attempts and sessions, evolving app versions, and nonclinical sample. **136 sessions are not 136 independent volunteers.** Engineering-preflight records excluded. Keep snapshot date and freeze after QA.
**Evidence:** Supabase session/event tables, preliminary aggregates. Do not say actual controlled repeatability studies are finished until documented.
**Transition:** Which signals were evaluable, and what were their distributions?
**Area guide:** ~12%.

## Scene 5 — What the data actually show (main scientific evidence)
**Job:** Show engineering measurement capture and its limits in depth, not just 89% completion.
**Heading:**
> **FROM RAW EVENTS TO USABLE MEASUREMENTS**
**Main chart (prominent):** A stacked validity/evaluability comparison by attempt (not participants): Face 136 valid / 16 invalid / 4 not-evaluable (n=156); Arm 283 / 13 / 1 (n=297); Speech 190 / 27 / 59 (n=276). Caption explicitly explains validity is technical evaluability, **not correct diagnosis**. Show missingness too (Face research-derived payload available for 104 of 136 valid attempts; Arm research payload 297/297 attempts; Speech 275/276).
**Supporting evidence figures (choose 2–3 after methods audit):**
- **Face:** Distribution of normalized smile asymmetry from **104 metric-bearing valid Face attempts**; preliminary median **0.025**. Confirm exact algorithm and units before interpreting. An annotated example showing *which mouth movement* underlies measure adds more meaning than an isolated number.
- **Arm:** Valid maximum phone-orientation drift distribution, n=283 attempts, preliminary median **0.707°**; show actual time-series trace if QC passes. Left vs right summary preliminary medians **0.720° (left; n=144 valid)** vs **0.675° (right; n=139 valid)**, but these are **unpaired** and do **not** demonstrate equivalence/reliability; only publish paired claim after proper session-pair analysis.
- **Speech:** Full phrase recognition / quality states with error reasons stratified by platform/build if supported; per-attempt valid 190/276. Avoid “100% recognition accuracy” from phrase similarity=1.0 in selected valid attempts: the gate *defines* success.
**Design:** Each figure pairs **metric definition / unit / denominator** with graphic and one-sentence interpretation. Few, clear scientific figures beat a dashboard of unexplained scores. Small footnote: app v1.0.21 dominates pilot (124/136 sessions), data are repeated and non-independent.
**What can be claimed:** “Measurable derived signals and technical quality indicators were recorded in a nonclinical pilot; evaluability differed among modules.” Not “all markers performed as expected”, “clinically validated”, “reliable across devices”, or “accurate stroke detection”.
**Evidence status:** *Exploratory verified aggregates*; plotted distributions, controlled reference captures, algorithm definitions and deduplication still require audit before print.
**Transition:** What broke or remains unclear, and what did the team learn?
**Area guide:** ~26%.

## Scene 6 — Engineering lessons, openly reported
**Job:** Demonstrate actual research judgement through careful limits and actionable technical learning.
**English poster copy (draft):**
> **WHAT WE LEARNED**  
> Validity checks can flag missing or low-quality measurements. Phone and browser behavior matters—particularly for microphone and speech-recognition readiness. A completed test is not proof of correct medical classification.
**Visual:** Tiny 3-column “captured | rejected or uncertain | next improvement” pattern; code-free icons for camera-frame gaps, uncertain arm movement, and speech capture/ASR issues. “Dead microphone detected” is a telemetry reason code, not automatically proof that the hardware microphone physically failed.
**Critical caveat:** No clinician-labeled patient comparison, no reliable estimate of diagnostic sensitivity or specificity, not all versions equally represented; repeated attempts need clustering. Do not call technical failures 'false positive/negative' without ground truth.
**Transition:** What evidence must be collected before medical thresholds or ML might be appropriate?
**Area guide:** ~5%.

## Scene 7 — Next science and booth participation (closing loop)
**Job:** Return to Scene 1: responsible technological progress towards helping people act, without claiming finished clinical impact.
**English poster copy (draft):**
> **NEXT: FROM ENGINEERING DATA TO CLINICAL VALIDATION**  
> First, test measurement accuracy and repeatability under controlled tasks. Then study ethically recruited patients and controls with clinical reference labels to develop and independently validate decision thresholds and, if useful, machine-learning methods.
> **TRY THE PUBLIC PROTOTYPE** — Scan to explore the guided tasks. *Not for diagnosis or to rule out stroke.*
**Visual:** Three future research milestones “Controlled reference tasks → Clinically labeled study → Independent validation and decision-impact research” plus small, high-contrast QR linking **Public mode**, never `/jssf-consent.html`; plus logo/team/school credits, small references. Main permanent emergency line: “If stroke is suspected, seek emergency medical care immediately. Do not delay for an app test.”
**Evidence:** These are future objectives, not completed achievements.
**Area guide:** ~5%; team branding/references integrated within margins without squeezing safety copy.

## Poster composition, first proposed hierarchy (not a final layout)
- **Top ~22%:** Scenes 1+2 as a *single* human motivation + stroke explainer + one-phone hero; immediate naming of STROKE, concise FAST cues and urgent action.
- **Center ~30%:** Scene 3 as technical centerpiece (3 authentic science panels).
- **Research evidence ~38%:** Scene 4 (12%) leading to Scene 5 (26%); most density here but prioritize graphics.
- **Bottom ~10%:** Scenes 6+7, conclusions / honest limits / clinically labeled-data roadmap / Public-demo QR and full safety line.
- Strong visual continuity: color keyed Face / Arm / Speech from instrument panels into research graphs; ideally viewer can visually trace **metric → data distribution**.
- Suggested dimensions 85×160 cm *as one option*, not approved print master; official board max and printer crop/bleed need confirmation. PPTX scaling needs technical proof if beyond app slide maximum.

## Asset inventory before final design
| Priority | Asset | Status / blocking condition |
| --- | --- | --- |
| P0 | Authenticated Face Mesh adult photo and mouth callout | Need staged adult capture with permission for public poster; inspect actual overlay; avoid pilot face images |
| P0 | Original left/right arm instruction artwork | Existing in repository, verify orientation correct in current build and license/use |
| P0 | One truthful, anonymized IMU drift vs time plot | Raw bounded derived bins in Supabase; select QA-passed attempt; no synthetic trace presented as real |
| P0 | Current EN/JA speech phrase and ASR transcript visual | Engineering workstream must verify current phrases/algorithm; use staged demo |
| P0 | Research validity chart with exact denominators & snapshot | Preliminary aggregate verified; final numbers freeze just before printing |
| P1 | Distribution plots and metric methodology | Need QA by version, retries, unit definitions, missingness |
| P0 | School, student names, adviser names, logo authorization, print dimensions | Confirm prior to print master |
| P0 | Public demo QR & emergency notice | Must link Public mode only; QR requires connectivity first-use; explicit demo safety |

## Content acceptance checklist
1. Stranger understands **stroke** and time-critical action without needing domain knowledge.
2. Human hesitation and mission are visible, but **no app-gated emergency pathway** is implied.
3. Each technical panel names input, derived measurement, and limitation honestly.
4. Statistical figures cite n, measurement level, units, version/snapshot and any exclusions.
5. No visually misleading speech waveform or 'joint angle' anatomy inferred from phone orientation.
6. Pilot data cannot be read as 136 unique subjects or clinical accuracy.
7. Poster clearly distinguishes **what we built**, **what the nonclinical data show**, and **what future clinical work might prove**.
8. Poster and Oral workstreams share verified research figures, but storytelling and density differ by presentation format.

## Source anchors for medical context
- CDC: https://www.cdc.gov/stroke/signs-symptoms/
- American Stroke Association: https://www.stroke.org/en/about-stroke/stroke-symptoms
Other medical facts must be individually checked. Numerical research figures must trace to Supabase source queries and a declared snapshot date.

## Version discipline
Document-only change, research branch only. No production UI/engine, Supabase data/schema, JSSF Consent or clinical-threshold changes. Further poster revisions happen as independent artifacts until approval; share validated metrics with Oral team through this document.

## Privacy as a visible engineering differentiator — required revision (2026-10-18)
See [`JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md`](./JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md). **Do not hide Privacy in a technical footnote.** Add a clear, attractive **“PRIVACY BY DESIGN”** callout at the side of Scene 3 instrument figure, and connect Scene 4 to the consented telemetry workflow: no stored raw face video, photo/audio recording, landmark arrays or transcript text in the research database; derived measurements and technical metadata only (with consent). Distinguish no **QuickStroke research-server audio uploads** from broader **voice stays on device**, which cannot yet be guaranteed for browser-default SpeechRecognition and is a tracked issue for engineering. Diagram must show browser ASR vendor path as platform-dependent/unverified rather than falsely draw an unconditional local-only arrow. Do not claim perfect anonymity; derived metrics/metadata may have residual privacy risk. Re-evaluate poster panel allocation to give this architectural principle enough visibility, while keeping Stroke/FAST recognition, engineering figures, and research chart priorities. No client/database/consent modifications as part of this editorial change.
