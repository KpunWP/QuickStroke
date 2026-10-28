# Phase C.3 — Public Speech UI

## Baseline and boundary

Source branch fix/public-arm-completion-layout-20261025 was verified on GitHub at a26c59fca07f6031c2083a34414bbf24eef2ef56 before creating feat/public-speech-ui-phase-c3-20261025. It includes Home #106, Result #108, language #110, Arm #109 and its accepted refinement #111. No existing source branch is modified.

Brief: calm clinical white/light blue, IBM Plex Sans Thai/Manrope and Japanese system fallbacks, clear task/phrase/countdown/status, one primary action, original copy, fluid widths and scroll access. No new Thai labels or translation edits. The English target remains the exact production string `The sky is blue today` (production stores no terminal punctuation). Never substitute “clear” for “blue”.

## Actual screen/state inventory

| Engine state / condition | Existing DOM and controls | Presentation |
| --- | --- | --- |
| Locale initialization / no saved locale | #lang-screen, selectLang; disabled action on load failure | Existing loader/landing/fallback behavior retained; top TH/EN/JA picker |
| IDLE / preparation | #hint-text, #word-target, #mic-circle; #action-btn → handleAction | Short instruction, exact target phrase, centered microphone, prominent Start |
| First-use disclosure / permissions | fast-permissions.js / ensureMicDisclosureBeforeFirstUse | Existing permission UI and native prompt, untouched |
| CALIBRATING / readiness / reconnecting | #hint-text/#transcript-box/#mic-icon; action disabled | Visible readiness information, fluid text; no new control |
| Noise warning | #noise-overlay with noiseMoveLocation / noiseMeasureAnyway | Scrollable modal, both original choices and copy retained |
| READY_CUE / countdown | .speech-countdown-active, .speech-countdown, #mic-icon digits | Existing 3–2–1 centered in its own reserved microphone area; phrase/instruction remain separate; original action/status hiding retained |
| RECORDING / listening | .recording/.speak-now, target, transcript, action → original manual stop | Target and listening messages readable; normal button availability retained |
| RECORDING / evaluation pending | #hint-text = analyzingPrompt, hourglass icon | Original pending UI, no new engine state or fake progress |
| RETRYING / automatic validity retry | Reconnection icon, retry reason in transcript; action disabled | Reason stays visible; no new timer or retry logic |
| DONE / valid phrase observation, no alert | #result-banner, #domain-summary, details toggle, #fast-nav-btn.show; Retry | Original interpretation first; existing View results and Retry follow content; no numerical scores added |
| DONE / review, limited quality or incomplete ASR | Same DOM plus exact engine wording/flags | Original distinction retained; no new success/failure categories |
| DONE / invalid / unavailable | finishSpeechInvalid; #rb-sub contains reason; Retry and Result | Permission, no voice, no recognized text, unsupported API, insufficient duration/energy, audio/microphone and interrupted messages retained |
| Interrupted / PAGE_HIDDEN | Existing finalization and invalid presentation | Original interrupted lifecycle and navigation unchanged |
| Details expanded | .result-details-open, transcript and #result-details-note | Existing toggle/aria-expanded and original disclosure retained |
| Research / Dev/judge | Existing diagnostics, log tools, technical DOM | All new CSS gated off; no telemetry, visibility or export changes |

Protected lifecycle inventory: selectLang/speechSwitchLang; handleAction (initial start/manual stop/retry); ensureMicDisclosureBeforeFirstUse; startRecording/startPublicIosRetryFromGesture; calibration/runLoop; playPublicIosUnifiedCountdown and other existing cue routes; ASR event handlers; evaluateSpeech/finishSpeechInvalid; automatic validity retries; handleFastFlow and its cleanup/flush/navigation; goSpeechHome/pagehide. All pre-existing inline script bytes, external script URLs, DOM IDs, attributes and handlers are unchanged.

## Implementation

Only a Public CSS layer and one fail-closed presentation gate are added to speech-test.html. The gate reads existing mode resolution, marks the root and removes user-scalable=no only in Public. It has no storage, event listener, media, request or timer operations. Unknown mode and Dev override keep the legacy presentation.

assets/public-speech.css is duplicated inline atomically, as with Arm. Existing HTML network-first/precache delivery brings styles offline without fetching a new uncached stylesheet; Service Worker and cache version remain unchanged. Old offline installations remain on coherent old HTML until an online update arrives. Offline ASR itself still depends on the existing browser/service capability; offline styling does not promise offline recognition. Fonts follow the existing delivery/fallback policy, without bundling new font files.

