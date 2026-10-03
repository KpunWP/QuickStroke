# Face P0 Research Audit — JSSF nonclinical pilot

Status: **P0-A through P0-F implemented and code-audited on `research/face-p0-data-contract-20261003`. Hosted staging ingest is `0.9.0`; production remains untouched. Physical device verification is the remaining pre-pilot step.**

Scope: JSSF is a **nonclinical usability/reliability pilot**. Nothing in this audit establishes clinical validation, stroke sensitivity/specificity, ROC cutoffs, or diagnostic performance.

## Data-path audit matrix

| Research variable / control | Computed | Local persisted | Remote transmitted | DB stored | Exportable / analyzable | Notes |
|---|---|---|---|---|---|---|
| Session / module run / attempt IDs and retry sequence | Yes | Yes | Yes | Yes | Yes | Canonical IDs link summary and samples. |
| App/build/config/Face algorithm/research versions + config hash | Yes | Yes | Yes | Yes | Yes | Required for retrospective replay and cohort stratification. |
| Active Face thresholds used by each attempt | Yes | Yes | Yes | Yes | Yes | Includes smile, baseline, pose, visibility, persistence, valid-frame and hand-model policy thresholds. |
| Baseline median values | Yes | Yes | Yes | Yes | Yes | Canonical baseline is median of neutral-valid frames. |
| Baseline mean comparison values | Yes | Yes | Yes | Yes | Yes | Retained only for research comparison with the median method. |
| Baseline stability (MAD + accepted/rejected neutral frames) | Yes | Yes | Yes | Yes | Yes | Neutral gate does not require symmetry. |
| Baseline smile L/R and normalized mouth width/corner positions | Yes | Yes | Yes | Yes | Yes | Supports relative closed-mouth replay/features. |
| Resting asymmetry evidence | Yes | Yes | Yes | Yes | Yes | Independent safety evidence; not removed if smile is unassessable. |
| Independent peak Smile L/R capacity | Yes | Yes | Yes | Yes | Yes | Preserved independently from paired dynamic metrics. |
| Signed raw and normalized mouth-corner displacement | Yes | Yes | Yes | Yes | Yes | Positive=up, negative=down; no per-frame positive clamp. |
| Paired dynamic asymmetry median/P75/P90 | Yes | Yes | Yes | Yes | Yes | Shadow/research only. |
| % paired frames above candidate asymmetry threshold | Yes | Yes | Yes | Yes | Yes | Threshold snapshot travels with attempt. |
| Longest continuous paired asymmetry duration | Yes | Yes | Yes | Yes | Yes | Shadow/research only. |
| Onset L/R, weak-side lag, time-to-peak L/R/difference | Yes | Yes | Yes | Yes | Yes | Candidate future feature set; not user-facing scoring. |
| Raw yaw/pitch/roll | Yes | Yes | Yes | Yes | Yes | Allows later re-stratification/re-gating. |
| Measurement pose thresholds + 3/8 hysteresis | Yes | Yes | Yes | Yes | Yes | 15/18/15 engineering starting point. |
| Rest high-weight pose thresholds | Yes | Yes | Yes | Yes | Yes | 12/15/12 engineering starting point. |
| Eye distance + ratio from baseline | Yes | Yes | Yes | Yes | Yes | Quality/confounder variable; no duplicate correction is applied. |
| Raw vs normalized geometry | Yes | Yes | Yes | Yes | Yes | Supports testing whether normalization reduces distance/pose bias. |
| Mouth visibility score/dark/central-dark/line components | Yes | Yes | Yes | Yes | Yes | Pixel heuristic remains a quality variable. |
| Mouth assessable + hand-mouth overlap | Yes | Yes | Yes | Yes | Yes | Per-frame research samples. |
| Hand model available/delegate/degraded mode | Yes | Yes | Yes | Yes | Yes | Coarse technical runtime only; no device identifiers. |
| Face/hand detection error counts + quality flags | Yes | Yes | Yes | Yes | Yes | Technical reliability/stratification variables. |
| Coarse platform/browser/locale | Yes | Yes | Yes | Yes | Yes | Stored once on parent session and joined for analysis. |
| Validity/quality/invalid reason/retry | Yes | Yes | Yes | Yes | Yes | Canonical attempt/run summaries plus research attempt summary. |
| Raw image/video/audio/biometric media | **No** | **No** | **No** | **No** | N/A | Explicitly outside JSSF remote research contract. |
| Withdrawal deletion | N/A | Yes | Yes | Yes | N/A | Local purge + atomic parent delete; child events cascade. |
| 90-day primary DB retention | N/A | N/A | N/A | Yes | N/A | Hourly parent-session purge; child events cascade. |

