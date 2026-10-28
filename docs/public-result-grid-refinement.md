# Public Result — compact adaptive module summary

Refinement of PR #108 on `feat/public-result-ui-phase-c1-20261024`, based on
`35a3e793045ffde2943e9e0d8a9b003766610d47`. The PR continues to target the Public
Home feature branch. No merge or deployment is performed.

## Presentation changes

Standard Public Result uses three balanced columns: icon, real module name,
actual status/validity and existing retry/start action. Space is reduced to 8px
between columns and 8px horizontal card padding; labels wrap instead of clipping.
The whole card remains the original keyboard/click target with its existing
role, tabindex, accessible name and handler; there is no new nested button.

The CSS grid uses an em-based minimum readable width, capped at three columns.
At 200% text it naturally becomes two columns where space permits, otherwise one.
Retained abnormal or invalid history sets a DOM-only complexity flag and uses
full-width rows, so long safety history gets adequate reading space. Invalid and
invalid-history text is also exposed via stable aria-describedby references.
No labels, clinical values, status semantics or action conditions are invented.

Completion metadata is muted, unboxed 14px text. The main interpretation remains
the heading, and the separately labelled signs-found metric stays distinct.
`3/3 complete` still counts usable checks; `0/3 Signs found` still represents the
existing signs-found count. Neither is relabelled or merged, and the existing
“does not rule out stroke” and emergency copy remain intact.

Only Public-scoped CSS and the existing DOM-only presentation helper change.
The entire baseline Result-script digest still matches after excluding that
helper/call. Calculations, counting, historical interpretation, invalid/Individual
semantics, retries/navigation, emergency actions, language resources, sessions,
Consent/Research/Supabase and all module engines remain unchanged. Research/Dev
styles are excluded by the resolved session-mode flag.

## Validation

- 360 actual Chromium cases: 15 states/scopes/history fixtures × TH/EN/JA ×
  320/360/390/430px × normal/doubled computed text. Geometry and real handler
  checks pass with no clipping, main-region overlap or undersized card targets.
- 192 additional native-root-text cases: eight representative outcomes × three
  languages × four widths × 100/200% root font size. Executed with system fallback
  fonts and again with official local Plex Thai/Manrope font fixtures. Asserted
  columns, >=48px targets, role/tabindex/names, referenced descriptions and Space
  activation of the original retry handler. Enter activation passes separately
  in the main Result harness. This is not physical screen-reader certification.
- Standard no-sign/review/urgent/invalid/incomplete/Individual: three columns at
  all four widths. 200% text: one column at 320/360/390px; two at 430px. Historical
  abnormal/invalid fixtures: one column at all widths and sizes.
- Original Continue, Home, module retry, reset cancel/confirm, Thai `tel:1669`,
  English local emergency message, language switching and JSSF Home→Result English
  handoff remain functional, checked before entering real media acquisition.
- Repeated EN→TH→JA→EN, 36 rebuilds, away/back and three distinct icon identities
  pass without duplicated completion/invalid/history labels or icons.
- Actual unchanged service worker: fresh install/first Result offline and existing
  v101 cache online-refresh→offline cases pass. CSS remains bundled atomically
  in HTML and byte-equal to `assets/public-result.css`. No SW/cache-version change.
- Protected Research recovered view remains pixel-identical to baseline; Dev
  computed styles remain unchanged. Core 23/23, UI script freeze, sticky-history,
  JSSF Result completion and inline syntax checks pass.

Browser tests: `tests/public-result-grid.cjs` and the existing final-review browser
suite require separately installed Playwright/Chromium. `PLAYWRIGHT_MODULE` and
`CHROMIUM_PATH` select local installations. Optional `RESULT_GRID_FONT_FIXTURES`
points to official font fixture files; `RESULT_GRID_SCREENSHOTS` writes actual
captures outside application logic. Network/service requests are blocked; all
screenings are synthetic Public fixtures. No live Research enrollment/submission.

Selected normal and fallback screenshots are in
`docs/ui-reviews/public-result-grid/`. Normal font rendering uses official local
fixtures; Japanese uses system fallbacks. The screen captures are real Result
HTML, not prototype simulations. A contact sheet labels the synthetic fixtures.

## Remaining UAT

Physical iPhone Safari, Android Chrome/Samsung Internet; native font settings and
zoom, VoiceOver/TalkBack name/description order, Thai tone marks and Japanese
wrapping, Google Fonts delivery/offline fallback, touch reach, landscape/browser
bars/safe areas, native reset and dialer handoff without placing a call, and
installed-PWA refresh/eviction remain device UAT. Existing offline HTML must
connect once to receive the new layout. Two-column final rows may contain one
card; no information is hidden to create a visually complete grid.

The prior two broad baseline failures (remote-staging whitespace assertion and
remote-sync-flow collection-phase fixture) remain unrelated and unchanged. No
new failure occurred in this refinement's targeted checks. Arm PR #109 and all
module implementations are untouched by this Result-only change.
