# Face camera/countdown final correction

Baseline: `b7b4b3558786114933195546642f9b435603c4d5` (PR #116).
Branch: `fix/public-face-camera-countdown-final-20261026`.

## Exact runtime delta

Only `assets/public-face-active.css` and its existing inline mirror in `face-test.html` change.

1. Delete PR #116's two active camera rules: fixed/viewport-sized `#video-container`, and absolute-positioned `#video`. Do not replace them with another geometry override. Both pre-Start and active measurement inherit the original absolute inset container and static, full-size cover video. Existing mirroring remains unchanged.
2. Keep the existing active body block-flow rule byte-for-byte.
3. Keep the existing countdown 50%/50% center and visibility/lifecycle. Set Manrope, `clamp(4rem,20vw,5rem)`, 700, line-height 1.15, tabular numerals; white `.85` alpha; zero stroke; `0 1px 3px rgba(0,0,0,.28)` shadow; no background/backplate. Arm/Speech are untouched.

The Public active-only selector and urgent/result exclusions are unchanged. There are no original script, handler, DOM structure, locale, startup CSS, completion CSS, Service Worker, model, audio, camera acquisition, mirror, intrinsic dimension, scoring, navigation, session, Consent/Research/Supabase changes. Existing frozen-source hashes and whole-HTML-after-active-style-removal assertion remain unchanged. Speech Retry and the previously observed Face voice silence remain unresolved and outside scope.

## Evidence

[Comparison contact sheet](ui-reviews/public-face-final/comparison.png) includes PR #116 vs final active countdown, pre-Start vs post-Start, and TH/EN/JA enlarged text. All video frames are synthetic canvas-generated portraits, not physical camera footage. Both before and after use the same synthetic content. Chromium does not reproduce the physical Safari bands.

The transition test clicks the **actual original Start handler** on a fresh Public fixture with a synthetic stream and existing readiness flags. Original startup/assessment logic runs only to its early countdown presentation; MediaPipe bootstrap is suppressed. External network calls are blocked. This is not a real camera/model/clinical validation. Separate actual-handler checks cover Retry and Full→Arm / Individual→Result navigation boundaries.

DOM evidence from Chromium:

| Viewport | Container before → after Start | Video positioning before → after | Display rect before/after | Intrinsic stream dimensions |
|---|---|---|---|---|
| 320×568 | absolute → absolute | static → static | x0 y0 w320 h568 | 640×480 unchanged |
| 360×844 | absolute → absolute | static → static | x0 y0 w360 h844 | 640×480 unchanged |
| 390×844 | absolute → absolute | static → static | x0 y0 w390 h844 | 640×480 unchanged |
| 430×844 | absolute → absolute | static → static | x0 y0 w430 h844 | 640×480 unchanged |

At 390×844 normal text, PR #116 vs final countdown: 85.8px/500/.72 fill/1.25px stroke → 78px/700/.85 fill/0px stroke. Center stays `(195,422)`. Shadow alpha reduces .70→.28. No backplate.

## Validation scope

Core and existing frozen Face/capture/audio/language/Home/Result/Arm/Speech/Consent-isolation contracts; existing Face 432-case browser suite; completion/safe-area 148 cases; startup 48; active 96 (72 TH/EN/JA × four widths × normal/200% × alignment/countdown/capture, plus 24 simulated-safe-area combinations). Startup/completion/error/urgent and Research/Dev comparisons protect unchanged presentation. Original PWA offline/cache-refresh checks retain atomic inline styling. No new Service Worker migration is needed.

## Remaining Safari UAT

This is the approved **hypothesis-based rollback**, not a confirmed Safari root-cause fix. Physical iPhone Safari must verify live framing before/after Start, no black bands, dynamic toolbar/safe areas, portrait/landscape and native enlarged text, countdown readability on bright/dark scenes, completion/Retry and Full/Individual progression. Chromium root-font enlargement and CSS-injected insets do not reproduce Safari's native zoom/compositor. If bands persist with full DOM rectangles, investigate native video painting/source presentation separately before further fixes. Audio audibility was not fixed or physically verified.

No deployment or merge is part of this PR.

## Local results

PASS: core 23/23; existing Face browser 432/432 (zero layout failures), completion/safe-area 148, startup 48, active/safe-area 96 plus four actual-Start geometry transitions. All browser suites report zero page errors. Frozen source, capture/timing/critical retention, audio contracts, language continuity, Full/Individual navigation, Research/Dev isolation and unchanged offline cache-refresh checks pass. These results do not establish live camera/model/audio behavior on Safari.
