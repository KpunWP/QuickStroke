# Temporary Public Face black-band A/B diagnostics

Baseline: PR #119, `7dd8b403b7ed2460c0f1608bdf5d4db5b2655d19`.
Branch: `diagnostics/public-face-black-band-ab-20261026`.

This is diagnostic only. The owner's physical measurements substantially weaken ordinary DOM shrinkage; they do not establish overlay, source-pixel or Safari-compositor cause. No physical A/B observations are fabricated by these tests.

## Authorization and unchanged behavior

Existing `faceLayoutDebug=1`, verified immutable-host Preview POST gate and ordinary Public gate are unchanged. Production/ordinary visits/Research/Dev/mesh stay ineligible. The diagnostic helper URL advances to v3 to avoid an older cached helper. No project settings, environment variables or server gate changes.

No original Face engine/MediaPipe/camera/audio/scoring/countdown/navigation scripts, normal app CSS, startup feedback or result panel change. No stream reattachment, constraints, mirroring, source/intrinsic dimensions or processing input change. The existing original Start listener remains untouched. No image/frame/screenshot/pixel/landmark/audio/clinical/identity data is captured. No uploads or persistence. Copy Summary/full JSON/Mark remain available.

## Exact Test A

An owner-created diagnostic stylesheet sets **only `visibility:hidden!important`** on:

- `#canvas` (the visible technical mesh overlay)
- `#face-status-row`
- `#progress-dots`
- `#pose-hud`
- `#debug-panel`

All selectors require the existing Public presentation gate. Many rows already have `display:none` in Public; the meaningful remaining candidate is the canvas layer. The analysis mouth canvas is off-DOM and is not targeted. This does not clear/resize/read any canvas bitmap or stop drawing/detection. Visibility preserves layout dimensions. No target node is removed and no inline style/class is overwritten.

Instructions, alignment/pose/no-face warnings, urgent notices, countdown, Home/Retry/navigation buttons, startup and completion panel are deliberately **not hidden**. Therefore A cannot rule out every conceivable painted element.

If bands disappear under A, this is evidence of sensitivity to these layers' painting/visibility. It does not alone prove an opaque canvas: changing visibility can also trigger Safari recompositing.

## Exact Test B

A separate owner-created diagnostic stylesheet applies **only**:

`html[data-face-public="1"] #video { will-change: transform !important; }`

This requests a compositing hint without changing the transform itself. There is no translateZ/scale rewrite, backface rule, object-fit/position, size, crop, mask, source assignment, play/pause or model call. Existing mirror and source pixel data remain unchanged.

Safari may ignore this hint or may already composite video. No visible difference does not exclude a compositor problem. Disappearance with unchanged geometry supports compositing sensitivity, not a permanent fix or confirmed root cause. Real performance/timing neutrality cannot be proved from synthetic browser tests; no application timer or processing callback is modified.

## Reversibility and independence

A and B cannot be combined. The opposite button is disabled while one is active, and the handler independently rejects activation outside baseline. The active button toggles off; **Restore baseline** is always available, including during a pending diagnostic operation.

Stylesheets start with `media="not all"`; explicit activation switches only the selected stylesheet to `all`. Restore returns them to `not all`, exposing the exact current original cascade. Application style attributes, classes, nodes and parents are never replaced. Mode teardown disables/removes only the tool's own styles and controls and clears its in-memory A/B buffers. No changes persist after navigation/reload or outside the diagnostic session.

Original automatic snapshot budget (12) remains separate. A/B uses at most eight additional snapshots, each explicitly triggered by a toggle/restore, with post-render batched reads. A baseline is captured before each experiment; no polling or MediaPipe/frame hooks. Observations have their own eight-entry cap and only fixed values (`still-visible`, `disappeared`, `unsure`). No automatic inference of band visibility.

## Physical-iPhone procedure after separately authorized Preview deployment

1. Open ordinary Public Face with `faceLayoutDebug=1` on the immutable protected Preview hostname. Do not enable Dev or mesh. Wait for live video and the original pre-Start snapshot; collapse Layout, then press the actual Start.
2. When bands appear, expand Layout, press **Mark black bands visible**, and open **A/B paint diagnostics**. Select **Still visible** and press **Record observation** while baseline is selected.
3. Press **Test A: Hide nonessential overlays**. Wait for **Test A ACTIVE**, observe the image, select the observed outcome and press **Record observation**. No outcome is recorded until this explicit action.
4. Press **Restore baseline** and observe the baseline again. Record its outcome too. If the visual baseline does not return despite CSS restoration, note that carryover in the observation log and use a fresh page for an independent B trial.
5. Press **Test B: Video presentation**, wait for **Test B ACTIVE**, observe and explicitly record the outcome. Restore baseline again and record the restored appearance.
6. Complete the ordinary test without changing its timing. If the measurement finishes before the A/B sequence, the tool can still operate on the persisting completion-time video; it does not pause/extend/restart measurement or alter the accepted panel. The summary includes captured layout classes so this difference remains visible.
7. Press **Copy A/B Summary**, transfer the short text through LINE/notebook, then paste it into ChatGPT. Use the selectable text fallback if Clipboard fails. Copy before navigating away. Original Copy Summary and JSON remain available, but use the dedicated A/B summary for experiments/modes/outcomes.

The short summary includes initial baseline, latest A/B geometry, observed canvas visibility/video will-change, selected modes, geometry comparison (including intrinsic dimensions), restored baseline and the explicit owner observation log. Missing data or observations are labelled, never inferred. Comparing against the initial baseline is not causal attribution; natural viewport/state changes must be considered. CSS metadata cannot prove source frames lack padding.

## Automated evidence and limitations

Focused tests verify the strict A whitelist, single-property B, no stream assignment/play, identical video rect/intrinsic/crop/mirror and original app classes/style attributes, preserved warnings/countdown, mutual exclusion including a scripted bypass attempt, exact A/B restoration, clipboard/fallback, explicit outcomes, mode-exit restoration and privacy. Existing gate, Copy Summary, JSON, core and frozen Face/capture/language contracts remain in CI. Browser tests are synthetic Chromium metadata, not physical camera/MediaPipe/Safari validation.

The expanded diagnostic UI itself can perturb compositing. Its existing rectangle/expanded state and the requested A/B mode are recorded. Visual persistence after Restore may be informative but does not justify a permanent CSS patch without owner evidence. Face audio silence and Speech Retry remain unresolved and untouched.

No automatic Preview deployment, Production deployment or PR merge is authorized by this implementation.

Local verification: core 23/23; existing Face browser matrix 432/432 with zero failures; focused A/B and original diagnostic browsers passed. Synthetic A/B clipboard summary was 1,596 characters. Frozen Face startup/active/completion, capture, language and navigation contracts passed. Existing offline/PWA Face checks passed. These results establish diagnostic isolation/restoration in Chromium, not a physical Safari cause or fix.