## Analysis path

Remote samples are stored as a fixed ordered `fields` dictionary plus compact numeric `rows`. Run:

```bash
node research/jssf-face-export.mjs <events-or-bundle.json>
```

The helper expands every sample row to named columns and joins the matching `face_research_attempt` summary. If parent session rows are included in the input bundle, it also joins Study ID and coarse platform/browser/locale. This provides a deterministic analysis-ready representation without exposing a public database view or requiring application secrets.

## Privacy / research-validity boundary

- Consent discloses derived numeric time-series and explicitly excludes raw image/video/audio and direct identifiers not required by the project.
- Device/browser are coarse metadata and should be treated as confounder/stratification variables, not biological stroke predictors.
- JSSF can estimate normal distributions, measurement variability, retry/failure rates, device/browser effects, pose/distance effects, and open-mouth versus closed-mouth performance.
- JSSF must **not** be used to claim clinical sensitivity/specificity or set clinical cutoffs. A later patient/control study requires ground truth independent of QuickStroke.

## Behavioral hardening completed after the data-path audit

The blockers identified by the first audit are now closed in code:

1. **Mouth visibility persistence** — pixel-only visibility loss now uses 300 ms persistence; confirmed hand overlap resets immediately.
2. **Reason taxonomy** — current records distinguish `HAND_OCCLUSION`, `MOUTH_VISIBILITY_LOW`, and `PIXEL_HEURISTIC_FAILURE`; hand-model availability/degraded mode is recorded separately. Legacy `MOUTH_NOT_VISIBLE` remains display-compatible only.
3. **Distance quality gate** — ideal 0.85–1.15 × baseline and acceptable 0.80–1.20 × baseline are active as quality gates without a second geometry correction.
4. **Early safety / inability path** — valid resting abnormal evidence is preserved if smile is unassessable, and resting critical evidence now offers an optional immediate safety/result exit without forcing completion of all modules.
5. **0–100 score interpretation** — numeric Face score remains available for research/debug but is hidden from normal user-facing Face interpretation; categorical result status drives the user UI.
6. **Final Face Threshold Review** — config, runtime fallbacks, local snapshot, remote sanitizer and research export are aligned. Active values remain explicitly engineering/pre-pilot and are documented in `docs/FACE_P0_THRESHOLD_REVIEW.md`.

## Remaining pre-pilot requirement

The remaining blocker is **physical/device verification**, not another algorithm rewrite. The branch must be exercised on the target browsers/devices with open-mouth and closed-mouth smiles, pose/distance deviations, hand/pixel occlusion, retries, early-safety flow and developer-gated hosted Supabase collection. See `docs/FACE_JSSF_PILOT_VERIFICATION.md`.

## P0-F exit condition

P0-F data-path audit exit criteria are met:
- runtime + full replay threshold payload is covered by contract tests,
- the analysis flattening helper passes,
- staging ingest matches branch contract 0.9.0,
- retention/withdrawal regression remains green,
- behavioral blockers identified by the audit are closed in code,
- and clinical-validation claims remain explicitly out of scope.
