# Public Home Phase A.1 review — 24 October 2026

Design reference: approved Phase A Public Home on PR #106, base commit
`80f6a15b216f79242cfbd135b617d38cbd5bee2f`.

## English entry decision

Use `index.html?event=jssf2026` for an explicit exhibition entry. No hostname
heuristics, global default changes, build environment variables, or project
settings are needed. The ordinary URL retains the existing default (`th`) and
legacy language behavior. The event URL can also be used deliberately on any
origin; this is entry-specific, not an origin-level Preview restriction.

Only ordinary Public Home, after the existing safe mode transition succeeds,
activates `quickstroke_public_event=jssf2026` in sessionStorage. A fresh event
entry ignores inherited `fast_lang` (including Consent/Research values) and
starts English. A visitor's explicit Home/disclaimer selection is stored in
`quickstroke_public_home_language`; automatic initialization is not recorded as
an explicit choice. A Home choice already made in the current tab also takes
precedence when the event entry is subsequently opened. Unknown entries and
invalid choices do not activate an alternative language.

The event flag survives same-tab reloads, module returns and existing screening
reset operations. A genuinely fresh tab/session starts English again; browser
session restoration/tab duplication can copy sessionStorage. There is no new
cross-tab or permanent visitor preference. Home still writes the selected
language to `fast_lang` using its existing locale loader, so all four downstream
pages keep their existing language handoff. Shared i18n/localStorage behavior
is unchanged. No module language handlers were edited; this dedicated preference
records choices made on Home/disclaimer, not choices made inside a module. If a
module language is changed independently, returning to event Home restores its
Home/disclaimer choice (or English default).

Staff entry URLs and protected Research recovery bypass the event-language
policy and retain their original language path. Consent/enrollment and Research
code remain unchanged. Event entry is not a Research sandbox: live services may
still be configured. Use fresh private tabs, ordinary entry, and no enrollment.

## Home and Disclaimer audit

No additional visual changes were warranted. Existing logo/header, three-language
picker, Plex Thai/Manrope/Japanese fallback typography, Face/Arm/Speech overview,
content-width Play CTA, status hierarchy, Full/Individual selection, Latest
Result and reset confirmation are retained. Screenshots were inspected for
English Fresh, Japanese Completed at 320px/doubled text, and Thai Disclaimer;
tone marks and text were readable without visible clipping in those renders.
Warnings and diagnostic limitations were not edited. Thai retains `tel:1669`;
English/Japanese retain the existing instruction to contact local emergency
services without initiating a Thai-number call. The exhibition locale change
does not introduce a Japanese emergency number or new safety copy.

## Validation

- New `node tests/public-event-language.mjs`: PASS. General default; inherited
  language isolation; TH/EN/JA choices; reload/return; protected/staff isolation;
  invalid inputs; unchanged downstream language readers/initializers executed
  with inert loaders for Face, Arm, Speech and Result.
- Existing `node tests/public-home-redesign.mjs`: PASS.
- `python3 tests/check-inline-scripts.py` and `git diff --check`: PASS.
- Existing local CI selection: 35 suites, 33 pass after the localhost-only HTTP
  suite was rerun with permission to bind its local socket. That suite uses
  mocked storage, not live Production records. Core/frozen algorithms and the
  Public, Arm, Speech, research lifecycle/isolation suites are included.
- Two unchanged, previously documented failures: `jssf-remote-staging.mjs`
  expects `/allowExpired:isWithdrawal/` but the source contains spaces;
  `jssf-remote-sync-flow.mjs:140` expects readiness from a fixture missing the
  required `dataCollectionPhase`. Neither failure was fixed in this UI task.
- Local desktop Chromium: 168 layout cases (TH/EN/JA × 320x568, 360x800,
  390x844, 430x932 × Fresh/Incomplete/Completed/invalid/Individual/reset/
  disclaimer × normal/doubled computed text): PASS. No measured horizontal
  overflow, out-of-viewport text, overlapping main regions or controls below
  48px in those Public Home/dialog cases. Dialog acceptance remains scrollable.
- Actual Home handler checks: Full fresh/incomplete/invalid/completed routing,
  same/new-session behavior, Individual, Latest Result, reset cancel/confirm,
  completed reset disclosure, Home/disclaimer language controls and acceptance,
  emergency keyboard handoff, four staff URLs and protected Research recovery:
  PASS. Navigation was intercepted before module media startup.
