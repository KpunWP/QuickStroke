# QuickStroke JSSF 2026 — Scene 04: Our Experiment / Methods & Layout v1
**Date of draft:** 2026-10-19 (ICT) | **Workstream:** Research & Poster | **Status:** owner review; actual bounded pilot aggregate read-only verification, **not print data freeze**.
**References:** `docs/JSSF2026_POSTER_COMPLETE_STORYBOARD_V2_20261018.md`, `docs/JSSF_REMOTE_DATA_COLLECTION_DRAFT.md`, `docs/JSSF2026_POSTER_MEASUREMENT_EVIDENCE_STORYBOARD_20261018.md`, `docs/JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md`. This is a **documentation-only** revision on branch `research/jssf-2026-poster-demo-kickoff-20261018`.

## Editorial mission
Show **research design** rather than merely a website or polished Demo. Establish a testable question:
> **Can smartphone-guided Face, Arm and Speech tasks reliably yield interpretable technical measurements in a remote, nonclinical pilot?**

**Important framing:** The pilot can investigate capture feasibility, completion, technical quality/evaluability, retries, metric distributions and browser/device issues. It does **not** establish clinical accuracy, sensitivity/specificity, diagnostic thresholds, true strength, dysarthria detection, or shortened care-seeking time.

## Exact final-candidate English copy for a printed Scene 04
**Section heading:** `04 / OUR EXPERIMENT`
**Subheading:** `A NONCLINICAL SMARTPHONE PILOT`

**Main paragraph (keep to ~39 words):**
> Consenting adult volunteers (18+) completed guided Face, Arm and Speech tasks on their smartphones. We studied whether the system could collect usable measurements, how often tests needed retrying, and how technical quality varied across devices and browsers.

**Methodological sentence below pipeline (~20 words):**
> Per-attempt validity and quality were recorded separately. Our study measured technical feasibility—not medical diagnostic accuracy.

**Diagram nodes (prefer these, 4 nodes):**
1. `CONSENT` — `Adults 18+ • Voluntary`
2. `GUIDED TASKS` — `Face • Arm L/R • Speech`
3. `QUALITY CHECK` — `Valid / Invalid / Not evaluable`
4. `RESEARCH METRICS` — `Derived features • Technical metadata`

**Compact cohort strip, snapshot checked 2026-10-19; source event window through 2026-10-18:**
- `136 pilot sessions`
- `121 sessions completed` 
- `729 completed test attempts`
- tiny note: `Sessions ≠ unique people. Attempts include left/right arm measurements and retries.`
- excluded cohort: `26 engineering-preflight session records excluded.`

**Privacy one-liner (from actual protocol):**
> **Privacy by design:** no raw face images/video, voice recordings or transcripts are stored in the QuickStroke research database; with consent, limited derived and technical records are collected.

**ASR caveat** for presenter/technical Q&A or full privacy diagram, not necessarily every Scene 04 line: Public browser ASR may use vendor server processing; do not claim all speech is on-device.

## What the actual study design is (expanded team/reviewer explanation)
| Dimension | Verified scope / wording |
|---|---|
| Design | Observational, remote, voluntary **nonclinical usability/measurement feasibility pilot**; community-adult enrollment via JSSF consent link. Not randomized, not a diagnostic accuracy study. |
| Eligibility | Self-declared age ≥18, explicit consent in hosted flow; not clinician-confirmed “healthy” status and no patient/control labels. |
| Data collection | App-generated Study/session identifiers, event timestamps, coarse platform/browser/build, module attempts, retry and quality/failure metadata and consented bounded derived research measurements. |
| Tasks | Face rest and smile with camera landmark tracking; Arm left/right smartphone orientation observations; prompted Speech with browser ASR. Module methods in Scene 03. |
| Within-task records | `test_attempt_completed` events (attempt unit) and `module_run_completed` where present; `validityStatus` `valid`/`invalid`/`not_evaluable`, **separate** `qualityStatus` `acceptable`/`limited`/`unusable`. |
| Analysis | Session completion, attempt/evaluability counts, retry/technical errors, subset missingness, exploratory distributions and device/browser differences; version-specific denominators/quality gates to be audited before print. |
| Independence | One session can contain multiple attempts incl. left/right and retry; same human might enroll in multiple sessions. Sessions and attempts **must not be called participants** or used as independent patient samples. |
| Clinical gap | No externally labeled patient/control comparison or reference standard, no proof of clinical diagnostic performance, no demonstrated faster real-world action. |
| Privacy | Public Mode does not send JSSF research telemetry; consented research event server stores **derived metrics and technical metadata**, not raw face/video/audio/transcript. Browser/vendor ASR transmission remains possible. JSSF primary DB retention policy 90 days plus withdrawal. |
| Comparison | Cross-device differences are observational/confounded by small samples, builds, browser platform and repeated attempts. Descriptive charts only pending suitable adjustment/design. |

## Snapshot audit — verified via READ-ONLY production Supabase queries, 2026-10-19
All counts below filter **`jssf_remote_sessions.data_collection_phase='jssf_pilot'`**; `engineering_preflight` excluded. Public/Dev not mixed.

