# Speech Dev control placement correction

Baseline: `1e83ea333ac8b0776e5664dea8c0c36ca1c3feec`, Draft PR #131.

The previous correction confused the Technical Data Show/Hide control with the existing Speech Debug and Copy Log buttons. It collapsed the data and moved Show/Hide to the top-right. This correction restores visible-by-default Technical Data and its ordinary in-flow manual Show/Hide control.

Only eligible Dev / engineering_only Speech creates the new presentation group. Existing `#debug-toggle` and `#dev-log-tools` (including `#dev-copy-log` and its feedback) are moved, not cloned, to a compact right-aligned group at the bottom of Technical Data. At enlarged text the group wraps. It stays in normal page flow and scrolls, rather than using a fixed viewport layer that could cover countdown, instructions, transcript, results, Retry or browser keyboard. Existing `#debug-box` expands below it in flow with bounded internal scrolling. Safe-area padding and 48px minimum button targets are retained. The original state-driven availability of Copy Log remains: it appears when an actual completed log is available. Debug remains reachable at completion; its original toggle action is preserved.

The pre-existing auxiliary bug/audio controls remain in their original Developer tools disclosure; no new logging or diagnostics are introduced. All original handlers and log-bundle construction/export remain unchanged. Manual Show/Hide affects Technical Data only, not these controls. Mode teardown restores original DOM parents.

Runtime changes are limited to `js/technical-demo.js` and the Speech-only helper URL (`?v=20261031-demo-v4`). Home, Face, Arm, Result, mode helpers, locales, recordings and SW v108 are unchanged. SW's existing runtime cache stores the new helper after an online visit; a returning offline installation must first load the update online.

## Validation

- Exact reversible presentation-only fixture against the baseline; unchanged measurement, recognition callbacks, Retry/audio/countdown/scoring/navigation and values.
- TH/EN/JA × 320/360/390/430px × normal/200% text: initial data visible, no automatic collapse, one of each original control, 48px targets, no horizontal overflow, no collision with essential Speech content during recording and completion, actual Debug toggle, actual Copy Log output, keyboard Show/Hide, mode isolation.
- Existing Demo live-binding, Face scalar, Speech first-attempt + three-Retry callback replay, core/source, Home parity, Public/Research and offline-after-online suites remain required. No live participant data, remote submission, emergency calls, microphone or camera acquisition is used by synthetic tests.
- Screenshots use actual application DOM with synthetic Speech completion data in local Chromium. They do not verify physical iOS microphone, audio, Safari viewport chrome or real ASR.

## Owner device UAT

After separate Preview authorization, open a fresh engineering-only Dev session. Check initial Technical Data visibility; scroll to bottom-right Debug/Copy Log group. Complete one real Speech attempt, then three manual Retries (immediate and delayed). Confirm actual transcript/status and Copy Log, open/close Debug and Show/Hide, check 320–430px portrait, TH/EN/JA and 200% text with Safari safe areas/toolbar. Confirm no controls obscure essential content; scrolling is intentional. Verify ordinary Public/Research do not gain the group. No real emergency calls or Research submissions.

No deployment, merge, tag or Production change is part of this correction.

## Visual evidence

[Before/after comparison](ui-reviews/technical-demo-speech-controls-correction/comparison.png) shows default and completed states at 390px, captured at 2× resolution and resampled for the contact sheet. Before is exact commit `1e83ea3`; after is this correction. The completion fixture has no actual microphone or ASR session, so unavailable hardware indicators are expected, not device-test findings.
