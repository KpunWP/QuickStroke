# Face-only revision — full-screen crystal camera proposal

The six Face mockup states are revised: instructions, camera/alignment,
countdown, result, unable-to-assess and permission/error. Actual screening pages,
Result/Arm/Speech mockup renderers, translation resources and clinical engines
are untouched. Open the gallery's Face filter or
`index.html?module=face&state=camera&lang=en`.

## Overlay layout

The entire viewport uses the camera-scene backdrop. There is no flat camera
card or paper-page shell. The portrait is explicitly an illustration, not live
camera data. The glass language rail and compact instruction bubble occupy the
top edge. A clear central region contains only the portrait and a noninteractive
alignment rim; no instruction, result, control or countdown intersects that
region. The large countdown is horizontally centred below the facial region,
over the lower camera area, rather than covering the eyes/nose/mouth. Status
bubbles and floating action pills follow at the lower edge. Safe-area padding
and normal document flow reserve each layer's space. Emergency and diagnostic
limitations remain readable below the working area; they are never clipped.

TH/EN/JA retain the existing Face/action/safety copy. The mockup has no timers or
capture logic; the static "5" is the same review example as before. Review
controls advance countdown states. A glass background is translucent, with a
more opaque fallback when backdrop filtering is unavailable. The visual theme
uses familiar crystal highlights without introducing iOS-specific navigation
conventions that would prevent Android use.

At normal size the face remains the dominant visual anchor. At enlarged text,
rails/status/actions wrap and the document scrolls: we deliberately do not
shrink text or position controls over the face to force a one-screen fit. The
camera backdrop remains full-viewport. This is the accessibility compromise for
short screens and 200% text, not a card-based alternative layout.

## Review artifacts

New Face artifacts are in `exports/face-glass/`:

- `face-glass-contact-sheet.png`: all six English states, full-page captures.
- `face-glass-screenshots.zip`: 36 actual browser captures (six states × three
  languages × 360px/normal and 320px/200% text).
- `face-glass-gallery.zip`: the current gallery, scripts, Face stylesheet and
  relative assets. Extract and serve its `public-modules` directory with a local
  HTTP server as described in REVIEW.md.

The older Phase B export archives remain historical snapshots of the previous
Face design. Use these new Face artifacts or the current gallery for this review.

## Verification

Local Chromium 154, 144 Face cases: six states × TH/EN/JA × 320/360/390/430px
× normal/200% text, plus six 800×360 enlarged-text landscape checks. All passed:
no horizontal text clipping, overlapping layout layers, protected-region
intersections, hidden emergency section, undersized controls, missing assets or
page errors. TH/EN/JA simulated navigation and gallery controls passed. Official
local font fixtures replaced Google Fonts CSS for deterministic screenshots;
real font delivery and physical smartphone rendering are not certified.

Representative Result/Arm/Speech renderings are additionally compared against
the previous screenshots in all three languages. Their renderer functions and
shared styling are unchanged; the new CSS is scoped to `body.face-mode`.

## Implementation risks — no application implementation authorized

- The portrait/clear-region geometry is illustrative. Before implementation,
  map the actual video/canvas/landmark transforms and measure the real protected
  facial region. Never resize/crop/mirror acquisition to match this illustration.
- Glass contrast must be tested against bright/dark live scenes; an opaque
  fallback may be required. Blur performance and battery use need device checks.
- Real iOS Safari / Android Chrome / Samsung Internet dynamic browser bars,
  cutouts, native enlarged text, screen readers and landscape remain untested.
- Countdown location is proposed presentation only. Preserve actual durations,
  phase gates, MediaPipe analysis, timers, capture cleanup, scores and thresholds.
- State-dependent Retry/Continue availability and emergency calling must retain
  their existing production handlers. This simulator never invokes a dialer,
  camera, audio, sensors, recognition or research submission.
