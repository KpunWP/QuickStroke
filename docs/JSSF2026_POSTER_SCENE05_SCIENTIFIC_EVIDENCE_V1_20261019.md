# QuickStroke JSSF 2026 — Scene 05: Scientific Evidence / Graphic Narrative v1
**Draft:** 2026-10-19 | **Status:** preliminary verified descriptive attempt-level evidence, awaiting 23 Oct freeze and figure QA | **Print target:** 25 Oct.
**No production code, thresholds, Research/Consent or database mutation.** Read-only aggregates of production `jssf_remote_sessions` and `jssf_remote_events`, restricted to `data_collection_phase='jssf_pilot'`. Exclude all 26 `engineering_preflight` sessions. This is not a clinical diagnostic accuracy study.

## Graphic/story design decision
**Main headline:** THREE SIGNALS. DIFFERENT CHALLENGES.
**Research question:** CAN WE TRUST THE MEASUREMENTS WE CAPTURE?
**Scientific message:** Technical validity/evaluability and technical quality differ across modules; a valid event is not evidence of a correct medical classification or even necessarily a technically full-quality capture. Face and Arm yield measurable derived metrics; Speech shows browser/ASR feasibility limitations that matter. The project learns from failures rather than hiding them.

**Scene layout Candidate A:** dominant left chart “Technical evaluability” (per-attempt stacked segments), right chart “Data quality” (separately coded per-attempt quality, color semantics consistent), bottom scientific readout/short derived metrics cards Face/Arm/Speech. The rest of the poster remains dedicated to clinical need and Face/Arm/Speech technique. **Treat data visualization as the hero image**, not ornament or a dashboard of unexplained clinical-sounding scores.

## Data and denominators — snapshot 2026-10-19
136 JSSF pilot session records, **121 completed**, 15 active; 729 `test_attempt_completed` events. Session != volunteer; event != person; repeated attempts and separate left/right Arm events prevent independence. Session records span 4–18 Oct 2026. Exclude 26 engineering preflight session records.

### Main figure 5A: TECHNICAL EVALUABILITY (validityStatus)
| Module | N attempts | Valid | Invalid | Not evaluable | Valid % |
|---|---:|---:|---:|---:|---:|
| Face | 156 | 136 | 16 | 4 | 87.2% |
| Arm | 297 | 283 | 13 | 1 | 95.3% |
| Speech | 276 | 190 | 27 | 59 | 68.8% |
| Total | 729 | 609 | 56 | 64 | 83.5% |

**Caption:** “Technical attempt validity across Face, Arm, and Speech in a nonclinical smartphone pilot. Counts are test attempts, not independent participants; module validity rules are not identical. Validity does not represent diagnostic accuracy.”

Prefer 100%-width stacked horizontal bars with module N labels and small exact fractions. **Note:** no generalizable between-module statistical test or matched-person effect sizes with this counting scheme. Uncertainty intervals on pooled attempts would be misleading without clustering.

### Supporting figure 5B: MEASUREMENT QUALITY (qualityStatus)
| Module | N attempts | Acceptable | Limited | Unusable |
|---|---:|---:|---:|---:|
| Face | 156 | 136 | 0 | 20 |
| Arm | 297 | 263 | 20 | 14 |
| Speech | 276 | 78 | 112 | 86 |

**Caption:** “Per-attempt technical quality categories are separate from the validity outcome. In Speech, many valid attempts were labelled 'limited'; this reflects current technical quality policy, not a diagnosis or medical severity level.”

**Important interpretation:** Because `validityStatus` and `qualityStatus` are different fields and each module has different rules, never put percentages across charts in direct scientific-equivalence language. Further cross-tabulation and code-version checks recommended before printing.

### Supporting figure 5C: DISTINCT REAL MEASUREMENTS
- **Face**: `faceResearch.smile.representativeAsym`; *normalized, unitless and algorithm-dependent index*, pilot median **0.025** in **104 metric-bearing technically-valid Face attempts**. P10/P90 preliminary **0.009 / 0.067**. Not probability of stroke. The actual definition may combine blendshape asymmetry, 2D geometrical mouth rise asymmetry and a weak-side override, so do not label “mm mouth-droop” or “3D facial deviation”.
- **Arm**: `armResearch.measurement.finalDriftMaxDeg`; median **0.707°** in **283 technically-valid Arm attempts**, P10/P90 preliminary **0.297° / 3.197°**. Measures phone orientation change, not actual arm muscle strength, shoulder angle or clinically graded weakness. Left valid 144 and right valid 139 attempts; not necessarily independent or matched.
- **Speech**: 190/276 technically valid (68.8%). Show **task completeness/evaluability and error reasons**, not 1.0 phrase-similarity of accepted attempts as “100% recognition accuracy” or dysarthria detection. Browser default ASR might be vendor hosted; no raw audio/transcripts stored in QuickStroke research database.

