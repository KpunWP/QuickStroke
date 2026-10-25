# Phase C.1 — actual Public Result UI

**Layout follow-up:** current Public module cards are adaptive columns; see
`public-result-grid-refinement.md`. The original stacked-layout screenshots and
implementation notes below are historical.

**Asset-delivery follow-up:** see `public-result-final-review.md`. Public CSS is
now bundled atomically in Result HTML; the original external-link/cache limitation
below is historical and fixed without changing the service worker.

Base: PR #106 head `87388eb7dd39be24663e0364f66193aa72481966`.
Branch: `feat/public-result-ui-phase-c1-20261024`.
Design reference: Phase B Result at `bfa19d3bdc836efcc25ee91c67d07c7cbe04a5a2`.
This is actual Result presentation, not a simulation replacing its behavior.

## Source/state inventory reviewed before presentation changes

The existing `calculate()` defines five combined/individual summary states:
`noData`, `incomplete`, `ok`, `review`, `urgent`. Existing module classes are
`na`, `ok`, `warn`, `bad`; missing data and attempted-but-unusable data are
separate even though both can be class `na`. Technical failure, aborted/invalid
attempts, malformed legacy JSON, display/observation statuses, clinical values
and legacy risk/passed fields follow the unchanged priority in `moduleClass()`.
Numerical research scores never determine the Public combined result.

Full scope respects the existing single-positive urgent override, including a
partial urgent result before all three tests finish. Otherwise missing/invalid
checks are incomplete; three usable checks resolve through existing bad/warn/ok
semantics. Individual scope uses the requested module and never presents its
result as the combined screening. Source is query module, stored result source,
or existing single-attempt Individual inference, with existing fallbacks.

Additional existing variants remain intact: prior abnormal retained after a
normal retry; prior invalid attempts/count; same-session retry and pending
canonical retry/catchup; historical/legacy versus canonical data; malformed
storage fallback; Public ephemeral session versus canonical Research/Dev session;
finalized-session retry guards; clinic Research finalization and remote JSSF
editable, protocol-completed, recovered and finalized/terminal views. Public
presentation must not override the active/canonical mode with the selected mode
or a Public query parameter.

Existing handlers remain: module pointer/keyboard retry, Continue/remaining test,
Home, Retry all with native confirmation, language switching, locale-specific
emergency dialing/message, optional Public TTS trial, Research finalization and
remote recovery/upload. Their source bytes are frozen by a new regression test.

## Changes

`result.html` loads `assets/public-result.css` after the existing stylesheet. The
new CSS is entirely scoped to `html[data-result-public="1"]`. A small DOM-only
helper runs after existing rendering and obtains its flag from the already
recovered `isPublicResultSession()`; it never sets mode or session storage.
Research and Dev keep the legacy styles and viewport settings.

Public gets the approved Home header, font pairing/Japanese fallbacks, clinical
blue paper background, blue/amber/coral hierarchy, readable summary, stacked
Face/Arm/Speech rows and Home's icon family. Valid completion uses an additional
existing translated `{n}/3 complete` badge only for combined three-usable-check
results. Existing signs-found counts remain separately labelled. Invalid rows
retain the existing Retry status/action and add existing `validityInvalid` text
so failed assessment differs visibly from untested data. No locale packs change.

Public actions retain their real labels/handlers and are content-sized with
natural wrapping. Existing emergency controls remain at their current triggers;
urgent guidance stays within the leading summary. Existing warnings, historical
findings and diagnostic limitations are retained. Public zoom is enabled and
viewport safe-area support is added; Research/Dev viewport behavior is unchanged.
No media page, algorithm, timing, threshold, consent, research store, Supabase,
configuration, service worker or language-persistence file is changed.

## Differences from the mockup, intentionally preserving working behavior

- Existing labelled signs-found metric remains; completion is a separate badge,
  never a clinical clearance indicator. Incomplete/partial urgent count semantics
  are unchanged, including the existing partial-completion label.
