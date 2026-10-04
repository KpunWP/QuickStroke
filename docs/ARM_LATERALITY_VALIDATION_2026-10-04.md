# Arm Laterality and Wrong-Hand Validation Note — 2026-10-04

## Question

Can QuickStroke verify that a participant is physically holding the phone in the same hand as the arm currently requested by the UI?

## Current answer

**No.**

The current Arm readiness layer can verify:
- permission and sensor availability,
- fresh sensor samples,
- coordinate frame,
- portrait/upright posture,
- top-up orientation,
- baseline stability,
- explicit participant confirmation of the requested arm.

It cannot infer the physical hand holding the device. The implementation records:

`phoneFacingExpectedSide: "not_sensor_verifiable"`

and the confirmation method is user interaction rather than sensor-determined laterality.

## Why wrong-hand use may still produce a plausible drift result

The current movement classifier computes:
- total angular drift from the baseline gravity vector,
- `abs(deltaX)`,
- `abs(deltaZ)`,
- `ratioZX = abs(deltaZ) / max(abs(deltaX), 0.001)`.

Therefore direction signs that might distinguish left from right are intentionally discarded by the current classifier. The detector can still see a large movement even if the phone is in the opposite hand.

## Controlled engineering test

Source log:
`quickstroke-arm-sensor-2026-10-04T07-21-22-519Z.csv`

The test sequence was:
1. UI left / actual left hand.
2. UI right / actual right hand.
3. UI left / actual right hand.
4. UI right / actual left hand.

Successful final attempts:

| UI target | Actual hand | motion_class | driftMaxDeg | peakDeltaX | peakDeltaZ | peakRatioZX |
|---|---|---|---:|---:|---:|---:|
| left | left | possible_arm_drift | 15.671 | +0.249 | -0.068 | 0.275 |
| right | right | possible_arm_drift | 14.762 | -0.240 | -0.058 | 0.244 |
| left | right | possible_arm_drift | 12.564 | -0.205 | -0.056 | 0.272 |
| right | left | possible_arm_drift | 13.734 | +0.224 | -0.060 | 0.270 |

The right/right control required retries before the final successful attempt:
- 13.714° → wrist_movement
- 9.561° → uncertain
- 14.762° → possible_arm_drift

## Interpretation

This small engineering test suggests that the present drift-magnitude classifier can still recognize deliberate arm drift under wrong-hand use.

However:
- the UI-side label can be incorrect,
- the sample is too small to establish hand invariance,
- execution magnitude was not mechanically standardized,
- the wrist/drop classifier may still depend on holding biomechanics,
- the test does not demonstrate clinical validity.

The current limitation is therefore primarily **laterality-label validity / participant compliance**, not evidence that the drift magnitude detector necessarily fails when the wrong hand is used.

## Candidate future solutions

1. **User confirmation only (current approach)**
   - Lowest UX burden.
   - Cannot independently verify hand laterality.

2. **Directional gyroscope/orientation gesture**
   - Could generate a sign-specific handedness challenge.
   - Adds a new participant action and instruction burden.

3. **Front-camera + sensor fusion**
   - Could attempt passive laterality inference from body/camera geometry and natural movement.
   - Adds camera permission/privacy/technical complexity and may require changing the phone-facing convention.

4. **Natural-motion sensor fusion**
   - Attempt to infer handedness from the movement already made while raising the arm.
   - Attractive because it may add little UX burden, but requires dedicated validation.

## JSSF decision

Do not add a laterality-verification gesture or camera requirement before the current JSSF pilot.

Rationale:
- Arm self-administration is already instruction-heavy.
- Additional gestures or permissions may increase confusion, invalid attempts, and abandonment.
- The wrong-hand engineering test did not show catastrophic failure of drift detection.
- The pilot can provide evidence about real usability/compliance before adding complexity.

For JSSF reporting:

> Arm laterality is participant-confirmed and is not independently sensor-verified. The system verifies device posture and movement quality but cannot prove that the phone is physically held in the requested hand. A small engineering wrong-hand test showed that deliberate drift remained detectable, but this does not validate laterality or establish hand invariance.

Status: **KNOWN LIMITATION / FUTURE VALIDATION TARGET.**