**Recommendation:** In the finished poster put Face's **distribution or violin/strip plot** and Arm's **real captured drift-vs-time example** or compact distribution beneath charts 5A/5B, and let Speech's highlighted “limited/not evaluable” technical issue stand as honest engineering insight. The lower three number tiles of the current wireframe are strictly *illustrative layout*, may change once we determine chart hierarchy. No claim of medical predictive performance.

## Structural missingness and reliability notes
- **v3 consent**: 27 sessions / 41 Face attempt events / **0** Face research payloads. Face telemetry not within v3 pilot collection scope. Do NOT interpret as Face technical capture failure.
- **v4 consent**: 109 sessions / 115 Face attempt events / 113 with Face research payload; 104 technically-valid attempts with metrics. Face distribution uses only consent-appropriate subset.
- App version: 124/136 sessions are **v1.0.21**, remainder scattered across seven minor builds; do not claim comparison between versions proves improvement.
- iOS/Safari 101 sessions; iOS/Chrome 3, Android/Chrome 29, Android/Samsung Internet 3; groups uneven, intertwined with build and task circumstances.
- Test attempts aren't independent volunteers. When displaying a true statistical comparison, control for session clustering, retry order, selection, software version and browser/platform where feasible.
- Technical reason codes, e.g. `DEAD_MIC_DETECTED`, are app's classifications, not proof that physical mic hardware failed.
- Quality gates and consent versions may affect observed metric distributions. Missingness, selective capture and validity-conditioned histograms are descriptive, not representative of typical unselected users.

## Print-safe English copy draft
**05 / SCIENTIFIC EVIDENCE**
**CAN WE TRUST THE MEASUREMENTS WE CAPTURE?**
> Across 729 attempts from 136 pilot sessions, the proportion of technically valid attempts differed across Face (87.2%), Arm (95.3%), and Speech (68.8%). The app also recorded technical quality separately, revealing important limitations in speech capture and browser recognition.
> Among valid attempts with available measurements, median normalized smile-asymmetry index was 0.025 (n=104), and median maximum phone drift was 0.707° (n=283).
> These are exploratory engineering measurements—not clinical stroke-detection performance.

**Graph annotation**:
- Valid = application quality/measurement gate satisfied; not a healthy outcome and not medically “correct.”
- Quality-limited = the specific technical capture/interpretation policy recorded a limited observation.
- Data snapshot: 19 Oct 2026; 26 engineering-preflight sessions excluded.
- Units/denominators indicated per figure; repeated attempts by sessions.
- Public-facing emergency message belongs close to QR and overall intro.

## Suggested verbal explanation for student (25–30 seconds)
> “The scientific question was not whether we could diagnose stroke; we do not have clinically labeled patient data. Instead we studied whether the smartphone could capture usable signals. Across hundreds of test attempts, Face and Arm were usually technically evaluable, while Speech experienced more difficulties. We also learned that ‘valid’ and ‘high quality’ aren't the same thing. We can measure facial asymmetry and phone drift, but the next step is to prove these measurements are reliable and clinically meaningful.”

## Artwork version 1 (vector-safe)
Local mockup `QuickStroke_JSSF_Scene05_Evidence_Wireframe_v1.svg` is intentionally a design candidate. Its values are based on the Oct 19 read-only snapshot; file is not a locked chart master. Build all print text, bars, axes and caveats as vector; display % and n directly. A second figure option to compare in artwork is a **large single 100%-stacked evaluability hero** plus two small modality-research mini-plots instead of the side-by-side quality chart.

## Before final print: required read-only QA
1. Freeze cohort on 23 Oct, run the same filtered queries, attach stable snapshot date and totals.
2. Confirm attempt vs module-run denominators and whether retries and side-specific observations meaningfully change the story.
3. Cross-tab `qualityStatus` by `validityStatus` and module before making strong “quality limited among valid” statements.
4. Verify units, algorithms, collection-version scope and missingness for Face (especially v3 vs v4).
5. Validate Arm raw derived trace availability and quality, sensor freshness and person-level inclusion before exporting a publication chart.
6. Verify Speech error groups: reason codes may represent browser/ASR capture phenomena, not diagnostic disorders.
7. Prefer figures from consented aggregate outputs, avoid re-identifying devices/participants or unique trace IDs on publicly posted poster.
