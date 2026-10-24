# Phase B mockup validation

Scope: isolated static design files only, based on PR #106 `87388eb…`.
This report describes simulated desktop Chromium rendering, not smartphone
browser certification or clinical validation.

## Responsive and multilingual matrix

Each cell represents 24 visual states × normal and 200% text = 48 cases.

| Width / portrait height | English | Thai | Japanese | Total |
| --- | --- | --- | --- | --- |
| 320 × 568 | 48 PASS | 48 PASS | 48 PASS | 144 |
| 360 × 800 | 48 PASS | 48 PASS | 48 PASS | 144 |
| 390 × 800 | 48 PASS | 48 PASS | 48 PASS | 144 |
| 430 × 800 | 48 PASS | 48 PASS | 48 PASS | 144 |
| Total | 192 | 192 | 192 | 576 |

State coverage: Result completed/incomplete/unable/urgent; Face instructions/
camera/countdown/result/unable/permission; Arm left/countdown/measure/transition/
right/completion/retry; Speech instructions/countdown/listening/retry/unable/
permission/result.

Measured checks: no document horizontal overflow; no text range outside viewport;
no overlap between direct main layout regions; visible interactive controls at
least 48px; emergency section rendered in every state. Vertical scrolling is
intentional, particularly at 200% text; safety content is never removed to fit.

Additional landscape check: 800 × 360, 200% text, TH/EN/JA × Result urgent, Face
countdown, Arm measurement and Speech listening = 12 cases. Check horizontal
fit and scroll access to emergency guidance. Real browser UI and physical safe
areas are not emulated by this check.

English defaults on direct/generic mockup entry. TH/EN/JA switching and Face
instruction → camera → countdown → result → Arm simulation were exercised.
Countdown advances through review controls, not real timers. Gallery has 24
linked interactive frames; module filter, Japanese selection and 200% text
controls were checked. No real screening session, media or data was created.

276 existing localized excerpts were compared byte-for-byte with their source
locale values: all match. Only `review.*` simulation annotations are new proposed
translations; see COPY-MAPPING.md. This is a presentation review, not an editorial
certification of existing Thai/Japanese medical wording.

## Rendering method and evidence

Desktop Chromium 154, device scale factor 2. Normal text is the proposed 16px
body scale. The prototype's 200% mode doubles the body scale; it is not an
emulation of every OS accessibility/font setting. Local static server only.
Google Fonts CSS was replaced during testing by official local Plex Thai and
Manrope font fixtures for deterministic rendering. Japanese used the installed
system fallback. No bundled fonts are committed. Network access beyond the
local server/font stylesheet interception was blocked. No external service
requests, missing assets or page errors were observed in the checked cases.

Actual browser screenshots and raw evidence remain outside application source:

- `/workspace/work/phase-b/screenshots/`: all 24 EN states at 360px/normal text;
  TH/JA initial states for each module; selected 320px/200% stress cases.
- `/workspace/work/phase-b/validation.json`: per-case measurements, browser
  version, interaction checks and landscape records.
- `/workspace/work/phase-b/validate.cjs`: environment-specific test harness.

Screenshots show actual renderings, with simulated data explicitly marked. They
are not photos of physical devices or evidence of working capture/scoring.

## Remaining real-device checks

- iPhone Safari, Android Chrome and Samsung Internet; Samsung Galaxy and
  Xiaomi/POCO proportions, short portrait screens and landscape.
- Native OS text scaling/zoom, VoiceOver/TalkBack, focus order and announcements.
- Actual Google Fonts delivery, Thai tone marks/baselines and Japanese glyph/
  line-break/editorial review on each OS; no locale should silently fall back to
  another language.
- Dynamic browser bars, display cutouts and safe-area insets. CSS uses env()
  padding, but physical insets were not tested.
- Bright/dark camera readability and unaltered capture/landmark alignment before
  Face implementation. Arm physical phone/hand orientation and illustration
  comprehension require observed UAT.
- All future media/permission/audio/retry transitions require separate tests on
  the unchanged production engines once presentation implementation is approved.
- Preserve emergency dialing behavior during implementation; this simulator
  intentionally never opens a dialer. Do not place a real emergency call for UAT.

No deployment, browser compatibility certification or implementation approval is
implied by these results. Production pages and Preview are unchanged.
