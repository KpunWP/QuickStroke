# Country-explicit emergency guidance — review and device acceptance required

Base PR #122: 262f8b5b46d7c3e5c7612a6e53d0ef1349bcd3b6.
Branch: fix/jssf-country-explicit-emergency-20261027.

## Scope and behavior

Home, its first-use disclaimer and urgent/nonurgent Result now show both country-labelled ambulance links in TH/EN/JA: Thailand 1669 -> tel:1669; Japan 119 -> tel:119. Other countries are directed to local emergency services without guessing a number. No country default, geolocation, locale-based destination, cookie or country preference is introduced. Language changes only label wording. Native links retain keyboard/screen-reader access and 48px targets.

Removed Home's Thai-only card activation and Result's language/config-derived emergency phone selection. All modes receive the same explicitly labelled links. Clinical interpretation, scoring, module retry/navigation and Research finalization are unchanged. The existing Research Consent paragraph and its explicitly Thailand-qualified tel:1669 link are unchanged; only the shared audio/i18n script version references on that page advance.

Unqualified Thai warning suffixes on Home/disclaimer/Face/Arm/Speech now say contact local emergency services immediately. Clinical observation prefixes remain. Arm's hidden legacy language-screen disclaimer is similarly neutral. EN/JA warnings already use local-emergency guidance. Result's retained Thailand-specific translation is explicitly qualified as Thailand.

## Supplied recording

New asset: audio/th/arm_11_alert_local_emergency_v2.mp3.
User-supplied transcript:
"อาจพบแขนตก หากสงสัยสโตรก ติดต่อบริการฉุกเฉินในพื้นที่ทันที"

31,104 bytes; MP3; mono; 24,000Hz; duration 5.184 seconds. FFmpeg decoded the complete file without error. Automated hash checks pin the uploaded bytes. Original audio/th/arm_11_alert.mp3 is not overwritten; it is retained as an unreferenced historical asset, never selected by the current mapping.

IMPORTANT: container/decode/hash checks do not establish intelligibility, pronunciation, completeness or spoken absence of 1669. No automated transcription or listening verification is claimed. Human listening acceptance is still required before release.

The Thai locale, player mapping and sidecar manifest use the reviewed neutral sentence and new filename. A compatibility alias routes the old exact Arm alert sentence to the NEW recording, never the old clip. The same exact old sentence is neutralized for native Thai TTS before the existing pronunciation normalization. Other Thai pronunciation, EN/JA text and all other cue mappings remain unchanged. Player use/play/stop/unlock functions remain byte-identical to base; platform routing, timeouts, callbacks and audio lifecycle are unchanged.

No new Face cue, Face audio lifecycle, Speech Retry, ASR, IMU, timer, posture sequence, thresholds or navigation behavior is introduced. Face/Speech changes are warning resource delivery references only. Normal instructions and recordings remain unchanged.

## Cache migration

- locale asset version: 20261027-emergency-v2.
- shared i18n script URL version: 20261027-emergency-v2.
- recorded player script URL version: 20261027-local-emergency-v2 on all consumers.
- recorded-audio cache v3 -> v4.
- SW app cache v101 -> v102; add the NEW MP3 to mandatory offline assets.

SW install/update/activation logic, model caching and audio Range handling remain unchanged. Mandatory pre-cache failure prevents installation of an incomplete v102 cache. The unique MP3 path avoids existing audio matching with ignoreSearch:true; query-only audio versioning would not suffice. The new cache is prepared before existing activation cleanup; no IndexedDB/research/session data is cleared.

Returning-PWA test installs the actual old SW/resources from the base revision, seeds an old v3 audio canary, updates to the new SW/resources online, reloads, then verifies the new bytes and neutral Thai locale offline. A session sentinel must survive. This verifies the completed upgrade path, not every interrupted migration.

A device still running an OLD app/SW entirely offline can retain old guidance. Update online while idle and reload before JSSF use; do not update in the middle of measurement. Never claim remote changes retroactively correct an unupdated offline installation. Test old/new worker transitions and failed downloads on devices before release.

## Automated validation boundaries

New tests cover destination/label consistency, language independence, modes, duplicate-free rendering, intercepted telephone activation, minimum target sizes, enlarged text, source/manifest/native-TTS agreement, legacy-transcript alias, new MP3 hash and original recording hash, non-emergency config/translations and exact player lifecycle code. Existing frozen-engine, module, language, navigation, privacy and PWA checks remain. Tests normalize only explicitly approved emergency rendering sections/resource URL updates; other Result scripts remain pinned to the approved baseline.

No real telephone calls, participant enrollments, Research sync or live-service tests are performed. Browser media fixtures and mocked Audio are NOT physical-device playback acceptance.

## Physical UAT on the final PR SHA (requires separately authorized Preview)

1. Human listening: play the supplied NEW file end-to-end. Confirm exact reviewed sentence, intelligibility, correct pronunciation, no clipping, no spoken 1669, and acceptable volume. Record reviewer and outcome. Do not approve solely from manifest text or successful decode.
2. iPhone Safari and Android Chrome (Samsung if available): exercise actual abnormal Arm completion with an approved synthetic/demo fixture. Verify native Thai TTS and recorded route separately; neither may speak 1669. Do not alter real sensor thresholds to force a result.
3. Compare normal Arm cues, left/right order, holds/countdown, completion/Retry and Full->Speech / Individual->Result. Face/Speech audio behavior must remain unchanged; known iPhone Face silence and Speech Retry remain unresolved.
4. Home/disclaimer/Result in TH/EN/JA: verify both country names/numbers, local-services message and 48px controls at 320/390/430-class widths and 200% text. Use blocked/intercepted telephone navigation, NEVER a real emergency call.
5. Check urgent/nonurgent/incomplete/historical Result and Public/Research/Dev; Consent Thailand qualification and protected recovery must remain intact. Do not submit live Research data.
6. Returning PWA: update online while idle, reload, verify versioned resources/new recording; repeat offline. If new asset download fails, do not certify the device updated. Do not clear participant data as a workaround.

No merge, Preview/Production deployment or release tag is authorized here. PR #122 and main must remain unchanged. Native Japanese label editorial review and all physical/audio acceptance remain release gates.

## Local evidence

38 selected source/contract commands passed (including core 23/23). Synthetic Chromium module checks passed: Face 432, Arm completion 48, Speech 336, Result grid 192 and Public language/back/forward/reload isolation. Emergency browser matrix passed 72 cases with zero telephone calls; both normal and 200% text were checked. Actual base SW v101 -> v102 update preserved the session sentinel, removed the old app cache, warmed recorded cache v4, and read the new 31,104-byte MP3 offline with SHA-256 b99907a9d1c0b7d78302a145131c7ab2672d2a16ec9b15e4e965bb23567a4f7d while an old v3 audio cache was still present. This establishes byte delivery/routing, not spoken-content acceptance.
