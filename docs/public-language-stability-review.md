# Public language continuity / Speech investigation

## Scope and cause

Based on Result integration `03138c0c32a550d616eea2a5bc65c7eb70f2aa28`.
Home's JSSF entry uses `quickstroke_public_home_language`; module/Result pickers previously updated only `fast_lang`. Returning Home could restore an older explicit choice or initial English. A BFCache-restored Home can also retain its earlier DOM.

The existing picker registry now records successful explicit Public module/Result selections in the existing Home preference key. Original handlers run synchronously before awaiting their completion, preserving the user-gesture boundary. Direct initialization does not record a preference. Failed/blocked/fallback language changes do not record the requested language. Home's existing explicit-selection policy is unchanged. A persisted `pageshow` refreshes stale JSSF Public Home language without recording a new choice. No new key or persistent architecture, no localStorage policy changes.

Public checks fail closed without a resolved Public mode; staff, Research, Dev and Consent are excluded. No module source, clinical/audio handlers, translation resources, Service Worker or research persistence changed.

## Verification

Passed: `public-language-continuity.mjs`, `public-event-language.mjs`, `public-home-redesign.mjs`, `public-result-ui.mjs`, `run-tests.mjs` (23/23), `public-sticky-regression.mjs`, `public-flow-audio-audit.mjs`, `public-ios-speaker-first.mjs`, `public-tts-uat.mjs`, `voice-cue-flow.mjs`, and inline-script syntax checks.

Local Chromium 154: actual Home and all four destination-page pickers; TH/EN/JA; return, reload, back/forward; ordinary non-event default; Research Home exclusion. The Face test server replaces only its automatic camera/model bootstrap with locale initialization in the served response, leaving production files unchanged. Speech synthesis is stubbed; no capture is started. External requests and Service Workers are blocked. BFCache restoration is covered with a synthetic persisted pageshow event, not proof of actual browser cache admission.

Run browser regression with installed Playwright, or set `PLAYWRIGHT_MODULE` to its module path and `CHROMIUM_PATH` to the browser binary. No live-service or participant tests were performed. No failures in the listed suites; this is not a claim that every repository suite or real browser is verified.

Device UAT: iPhone Safari / Android Chrome and Samsung Internet, actual BFCache, PWA/online cached upgrades, all three languages, blocked mid-measurement picker behavior, module retries and returning Home. Existing cached `languages.js` delivery still follows the unchanged Service Worker policy; a fresh online reload/update may be necessary. No cache migration is introduced.

## Speech countdown: evidence only; behavior unchanged

Inspected `speech-test.html` countdown dispatch, `playPublicIosUnifiedCountdown`, `playPublicTtsCountdownDigit`, `playIosAsrOnlyCount`, `playVisualCountdownBeep`, diagnostic queuing, and `js/thai-recorded-audio.js` routing.

- Public iOS speaker-first uses one spoken utterance, visual fallback timers and boundary callbacks; phase/token guards can cancel obsolete work. It has a bounded completion wait and reports no-start, timeout, error or exception. Visual countdown completion alone does not prove audible playback.
- Ordinary Android Public does not invoke spoken-digit playback by default in the dispatch loop. The opt-in Public TTS trial and consented Android Research have different routes. This is a confirmed mode/platform distinction, not proof of the reported intermittent incident.
- Per-digit trial playback can use recorded Thai or native speech, bounded waits and fallbacks. The recorded helper also selects by language, platform, voice availability and existing mode policy.
- Technical codes include `PUBLIC_IOS_UNIFIED_COUNTDOWN_NO_START`, `_TIMEOUT`, `_ERROR`, `_EXCEPTION`, `PUBLIC_TTS_COUNTDOWN_UNAVAILABLE_1/2/3`, and `ANDROID_JSSF_COUNTDOWN_AUDIO_UNAVAILABLE`. Diagnostic upload requires `QuickStrokeJssfRemote.canSync() === true`; absence of a remote event is not proof of audio success. No live research records were queried or created.
- No affected-device diagnostic trace or recording was available. Existing static/contract audio suites pass; they cannot establish physical audibility or a runtime root cause.

Unconfirmed hypotheses: browser voice readiness, audio routing/interruption/Bluetooth or volume, gesture activation, retry cancellation, differing trial/mode configuration. None justifies a timing or lifecycle change yet.

To isolate: record exact commit/device/OS/browser/locale/mode/trial flags, first attempt versus retry, output route and whether visuals continue; capture existing console/technical diagnostics with appropriate authorization. Reproduce without enrolling research volunteers. Any proposed microphone/TTS/ASR timing or lifecycle fix requires separate review. Speech is unchanged in this branch.
