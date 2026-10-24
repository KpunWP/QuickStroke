# Face — Minimal Full-Screen Crystal Camera

Design only. Supersedes the earlier glass/card Face proposals. Other module
renderers and actual application pages are unchanged.

## Seven illustrative states, plus an urgent-result variant

The previous six states did not explicitly represent active capture. The review
now includes `instructions`, `camera`, `countdown`, **`capture`**, `result`,
`unable`, and `permission`. Gallery now contains 25 states in total. Capture is a
static visual scenario, not a new timer, sensor phase or implementation change.

- Alignment: one short existing instruction and one Start control.
- Countdown: one short instruction, unobstructed face and a large plain number
  below the protected facial region. No button or decorative countdown bubble.
- Capture: only the existing short “Smile widely” instruction and minimal guide.
  No persistent status, progress, header, language rail or action button.
- Result: one existing finding and Continue action; no score or technical metric.
- Unable to assess: existing help and one Retry action.
- Permission/error: necessary blocked-camera/privacy explanation and one Retry.
- Context-specific urgent result is available at
  `index.html?module=face&state=result&lang=en&urgent=1`. It retains existing
  critical Face copy and the locale-appropriate emergency action label. Clicking
  this simulated button opens the review-only notice, never a real phone call.

The language rail is available in preparatory/result/error states. During active
states it moves to review controls below the camera viewport, so TH/EN/JA remains
selectable without a persistent rail competing with the face. Review state and
language tools remain reachable by scrolling. Mockups have no actual capture
that could be interrupted by these review controls.

## Minimal overlay plan

An edge-to-edge camera-scene backdrop replaces the webpage shell. A larger
illustrated face is the visual anchor. A single fine alignment rim has no glow
or stacked borders. The short instruction is plain high-contrast text, not an
extra card. Glass is reserved for functional buttons and necessary error/urgent
messages. During countdown/capture there are zero glass cards and no controls.

General warnings and repeated diagnostic/progress/supporting text are removed
from the active mock camera, per the authorized design refinement; Home Disclaimer
is assumed to have been shown in the real flow. Context-specific urgent guidance
is retained. This is NOT authorization to remove production safety requirements.
The real app must continue to enforce all existing warning triggers and access.

The SVG framing was enlarged only for this synthetic illustration. It is not a
video crop or a proposed MediaPipe coordinate transform. Normal text stays within
a viewport-led composition; at 200% text, necessary controls/errors can grow and
scroll rather than overlap the protected face. Safe-area padding is preserved.

## Verification and review artifacts

Local Chromium: 168 cases, seven states × TH/EN/JA × 320/360/390/430px × normal/
200% text. Six additional 800×360 enlarged-text landscape checks and three
urgent-action examples. Checks cover horizontal clipping, 48px controls, layer
separation and protected facial-area intersections. This is simulated browser
validation, not physical iPhone/Android certification. Deterministic local font
fixtures substitute for Google Fonts delivery during screenshot capture.

Updated artifacts are in `exports/face-minimal/`. They include all seven states
and the urgent example in TH/EN/JA. Contact-sheet headings identify all imagery as
synthetic. The interactive gallery ZIP includes all required relative assets.
Previous `exports/face-glass/` and earlier Phase B exports are historical versions.

## Risks before any implementation

- Preserve actual video/canvas/landmark mapping, framing and acquisition. This
  drawn portrait cannot validate facial geometry, capture quality or real light.
- Plain text/glass contrast must be checked against bright/dark live camera
  scenes, with a restrained opaque fallback if needed.
- Avoid using a mockup's viewport layout to alter timers, cues, phase gates,
  landmark processing, score thresholds, retries or cleanup.
- Hiding runtime controls/language UI during capture needs a separate audit of
  actual permission, back/cancel and accessibility requirements. Do not silently
  remove an existing necessary exit or safety control during implementation.
- Emergency labels/handlers and urgent-warning conditions must remain exactly
  mode/locale appropriate. No actual dialer is invoked by these mockups.
- Native text scaling, screen readers, browser bars/cutouts, orientation and
  glass rendering on Safari/Chrome/Samsung Internet remain device-UAT work.

No camera, MediaPipe, audio, storage, Consent, Research, Preview or Production
changes are made. Await visual approval before implementation.
