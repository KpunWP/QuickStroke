# Demo Home and Speech control correction

Baseline: PR #131, `429b3509c20aa36a8cbe698263b53421dfacba9d`.
Verified current Public main: `82cf095eaf47581283cdf28b789d80a48fc90268`.
This is a Dev-only presentation correction, not a release or deployment.

## Confirmed causes

Home already reused Public CSS, but `homeInitialLanguage()` still used Dev's Thai configuration fallback. `updateEmergencyAction()` still passed `publicCompact:false` in Dev, producing the older expanded dual-country card in both Home and disclaimer. These were deliberate boundaries in the earlier parity patch, not a cache-only explanation. The owner has now explicitly authorized matching the current Public presentation at those points.

Speech had two competing controls: the in-flow Technical Data panel started expanded, and the legacy bug/log button was created during DOMContentLoaded. The earlier collector could run during the document's interactive phase before that button existed, leaving the bug button floating over the screen. Its log panel also retained its original fixed overlay positioning.

## Changes

- Eligible Demo Home uses English when no valid `fast_lang` selection exists, preserving selected TH/EN/JA and the existing handoff key on reload/navigation. Public and Research initialization/persistence rules are unchanged; no new preference architecture or mode conversion.
- Home and disclaimer reuse the current compact country-labelled emergency component, including the existing Change country picker, manual override persistence and other-country advice. The helper, numbers, warnings and Research Consent are unchanged.
- Speech Technical Data starts collapsed. Its existing Show/Hide control is a 48px page-anchored top-right button with safe-area offsets and a visible module-color keyboard focus ring. The header reserves horizontal room for it, so the language picker wraps instead of colliding.
- The trigger scrolls away with the page rather than becoming a fixed obstruction over later instructions, transcripts or actions. Expanded technical data remains in normal document flow and is reachable by scrolling; it never becomes a modal overlay.
- Existing bug/log and audio-test controls are collected after DOM readiness/load and remain within the collapsed Developer tools disclosure. The original debug panel is in-flow and internally scrollable. Original handlers/logging are retained; no new diagnostics.
- Only Speech references the new versioned `technical-demo.js?v=20261031-demo-v3`. Public SW v108, CSS assets, mode helpers, Face/Arm/Result source and all locale/audio files remain unchanged.

The completed Dev Home retains its genuine Results action because its original handler opens Result. Calling that action Test again would misrepresent the unchanged Dev navigation policy. No navigation handler is changed by this correction.

## Exact runtime scope and proof

Runtime files: `index.html`, `speech-test.html` (asset URL only), `js/technical-demo.js`.

`tests/fixtures/demo-home-speech-correction.json` inventories every permitted runtime edit. `tests/technical-demo-home-speech.mjs` reverses those blocks and requires every remaining byte to match the exact accepted baseline, including the entire Technical Data helper. Existing broader page restoration and frozen engine/mode/audio contracts remain in place. Binding tests now explicitly open the default-collapsed Speech panel; they do not substitute new values or acquisition policies.

## Validation

- Home: 24 Public-main-versus-Dev pairs, TH/EN/JA × 320/360/390/430 × normal/200% text. Actual Home geometry/styles match Public; disclaimer and Home each render one compact emergency group. English fresh entry, selected-language reload, manual country override and true engineering_only mode checked.
- Speech: 24 corresponding responsive cases. Default collapse, 48px target, no corner overlap with language/instruction/transcript/microphone/actions, keyboard activation/focus, legacy log containment, in-flow expanded data, synthetic completion/Retry controls, transcript retention and Public/Research isolation.
- Existing source/core, Demo/Face scalar, Speech first-attempt and three-Retry callback, audio/navigation/isolation and offline suites remain required. All browser evidence is local Chromium with synthetic inputs, not physical iPhone/Safari or microphone/ASR proof.
- No telephone navigation is activated, and no participant or Research data is submitted.

Before/after image: `ui-reviews/technical-demo-home-speech-correction/comparison.png`. Actual application DOM at 390×844 CSS px, 2× capture; contact sheet resampled/palette-compressed. Before is the exact accepted PR #131 baseline, after is this correction. The expanded Speech view uses synthetic callback data. Fonts are review-only fixtures and are not bundled.

## Device UAT / remaining limits

Use a separately authorized protected immutable Preview in a fresh Dev context. Check fresh English, TH/EN/JA, manual country choice across language/reload, disclaimer, Full/Individual paths and unchanged completed-Dev Results navigation. Check Speech with the panel closed and open, log disclosure, short portrait/safe areas, enlarged text, initial Start and three manual Retries. Scroll back to the header to access the page-anchored toggle. Check actual audio/ASR and timing on the owner's iPhone; Chromium cannot establish that behavior. Existing intermittent Face/audio/Retry and Arm illustration issues are outside this patch.

No merge, Production change, new project, deployment or release tag is authorized by this correction task.