### Sessions
- 136 Pilot Session records across 2026-10-04–2026-10-18.
- 121 completed and 15 active (these are *session statuses*, not quality states).
- Every completed session has completed-attempt events across Face, Arm and Speech; does not mean all attempts were technically valid.
- 26 additional engineering-preflight sessions (22 completed, 4 active) are outside this cohort.
- Version mix: `1.0.21` **124/136 sessions**, remaining 12 across 1.0.23/24/25/26/28/29/30.
- Browser mix: iOS/Safari **101**, iOS/Chrome **3**, Android/Chrome **29**, Android/Samsung Internet **3** session records; unequal representation limits platform comparison.
- All 136 pilot session records include `age_18_or_older = true` and scope `usability_nonclinical` (self-declared eligibility).

### Attempts
**729 test-attempt-completed event records**, not 729 independent people:
| Module | Attempts | Valid | Invalid | Not evaluable | Research payload present |
|---|---:|---:|---:|---:|---:|
| Face | 156 | 136 | 16 | 4 | 113 / 156 |
| Arm (Left + Right) | 297 | 283 | 13 | 1 | 297 / 297 |
| Speech | 276 | 190 | 27 | 59 | 275 / 276 |
| **Total** | **729** | **609** | **56** | **64** | — |

Arm laterality: **155 left** (144 valid, 10 invalid, 1 not evaluable); **142 right** (139 valid, 3 invalid). These are **attempt counts**, not matched-participant pairs.

Technical **validity** differs from **quality**:
- Face quality: 136 acceptable, 20 unusable.
- Arm quality: 263 acceptable, 20 limited, 14 unusable.
- Speech quality: 78 acceptable, 112 limited, 86 unusable.
- Speech technically valid (190) includes many quality-limited (112), and these quality indicators are *not* medically calibrated diagnostic grades.

### Crucial Face data missingness is CONSENT-VERSION DEPENDENT
- v3 consent (`JSSF-REMOTE-2026-10-04-v3`): **27 sessions**, **41 Face attempts**, **0 Face research payloads** (32 Face valid attempts).
- v4 consent (`JSSF-REMOTE-2026-10-06-v4`): **109 sessions**, **115 Face attempts**, **113 Face research payloads** (104 Face valid attempts).
**Never call v3 missing Face telemetry “camera measurement failure”**. The Face research consent scope was expanded in v4, so analytic Face distributions must explicitly use consenting v4 metric-bearing valid attempts; these are a subset, not the whole cohort.
This structural missingness should be described in a Methods/Scene 05 footnote and QA legend; it is also an example of privacy-by-design research governance.

## Graphic layout recommendation for the full Poster
Previous preliminary wireframe proposed Scene 04 narrow on left beside larger Scene 05 on right. That can crowd the entire consent → capture → quality → derived-metrics pipeline.

**Proposed improved Candidate B:** Put Scene 04 in a **full-width, shallow horizontal methods band** (~10–12% of poster height) directly below the Scene 03 Technology Hero, then Scene 05 as the expansive research-chart region below. This improves read order, separates *how* from *what was measured*, and gives Scene 05 enough width for careful denominators and labels. Not a locked print choice; compare with the previous side-by-side Candidate A after plotting real Scene 05 figures.

Suggested hierarchy:
```text
┌────────────────────────────────────────────────────────────────────────┐
│ 04 / OUR EXPERIMENT                      NONCLINICAL SMARTPHONE PILOT   │
│ Consent (18+)  →  Guided Face/Arm/Speech  →  Quality checks  →  Metrics  │
│                                                                        │
│ 136 PILOT SESSIONS     121 COMPLETED        729 ATTEMPTS               │
│ Sessions ≠ people; retries included • Preflight excluded              │
└────────────────────────────────────────────────────────────────────────┘
                          ↓
                05 / SCIENTIFIC EVIDENCE
```
Reserve small privacy note in Scene 04 with pointer to the richer Scene 03 Privacy Architecture. Do not repeat the lengthy technical caveat throughout every panel.

## Science communication / speaker explanation
**~20–25-second script:**
> “We ran a voluntary, nonclinical pilot with adults using their own smartphones. After consent, people followed Face, left-and-right Arm, and Speech tasks. For each attempt, we checked whether usable measurements were captured and documented technical limitations. So far our dataset contains 136 test sessions and 729 attempts—not 136 or 729 independent volunteers. We are studying measurement feasibility, not clinical stroke accuracy.”

## Known caveats before printing
1. Final print data freeze targeted **2026-10-23**; snapshot on 19 October remains preliminary until source counts, missingness, consent versions, and export QA are frozen.
2. Protect privacy: never publish participant IDs, exact timestamps for individual rare records, device fingerprints, raw transcripts, images, or audio.
3. Any percentages in Scene 05 must name their denominator and ideally distinguish valid / invalid / not evaluable and quality-limited.
4. No medical sensitivity, specificity or “diagnosed stroke” claims from this pilot.
5. No declaration of statistical independence or paired left-right comparisons without analysis by meaningful matched units.
6. If poster design is constrained, prefer larger clear methods pipeline and 3 cohort counts to a complicated table in Scene 04; detailed counts belong in Scene 05.

## Implementation / artwork status
- **Done in this doc:** scientifically verified study design, exact English candidate copy, proposed full-width horizontal methods panel, privacy safeguards, read-only data snapshot, denominator distinctions, consent-dependent metric-missingness discovery.
- **Pending owner art decision:** Candidate B methods band vs Candidate A left-column methods, coordinated with future Scene 05 charts.
- **Not blocked by Demo:** all Scene 04 copy, numbers, methods nodes and diagram can be laid out right now. Only final cohort freeze and print dimensions remain pending.
