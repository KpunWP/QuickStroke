# Phase C.2 — Public Arm UI implementation

Base: PR #108 `35a3e793045ffde2943e9e0d8a9b003766610d47`.
Branch: `feat/public-arm-ui-phase-c2-20261025`.
Approved design: Arm mockup at `bfa19d3bdc836efcc25ee91c67d07c7cbe04a5a2`.

## State and protection inventory

Existing Arm phases remain unchanged: IDLE, WAIT_VOICE, WAIT_SENSOR, CALIB,
PRE_MEASURE_RECHECK, MEASURE, BETWEEN, RETRY_ARM, READINESS_ERROR,
POST_TASK_QUESTION (Research), DONE. The introductory gate, side confirmation,
three image-guide stages, left-to-right handoff, same-side retry, sensor warnings,
calibration/recheck and completion all retain their original handlers and timing.

Every pre-existing inline script is byte-for-byte identical to the integration
baseline, checked by a frozen digest test. New scripts only read mode to scope
presentation, enable Public zoom, and supply the exact existing illustration
bytes. No orientation/gravity/roll/pitch/yaw, drift, calibration, thresholds,
measurement duration, timers, voice queue/TTS/prerecorded prompts, confirmation,
side progression, lifecycle, persistence or completion code is modified. Face,
Speech, Result, Consent, research stores, Supabase, config and service worker are
unchanged. No locale entries or real spoken instructions are replaced.

## Presentation changes

Public uses Home/Result's paper/clinical blue, Plex Thai/Manrope/Japanese stack,
rounded surfaces, consistent typography, content-sized controls and 48px minimum
targets. The fixed portrait shell is replaced by fluid scrolling, safe-area
padding and distinct nonoverlapping regions: navigation/language, left/right
status, posture illustration, instructions/warnings, countdown, actions/result.
Necessary !important declarations only counter the legacy Arm stylesheet's fixed
positions and forced sizes; existing state display rules remain authoritative.

Measurement's existing countdown is visually ordered before the retained
step-three image so it can be read on shorter screens. The original guide text,
image selection and actual countdown are unchanged. Existing measurement/intro
rules still hide confirmation controls in their original states. Status uses
labels and symbols as well as color. No new absolute-angle gauge is introduced:
the old numeric drift DOM remains updated by its engine but is not displayed in
Public, matching the approved no-gauge design. Arm still measures smartphone
orientation drift, not absolute participant arm angle.

Presentation is scoped to a recovered Public mode and excluded from Research/Dev.
Research's post-task understanding, consent/finalization and original image URLs
remain intact. Tests include a Research snapshot despite selected Public mode.

## Offline asset delivery

Public CSS is bundled in Arm HTML, with `assets/public-arm.css` as its canonical
reviewed source. All six existing left/right step-1/2/3 WebP assets are embedded
as data URIs in a Public-only asset script. Each embedded byte stream is tested
against the original approved file; no picture is generated, cropped or replaced.
The original HTML src values remain for Research/Dev. Public assignment changes
only instructional image delivery, not any sensor/camera acquisition geometry.

A successful installation of the unchanged service worker already precaches Arm
HTML. Bundling CSS/images makes the first Public Arm visit work offline without
needing a prior image visit, a new cache version, deletion or model-cache rebuild.
The original image URLs may be attempted by browser preload, but Public rendering
uses the bundled bytes even when those requests cannot succeed offline. Fonts
remain external, so offline users may receive system fallbacks. Older offline
HTML cannot acquire this release until an online refresh/update. No service-worker
or asset-caching policy is changed.

## Differences from illustrative mockup

- Keep the real introductory gate, three-stage posture guidance, explicit side
  confirmations, existing instruction/audio text and Research-only question.
- Keep all six approved posture images rather than only the mockup's step-two
  pictures. Step-three artwork contains existing Thai “10 seconds” notation;
  it is not silently translated/edited. Native international comprehension UAT
  is required; localized text and the real countdown remain alongside it.
