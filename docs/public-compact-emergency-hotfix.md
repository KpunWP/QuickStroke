# Compact Public emergency hotfix

Base: released main 9ae7b0f2aa340bba2aecc125b7d41d8c60558d11.

## Cause and behavior

The helper previously used `jssfExhibition` alone to choose compact presentation.
Ordinary Public Home and disclaimer, and Public Result, now explicitly request
`publicCompact`. Research/Dev calls retain their existing rendering path.

Public shows one country-labelled telephone action, a native expandable
“Change country” selector, and existing localized other-country guidance.
Outside JSSF the initial preset is always Thailand / 1669, regardless of UI
language. This is a visibly named preset, not location detection. Users must
choose Japan / 119 if appropriate, or contact local emergency services elsewhere.
In JSSF the existing TH→Thailand / EN,JA→Japan defaults remain until an explicit
country selection is made. An explicit choice always wins over language/event
presets. It is shared by Home and disclaimer, retained through Result and return,
and stored only in this tab under `quickstroke_public_emergency_country`.
Invalid stored values are ignored. Blocked storage falls back to in-memory
selection. No geolocation, network transmission or Research enrollment is added.

Both telephone target and visible/accessibility labels are derived from the same
TH/JP destination record. Selecting a country never starts a call. Link,
country-switch summary and native select have minimum 48px targets. Other-country
guidance and existing non-diagnostic/emergency warnings remain visible.

## Boundaries and cache

Only runtime files: index.html, result.html, js/emergency-contacts.js and
service-worker.js. Atomic inline helper copies support cached/offline HTML.
Shell cache increments v104→v105 so returning clients receive the new presentation.
Locales, module HTML, recordings, mapping/manifest, algorithms, audio, session
navigation, Research Consent and remote-data policies are unchanged.

The exact reversible presentation substitutions are inventoried in
`tests/fixtures/compact-emergency-patch.json`; new contracts restore whole files
to the released baseline, retaining all existing engine golden checks. Legacy
helper tests still validate Research/Dev rendering; browser checks exercise the
new Public path directly, including manual selection and language changes.

## Physical UAT before release

On iPhone Safari and Android Chrome, open the Preview ordinary URL in a fresh
context, then JSSF entry separately. In TH/EN/JA check Home/disclaimer and normal
and urgent Result. Select Japan and Thailand, change language, reload and return;
confirm choice stays explicit, shared and correct. Expand/collapse the selector,
check keyboard/native-picker accessibility and 200% text on a short screen.
Never place an emergency call; inspect/intercept or cancel telephone navigation.
Verify v104→v105 update followed by offline reload on the same hostname. Existing
Face cold start/audio, Speech Retry/countdown audio and Arm illustration issues
remain unresolved. No Preview/Production deployment or merge is authorized here.

Local validation: 48 release contract suites pass; original emergency matrix 144 cases plus 48 country-control layouts at 320/360/390/430 and 100%/200% text. Explicit-choice precedence, reload, Result return and both Home/disclaimer instances tested. Keyboard focus targets, blocked/invalid storage, nonPublic helper behavior and old-v104 to v105 offline update covered. No calls or external submissions. GitHub CI and physical-device acceptance are reported separately in the Draft PR.
