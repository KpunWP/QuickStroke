# Face P0 Final Threshold Review

Status: engineering/pre-pilot review for JSSF reliability/usability work. **None of these values are clinical cutoffs or evidence of clinical validation.**

## Active result / smile evidence
- weak-side ratio bad: 0.45
- blend asymmetry warn / bad: 0.22 / 0.32
- resting asymmetry high-weight evidence: 0.30
- absolute smile detection mean / unilateral side: 0.030 / 0.045
- valid smile strength: 0.020
- minimum absolute blend evidence: 0.018
- closed-mouth vertical rise: 0.0018
- relative closed-mouth delta start / valid: 0.020 / 0.012
- relative lateral displacement: 0.006
- mouth-width increase: 0.012
- relative-path persistence: 250 ms

## Research/shadow only
- weak-side ratio shadow: 0.30
- dynamic asymmetry candidate threshold: 0.22
- dynamic geometry minimum magnitude: 0.01
- paired median/P75/P90, duration and timing features do not alter the user-facing result.

## Baseline / pose / distance quality
- baseline minimum neutral-valid frames: 12
- neutral smile max: 0.08
- neutral mouth activity max: 0.20
- corner MAD max: 0.020
- eye-distance relative MAD max: 0.040
- measurement pose: yaw ±15°, pitch ±18°, roll ±15°
- rest safety pose: yaw ±12°, pitch ±15°, roll ±12°
- pose hysteresis: 3 bad frames / 8 good frames
- distance ideal band: 0.85–1.15 × baseline eye distance
- distance acceptable gate: 0.80–1.20 × baseline eye distance
- eye-distance ratio is a quality/confounder variable and is **not** used as a second geometry correction.

## Visibility / persistence / validity
- mouth visibility score: 0.052
- dark ratio / central dark ratio / line score: 0.003 / 0.002 / 0.010
- hand-mouth overlap: 0.08
- pixel-only visibility grace: 300 ms
- confirmed hand overlap: immediate reset path
- smile lost grace: 1400 ms
- minimum valid smile frames: 2
- minimum visible mouth frames: 5
- minimum valid smile ratio: 0.05
- overall wait for smile: 14 s
- 4 s smile measurement window remains unchanged
- baseline alignment timeout: 30 s
- maximum assessment attempts: 3

## Research collection timing
- Face derived telemetry sampling: 100 ms (~10 Hz)
- retry delay: 2500 ms
- smile-nudge minimum display: 2500 ms
- critical rest notice: 2000 ms

## Deprecated compatibility field
- `realMoveMin: 0.0018` remains in config only for backward compatibility. It is not referenced by the current Face algorithm and must not be interpreted as an active threshold.

## JSSF purpose
Use JSSF to estimate normal distributions, variability, false-positive behavior, device/browser effects, pose/distance effects, open/closed-mouth performance, and usability/retry/failure rates.

Do **not** derive clinical sensitivity, specificity, ROC cutoffs, diagnostic claims, or patient-facing clinical thresholds from JSSF. Those require a later patient/control study with independent ground truth.
