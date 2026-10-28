# Phase C.4 — Public Face Minimal Crystal

**Unresolved functional issue outside this change:** the owner reports that Speech Retry may fail to start measurement on a real iPhone. Investigation/repair is explicitly deferred. Speech is unchanged here and must not be described as fully validated or retry-safe. Previous synthetic Speech dispatch checks do not establish successful physical microphone/ASR restart.

## Baseline and design reference

Verified GitHub head of feat/public-speech-ui-phase-c3-20261025 at 17921ba4cab46575a08e844ae7082450c574834b. New branch feat/public-face-ui-phase-c4-20261025 starts there; no existing PR branch is changed.

Reference: design/public-modules-phase-b-20261024, bfa19d3bdc836efcc25ee91c67d07c7cbe04a5a2, design-reviews/public-modules/exports/face-minimal/ and FACE-MINIMAL.md. The later Minimal Full-Screen Crystal design supersedes the card/glass-heavy Face proposals.

Brief: live camera dominates; restrained functional glass; one existing instruction; existing countdown centered below the face; no dashboard/status mosaics or numeric Public metrics; accessible existing actions, original TH/EN/JA copy and all urgent/error messages. No new translation labels or clinical claims.

## Actual state/control inventory

| Existing phase/condition | Original surfaces/handlers | Public presentation |
| --- | --- | --- |
| BEFORE_START / locale loading/failure | bootstrapFaceTest, switchFaceLang, status-msg | Existing loader/failure message; no new recovery flow |
| BEFORE_START / camera/model readiness | startCamera/loadModel/initCamera | Existing permission helper, readiness messages, Start availability |
| BEFORE_START / ready | setUI, start-btn click listener | Unobstructed preview, compact language rail, one Start bubble |
| Face missing | no-face-banner and pose-warn-msg, onResults | Existing no-face warning; suppress simultaneous inapplicable alignment prompt only while this warning is visible |
| RESTING_PHASE / alignment and neutral countdown | setUI, showCenterCountdown, calibrationTick | One edge instruction; original digits centered in lower edge band; original pauses/debounce/timeout unchanged |
| ACTION_PHASE / smile guidance | startActionPhase, showSmilePrompt | Existing short smile prompt in upper edge band |
| ACTION_WAIT_SMILE / actual acquisition | onResults / continuous smile window | Camera remains dominant; original capture countdown remains visible whenever engine requests it |
| Pose/occlusion/mouth failures | showPosePanel, resetSmileWindowToAction | Original guidance/warnings retained, not replaced by invented validity rules |
| RETRYING / automatic retry | finishInvalid, retryTimer | Existing retry notice; capped automatic retry unchanged |
| Evaluation | finishFace/saveAndShow, synchronous | No new “analyzing” phase, delay, spinner or classification |
| FACE_DONE / normal/review/abnormal | saveAndShow; score-label/score-threshold | Existing interpretation, no numeric Public score; original Continue and Retry near summary |
| FACE_DONE / unable or technical error | finalizeInvalidResult/saveTechnicalInvalid | Actual reason, model/camera/permission failure and recovery controls retained |
| Critical resting asymmetry | criticalFired safety flag / FL.critical | Original urgent message continues into result; no new dialer or urgent threshold |
| Legacy CRITICAL_ASYMMETRY / ABORTED labels | recognized by existing UI/idle guards | No new transition into these labels |
| Full / Individual / Result retry | addNavButton / decideFaceCompletionTarget / original flush handler | Full continues Arm; Individual continues Result; existing incomplete/result-retry destination policy unchanged |
| Home / language | goBackHome, switchFaceLang, shared existing picker | TH/EN/JA Public preference and JSSF English handoff retained |
| Research / Dev / explicit ?mesh | original landmark canvas, pose HUD, debug panel and log controls | All new CSS gated off; judge demonstration preserved |

## Protected boundary and geometry

Only Public-scoped CSS, its identical inline copy in face-test.html, and a small fail-closed mode/viewport gate are added. The gate has no media, storage, timer, observer or network operations. It excludes Research, Dev and any explicit mesh query. Public viewport permits native zoom; other modes keep their original meta policy.

