# Face JSSF Pilot Verification Matrix

Purpose: final nonclinical usability/reliability verification before distributing a JSSF QR/link. This does **not** validate stroke diagnosis or clinical sensitivity/specificity.

## Devices / browsers
Run the matrix on at least:
- iPhone Safari (primary target)
- Android Chrome
- Desktop Chrome or Edge

Record browser/device family only at the coarse level already allowed by the research contract.

## Required scenarios

| Scenario | Procedure | Pass criteria | Research evidence to inspect |
|---|---|---|---|
| Neutral baseline | Face forward, neutral expression | baseline completes without symmetry requirement | median baseline, mean comparison, MAD/stability, neutral rejected frames |
| Resting asymmetry simulation | Intentionally lower one mouth corner while neutral | resting abnormal evidence is retained; early-safety action appears | rest asymmetry, tight rest-pose validity, critical flag |
| Open-mouth / teeth smile | Smile naturally showing teeth | absolute blendshape path starts 4 s window | startPath=absolute, valid frames, peak L/R |
| Closed-mouth smile | Smile with lips closed | relative path can start after persistence without lowering absolute threshold globally | baseline smile L/R, deltas, geometry support, startPath=relative |
| Geometry-only movement | Move mouth corners without blendshape-consistent smile if reproducible | geometry alone must not confirm start | relativeBlendEvidence=false or no confirmed smile |
| Unilateral strong smile | Emphasize one side | one strong side can start measurement; asymmetry remains measurable | peak L/R, paired dynamics, weak-side ratios |
| Yaw violation | Turn beyond ±15° | measurement pauses/retries; 3-frame debounce applies | raw yaw, poseValid, invalid/retry reason if timeout |
| Pitch violation | Move beyond ±18° | same | raw pitch |
| Roll violation | Tilt beyond ±15° | same | raw roll |
| Rest safety pose | During rest, exceed ~12/15/12 | high-weight rest abnormal must not fire outside tight gate | restSafetyPoseValid / raw pose |
| Too close | Move to >1.20× baseline eye distance | smile measurement blocked with guidance | eyeDistanceRatioFromBaseline, distanceAcceptable=false |
| Too far | Move to <0.80× baseline | same | same |
| Ideal distance | stay 0.85–1.15× | no distance warning | distanceIdeal=true |
| Hand over mouth | Cover mouth with hand | immediate smile-window reset | handMouthOverlap=true, hand reason |
| Brief pixel visibility loss | brief lighting/contrast loss under ~300 ms | no unnecessary reset | visibility components, persistence behavior |
| Sustained pixel visibility loss | >300 ms without hand | reset with visibility-specific reason | heuristic availability + visibility low/failure |
| Hand model unavailable/degraded | simulate/observe fallback if available | normal-volunteer pilot can continue with flag; no raw media | handModelAvailable=false, degradedMode/quality flags |
| Smile loss | stop smiling during window | 1400 ms grace before reset | smileConfirmed trajectory |
| Early safety exit | after resting critical evidence choose safety action | result page opens without requiring Arm/Speech first; urgent emergency CTA visible | EARLY_SAFETY_EXIT attempt + bad Face result |
| Continue after resting abnormal | do not choose early exit | smile research can continue voluntarily | rest abnormal + smile attempt in same run |
| Retry path | deliberately fail smile then retry | capped attempts, stable IDs/retry linkage | attempt sequence/retryOfAttemptId |
| Public/no-consent path | ordinary Public Mode | no research upload | no remote event |
| Developer-gated JSSF upload | approved synthetic JSSF developer flow | remote summary + samples arrive once/idempotently | face_research_attempt + face_research_samples |
| Withdrawal | enroll synthetic Study ID then withdraw | parent session and child events deleted; local capability cleared | zero remaining rows for session |
| Export | export synthetic remote JSON | flatten helper produces joined attempt/sample rows | `research/jssf-face-export.mjs` output |

## Closed-mouth / open-mouth comparison capture

For each device/browser, perform repeated open-mouth and closed-mouth smiles under similar pose and distance. Record:
- success/failure to start
- start path (absolute/relative)
- retries
- baseline Smile L/R
- delta Smile L/R
- vertical rise
- lateral displacement / width delta
- valid-frame ratio
- paired asymmetry median/P90
- onset and peak timing
- mouth visibility quality

Do not tune a clinical cutoff from this normal-volunteer pilot. Use the results to identify measurement bias, instability and engineering thresholds that cause unnecessary failure.

## Distance / normalization analysis

Use raw and normalized signed mouth displacement plus eye-distance ratio to test whether normalization reduces association with camera distance. Do not apply a second eye-distance correction in production logic unless later evidence demonstrates a specific residual bias.

## Release gate

Face JSSF pilot is ready for limited volunteer distribution only after:
1. all automated branch CI is green,
2. hosted staging ingestion/withdrawal is verified,
3. the device/browser matrix above has no unnecessary blocking defect,
4. closed-mouth flow is usable on target phones,
5. emergency/safety action remains available without protocol completion,
6. no raw media is present in exported/stored records,
7. consent text matches the telemetry actually collected.

Any clinical threshold, sensitivity, specificity, ROC analysis or patient-facing diagnostic claim remains out of scope until a later independently labelled patient/control study.