- Preserve real retry/next/Result controls and their original availability. No
  simulated state transitions replace production handlers.
- Keep the guide image during measurement but prioritize the real countdown
  above it visually. Vertical scrolling is preferable to clipping or shrinking
  accessible text; no promise of a one-screen fit at 200% text.
- No new warning copy, result interpretation or absolute arm-angle explanation.

## Verification

- New `node tests/public-arm-ui.mjs`: frozen original scripts; Public/Research/Dev
  scope and Public zoom; exact six original images; bundled CSS equality;
  Public numeric-gauge suppression. PASS.
- 13 relevant existing suites pass: Arm sensor replay, dynamics/duration,
  device/browser hardening, guide persistence, post-task understanding, remote
  contract, research E2E audit, Public flow/audio, Public TTS, voice cues, core
  (23/23), Result UI freeze and event-language handoff.
- Actual local Chromium: 312 cases = 13 synthetic UI states × TH/EN/JA ×
  320/360/390/430px × normal/doubled text. Covers intro, left, raise, calibration,
  countdown, left measurement, transition, right, right measurement, retry,
  error, completion and abnormal completion. No measured horizontal text
  overflow, region overlap, controls below 48px, missing image, exposed numeric
  gauge, page error or external-service request.
- Actual intro/confirmation handlers and right-hand image selection tested.
  For these control-only checks, startWait is replaced at the test boundary so
  no real sensor acquisition begins. Actual Full completion→Speech, Individual
  completion→Result, retry→left IDLE, language switching and JA handoff checked.
- Existing sensor/timer/audio replay tests exercise the protected engine with
  deterministic fixtures. Browser screenshots use synthetic phase fixtures and
  mocked voice completion, not real IMU measurements or audible device tests.
- Actual unchanged service worker: fresh installation, first-ever offline Public
  Arm visit, Japanese handoff, all six images decoded and new CSS applied. PASS.
- Research intro screenshot is pixel-identical to baseline; Research/Dev computed
  styles and original image URLs remain unchanged. PASS.
- Inline syntax and diff checks pass. New CI workflow targets the Result branch
  and main and runs Public Arm UI/freeze plus existing sensor/audio/guide checks.

No failure occurred in the executed relevant selection. Two broader baseline
failures were previously documented in Phase C.1: `jssf-remote-staging.mjs` has a
whitespace-sensitive assertion and `jssf-remote-sync-flow.mjs:140` a readiness
fixture missing collection phase. They are unrelated, unchanged and not repaired
by this phase; they are not new Arm failures.

Raw browser evidence remains under `/workspace/work/phase-c2/`. Selected actual
synthetic-fixture screenshots are in `docs/ui-reviews/public-arm-phase-c2/`.

## Device UAT and implementation risks

Physical iPhone Safari, Android Chrome/Samsung Internet and Galaxy/POCO/Xiaomi
screen proportions remain unverified. Check native font scaling/zoom, Thai tone
marks/Japanese wrapping, screen reader order (including countdown/guide visual
order), landscape/cutouts/browser bars, Home visibility and touch reach while
holding the phone. Validate actual left/right one-handed holding comprehension,
including the original step-three embedded Thai notation.

Real motion permissions, live sensor stability/orientation, audible prompt order,
calibration and 10-second timing, retry recovery, foreground/background changes,
and next-page audio acquisition need device UAT. This change does not certify
the existing algorithms or change their thresholds. At extreme text sizes the
instruction/countdown/guide can require scrolling; users should not need to
interact during the existing measurement interval. Verify physical usability.

Check installed-PWA online update/offline relaunch, storage eviction and offline
font fallback. Bundled asset equality tests require future asset/style updates
to refresh their inline copies. No Preview or other deployment is created; do
not merge this PR, PR #108 or PR #106 without explicit approval.