All pre-existing inline scripts remain byte-for-byte frozen, including MediaPipe model loading, camera selection/constraints/play/cleanup, landmarks and asymmetry, pose/mouth/smile calculations, thresholds, countdown intervals, TTS, retry, persistence, session and navigation. No shared JS, language, config, Home, Result, Arm, Speech, Consent, Supabase or Service Worker changes.

No new CSS selector targets video, canvas or video-container; no object-fit, crop, mirroring, mask or processing dimensions are changed. Browser comparisons at 320/360/390/430px verify the same video rectangle, object-fit and mirror as baseline. Canvas/video rectangles remain identical during active states/results and enlarged text. The synthetic central protected region checks are an illustrative layout assumption, not a guarantee about a real participant's face position. Wide/landscape camera framing still needs device UAT.

## Overlay layout

Home remains accessible at an edge. TH/EN/JA is available before/after screening and hidden by existing active phase classes during capture, as in the reference. Redundant heading/progress/status mosaics and Public pose/debug metrics are hidden; original DOM updates remain. Instructions use the existing notice-state surface in the upper edge band. The original countdown is horizontally centered below the protected central facial area, with no added ring or timer. Start is a functional bottom bubble.

At enlarged text, the upper instruction region is scrollable rather than expanded across eyes/nose/mouth. Full messages remain in DOM and can be read by scrolling; normal short instructions fit without a stack of cards. Critical/error result messages have no max-height truncation. The numeric score remains hidden under the existing pilot policy, and Research/Dev technical information is untouched.

The real completed interpretation/reason appears in one glass surface, followed by original continuation (primary) and Retry (secondary), 12px apart from the summary. Result content can grow/scroll at large text. The existing separate active Reset icon remains legacy-hidden by its inherited CSS; its listener is unchanged. The visible completion Retry uses the original start-btn listener. A test invokes the legacy hidden Reset listener programmatically, not as a claim of visible/tappable availability.

## Deviations from mockup

- Keep Home during capture, preserving an existing exit. Do not add mockup-only actions or remove working handlers.
- Keep real capture countdown when the engine requests it, even if an illustrative mockup omits it.
- Use actual production messages, result wording and permission helper. No mockup-only emergency action, invented clearance statement, numeric score or altered classification.
- No new decorative alignment ellipse, because production guidance/pose gates take precedence and no new framing assumption is introduced.
- Long accessibility instructions can scroll within their safe edge region. Result content may scroll below the camera viewport. No capture geometry or font-size suppression is used to force everything into one screen.

## Verification method and remaining UAT

Public Face unit tests hash every original script; check Public/Research/Dev/mesh/unknown-mode isolation and viewport policy; validate atomic CSS and model asset presence; forbid acquisition-surface CSS. Core tests preserve clinical algorithms; audio/TTS/readiness/voice/Android and all accepted Public page contracts run too. These source/fixture checks are not real-camera model validation.

Browser server suppresses only automatic bootstrap in the served response, initializes the real locale loader and appends a test-only bridge into the module scope. Production source is unchanged. All external requests are blocked and getUserMedia rejects if reached; speech synthesis completion is stubbed. A drawn synthetic portrait is set as the existing video poster for review, never used as model input. Actual setUI/notice/countdown/result/invalid/technical helpers produce fixtures; Start/Retry handlers are exercised only to an explicit stubbed screening boundary. Navigation uses the real flush/target handler and an intercepted destination before downstream hardware.

Research pixels are compared with animations disabled identically in both screenshots. Dev/mesh camera geometry and original mesh drawing are exercised on synthetic normalized points. Fresh/returning offline checks use the actual unchanged Service Worker but the instrumented no-camera test response; they verify styling/locale delivery, not real offline inference. Inline CSS needs no new cache migration; a coherent old offline HTML stays old until online refresh.

