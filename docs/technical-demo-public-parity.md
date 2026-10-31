# Technical Demo: approved Public presentation, Dev execution

Baseline: `bde5ead8904a8a9fe385a5b45b842d89a0ff3a29`, Draft PR #131.
This is a presentation revision, not a mode conversion or deployment authorization.

## Impact audit and gate inventory

Locations below refer to the updated working tree; named functions are the stable anchors.

| Page/source | Gate / locations | Classification and treatment |
|---|---|---|
| `index.html:506–524` | `qsStaffEntry` from explicit staff URLs; staff controls | Mixed entry/recovery policy. Original marker and entry logic retained. Demo gets a separate CSS marker; its mode selectors remain out of the visitor-style primary view. Existing DEV MODE badge remains. |
| `index.html:1226` | `isOrdinaryPublicHome`; calls at 1232/1240/1249/1285 | Public language/event preference and pageshow behavior, not just appearance. Unchanged. |
| `index.html:1462` | Local `ordinaryPublic` in `updatePublicHomePresentation` | DOM-only overview, content-based CTA hierarchy, reset disclosure/copy and accessible labels. Expanded to eligible Demo only. Original `isOrdinaryPublicHome` is not expanded. |
| `index.html:860/954/1025/1069/1310/1314/1318/1341/1352/1362/1433/1616` | TTS opt-in, mode selection, session initiation, completed-session handling, Research recovery, alerts and staff-to-Public entry boundary | Behavioral or mixed. All preserved, including the original Home-return policy. |
| `index.html:1297/1300` | Emergency renderer `publicCompact` / JSSF arguments | Country preference and emergency actions are coupled to these flags. Unchanged; Dev retains explicit country choices. No country inference added. |
| `face-test.html:1800` | `publicFacePresentation`, `facePublic`, mesh exclusion, viewport | Original Public mode marker retained. Separate Demo selector reuses the exact approved inline CSS. No video/canvas selector changes. |
| `face-test.html:3525/5482` | `applyFaceLang` accessible Home/Retry labels; locale-failure display | Display only. Demo reuses existing Public labels, with no locale or recording edits. |
| `face-test.html:5505` | Startup presentation observer | Read-only projection of FL/modelReady/isCameraRunning/phase/quality flags. Enabled for eligible Demo, with an additional eligibility check during refresh/teardown. No readiness, acquisition or state transition writes. |
| `arm-test.html:1710` | Public mode marker / viewport | Original marker retained. Approved Public CSS projected onto separate Demo marker. |
| `arm-test.html:1887/4353/5188/5246` | Inline approved guide images; guide alt/aria; locale-error copy; Home aria | Display/assets only. Demo uses the identical approved illustrations and copy. No posture/timing/audio changes. |
| `arm-test.html:4799` | Public attempt/history projection | Behavioral persistence policy. Unchanged. All side confirmation, readiness, sensor, calibration, measure and completion handlers are unchanged. |
| `speech-test.html:1018` | Public mode marker / viewport | Original marker retained; separate Demo CSS scope. |
| `speech-test.html:1546/1572/2840/4438/6340` | `speechUiText`, screen/aria/safety labels, error and recovery DOM text | Display only. Existing Public Power Words and visible non-diagnostic note reused. No translation resources changed. `speechUiText` consumers write UI text, never ASR configuration or spoken cue inputs. |
| `speech-test.html:1258/1265` | `PUBLIC_SPEECH_TTS_TRIAL`, `PUBLIC_IOS_SPEAKER_FIRST` | **Audio lifecycle policies, not visual gates. Unchanged and false in actual Dev.** Research-only iOS/Android policies are also unchanged. |
| `speech-test.html:5070` | Actual app mode in canonical result/session projection | Behavioral data policy. Unchanged. `handleAction`, gesture Retry, startRecording, recognition callbacks, cleanup and countdown are unchanged. |
| `result.html:1252` | `isPublicResultSession` / recovered effective mode | Mixed clinical/history/navigation/TTS policy. Unchanged. |
| `result.html:1425/1435/1452/1881/2278/2885/2937/2943/3405/3485` | Public historical retention, module data, TTS and remembered findings | Behavioral. Not widened to Dev. Actual result interpretation, completion and persistence remain mode-specific. |
| `result.html:2244/2354/3525` | Emergency presentation/country policy; locale failure | Mixed or safety-related. Unchanged; Dev emergency country choices remain explicit. |
| `result.html:3313` | `updatePublicResultPresentation` | Pure DOM presentation: icons, quieter completion metadata, adaptive/complex card layout, validity/history accessibility, viewport. Demo included locally. `resultPublic` still reflects the true Public mode, never Demo. |
| `js/app-mode.js:107/112/127/241`, `js/data-contract.js:244/256/330`, `js/dev-mode.js:254` | Session snapshot precedence, role, mode changes, storage/submission boundaries | Unchanged byte-for-byte. No resolveMode substitution, session rewriting, Research enrollment or new persistence. |
| `assets/public-{face,arm,speech,result}.css` and mirrored inline styles | Explicit `html[data-*-public="1"]` selectors (Home uses `qsStaffEntry="0"`) | All existing CSS/assets unchanged. The helper copies only these selector rules, including nested responsive rules, into a Dev-only stylesheet. Unscoped legacy rules and Public markers are not changed. |

