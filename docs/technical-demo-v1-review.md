# Technical Demo V1 — review, not release approval

Base: `82cf095eaf47581283cdf28b789d80a48fc90268` (verified main before branch creation).
Branch: `feat/technical-demo-v1-20261029`. No merge, deployment or release tag.

## Existing signal inventory

| Module | Existing source | Display projection / limits |
|---|---|---|
| Face mesh | `face-test.html`, `drawFaceMesh` and existing `drawFaceMesh(lm)` in `onResults` | Reuses exactly the original canvas, cover-crop mapping, mirror and model. No second renderer or inference engine. |
| Face pose | `computePose(lm)`; `yawDeg`, `pitchDeg`, `rollDeg` | Existing 2D-based technical estimates in degrees, not anatomical/clinical pose measurements. |
| Face smile | Existing `smileAsym`, normalized blendshape difference | Labelled Smile ratio, 0–1; unavailable when existing `smileTotal <= 0.05`. Not the final geometry/scoring result. No fabricated zero for absent evidence. |
| Face readiness | Existing `modelReady`, `isCameraRunning`, `sampledPoseValid`, `countdownPaused`, `noFaceCount` | Technical alignment only. Values expire after 1 second without a current frame. No new quality gate. |
| Arm | `tickMeasure`, `currentDrift`, `driftMax`, `arm`, `lastSensorSampleAt`, original freshness configuration and readiness flags | Existing smartphone orientation drift, not anatomical arm angle. Missing/stale/outside measurement values show —. |
| Arm graph | No previous graph | Bounded 60-point, 5 Hz presentation sampling of existing currentDrift. X: seconds since first observed measuring sample, capped at 10 s; Y: degrees, dynamic nonclinical range, at least 5°. The display clock can lag the true measurement start by up to one display tick. Never supplies sensor/calculation inputs. No points outside MEASURE. Resets on side/attempt change. |
| Speech target | Existing `T.target` | Original localized phrase, unchanged. |
| Speech transcript | Existing `bestTranscript` in current-run browser `recognition.onresult` | Only actual browser-emitted output; no placeholders, inferred text, interim generation or persisted transcript copy. |
| Speech mic/ASR | Existing track predicate and onstart/onaudiostart/onaudioend/onend callbacks; `lastAsrErrorCode` | Distinguishes requested recognition, observed ASR audio capture and a local track. A started recognition request alone is not proof of microphone capture. |
| Speech match | Existing `domain-phrase-status` after DONE | Existing accepted-variant result, not a new match/scoring algorithm or medical diagnosis. Pending until available. |

Source adapters are labelled `TECH DEMO` in each module. Every original byte is retained by an exact reverse-patch test. Face/Speech callback additions forward only scalars/text into the display helper, never control a module. Arm uses a read-only closure; no sensor listener added.

## Access and isolation

`js/dev-mode.js` reads `dev=1` or the existing tab Dev switch. This is a visibility/logging setting, **not authentication**. `js/app-mode.js:resolveMode()` prioritizes the active session snapshot; selecting Dev cannot convert an active Public/Research session.

New overlays require all of: enabled Dev switch, resolved `dev`, role `engineering_only`, and no Public/Research data-contract context. They do not set mode, clear snapshots or enroll anyone. No Public Home entry added. Public/Research documents load a no-op helper and gain no new DOM, style, timer or telemetry projection. Existing Dev logging/storage behaviour remains; this patch adds no storage/export/upload paths.

For owner device testing, request a separately authorized immutable **Vercel Authentication-protected Preview**. Use a fresh browser context; authenticate with the authorized Vercel account, then enter `index.html?dev=1` and start a new engineering session through the existing staff pathway. Confirm DEV MODE and engineering-only mode before testing. Existing module URLs `face-test.html?dev=1`, `arm-test.html?dev=1`, `speech-test.html?dev=1` work only when session mode permits Dev; they are not secure credentials or device-only access controls. Do not reuse a Research tab or bypass its recovery protections. No remote logging is introduced; browser Web Speech may still use its vendor's network service.

## Presentation

Existing test screens only. Dark readable teal/blue/purple compact panels; one Show/Hide control per module; no continuous animation. Existing developer logs stay secondary. Arm/Speech legacy log and recorded-audio test buttons are moved with their original handlers into a collapsed Developer tools disclosure; no audio code is changed. Face Mesh toggle is moved away from the language picker. Arm/Speech panels sit in the existing test content with a Dev-only scroll-safe content region. During Arm measurement the redundant legacy side-result row and numeric gauge are hidden in Demo, since the panel displays the real side/current/max; the original countdown becomes an in-flow sibling so it cannot cover the graph, and the old result-row padding reservation is removed only during Dev measurement. Illustration dimensions are untouched; Arm countdown/graph content may require scrolling on short screens, and simultaneous visibility of every original guide and metric is not promised; original instructions/countdowns/actions remain. No changes to Public layout or Face surfaces/ancestors.

