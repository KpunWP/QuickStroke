# Public Arm completion and label refinement

Baseline: integration/jssf-public-arm-uat-20261025 at aa1bd875047e9a515a8c67b47c816ee38bc0a2de, verified against GitHub before creating the separate fix/public-arm-completion-layout-20261025 branch. Integration and source PR branches remain unchanged.

## Presentation changes and cause

Legacy fixed-dock rules reserve 210px bottom padding in #mid and 155px margin after #final-banner. Public presentation uses an in-flow dock, so that clearance is redundant. The completed posture illustration also remains before the summary. Public-only CSS now follows the existing visible completion banner (inline display:flex from showFinal), hides the redundant completed guide/timer presentation, and overrides only that state's old clearance. Warnings, summary title/body and existing buttons remain. Continuation is visually first, Retry secondary; no sticky footer, new control, handler, automatic navigation or state hook. Keyboard and DOM order of existing buttons is retained.

English labels were constrained by legacy width:calc(100% - 58px) and row-wrapping icon layout. A Public-only grid puts each status/name in a real text column and the existing icon beside both. Normal English word boundaries are retained without truncation or smaller fonts; intrinsic card widths permit a single column at enlarged text. TH/JA retain normal language wrapping.

assets/public-arm.css and its atomic inline copy in arm-test.html are identical. All pre-existing scripts remain byte-frozen. Public numeric drift remains hidden while its original DOM/calculations and Research/Dev information remain unchanged. No translations, sensor, audio, lifecycle, scoring, Home, Result, Face, Speech, consent, Supabase or Service Worker changes.

The completion selector follows existing inline visibility rather than class alone (classes survive reset). The application already uses :has; no new JavaScript compatibility shim is added. Reset restores normal guide/controls automatically. Older browsers without existing :has support require device assessment; the baseline was already dependent on it.

## Verification and evidence

- Core 23/23 and all selected existing Arm sensor, ten-second duration, device-hardening, Research, guide, understanding, audio/TTS/voice suites passed. Home, Result, sticky history, language and inline syntax regressions passed.
- Focused browser suite: 48 DONE cases (TH/EN/JA × 320/360/390/430px × normal/200% root text × Full/Individual). No horizontal overflow; summary/action gap at most 20px; 48px minimum controls; normal-size actions within 800px viewport. Eight English word-range checks ensure Waiting/Left/Right stay on one line at normal/200% text. Full→Speech, Individual→Result and Retry→left IDLE use original handlers with navigation intercepted before hardware. Abnormal summary body remains visible.
- Existing all-state browser harness covers 13 states × 3 languages × 4 widths × normal/200% per-element text (312 cases), including BETWEEN, countdown, measuring, retry, errors and completion, with guidance/control geometry and actual confirmation/navigation checks.
- Unchanged actual Service Worker: first-ever offline Arm visit decodes all six images and bundled CSS. Research intro pixel-identical to earlier baseline; Dev computed styles unchanged. No SW/cache migration; cached older HTML remains old until an online update delivers new atomic HTML/CSS.
- Screenshots use actual application DOM/functions with synthetic results, voice completion stubs, approved local font files and all external services blocked. No real participants, live API writes, microphone, camera or IMU acquisition. Enlarged-text checks are simulations, not physical-device/native OS font certification.

Selected before/after and narrow/large-text screenshots are in docs/ui-reviews/public-arm-completion/. The test can export all cases with ARM_REFINEMENT_SCREENSHOTS; install Playwright separately, set PLAYWRIGHT_MODULE/CHROMIUM_PATH as needed, and optionally ARM_FONT_FIXTURES to the official local font fixture directory. Generated JSON remains outside the repository.

## Remaining UAT

Real iPhone Safari/Android Chrome/Samsung Internet; native OS text size/pinch zoom; short screens, landscape, browser bars and cutouts; VoiceOver/TalkBack and keyboard order; real left/right arm posture, permissions, prompts, ten-second timing and retries; installed-PWA online upgrade/offline relaunch. Large text or lengthy safety guidance intentionally scrolls rather than shrinking or hiding clinical copy. Original embedded Thai image notation and clinical summary wording are unchanged. No deployment or merge authorized by this refinement.
