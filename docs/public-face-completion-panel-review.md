# Public Face completion panel hotfix

Baseline: `428c34b357cd014203e8c4f29902ea571ea4bab3` (PR #113).
Branch: `fix/public-face-completion-panel-20261025`.

## Runtime scope

Only CSS is appended to `assets/public-face.css` and its existing atomic inline copy in `face-test.html`. All markup, scripts, handlers and translations outside that style block match the accepted baseline byte-for-byte (SHA-256 assertion in the new test).

Selector: `html[data-face-public="1"] body.result-visible:has(#score-box[style*="display: flex"]):has(#score-threshold:empty)`.

The existing Public gate excludes Research/Dev/mesh. Existing completion visibility plus an empty attached warning/reason identifies valid, non-urgent completion. Urgent, invalid, permission/model/error states have nonempty reasons and retain their previous presentation. Capture/retry/preparation do not qualify. This relies on existing DOM state; no state machine or handlers were added.

A noninteractive pseudo-element spans the original result and dashboard grid rows, creating one dark translucent backing without reparenting/duplicating content. The original buttons wrap together, use at least 48px targets and smaller padding/type than the baseline. Intrinsic rows accommodate enlarged text. Bottom spacing is 12px plus the safe-area inset. Video/canvas positioning, mirroring and object-fit are untouched. Inline CSS preserves the existing HTML/offline delivery strategy; no Service Worker migration.

## Verification scope

Synthetic Chromium fixtures invoke existing UI/result/navigation functions with camera/model bootstrap suppressed in the served test response. They never capture media or submit participant data. Portraits are illustrative, not clinical images. Before/after use the same portrait and video geometry.

- Valid normal/review/abnormal results: TH/EN/JA, 320/360/390/430px, normal/200% root text, Full/Individual (144 combinations).
- Safe-area values injected into test responses and shortened viewport heights simulate bottom toolbar constraints; these are not real Safari measurements.
- Capture, countdown, retry, urgent, invalid and error presentations compare against accepted baseline.
- Original Full→Arm, Individual→Result and Retry handlers are exercised at navigation/capture boundaries. Research/Dev isolation and offline cache refresh are checked.
- Core, frozen engine, Face capture, language and existing UI contracts run alongside the new checks.

## Physical-device UAT still required

Verify iPhone Safari expanded/collapsed toolbars, notch/home indicator, native text enlargement, standalone PWA and actual camera framing. Confirm reachable controls while scrolling in short landscape views. Also check Android browser safe areas and fonts. Chromium root-font enlargement is not native iOS text zoom. The current viewport disables pinch zoom; this pre-existing setting is unchanged by the CSS-only task. Older browsers without CSS `:has()` retain the existing layout.

Speech Retry remains an unresolved physical-iPhone issue and is untouched. No Preview/Production deployment or merge is authorized by this change.

## Captured evidence

[Contact sheet](ui-reviews/public-face-completion-panel/comparison.png) includes before/after EN at 360×800, normal TH/JA and all three languages at 320×568 / 200% text. Individual PNGs and simulated-safe-area captures are adjacent.

At EN 360×800, the result/control group shrank from 228.3px to 113.2px high and starts at y=674.8 rather than y=496. Primary/secondary controls are 48.8px high rather than 56px and share a row. Camera geometry remains identical. At 200% text the panel grows upwards as needed, so central-face visibility cannot be guaranteed on the shortest screen; readable results and reachable controls take priority.

Local results: existing 432-case Face browser regression passed with zero layout failures/page errors; core 23/23 passed; frozen Face source/capture, Public language/event, Home/Result/Arm/Speech, consent isolation and audio contract suites passed. Audio contract assertions do not establish real-device Speech Retry reliability. No new runtime behavior or Service Worker change was made.

Completion-specific browser suite: PASS, 144 completion combinations + 4 safe-area simulations; all 14 excluded states pixel-identical; Full/Individual/Retry boundaries, language switching, Research/Dev/mesh isolation and baseline-cache → online update → offline hotfix delivery passed, zero page errors. The new tests and existing 432-case matrix are wired into the Face CI workflow for this PR base.
