# Public Speech — actual application visual evidence

[Contact sheet: preparation, countdown, listening, completion, automatic retry, permission error](contact-sheet.png)

All images use actual Speech HTML and locale loaders. Completed/review/unavailable screenshots call original evaluateSpeech/finishSpeechInvalid with synthetic local timing/energy/transcript data. Active capture phases are synthetic UI fixtures. No real microphone, ASR, TTS playback, participants or remote services. Chromium 154 at deviceScaleFactor 2; enlarged examples simulate 200% root text. Local official IBM Plex Sans Thai/Manrope files supply deterministic rendering, without changing production font delivery. Japanese uses installed CJK fallbacks; device fonts still require UAT.

| State | English 360px | Thai 360px | Japanese 360px |
| --- | --- | --- | --- |
| Preparation | [EN](en-preparation-360-1.png) | [TH](th-preparation-360-1.png) | [JA](ja-preparation-360-1.png) |
| Countdown | [EN](en-countdown-360-1.png) | [TH](th-countdown-360-1.png) | [JA](ja-countdown-360-1.png) |
| Completion | [EN](en-completion-360-1.png) | [TH](th-completion-360-1.png) | [JA](ja-completion-360-1.png) |
| Permission error | [EN](en-permission-360-1.png) | [TH](th-permission-360-1.png) | [JA](ja-permission-360-1.png) |

English: [calibration](en-calibration-360-1.png), [listening](en-listening-360-1.png), [evaluation](en-evaluation-360-1.png), [review](en-review-360-1.png), [automatic retry](en-retry-360-1.png), [unsupported API](en-unavailable-360-1.png), [unrecognized/timeout](en-timeout-360-1.png), [retry failure](en-retryFailure-360-1.png), [interrupted](en-interrupted-360-1.png), [noise warning](en-noise-360-1.png).

| 320px / 200% text | English | Thai | Japanese |
| --- | --- | --- | --- |
| Countdown | [EN](en-countdown-320-2.png) | [TH](th-countdown-320-2.png) | [JA](ja-countdown-320-2.png) |
| Completion | [EN](en-completion-320-2.png) | [TH](th-completion-320-2.png) | [JA](ja-completion-320-2.png) |
| Permission error | [EN](en-permission-320-2.png) | [TH](th-permission-320-2.png) | [JA](ja-permission-320-2.png) |

[State inventory, protected boundaries, mockup differences, test method and device-UAT requirements](../../public-speech-phase-c3.md).

The full automated matrix covers 320/360/390/430px, all three languages, normal/200% text and 14 states (336 cases). Screenshots above are selected review examples; raw geometry/fixtures JSON stays outside the repository. Capture resets scroll to the top for review; the existing engine's result auto-scroll is unchanged.
