# Result emergency presentation correction

Baseline: Draft PR #131, `7942ebb283de0ae8d24af97016780c78e1ac89ce`.
Public main / Production remains `82cf095eaf47581283cdf28b789d80a48fc90268`.

## Root cause and exact patch

The approved Demo presentation retains real Dev / engineering_only mode. Result's two emergency calls still passed `publicCompact: isPublicResultSession()`, unlike the already-corrected Demo Home. They therefore rendered the legacy expanded TH/JP choices.

Only those two lines in `result.html` change: `publicCompact` now accepts `isPublicResultSession() || globalThis.QuickStrokeDemoPresentation?.enabled?.() === true`. This applies to urgent `#emergency-action` and non-urgent `#emergency-reminder`. Both calls follow `await ensureResultDataContext()` in `buildResult()`. No actual session predicate, recovery code, country helper or existing `jssfExhibition` expression changes.

Strict Demo eligibility still requires Dev enabled, actual Dev mode, engineering_only role and no Public/Research contract context. Research and ineligible Dev retain their previous emergency presentation. Country-labelled Public presentation is otherwise unchanged.

Fresh presentation defaults: TH → Thailand 1669; EN/JA → Japan 119. These are presentation presets, not detected location. The existing tab-scoped explicit country choice takes precedence, including after language switching, reload and navigation. Other-country advice and existing safety text remain. No telephone navigation is executed during testing.

## Runtime boundary

`result.html` is the only changed application file, with precisely two condition extensions. Helpers, locales, CSS, Service Worker v108, emergency MP3, Face/Arm/Speech, technical values, approved Debug/Copy Log controls, audio, camera/ASR lifecycles, scoring, interpretation, warnings, navigation and Research data handling remain byte-identical.

Supporting changes add an exact two-line restoration fixture and focused source/browser tests, extend existing restoration fixtures and adapt their frozen-source checks, update the existing emergency browser expectation for eligible Demo, and run the new tests in the existing Technical Demo workflow. These preserve all old engine/privacy checks rather than updating engine hashes or weakening them.

## Automated coverage

- Two-line allowlist against the exact baseline; all other runtime bytes frozen.
- Actual Result build/summary/reminder: Public and Demo, TH/EN/JA, urgent/non-urgent, Full/Individual, 320/360/390/430px, normal/200% text: 192 layout cases.
- Single visible country-labelled telephone action, accessible labels, Change Country, 48px targets, no overlap or horizontal overflow.
- Explicit TH→JP and JP→TH selection; language changes, 24 reload/history cases, Home↔Result continuity with and without JSSF flag.
- Research and ineligible Dev emergency DOM compared against the original revision; Research session context remains ineligible even with a stale Dev flag.
- Interpretation and warning strings remain unchanged after switching country/language; existing core, Result, emergency, language, Demo and offline suites remain required.

All browser testing uses local Chromium and synthetic session fixtures; external requests are blocked. No real camera/microphone input, emergency calls or live Research submissions. Physical Safari and Android acceptance is separate.

## Focused Director UAT

In the new immutable protected Preview, enter a fresh Dev Home (`index.html?dev=1`) and use Result from the existing demonstration flow. With no manual country, verify TH shows Thailand · 1669 and EN/JA shows Japan · 119. Verify one primary action, Change Country both ways, explicit choice surviving language/reload/return, concise readable safety warning and other-country guidance. Check urgent and non-urgent presentation using existing safe synthetic fixtures only; never fabricate participant findings or place real emergency calls. The unaffected six-category physical acceptance is not replaced by automated tests.

PR #131 remains Draft, open and unmerged. Preview only; no Production release, settings change or tag.