Legacy fixed shell/absolute positioning is replaced in Public with normal flow and safe-area padding. Countdown digits remain inside the original microphone container; no new countdown or playback. A stable microphone slot limits preparation/countdown/listening shifts. The decorative microphone is suppressed in DONE, without changing any updates to it. A valid completed observation (existing DONE + visible domain summary) hides only the stale preparation hint; invalid/readiness/error hints remain visible. Existing result body, warnings, target, details and permitted controls remain available. Primary continuation precedes Retry in the original DOM order.

The existing hidden pilot speed tile, metric bars and numerical score policies remain authoritative. No new unsupported speech-rate/voice-quality claims or clinical interpretation. Public colors/text contrast are adjusted for legibility; no state semantics change. No resizing of internal canvas dimensions or audio analysis.

## Differences from Phase B

The mockup is a visual reference, not behavior: retain actual phrase, original classification/copy, actual dynamic errors, first-use permission flow, stop/retry and details controls. Keep the existing microphone/status visuals rather than introduce mockup icons needing new assets. No new global safety panel is copied from the mockup; all existing Home disclaimer and actual context-specific messages remain. Actual automatic retry, browser microphone readiness and separate countdown/audio policies take precedence over simulated transitions. No Face or Speech audio investigation fix is attempted.

## Validation approach and limits

Tests freeze every pre-existing inline Speech script by SHA-256, validate Public/Research/Dev/unknown-mode gate and original viewport policy, check atomic CSS, and forbid changed pilot/diagnostic visibility. Core, ASR, timing, microphone timeout, device/browser contracts, Research contracts, audio/TTS/iOS speaker-first and voice-cue suites run alongside Home/Result/Arm/language regressions.

Browser tests use actual HTML, locale loaders, evaluateSpeech and finishSpeechInvalid with synthetic timing/energy/transcript fixtures for results; active capture phases are illustrative DOM/state fixtures. Native speech completion is stubbed. Media acquisition rejects if accidentally invoked; every external request is blocked. Original Start/Retry handlers are exercised only to explicitly stubbed disclosure/capture boundaries, never with real hardware. Result navigation uses original cleanup/flush handler and a locally intercepted destination. Tests check Public details and Home Individual→Speech entry plus language selection/return, Research/Dev baseline comparison and actual Service Worker first offline Speech visit.

Responsive matrix: TH/EN/JA × 320/360/390/430px × normal/200% root text × 14 states (336). Includes calibration, countdown, listening, evaluation, completion/review, automatic retry, permission, unavailable, timeout, retry failure, interruption and noise warning. Checks horizontal overflow, text bounds, English word fragmentation, touch targets, region overlap, pilot visibility and summary/action spacing. Screenshots are reset to page top for visual review; existing engine result scrollIntoView is unchanged. Enlarged text is simulated, not OS/browser certification.

No live-service requests, participant data, deployment or merge. Initial browser interaction caught a legacy header z-index intercepting Home; a Public-only stacking override fixes it. Existing result auto-scroll, timing and handlers are preserved.

## Physical UAT still required

Real iPhone Safari, Android Chrome and Samsung Internet; actual native text scaling/zoom, Thai tone marks and Japanese glyphs on device fonts, VoiceOver/TalkBack, landscape/short screens/browser bars/cutouts, permission sheets, real microphone/ASR routing, audible 3–2–1 and prompts, retry twice, foreground/background/interruptions and installed-PWA online update/offline relaunch. The intermittent countdown-audio incident remains unresolved and is not addressed by this UI change. Font fallbacks offline remain platform-dependent. No claim of device compatibility from Chromium tests.

## Verified results

All 18 selected Node suites passed (core 23/23 plus Speech/UI/ASR/timing/mic/device/Research/audio/TTS/voice, Arm/Result/Home/language regressions), alongside inline-script syntax and diff checks. Final Chromium 154: 336/336 layout cases, no horizontal overflow, text-bound failures, English split words, small targets, region overlaps, exposed pilot metrics or page errors. Valid completion's summary/action gap is 16px in every checked language/width/text scale; normal-size View results bottom ranges 577–651px across the tested widths/languages. Original navigation, details, Start/Retry boundaries and Home Individual entry passed. Research pixels and Dev styles remain baseline-equivalent with actual Dev diagnostics enabled. Fresh offline CSS and coherent old-cache/offline → online HTML upgrade → updated offline relaunch all passed.

No failures remain in the executed selection. Broader pre-existing baseline failures previously documented in the Result/Arm work (whitespace-sensitive jssf-remote-staging assertion; jssf-remote-sync-flow fixture missing collection phase) are not modified or claimed fixed. Not every repository test was rerun.

Confirmed UI defects fixed during validation: legacy header z-index intercepted Home taps; legacy title ellipsis clipped English at 320px/200%. Both are Public-only CSS corrections. A test-server missing root route initially stalled SW precache; correcting the fixture resolved it without app or SW changes.