| `js/languages.js:76–96`, `js/emergency-contacts.js:77`, `js/research-policy.js:359`, `js/research-store.js:46` | Public explicit-language persistence, compact emergency/country preference renderer, role validation, store mode | Behavioral/mixed. All unchanged; the new visual marker is not used by any of these helpers. |

## Implementation

`js/demo-public-presentation.js` uses the same strict eligibility boundary as the accepted Technical Demo: Dev enabled, resolved Dev, `engineering_only`, and no Public/Research session context. It projects the existing inline Public CSS to `data-demo-presentation=<page>` without marking Dev as Public. A no-op static helper is loaded in other modes; no stylesheet, marker, polling, media, storage or data request is created there. Eligibility loss removes the projected styles and restores the viewport.

The five HTML pages extend only the inventoried display gates. Exact ordered reverse-patch fixtures recover every byte of the accepted baseline pages; the existing boundary test additionally recovers the frozen Public baseline. Mode helpers, Service Worker, locales, scoring and audio assets are unchanged.

The accepted Technical Data adapters and values remain the data source. Legacy Dev-only Arm/Speech layout compensation is limited to legacy presentation so it cannot override the reused Public flow. Face keeps the original mesh button/handler and places it beside Show/Hide; both have 48px targets. Only its visual glyph is compact; its accessible name still announces Mesh ON/OFF. Face field wrapping and internal scrolling preserve readable enlarged text. Dock collision checks account for clipped instruction-panel content; no video/canvas is moved or resized. The central 28–74% region and painted controls/instructions remain excluded. The pre-existing temporary-hide policy remains for a viewport with no safe slot at all.

## Deliberate boundaries / risks

- **Medium visual UAT risk; low engine-change risk.** CSS now reaches Dev, so actual Safari camera painting, mesh alignment, browser chrome and operator reachability must be reaccepted. Chromium is not physical Safari evidence.
- Home and Result reuse the approved hierarchy/styles/icons. Their genuine Dev language, recovery, history, TTS and emergency-country policies remain Dev policies. Completed Dev Home retains its genuine View Result label/handler, rather than mislabelling that action as Public Test Again. In particular Dev keeps explicitly labelled country choices; this patch does not apply Public emergency defaults or Public history writes to engineering sessions.
- Existing module Home buttons lead to ordinary `index.html`; that entry can deliberately select Public through the existing safe staff/Public boundary. Use the explicit `index.html?dev=1` bookmark to re-enter Demo. Full module navigation remains engineering-only. No navigation or access policy is rewritten to achieve visual parity.
- `dev=1` is not authentication. A separately authorized protected immutable Preview is required. No project, deployment, protection setting or Production alias is changed here.
- Existing known Face cold-start/voice, Speech audio/Retry and Arm illustration issues are not fixed or reinterpreted by this presentation patch.

## Validation and evidence

All fixtures are synthetic and local. No camera/model/microphone or remote Research submission is used. Original UI handlers are exercised at explicit test-only hardware boundaries.

