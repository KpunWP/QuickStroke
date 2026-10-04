# QuickStroke Threshold Evidence Matrix — 2026-10-04

## Purpose

This document classifies the current QuickStroke Face, Arm, and Speech thresholds by role and evidence level. It is intended for JSSF pre-pilot interpretation and future validation planning.

It does **not** claim that project-specific numeric thresholds are clinically validated stroke cutoffs.

Status vocabulary:
- **KEEP** — retain for the current pilot.
- **KEEP + VALIDATE** — retain for the pilot, but validate against an appropriate reference dataset before any clinical interpretation.
- **ENGINEERING / QUALITY ONLY** — technical or usability parameter; do not present as a stroke cutoff.
- **RESEARCH ONLY** — record for analysis but do not use in the screening observation.
- **KNOWN LIMITATION** — validity issue requiring explicit disclosure and future study.

## External evidence anchors

1. NIH Stroke Scale (NINDS): arm drift is judged over 10 seconds; facial palsy is based on movement/asymmetry; dysarthria is assessed from speech articulation/clarity.
   https://www.ninds.nih.gov/sites/default/files/migrate-documents/nih_stroke_scale_booklet_508c.pdf

2. Shin et al. (2012), iPronator: handheld accelerometer measurements objectively separated acute ischemic stroke patients with mild arm weakness from healthy controls, but the devices were attached to the forearms and the study did not establish QuickStroke's holding-specific cutoff.
   https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0041544

3. Mitchell et al. (2025), systematic review of post-stroke dysarthria measurement: intelligibility is a core outcome; evidence quality for many instruments remains limited.
   https://pubmed.ncbi.nlm.nih.gov/40409971/

## Face

| Parameter | Current value | Role | Evidence interpretation | Pilot status |
|---|---:|---|---|---|
| weakSideRatioBad | 0.45 | active decision threshold | Project-specific normalized weak/strong smile-rise ratio. Dynamic facial asymmetry is clinically relevant, but no external source validates 0.45 for this exact metric. | KEEP + VALIDATE |
| weakSideRatioShadow | 0.30 | research-only comparison | Does not change the result; useful for retrospective sensitivity comparison. | RESEARCH ONLY |
| smileAsymWarn | 0.22 | active severity band | Project-specific normalized asymmetry; internally consistent with stronger asymmetry producing higher concern. | KEEP + VALIDATE |
| smileAsymBad | 0.32 | active severity band | Same limitation as above; not a published stroke cutoff. | KEEP + VALIDATE |
| restAsymCritical | 0.30 | can force bad result | Resting facial asymmetry is clinically meaningful, but this numeric threshold is project-specific. Because it can independently force an alert, it is a high-priority future validation target. | KEEP + VALIDATE, high priority |
| maxAllowedYaw | 28° | pose quality gate | Limits geometric distortion from non-frontal pose. | KEEP / QUALITY |
| maxAllowedPitch | 24° | pose quality gate | Limits geometric distortion from non-frontal pose. | KEEP / QUALITY |
| maxAllowedRoll | 20° | pose quality gate | Limits rotation-induced landmark asymmetry. | KEEP / QUALITY |
| minValidSmileFrames | 2 | measurement-quality | Prevents classification from too little smile evidence. | ENGINEERING / QUALITY ONLY |
| minVisibleMouthFrames | 5 | measurement-quality | Prevents classification when the mouth is not sufficiently visible. | ENGINEERING / QUALITY ONLY |
| minMouthVisibilityScore | 0.052 | visibility heuristic | Model/project-specific image-quality heuristic. | ENGINEERING / QUALITY ONLY |
| minMouthDarkRatio | 0.003 | visibility heuristic | Model/project-specific image-quality heuristic. | ENGINEERING / QUALITY ONLY |
| minMouthCentralDarkRatio | 0.002 | visibility heuristic | Model/project-specific image-quality heuristic. | ENGINEERING / QUALITY ONLY |
| minMouthLineScore | 0.010 | visibility heuristic | Model/project-specific image-quality heuristic. | ENGINEERING / QUALITY ONLY |
| handMouthOverlapMin | 0.08 | occlusion heuristic | Detects likely occlusion; not a clinical cutoff. | ENGINEERING / QUALITY ONLY |
| smileDetectMin | 0.030 | smile-evidence gate | MediaPipe/project-specific signal gate. | ENGINEERING / QUALITY ONLY |
| smileDetectSide | 0.045 | smile-evidence gate | MediaPipe/project-specific signal gate. | ENGINEERING / QUALITY ONLY |
| smileValidStrength | 0.020 | smile-evidence gate | MediaPipe/project-specific signal gate. | ENGINEERING / QUALITY ONLY |
| realMoveMin | 0.0018 | motion gate | Prevents near-zero landmark noise being interpreted as movement. | ENGINEERING / QUALITY ONLY |
| closedSmileRiseMin | 0.0018 | geometry support | Project-specific geometry gate. | ENGINEERING / QUALITY ONLY |
| smileRealMin | 0.018 | final smile validity | Prevents a weak/no-smile attempt being classified as facial weakness. | ENGINEERING / QUALITY ONLY |
| minValidSmileRatio | 0.05 | quality gate | Minimum valid-frame fraction. | ENGINEERING / QUALITY ONLY |

