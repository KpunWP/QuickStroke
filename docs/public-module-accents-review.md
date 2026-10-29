# Final Public identity accents — owner review

Baseline: main/Production `4f1cbe59b26080913c803dff5ad99788e9f1c3f2`.
Production was READY at deployment `dpl_9PYRh183X1bf7jVY5WhEu2XY3m1b` before work.
No merge or deployment is part of this PR.

## Exact color inventory and changes

| Element | Baseline | After | State restriction |
|---|---|---|---|
| Home Face icon / Individual choice icon | Blue on pale blue | #0D9488 on #F0FDFA | Unassessed only |
| Home Arm icons | Blue on pale blue | #2563EB on #EFF6FF | Unassessed only |
| Home Speech icons | Blue on pale blue | #7C3AED on #F5F3FF | Unassessed only |
| Face preparation spinner top border | White | #0D9488 | Preparing, not active/result |
| Arm intro-card heading | #172536 | #2563EB | Existing white intro panel only |
| Speech module heading | #172536 | #7C3AED | Not completed/result |
| Result Face/Arm/Speech icons | #0D58B8 on #E6EFFB | Matching colors/tints above | Summary ok AND individual module ok |

These colors identify modules; they are not medical classifications.
Clinical labels, metric colors, warnings, emergency controls, current-module focus,
buttons, countdowns, illustrations, camera/canvas, overlays and typography are unchanged.
Every new CSS declaration is color, background-color or border-top-color only.
No DOM, JavaScript handlers, text, locale, audio, timers, model or sensor changes.

Skipped: Arm header blue on the lightest gradient was only 4.44:1, so the blue
heading is restricted to the existing white intro card (5.17:1). Speech purple
has at least 4.9:1 over the header gradient. Teal is used only for non-text icons
and the preparation indicator (tested at least 3:1), never small text.
No additional microphone/listening, countdown, button or measurement decoration.

## Offline delivery and boundaries

Existing inline CSS copies exactly match their four stylesheet sources; this
preserves atomic cached HTML. Shell cache is v108 instead of v107. No change to
fetch routing, cache strategy, audio caching, or data persistence. The exact nine
CSS blocks are inventoried in tests/fixtures/public-module-accents.json. New
whole-file contracts restore only those blocks and the cache version to the
baseline; existing frozen-engine and privacy checks remain enforced.

## Visual evidence

[Before/after contact sheet](ui-reviews/public-module-accents/before-after.png)

| Page | Before | After |
|---|---|---|
| Home | [PNG](ui-reviews/public-module-accents/index-before.png) | [PNG](ui-reviews/public-module-accents/index-after.png) |
| Face preparation | [PNG](ui-reviews/public-module-accents/face-test-before.png) | [PNG](ui-reviews/public-module-accents/face-test-after.png) |
| Arm intro | [PNG](ui-reviews/public-module-accents/arm-test-before.png) | [PNG](ui-reviews/public-module-accents/arm-test-after.png) |
| Speech preparation | [PNG](ui-reviews/public-module-accents/speech-test-before.png) | [PNG](ui-reviews/public-module-accents/speech-test-after.png) |
| Result | [PNG](ui-reviews/public-module-accents/result-before.png) | [PNG](ui-reviews/public-module-accents/result-after.png) |

Actual application DOM with synthetic local fixtures, Chromium at 360px portrait,
2x screenshots. Face portrait and Result measurements are synthetic. External
services/media capture are blocked. Screenshots do not establish physical Safari,
Android, camera/model or native font-network behavior.

## Validation and physical acceptance

120 before/after layout pairs: five pages × TH/EN/JA × 320/360/390/430 × 100/200%.
Geometry, typography, existing button styling and clinical text colors match.
Additional tests cover Home status classes; normal/review/urgent/unavailable and
historical Result; Research/Dev isolation; exact accent colors; contrast; and
inline/offline delivery. Existing module/language/emergency/navigation suites run
in CI; telephone navigation is intercepted and no Research data is submitted.

Physical iPhone Safari and Android Chrome: compare the five screens in portrait,
check normal/enlarged text, language choice and emergency country selection, then
smoke-test Full and Individual navigation. Confirm the camera/countdown/completion
panel and controls remain unchanged; check an existing installed PWA updates.
Known Face cold start/audio, Speech Retry/countdown audio and Arm illustration
issues remain unresolved. Do not infer a fix from these screenshots or tests.

Local results: 35 source/contract suites pass; 120 paired layouts pass with identical geometry, typography, button styling and clinical text colors; state/mode isolation and exact accent assertions pass. Emergency browser 192 cases pass, including v104→v108 offline update, unchanged Thai MP3 hash and Japan119 for fresh English. Inline-script syntax and diff checks pass. CI results are reported in the PR.

CI review note: the first Face active test run rejected the deliberately changed preparation-spinner pixels against its historical white-spinner screenshot. The comparison now first asserts the actual approved teal border, then normalizes only that border to white during screenshot capture. Whole-screen pixel equality remains enforced for all remaining startup pixels and every completion/error/urgent state. No production CSS was changed in response.