- Completed Public retains Home as its primary action and native-confirmed Start
  over as secondary. The mockup's action order was illustrative; handlers are
  not reordered or replaced with a simulated flow.
- Module rows remain keyboard/click retry/start controls with their existing
  accessible names and historical messages; the visual-only mockup lacked some
  of these real controls. Invalid adds its existing explicit inability label.
- Existing locale-appropriate emergency reminder wording is retained verbatim
  rather than replacing it with the Home/mockup wording. No new safety copy.
- No synthetic-data badge is inserted into the application. Review screenshots
  use synthetic local fixtures, and their documentation explicitly identifies
  them as such.

## Validation

- `node tests/public-result-ui.mjs`: PASS. Entire baseline inline-script digest
  unchanged after removing only the authorized helper/call; Public-scoped CSS;
  zoom and mode isolation; full/individual completion/invalid presentation;
  five summary states and partial urgent/individual variants.
- Core tests: 23/23 pass. Existing sticky-abnormal/invalid history, JSSF Result
  completion and Public flow/audio regression tests pass. Inline syntax passes.
- Existing CI/local suite selection: 33/35 pass after the socket-restricted local
  mock HTTP suite is rerun with local-listen permission. No live enrollment used.
- Two pre-existing failures remain outside scope: `jssf-remote-staging.mjs`
  whitespace-sensitive `/allowExpired:isWithdrawal/` assertion;
  `jssf-remote-sync-flow.mjs:140` readiness fixture missing required collection
  phase. These are unchanged from the previously reviewed baseline.
- Actual application Chromium: 360 cases = 15 fixtures × TH/EN/JA × 320/360/390/
  430px × normal/doubled computed text. Includes no data, incomplete, unusable,
  malformed, ok, review, urgent partial/full, five Individual variants and two
  history variants. No measured horizontal text overflow, main-region overlap,
  visible controls below 48px, hidden required safety section or exposed Public
  Research/Dev panel. Vertical scrolling is intentional.
- Actual handlers exercised at intercepted navigation boundaries: fresh→Face,
  remaining→Arm, invalid→Speech, Individual retry/remaining, urgent/completed
  Home, keyboard module retry, reset cancel/confirm, language switching and
  Thai `tel:1669`; English retains non-dialing local-emergency guidance. The
  JSSF event Home→Latest Result flow is checked for English handoff.
- Recovered Research fixture (selected Public but Research snapshot) remains
  Research. Its actual baseline/current rendering is pixel-identical, with
  finalization visible and Public badge/styles absent. No finalization click,
  enrollment, remote sync or live data submissions are performed.
- New PR CI workflow targets the Home feature branch and main, running the UI
  freeze/presentation test and existing core/history/Result safety checks.

Browser evidence: `/workspace/work/phase-c1/` contains synthetic-fixture screenshots,
layout/results JSON and the environment-specific harness. Selected actual
screenshots are under `docs/ui-reviews/public-result-phase-c1/` for PR review.
Google Fonts CSS is intercepted with official local font fixtures for consistent
rendering. External service requests are blocked; no capture is started. This
is desktop Chromium testing, not physical-browser certification.

## Remaining device UAT and risks

Physical iPhone Safari, Android Chrome and Samsung Internet: font delivery and
Thai/Japanese glyph baselines/wrapping; native zoom/text scaling; 320px short
screens, landscape, browser bars/cutouts/safe areas; VoiceOver/TalkBack and
keyboard focus; emergency handoff without placing a call; native reset dialog;
back/history and installed-PWA cache refresh. The new CSS asset is not added to
the existing service-worker precache: first offline use may retain the legacy
presentation until it has been fetched/cached. Service-worker behavior is
intentionally outside this task and must be checked before release.

The source-freeze test intentionally requires review if future legitimate
clinical/Research behavior changes; do not casually update its baseline digest.
No deployment or merge is authorized by this PR. Continue after review with Arm,
then Speech, then Face using the latest Minimal Full-Screen Crystal proposal.