### Face conclusion

No external evidence currently justifies replacing 0.45, 0.22, 0.32, or 0.30 with a different exact value. Changing them before the pilot would substitute one unvalidated number for another.

The pilot should therefore preserve the thresholds and collect continuous metrics for later analysis. Clinical threshold optimization requires a reference cohort with clinician-rated facial weakness.

## Arm

| Parameter | Current value | Role | Evidence interpretation | Pilot status |
|---|---:|---|---|---|
| measureSec | 10 s | clinical-proxy timing | Directly aligned with NIHSS arm-drift timing. | KEEP |
| normalDriftMaxDeg | 5° | measurement threshold | Conservative dead-zone for small movement/noise; not an NIHSS cutoff. | KEEP + VALIDATE |
| driftFailDeg | 10° | candidate drift threshold | iPronator supports quantitative arm-drift measurement and shows substantially greater drift in stroke than controls, but the device placement differs from QuickStroke. | KEEP + VALIDATE |
| 5–<10° band | implicit | retest/uncertain zone | Avoids forcing a binary result near the boundary. | KEEP |
| wristRatioThr | 0.20 | motion-pattern classifier | Project-specific attempt to distinguish arm drop from wrist/device rotation. No directly matching published cutoff identified. | ENGINEERING / HEURISTIC |
| dropZMin | 0.04 | motion-pattern classifier | Same limitation as wristRatioThr. | ENGINEERING / HEURISTIC |
| thresholdAlertHoldMs | 600 ms | debounce | Prevents transient threshold crossing from becoming a final movement classification. | ENGINEERING / QUALITY ONLY |
| stableAngleDeg | 2.5° | calibration stability | Baseline-quality gate. | ENGINEERING / QUALITY ONLY |
| stableWindow / stableHold | 20 / 25 | calibration stability | Sensor-processing parameters. | ENGINEERING / QUALITY ONLY |
| flatZThr | 0.90 | posture validity | Rejects flat-device configurations incompatible with the measurement model. | ENGINEERING / QUALITY ONLY |
| portraitYMin | 0.55 | posture validity | Confirms approximately upright portrait posture. | ENGINEERING / QUALITY ONLY |
| preMeasureMaxDeltaDeg | 5° | readiness | Requires posture to remain close to accepted baseline before measurement begins. | ENGINEERING / QUALITY ONLY |
| movedFromRestMinDeg | 8° | readiness research | Currently not enforced; useful as a research observation. | RESEARCH / NON-ENFORCED |
| sensorGapThresholdMs | 250 ms | data-quality | Detects gaps in sensor sampling. | ENGINEERING / QUALITY ONLY |
| lpf | 0.15 | signal processing | Noise filtering coefficient, not a clinical cutoff. | ENGINEERING / QUALITY ONLY |

### Arm laterality limitation

The current system can verify sensor freshness, device orientation, stability, and whether the user explicitly confirmed the requested arm. It cannot independently verify that the phone is physically held in that requested hand.

Current telemetry explicitly records:

`phoneFacingExpectedSide = "not_sensor_verifiable"`

The classifier uses angular drift magnitude and absolute X/Z components:

- `dx = abs(delta.x)`
- `dz = abs(delta.z)`

Therefore the principal drift magnitude is not inherently tied to the named left/right side.

A controlled engineering experiment on 2026-10-04 tested four conditions in sequence:

| UI target | Actual hand used | Final class | Final driftMaxDeg | peakRatioZX |
|---|---|---|---:|---:|
| left | left | possible_arm_drift | 15.671 | 0.275 |
| right | right | possible_arm_drift | 14.762 | 0.244 |
| left | right | possible_arm_drift | 12.564 | 0.272 |
| right | left | possible_arm_drift | 13.734 | 0.270 |

The right/right control condition also produced internal retries (wrist_movement and uncertain) before the final successful attempt, demonstrating natural execution variability.