Real-device UAT: iPhone Safari, Android Chrome/Samsung Internet, live face sizes/lighting/contrast, actual eye/nose/mouth placement and portrait/landscape framing, safe areas/browser bars, native OS text enlargement, scrolling long notices while holding the phone, VoiceOver/TalkBack, permission dialogs, model readiness/offline inference, actual countdown/capture/retry/foreground recovery/audio and navigation. No physical Face measurements were performed. Speech Retry remains unresolved and untouched.

## Validation notes

A legacy higher-specificity active-state rule could resurrect cleared “Press Start” text during capture. Public CSS now makes the existing single-notice classes authoritative; no engine text, state transitions or timing change. The original bilingual locale-load failure remains visible even if no notice class was initialized. The screenshot fixture uses CALIBRATION_SECONDS from production config (currently 3), not the mockup's illustrative 5.

A completion margin initially collapsed through the body and displaced the camera; establishing a Public block formatting context fixed the presentation. Final mobile baseline comparisons include video x/y/width/height/object-fit/mirror, so this regression is guarded. The Full/Individual fixtures explicitly initialize canonical session mode rather than depending on an incomplete tab context. Research screenshots disable animations in both versions to avoid timing-only pixel differences.

The synthetic central face-protection check covers portrait 320/360/390/430px at normal/200% root text with heights 568/800px. It does not certify real facial placement, landscape, cutouts or browser toolbar behavior. No orientation restriction or new camera framing policy is implemented.

The capture prompt assertion checks absence explicitly, not just geometry; the locale-load error assertion checks visibility explicitly. A follow-up specificity override handles legacy :not(:empty) rules without changing any notice functions. Targeted original-function replay covers eye-frame roll/translation/scale invariance and unused z, neutral-countdown pause/minimum-sample/readiness timeout, bounded automatic retry delay/cap, and retention of a critical resting finding after an unassessable smile. These synthetic contracts do not establish performance on real patient measurements.

Urgent active notices are a deliberate exception to the small routine instruction band: the existing dashboard pulse marker expands the warning region while preserving a separate lower countdown region. At enlarged text, urgent content can extend across the central camera area and scroll; safety guidance takes precedence over an unobstructed live view. No safety copy is shortened and no timer is paused or hidden. This exception and actual facial placement require physical UAT. An additional 24 critical-notice fixtures cover all languages/widths/text sizes; the complete CI matrix is 18 states × 3 × 4 × 2 = 432 cases.

## Results and review evidence

Core 23/23; selected Public/Face script freeze, model asset, original landmark/countdown/retry replay, Android/audio/TTS/readiness/voice, Home/Result/Arm/Speech source, language/event and isolated Consent-entry contracts all pass. The Consent suite uses its existing local mock; its expected active-session refusal log is not a new failure and no enrollment was performed against a service. Inline syntax and diff checks pass.

Chromium 154: main 408/408 fixtures plus 24/24 critical-notice fixtures, no horizontal overflow, split English words, small touch targets, forbidden overlaps, unexpected technical panels or page errors. Capture prompt absence and locale-error visibility are explicit assertions. The main portrait cases avoid the synthetic central face region; urgent active notices are the documented safety-priority exception. Completed summary/action gap is 12px. Full→Arm, Individual→Result, visible Start/Retry dispatch to the screening boundary, legacy hidden Reset dispatch, actual TH/EN/JA/Home language flow and fresh/old-cache offline delivery pass. Research pixels (animations disabled equally) and Dev/mesh geometry are preserved. Mobile video rectangle/object-fit/mirroring match baseline at all four widths. Separate JSSF English and all-Public-page back/forward/reload/language checks pass, with persisted BFCache simulated as previously documented.

Screenshot contact sheet and TH/EN/JA/320px-enlarged examples: docs/ui-reviews/public-face-phase-c4/. No generated JSON, bundled fonts or credentials are included.

No new failure remains in the executed selection. Previously documented broader repository baseline failures (whitespace-sensitive jssf-remote-staging and jssf-remote-sync-flow missing collection-phase fixture) were not changed or claimed fixed. Tests are not a full repository/real-device certification. Speech Retry remains the owner's unresolved, deferred real-iPhone functional issue.
