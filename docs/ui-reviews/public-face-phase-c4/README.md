# Public Face — actual UI on a synthetic portrait

[Eight-state contact sheet](contact-sheet.png)

**These are not photographs, camera measurements or model results.** Screenshots render actual Face HTML and original notice/countdown/result helpers. The test server suppresses automatic camera/model bootstrap only in served responses, and uses a synthetic SVG video poster. No actual getUserMedia, MediaPipe, TTS or remote services run. Results and phases are synthetic fixtures, not clinical evidence. Chromium 154, deviceScaleFactor 2, official local IBM Plex Sans Thai/Manrope rendering fixtures and installed Japanese fallbacks; fonts are not bundled into the PR. Native text scaling and actual face/lighting/framing require device UAT.

**Known unrelated unresolved issue:** real-iPhone Speech Retry may fail to begin measurement. Repair is deferred; Speech is unchanged and is not certified retry-safe.

| State at 360px | English | Thai | Japanese |
| --- | --- | --- | --- |
| Ready | [EN](en-camera-360-1.png) | [TH](th-camera-360-1.png) | [JA](ja-camera-360-1.png) |
| Countdown | [EN](en-countdown-360-1.png) | [TH](th-countdown-360-1.png) | [JA](ja-countdown-360-1.png) |
| Capture | [EN](en-capture-360-1.png) | [TH](th-capture-360-1.png) | [JA](ja-capture-360-1.png) |
| Urgent result | [EN](en-urgent-360-1.png) | [TH](th-urgent-360-1.png) | [JA](ja-urgent-360-1.png) |
| Permission/error | [EN](en-permission-360-1.png) | [TH](th-permission-360-1.png) | [JA](ja-permission-360-1.png) |

English details: [alignment](en-alignment-360-1.png), [smile](en-smile-360-1.png), [result](en-result-360-1.png), [review](en-review-360-1.png), [unable](en-unable-360-1.png), [retry notice](en-retry-360-1.png), [no face](en-noFace-360-1.png), [pose](en-pose-360-1.png), [model error](en-unsupported-360-1.png), [locale error](en-localeError-360-1.png), [model readiness](en-model-360-1.png), [loading](en-loading-360-1.png), [active urgent notice](en-criticalNotice-360-1.png).

| 320px / 200% root text | English | Thai | Japanese |
| --- | --- | --- | --- |
| Countdown | [EN](en-countdown-320-2.png) | [TH](th-countdown-320-2.png) | [JA](ja-countdown-320-2.png) |
| Capture | [EN](en-capture-320-2.png) | [TH](th-capture-320-2.png) | [JA](ja-capture-320-2.png) |
| Result | [EN](en-result-320-2.png) | [TH](th-result-320-2.png) | [JA](ja-result-320-2.png) |
| Permission/error | [EN](en-permission-320-2.png) | [TH](th-permission-320-2.png) | [JA](ja-permission-320-2.png) |

[Full state inventory, source/geometry boundary, deviations and device-UAT checklist](../../public-face-phase-c4.md).

Automated layouts cover 320/360/390/430px, normal/200% text and TH/EN/JA. Raw test JSON remains outside the repository. The test bridge calls original showCenterCountdown with the production calibration constant (currently 3); no application timer is changed. Capture may have zero instructions once the original engine clears the smile prompt. Home is intentionally retained. Urgent copy has priority over an unobstructed camera; long notices/results scroll rather than shrink or lose safety text.