Interpretation:
- Cross-hand use did **not** prevent deliberate arm drift from being detected in this small engineering test.
- It does **not** establish hand invariance statistically.
- If the participant holds the phone in the wrong hand, the stored left/right label can be wrong even when drift magnitude is detected.
- Laterality is therefore **participant-confirmed, not sensor-verified**.

Potential camera/gyroscope verification was considered. It is deferred for the JSSF pilot because it adds permission, technical, or interaction complexity to an already demanding self-administered task. The pilot should measure usability/error patterns before adding this burden.

Status: **KNOWN LIMITATION — disclose and monitor; no threshold change before pilot.**

## Speech

| Parameter | Current value | Role | Evidence interpretation | Pilot status |
|---|---:|---|---|---|
| exact accepted phrase | exact match = no alert | active observation rule | Repeating a standard phrase is consistent with FAST-style speech assessment, but browser ASR is not equivalent to clinician-rated articulation/dysarthria. | KEEP + VALIDATE |
| normalized similarity | continuous | research metric | Useful for later analysis; no validated stroke-specific cutoff for this browser-ASR metric. | RESEARCH ONLY |
| rateMinTranscriptCoverage | 0.60 | reliability gate | Technical completeness threshold. | ENGINEERING / QUALITY ONLY |
| normalMin / normalMax | 2.5–6.0 units/s | exploratory rate reference | Browser timing showed platform-dependent bias in QuickStroke pilot testing. | RESEARCH ONLY |
| minSnrDb / snrWarnDb | 10 dB | quality warning | Audio-quality signal, not a stroke cutoff. | ENGINEERING / QUALITY ONLY |
| flatnessMax | 0.78 | noise-quality | Technical acoustic-quality heuristic. | ENGINEERING / QUALITY ONLY |
| minSpeechDurationSec | 0.6 s | validity | Rejects implausibly short measurement windows. | ENGINEERING / QUALITY ONLY |
| minEnergyFrames | 10 | validity/quality | Technical VAD/acoustic sampling threshold. | ENGINEERING / QUALITY ONLY |
| ASR/VAD preroll, hangover and timing values | multiple | signal processing | Timing implementation parameters, not clinical thresholds. | ENGINEERING / RESEARCH |
| speech rate decision use | disabled | policy | Supported by QuickStroke's own cross-platform timing evidence; rate remains exploratory only. | KEEP |

### Speech conclusion

The current phrase-first, rate-research-only architecture should be retained for JSSF. Future clinical validation should compare ASR-derived phrase features against blinded human/SLP ratings of intelligibility and dysarthria rather than assuming transcript correctness alone excludes dysarthria.

## Pre-pilot evidence from QuickStroke

Engineering/preflight data should **not** be interpreted as diagnostic validation. Its useful role is to reveal reliability, false-alert candidates, invalid attempts, retries, and device/browser effects.

Observed preflight event counts include:
- Face: valid/no-alert attempts plus a smaller number of invalid/not-evaluable attempts; no evidence here is sufficient to estimate clinical sensitivity.
- Arm: predominantly valid/no-alert attempts, deliberate abnormal testing, and occasional invalid/retry attempts.
- Speech: substantial earlier invalid/attention observations across changing engineering versions; these are not suitable as participant outcome data and are correctly separated from the JSSF pilot cohort.

All pre-freeze sessions are marked `engineering_preflight`.

## Decision before JSSF

**No current Face/Arm/Speech numeric threshold should be changed solely on the evidence available before JSSF.**

Reason:
1. Some thresholds are directly linked to established examination structure (for example Arm 10 seconds).
2. Some have supporting measurement precedent but not a directly transferable cutoff (for example Arm drift degrees).
3. Many are explicitly technical heuristics rather than clinical thresholds.
4. There is no patient/reference cohort yet that can establish sensitivity, specificity, ROC-optimal cutoffs, or calibration.
5. Replacing project-specific thresholds with different unsupported numbers would create false precision.

Current status:
- Engineering readiness: PASS.
- Pre-pilot threshold review: PASS with documented limitations.
- Clinical threshold validation: NOT ESTABLISHED.

## Post-pilot validation plan

JSSF/community data can support:
- invalid and retry rates,
- normal-population metric distributions,
- device/browser effects,
- usability/comprehension,
- repeatability,
- candidate false-alert rates.

It cannot establish:
- stroke sensitivity,
- stroke specificity against a clinical reference,
- optimal diagnostic cutoffs.

Those require a future appropriately governed clinical/reference cohort.
