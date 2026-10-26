# Public Face active fullscreen/countdown hotfix

Baseline: `8ceba7bf86430ade1d37b9058dc127bd8f9af3cb` (Draft PR #115).
Branch: `fix/public-face-fullscreen-countdown-20261026`.

## Findings and scope

The original Public `#center-countdown` rule explicitly sets a bottom offset and only horizontal translation. This confirms why the count appeared near the bottom; it is not a timing or MediaPipe defect.

PR #115 adds grid rows for pending/ready startup, projected from existing flags through a MutationObserver. Active measurement normally removes that attribute. Synthetic Chromium did not reproduce black bands in the baseline: video already measured the full viewport. Consequently, the owner-observed Safari bands cannot conclusively be attributed to those grid rows. This change makes the active display independent of parent/grid/scroll geometry and of when the startup observer clears its attribute. Physical Safari rendering still requires UAT; no claim of a confirmed browser compositor root cause is made.

## Runtime change — CSS only

Add `assets/public-face-active.css` and an identical inline `public-face-active-style` block for atomic cached-HTML/offline delivery. No new JavaScript, DOM controls, handlers, state indicators, locale entries, dependencies, Service Worker or model changes.

All rules require `html[data-face-public="1"] body.screening-active:not(.result-visible):not(:has(#dashboard.pulse))`.

- Explicit active block flow overrides any stale startup grid rows, without affecting startup itself.
- The camera **display container** is fixed to the viewport with zero inset/margin/padding/border/radius and `100dvh` height (`100vh` fallback). The video fills that display surface with its existing cover fit. Acquisition constraints, intrinsic frame size, mirror, processing dimensions and landmark coordinate code are untouched. Canvas remains aligned to the same full display area by its original rules.
- The existing countdown becomes viewport-centered at 50%/50%, with a responsive 4–8rem size, weight 500, white fill at 72% alpha and a thin dark edge/shadow for bright imagery. No backdrop, card, blur or pointer interception. Countdown display and timing remain the original handlers' responsibility.
- Instructions retain their existing safe-area-aware top position. No space is reserved above/below the video. Startup, completed results and urgent pulsing warnings do not enter the new selector. Research/Dev remain outside the existing Public gate.

A whole-HTML SHA-256 assertion after removing only the new style block must match exact PR #115 (`a1e6e55f83d2d1151d79bffb2d5cb0146e3d756f48720305241f34da680eb0a0`). This freezes all original startup/completion markup and scripts, camera/model/threshold/audio/countdown/retry/navigation logic. Existing source hashes also remain unchanged. The previous Public CSS and startup CSS files are untouched.

## Evidence

[Before/after contact sheet](ui-reviews/public-face-active/comparison.png). All image subjects/video frames are **synthetic**. Browser fixtures attach a canvas-generated 640×480 stream (no physical camera and no MediaPipe), preserving portrait aspect ratio within that synthetic scene. Before/after use identical frames. Baseline screenshots demonstrate the low countdown; they do not reproduce the reported physical-iPhone bands.

New active matrix: TH/EN/JA × 320/360/390/430px × normal/200% root text × alignment/countdown/capture = 72 cases; plus 24 language/text-size combinations with 47px-top/34px-bottom safe-area/reduced-height simulations. Assertions cover viewport fill, video/canvas rect equality, unchanged intrinsic dimensions/cover/mirror, exact centered count, alpha/background/weight, no instruction overlap and no horizontal overflow. A synchronous stale startup attribute test verifies active CSS wins before observer cleanup. Pixel comparisons protect startup/preparation/ready, completion/review/urgent/unable/error states, Research/Dev. Original Full→Arm, Individual→Result and Start/Retry boundary handlers are exercised.

The existing Face browser suite is updated to allow **only the explicitly approved active countdown** in its central-face exclusion check. Other overlays remain prohibited. Countdown/capture are moved from unchanged-pixel checks to explicit new active tests; completion/startup and urgent/error checks remain. Core and existing Face/capture/startup/completion/offline/isolation regressions also run.

## Remaining device UAT / risks

Verify real iPhone Safari portrait/landscape with expanded/collapsed toolbars, safe areas, scroll/native text zoom and actual video frames. Confirm no black bands, stable framing through startup→alignment→countdown→capture→completion→Retry, and acceptable count contrast against bright/dark faces and backgrounds. Chromium metrics and simulated insets do not establish iOS compositor behavior or universal contrast over arbitrary video. The number intentionally overlays the central face per owner direction; it is translucent and occupies only the glyph region. At enlarged text, check top instruction scrolling and reset controls remain reachable.

MediaPipe, camera lifecycle, intrinsic video dimensions, assessment, audio, timing, retry, navigation, Research/Consent/Supabase are unchanged. Speech Retry remains unresolved and untouched. No deployment, merge or Production change is part of this task.

## Local results

PASS: core 23/23; existing Face browser suite 432/432 with zero layout failures; completion/safe-area suite 148; startup suite 48; new active suite 96 (72 base + 24 safe-area/text/language cases). All browser suites report zero page errors. Frozen-source, Face capture/timing/critical retention, language continuity/event, Home/Result/Arm/Speech and Consent-isolation/audio contract suites pass. Original Full→Arm and Individual→Result navigation and Start/Retry boundaries pass. Actual unchanged Service Worker offline styling/cache-refresh checks pass.

EN at 390×844: countdown center before `(195, 791.2)`, after `(195, 422)`; video display rectangle remains `(0,0,390,844)` in Chromium before/after. The new fixed active surface is specifically tested with a temporarily stale startup attribute. White fill changes from opaque to 72% alpha and weight from 700 to 500, with transparent background. These measurements do not establish the cause or resolution of native Safari black bands.
