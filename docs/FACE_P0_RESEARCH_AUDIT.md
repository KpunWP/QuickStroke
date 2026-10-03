# Face P0 Research Audit — JSSF nonclinical pilot

Status: **P0-A through P0-E implemented on `research/face-p0-data-contract-20261003`; P0-F data-path audit in progress.**

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

## Behavioral blockers still open after the data-path audit

These are intentionally **not** hidden by a green data-contract audit:

1. **Mouth visibility persistence** — `smileOcclusionResetMs` is still 120 ms. The agreed engineering direction is fast response for confirmed hand overlap but roughly 250–350 ms persistence/grace for pixel-only mouth-visibility loss.
2. **Reason taxonomy** — the current code still uses `MOUTH_NOT_VISIBLE`. Before pilot freeze, separate at least `HAND_OCCLUSION`, `MOUTH_VISIBILITY_LOW`, `HAND_MODEL_UNAVAILABLE`, and pixel-heuristic failure where technically distinguishable.
3. **Distance quality gate** — eye-distance ratio is already recorded and normalized geometry is available, but the candidate ideal ~0.85–1.15 / acceptable ~0.80–1.20 gate has not yet been activated.
4. **Early safety / inability path** — resting abnormal evidence is preserved when smile becomes unassessable, but the full UX still needs explicit review so a participant with obvious FAST signs is not forced through every module before the safety/emergency path.
5. **0–100 score interpretation** — remains a mathematical transform of asymmetry, not a validated clinical severity score; user-facing prominence should be reviewed.
6. **Final Face Threshold Review** — all current thresholds remain engineering/pre-pilot values and require JSSF reliability data before further tuning. Clinical thresholds require a later patient/control study.

## P0-F exit condition

P0-F data-path audit is complete when:
- the runtime + full replay threshold payload is covered by contract tests,
- the analysis flattening helper passes,
- staging ingest matches the branch contract,
- retention/withdrawal regression remains green,
- and the open behavioral blockers above remain explicitly tracked rather than silently treated as solved.