- 49 existing local source/core suites, including 23 core cases; new presentation source/privacy/128-case gate matrix; inline script parsing.
- 72 Public-versus-Demo style comparisons: TH/EN/JA × 320/360/390/430 × 100/200% text, actual page DOM and strict mode/role checks.
- 36 Home/Result cases: TH/EN/JA × 320/390/430 × normal/enlarged text, including complex historical result layout.
- 144 Face scalar cases: loading, ready, still/countdown, smile, completion, Retry; actual existing onResults-to-scalar bridge with synthetic inputs, lost/reacquired/stale tracking, unavailable smile evidence, scrolling and Show/Hide.
- Existing 72 Demo layout cases, 12 Public/Research old/new comparisons, 8 Speech first-plus-three-Retry callback replays with desktop/iPhone UA profiles, permission and ASR failures.
- Original Face Full→Arm / Individual→Result / Start/Retry dispatch and Arm intro/left/right/retry/completion/navigation checks. Acquisition/audio boundaries are substituted only in the local test responses.
- Public Face subset (72 layouts plus original navigation/Research pixel comparison/offline checks) and Public Arm completion suite. Complete original suites run in GitHub CI. The legacy Speech browser, Face startup and Power Words isolation assertions now explicitly require Public visual/copy parity in actual Dev; Research still requires its original text and pixel-identical layout. The initial CI failures at those assertions were outdated Dev-presentation expectations, not acquisition or scoring failures.
- Screenshots use existing IBM Plex Sans Thai and Manrope fixtures, plus official Noto CJK Japanese review-only fonts. Fonts and runtime fixtures are not committed. CI without this optional fixture directory uses its installed fallback fonts.

See `ui-reviews/technical-demo-public-parity/comparison.png`: accepted legacy Dev (left) versus Public presentation + Technical Data (right), at 390×844 CSS px, local Chromium screenshots captured at 2× device scale; the labelled contact sheet is resampled to CSS-pixel size and palette-compressed for portability. Face portrait/mesh and all sample values are synthetic. A viewport crop does not imply below-fold controls or graph are absent; Arm/Speech data remain reachable by scrolling.

Live-service remote smoke/staging scripts are not release evidence here. An attempted remote HTTP smoke could not resolve its service hostname; it was excluded rather than treated as a local pass. The optional `jssf-remote-sync-flow.mjs` is not part of this patch's local run. No live Research data is submitted.

## Cache and offline

Public SW v108 stays byte-exact. Demo styles use `demo-public-presentation.js?v=20261031-v1`; the updated Technical Data helper uses `technical-demo.js?v=20261031-demo-v2` to avoid pairing a newly refreshed page with the older overlay layout. Existing stale-while-revalidate behavior and warm online→offline reload are tested for both resources. First-ever offline Demo/model/ASR availability is not promised. An old cached HTML document can remain old until its normal online refresh; visit all pages online and reload before judging.

## Required protected-device UAT

1. Fresh protected context, explicit Dev Home. Confirm DEV MODE and engineering-only role; Public and Research tabs must not display Technical Data.
2. Face cold and warm entry: Public startup/ready; original manual Start; centered countdown; full camera + aligned real mesh; live pose/asymmetry, loss→—, completion, Retry; Show/Hide and mesh toggle. Check short screens and 200% text without obscuring instructions or actions.
3. Arm: correct left/right posture, original durations/audio, Public guides/countdown/completion; current/max phone drift and graph reachable by scrolling; three Retries. No claim about anatomical arm angle.
4. Speech: Public Power Words/safety note, actual target and browser transcript, microphone/ASR status, completion and three manual Retries, immediate/delayed Retry, permission denial/recovery. No extra microphone request may come from overlay interaction.
5. Full and Individual flow, TH/EN/JA, normal/enlarged portrait, iPhone Safari and Android Chrome. Use explicit Dev bookmark after returning to ordinary Home.
6. Online warm-up, reload, offline-after-update; do not make emergency calls or enroll Research participants.

Stop before Preview deployment or merge. Physical-device acceptance is required for this revised presentation.
