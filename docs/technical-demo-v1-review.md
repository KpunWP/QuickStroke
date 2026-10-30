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

## Dev iPhone Retry: Phase A failure-stage diagnostic (2026-10-30)

Owner evidence: first Dev attempt passed; three manual Retries failed with No local
track / Unavailable. Public Retry previously passed physical testing. No exception,
mic operation stage, context resume result or ASR error was supplied. This does not
establish whether recovery, acquisition, context resume or recognition failed.
A capture-policy correction is therefore deferred pending physical stage evidence.

The new temporary observer is disabled unless all of the following hold:
explicit `speechRetryDebug=1`, iPhone/iPad/iPod UA, current engineering-only Dev
session, and successful empty same-origin POST to
`/api/speech-retry-debug-gate?speechRetryDebug=1`. Server requires Preview,
immutable request Host equal to VERCEL_URL, and a valid deployed SHA. Platform
Vercel Authentication must remain enabled; the flag and Dev mode are not security
credentials. Production cannot authorize this helper. Research/Public never make
the authorization request. No preview deployment is part of this change.

Once authorized, a collapsed diagnostic disclosure appears inside Technical Data.
It retains at most 160 allowlisted stage events in memory, with relative time,
phase, local track live/ended/none and muted boolean, AudioContext state, recognition
instance/request booleans, and allowlisted operation/error names. Unknown strings
are discarded. Dropped-event count is explicit. No scores, samples, recordings,
transcripts, device/session/participant IDs or raw URLs are collected. The empty
metadata authorization request is the only diagnostic network operation; reports
are never uploaded/persisted. Explicit Copy stage summary uses clipboard, with
selectable textarea fallback. Mode exit/pagehide clears memory and removes UI.

Additive hooks observe existing stage-code calls, existing bounded mic promise
outcomes, actual current-run ASR result/end, user Start/Retry and cleanup boundaries.
Original capture, context, recognition callbacks, delays, scoring, result handling,
audio, countdown and navigation remain unchanged after exact removal of the
inventoried observer blocks. No new sampling interval/timer or microphone request.
Synchronous scalar reads and bounded array work add small unquantified overhead;
this is not zero-overhead instrumentation and Safari performance must be checked.

Physical protocol (protected immutable Preview only after authorization):
1. Fresh engineering Dev Home, then Speech URL with `dev=1&speechRetryDebug=1`.
   Wait for “Speech Retry diagnostics · ready” BEFORE Start. If absent, stop;
   do not weaken the gate or switch to Public/Research for diagnostics.
2. Keep panel collapsed. First attempt, immediate manual Retry, second Retry,
   third Retry. Speak only when existing instructions permit. After each failure
   copy the stage summary, without sharing recognized text or legacy debug logs.
3. Reload a new Speech document and repeat with delayed Retry (e.g. 30 seconds).
4. Separately test microphone denial and reopening after browser permission repair.
5. Verify unchanged Public and Research paths independently. No research submission.

Interpretation: reuse probe rejection precedes rebuild; STEP_ERROR/TIMEOUT names
acquire_microphone/get_user_media vs audio_context_resume; START_ERROR records a
sanitized stage/name before cleanup; ASR_ENGINE_STARTED/AUDIO_STARTED/RESULT/ENDED
show actual callback boundaries. No ASR callback plus a startup failure is not an
unsupported ASR API. DONE/no transcript in the existing overlay is deliberately
coarse and is not a browser-error diagnosis. Healthy stage flow with a contradictory
overlay suggests a projection defect. A live track alone does not prove useful PCM.

No behavioral correction is included. After physical stage evidence, review a
coherent Dev-only full-release + gesture-bound retry policy and countdown handoff.
Do not call the Public helper without its full-release prerequisites. Public,
Research, Face/Arm, SW v108, locale resources and recordings are unchanged. Diagnostic
assets are online-only temporary tools; no offline availability claim. Existing
application offline-after-use behavior is separately regression-tested.

Local Phase A validation: 49 relevant source/core suites passed (23/23 core),
36 server authorization cases, 24 client isolation cases, exact observer-removal
source equality against 83e99b3, actual-document synthetic stage failures and
clipboard success/fallback, and first + three Retry callback replays per two
Chromium UA profiles. These are not physical microphone or Safari tests.
The broader optional `jssf-remote-sync-flow.mjs` fails its canSync assertion at
line 140; the identical baseline test and unchanged remote client reproduce it.
It is outside the required PR workflows and was not weakened. The optional live
HTTP smoke test failed DNS on its first health GET; no enrollment request was
reached. Live service tests are excluded from subsequent runs.