- Browser event cases: fresh entry with inherited JA becomes English including
  Disclaimer; all Home/disclaimer choices survive reload; query-free return
  resists contaminated `fast_lang`; staff retains its original language: PASS.
- Browser page errors: none. External service requests: blocked; none observed.
  Official local font fixtures substituted for the Google Fonts stylesheet for
  deterministic rendering. This does not verify real Google Fonts delivery.
- Evidence outside source: `/workspace/work/phase-a1/browser/` screenshots,
  `layout.json`, `results.json`; existing-suite report at
  `/workspace/work/phase-a/phase-a1.json` (socket-blocked attempt plus separate
  successful local HTTP rerun).

These are automated desktop Chromium checks, not physical smartphone tests.
No live research enrollment, synchronization, or module capture was performed.

## Remaining device UAT and release boundary

Check iPhone Safari, Android Chrome and Samsung Internet on real narrow/short
phones: native font scaling/zoom at 200%, Thai tone marks/Japanese fallback,
dynamic browser bars, portrait/landscape and safe areas; keyboard/screen-reader
picker and dialog interaction; real dialer handoff without placing an emergency
call; font delivery; back/reload/session-restoration and installed-PWA cache
refresh. Verify Home-to-module/Result language visually on devices without
changing Research consent settings. Japanese editorial review remains advisable.

Ready for local final UAT of this change; not deployed UAT. The existing Preview
still runs `80f6a15...`, so adding the event query to it will NOT activate this
new behavior until a separately authorized update is deployed. No push or new
Preview deployment is performed here. Do not merge or deploy Production without
explicit approval.

## Phase B inventory — source inspection only, no page modifications

Common carry-forward: calm clinical blue, existing font pairing with Japanese
fallback, consistent icon strokes/radii, 48px targets, text enlargement and safe
areas, one dominant permitted action, concise existing instructions, persistent
emergency/diagnostic guidance and explicit separation of Public/Research states.
Usability concerns below are source-derived risks, not newly reproduced device
bugs.

| Page | Existing presentation and usability risks | Protected coupling | Order / risk |
| --- | --- | --- | --- |
| Result | Summary/metric card, module grid, next-step and emergency sections, optional technical disclosure, mode-specific finalization/submit areas. Dense summary and several actions can compete on small/enlarged screens; viewport currently disables zoom. | Existing conclusion/score rendering, incomplete semantics, mode filtering, finalization/submit states, retry/session handlers and persisted/recovered result readers. Never restyle submission as merely viewing a result. | 1 / medium: first isolate Public presentation with synthetic result fixtures; preserve every Research action and urgency trigger. |
| Arm | Guided left/right flow with step dots, status cards, guide image, central instruction, countdown and bottom action. Many layered CSS overrides, fixed viewport/hidden overflow and small secondary labels create short-screen/text-expansion risk; zoom disabled. | IMU permission/calibration/orientation, stability/drift thresholds, countdowns, hand-side progression, guide/audio synchronization, completion/cleanup. Illustration placement must not change measurement interpretation. | 2 / high: inventory idle/permission/guide/calibration/countdown/hold/retry/completion before scoped CSS. |
| Speech | Large word/prompt, mic/frequency indicator, status/countdown, result banner, bottom action and developer diagnostics. Absolute top/bottom regions and clipped viewport can crowd warnings/large text; zoom disabled. | Gesture-based mic acquisition, prerecorded/TTS cues, ASR/recorder handoff, timers, retry cancellation, cleanup and navigation finalization. Do not change prompt/audio text. | 3 / high: validate every listening/countdown/retry/error transition with existing audio contracts before presentation work. |
| Face | Live video/canvas anchor with top status, pose guides, countdown/smile prompt and bottom controls. Many absolute overlays at shared offsets make overlap/bright-camera readability risky; crystal treatment must reserve separate UI regions. | Camera lifecycle, video/canvas geometry/mirroring, landmark mapping, pose/gates/thresholds, countdown/capture and retry cleanup. Crystal rim only on noninteractive decoration; no acquisition resize/crop/transform. | 4 / very high: build a complete state/geometry map before any visual edits; real-camera bright/dark device UAT mandatory. |

Do not migrate framework or make shared media/navigation refactors during Phase
B presentation work. Each page needs a separate authorized implementation and
state-specific regression review.
