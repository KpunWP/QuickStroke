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

Face uses an unused edge strip and hides redundant old technical/status/progress rows in the gated Demo only. The central 28–74% subject region and visible instructions/countdowns/actions are exclusion zones. The values scroll within a clear edge slot when needed, and Show/Hide follows the owner's choice. If no slot can safely fit the control, the dock is temporarily hidden without losing that choice. This prioritizes the participant and instructions while keeping each technical metric reachable at enlarged text/small viewports. Actual face position and Safari toolbar behaviour still require device acceptance.

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

Dynamic isolation: disabling Dev even while data is hidden disposes the panel/styles and restores original legacy control parents. Re-enable in a fresh document, consistent with existing module-level Dev initialization.

## Speech recognition-status correction

Physical iPhone report: the Dev Recognition field stayed Not active despite usable browser transcripts. Two confirmed binding defects exist in the reviewed source:

1. The field uses callback evidence only in RECORDING. DONE falls back to recognitionStarted, which original cleanup resets to false. A successful result is therefore overwritten with Not active; a lifecycle completed between display ticks can be missed entirely. speechResult did not advance the recognition display.
2. Manual Retry calls beginSpeechModuleRun and resets speechAttemptNo to zero. A subsequent attempt is 1 again. An attempt-number-only display cache cannot reliably distinguish these runs if it misses the short reset phase.

The exact physical Safari event chronology is not available; this patch corrects the demonstrated presentation defects without claiming to fix Safari ASR/Retry behaviour.

Only js/technical-demo.js presentation logic and one read-only adapter property change at runtime: run:speechModuleStartedAtMs. Existing ASR callback bodies, acquisition, scoring, timers, audio, Retry dispatch and accepted phrases are byte-for-byte unchanged from 87a2211e97a0c17e561f22852eb1c83fd422ed6a. The existing run timestamp is used in memory only, never displayed, stored or uploaded. Original run/attempt values remain unchanged.

| Display | Required existing evidence |
|---|---|
| — | No supported ASR event yet; preparation/reset or ended without output |
| Ready | Actual engine onstart; not permission for the participant to speak |
| Listening | Actual onaudiostart, before a transcript is emitted |
| Recognizing | Current-run onresult supplied nonempty browser output |
| Complete | Terminal module state plus current-run browser transcript; not a phrase-match or medical conclusion |
| Unavailable | Unsupported API, current ASR error, or terminal state without browser output |

Run + attempt changes and existing preparation/retry phases clear only the display cache. Complete is retained after original shutdown clears recognitionStarted. Transcripts and existing phrase-match labels remain separate and unchanged.

Focused test: tests/technical-demo-speech-status.cjs invokes the ORIGINAL beginSpeechRecognition callbacks and ORIGINAL Start/Retry UI dispatch with synthetic acquisition/evaluation boundaries. It covers a first attempt plus three manual retries under both desktop and iPhone user agents, accepted variant/mismatch, rapid event sequences between UI ticks, permission/network/capture errors, no API, zero media requests and Public/Research isolation. Chromium with an iPhone user agent is not real Safari. Existing Speech/core/Dev regression suites remain required. The test freezes the entire Speech file against the prior head except the one adapter property.

Physical acceptance: on a separately authorized immutable protected Preview, choose Dev in a fresh engineering context. Run the first Speech attempt and three manual retries. Observe event-supported Ready/Listening/Recognizing where emitted, Complete after actual output, and correct transcript/match. Fast events may skip visible intermediate labels. Deny permission in a fresh context and verify Unavailable with no stale transcript; verify normal Public/Research have no new panel. Never submit Research data. The existing physical Speech Retry acquisition issue remains unresolved. No deployment is part of this correction.

## Face technical scalar visibility correction (2026-10-30)

Physical owner UAT: Face measurement/mesh passed, but technical numbers were not
visible. Arm and Speech Demo were accepted. The reproducible presentation defect
is `placeFace()` in `js/technical-demo.js`: the baseline full-width 48px toggle plus
expanded fields did not fit the protected edge slot. Its fallback set
`fields.hidden=true` and changed the button to Show Technical Data. The fit check
could repeat on reopening, and it never automatically restored the owner's prior
expanded preference. Existing tests asserted textContent, allowing hidden values
to pass. A visible mesh alone does not establish scalar availability.

Signal trace, unchanged: `face-test.html` computes eye-frame yaw/pitch/roll in
`computePose()` (2D estimates), computes existing blendshape smile asymmetry in
`onResults()`, then calls `faceSignal()` before the early return for BEFORE_START,
FACE_DONE and RETRYING. The existing adapter supplies camera/model, phase, paused
and frame-presence state. The helper retains only the original scalar allowlist;
existing freshness/loss rules still replace unavailable values with em dashes.
Smile ratio remains unavailable without the existing smile-evidence criterion.
No threshold or metric definition changes.

Small Face-only correction: compact the existing Show/Hide button to a 48px +/-
control beside the values; retain its full accessible name and expanded state.
Fit the existing values into the available protected edge slot with keyboard-
focusable vertical scrolling as necessary. Normal text uses compact columns;
enlarged text wraps to fewer columns without shrinking glyphs. Placement never
changes fields.hidden; only the explicit Show/Hide action does. If all safe space
is temporarily occupied, hide the dock, preserve user preference and restore it
when space returns. No camera/video/canvas/ancestor geometry changes. Arm/Speech
rendering, signal projection and controls are source-frozen against 4f846bcd.

Evidence: [synthetic before/after comparison](ui-reviews/technical-demo-face-values/comparison.png).
At 390x696 and 320x568/200%, the original `onResults()` supplies computed yaw -2.5°,
pitch 1.1°, roll 1.7° and smile ratio 0.20 from synthetic model outputs. The baseline
DOM contains those values but fields.hidden is true; the corrected build has
fields.hidden false and every metric is reachable. These are synthetic test
outputs, not participant measurements or physical Safari evidence.

Focused test `tests/technical-demo-face-values.cjs` runs the actual computePose,
onResults, scalar bridge and mesh renderer. It substitutes only synthetic model
outputs and the pixel-readback boundary. It covers 144 TH/EN/JA x 320/360/390/430 x
100/200% x startup/still-countdown/smile/completion/Retry cases; tracking loss,
reacquisition, expiry, valid/absent smile evidence, Show/Hide, fully occupied safe
space/recovery, viewport/geometry/overlay constraints and Public/Research gating.
The original Service Worker is unchanged: an old cached helper refreshes online;
the corrected helper then renders Face values offline after reload. The first
cached response may still be old until background refresh finishes. A new
immutable Preview hostname starts with a separate origin cache.

Real-device retest still required: authenticated clean Preview on iPhone portrait,
ready -> still/countdown -> smile -> completion -> Retry. Gently change pose and
verify values refresh; remove/reacquire the face, check unavailable values, try
Show/Hide and 200% text/scrolling. Confirm instructions, countdown, mesh and
completion actions remain clear. No live camera/model verification was performed
by the synthetic Chromium suite. No new Preview deployment in this change.

Local correction validation: 49 source/core suites (23/23 core), 144 focused Face
cases, 72 existing Demo layout cases / 12 isolation comparisons, and eight Speech
first/Retry callback attempts passed. The new focused suite also verifies online
helper-cache refresh followed by corrected offline rendering. All are synthetic
Chromium checks; physical iPhone acceptance remains pending for this correction.