Face uses an unused edge strip and hides redundant old technical/status/progress rows in the gated Demo only. The central 28–74% subject region and visible instructions/countdowns/actions are exclusion zones. If the panel cannot fit, its data collapses; if even the 48px toggle cannot safely fit, it is temporarily hidden. This intentionally prioritizes the participant and instructions over showing all technical data. At enlarged text/small viewports, use a taller device or Hide Technical Data during a crowded phase. Actual face position and Safari toolbar behaviour still require device acceptance.

## Offline

Service Worker and shell cache remain v108, byte-for-byte unchanged. New helper uses a versioned URL. The existing SW caches it on first online request; offline-after-use is tested. A never-online Demo resource is not precached: Technical Demo availability on a first offline visit is not promised. Existing Public offline HTML/inline styling remains intact. Browser ASR is not promised offline. For judging, load all module pages online and verify models before losing connectivity; do not fabricate measurements for missing hardware/service.

## Automated evidence

- Exact base-file restoration for three module files; unchanged Home/Result, configuration, mode/security/store/sync, locales, Thai audio and SW.
- Mode/role/context gate matrix; no new network, media, inference, storage or export APIs.
- Actual module closures with synthetic scalar/callback fixtures; absent/tracking lost, stale sensor, left/right trace reset, stop after MEASURE, actual ASR text, pending/match and Retry reset; Show/Hide preserves phase.
- Mobile 320/360/390/430, normal/200% text; no horizontal overflow, 48px toggle, Face camera/canvas geometry and protected overlays.
- Public/Research old/new layout pairs, including conflicting Dev switches.
- Existing source/core/module/navigation/audio/privacy regressions and original browser suites run separately.

Screenshots in `docs/ui-reviews/technical-demo-v1/` are synthetic scalar/portrait illustrations on actual application DOM. They are not physical camera, sensor, microphone, mesh accuracy or live ASR evidence. No synthetic fixture is shipped to the application.

## Physical-device gate / remaining limits

Use the same protected Preview on owner iPhone Safari and Android Chrome. Do not make emergency calls or submit Research records.

1. Fresh Dev context; confirm no Research context/enrollment. Public/Research fresh tabs must not show a Technical Data toggle.
2. Face: real mesh follows mirrored live image at normal/rotated phone positions; yaw/pitch/roll and smile ratio update only with tracking; loss gives —; guidance/countdown/Start/Retry remain reachable. Check cold entry separately from warm re-entry.
3. Arm: real permissions and missing/stale sensor; left then right for original 10 seconds; current/max/trace use the original measured drift; graph stops at end and resets per side/retry. Verify illustrations/countdowns; scroll when needed without covering actions.
4. Speech: real permission denied/unavailable ASR; target, actual interim/final transcript and mic/recognition status; accepted variants, pending/mismatch, three consecutive attempts. No fabricated transcript on an unavailable browser.
5. Show/Hide, enlarged text, short/landscape viewports, browser toolbar/safe areas; preserve camera aspect/mirroring and touch targets.
6. Full and Individual navigation, module Retry, language continuity; offline-after-online page/model warm-up. Offline Speech recognition may be unavailable.
7. Confirm no new network uploads, recording or persistence from this panel (existing engineering logs are separate).

Known Public issues remain unresolved: intermittent Face cold start/voice, iPhone Speech Retry/countdown audio, Arm illustration movement. Do not infer hardware success from Chromium. Presentation sampling and Face collision checks add small Dev-only overhead; measure responsiveness on the actual demo phone before acceptance.

## Local result ledger

- 49 source/core suites (including the new technical source suite) collected from the relevant workflows: passed (including 23/23 core cases).
- New technical source/privacy gate and 72 TH/EN/JA responsive synthetic cases + 12 Public/Research comparison pairs: passed.
- Existing Face browser (432 layouts), completion, startup, active/camera transitions; Arm browser/offline and completion; Speech browser; Result grid and final/offline; emergency browser: passed.
- Initial Face startup/active failures were stale **Dev pixel-identical** assertions. Those two assertions now retain Research pixel identity and all-mode camera geometry, and require the new Dev panel. Public pixel contracts, engine boundary hashes, privacy checks and navigation checks remain intact. The new Demo browser suite covers the intentionally changed Dev layer.
- GitHub CI: see the Draft PR check runs for the final commit. Physical-device tests have not been performed by this agent.

CI integration follow-up: optional display projections use `globalThis` so isolated Node callback replays remain no-ops without a browser. The browser fixture forwards PLAYWRIGHT_MODULE from the CI environment; no dependency is added to the application. These correct initial CI failures, not pre-existing baseline failures.
