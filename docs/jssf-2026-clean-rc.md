# JSSF 2026 clean consolidation candidate — NOT RELEASE APPROVAL

Main base verified: fab140481ebcab7f6b32657dd4d4f8c1ad9299b6.
Accepted source: 2c0d3b868386c3324c5efc59d58983335af5a66e.
Branch: release/jssf-2026-clean-rc-20261027; intended PR base: main.

## Integration and diagnostic cleanup

Created from verified main and fast-forwarded to the exact accepted source. Main is its ancestor (zero main-only commits); no independent remerge of patch-equivalent PRs #109/#110. All 21 source commits and their UI remain in ancestry.

Removed only the opt-in Face layout loader, js/face-layout-debug.js, api/face-layout-debug-gate.js, their diagnostic workflow and diagnostics-only tests/formatter fixtures. This removes all A/B CSS injection, controls, clipboard/report collection and Preview gate runtime, including under faceLayoutDebug=1. Historical notes remain documentation, not executing instrumentation.

Replaced diagnostic-runtime tests with tests/release-diagnostic-cleanup.mjs: require helper/API absence and exact accepted Face HTML after removing ONLY the loader. Retained frozen engine/script, ancestor-layout, startup, completion, navigation, Research/Dev and atomic offline CSS checks. Updated one frozen DOM hash to reflect loader removal; no engine/privacy assertions relaxed.

No Arm layout, Face audio, Speech retry, clinical thresholds, sensor/model, session, Research/Consent, Supabase, model assets, Service Worker or project settings change.

## Emergency audit — BLOCKER, no partial implementation

Clickable runtime inventory:
- index.html updateEmergencyAction/activateEmergencyCard: Thai language enables tel:1669; other languages do not enable that card action.
- result.html emergencyPhone/renderSummary/renderReminder: number comes from config if present, otherwise Thai -> 1669; other languages -> local-services guidance. The reminder's button label is hard-coded 1669, which would also be inconsistent with a different configured number.
- jssf-consent.html: static tel:1669 link explicitly introduced as "in Thailand". This country-qualified link is not a universal call action.

Additional Thai displayed/spoken guidance in locales/th-TH/ui.json:
- face.critical: unqualified call 1669.
- arm.finalBadSub and arm.vFinalBad: unqualified call 1669.
- speech.subBad: unqualified call 1669.
- index/disclaimer emergency copy and Arm fallback language-screen copy also mention 1669.
- js/thai-recorded-audio.js maps the existing Thai Arm alert to arm_11_alert.mp3. Existing i18n speech normalization also handles 1669.

A CTA-only country selector would leave contradictory warning/spoken guidance for a Thai-language visitor in Japan. No partial change is included. No calls were placed and no country was inferred from language. Existing emergency behavior is intentionally unchanged pending an approved complete solution.

Minimal proposal for separate approval:
1. Public Home and Result expose country-labelled actions simultaneously: Thailand · Call 1669 (tel:1669), Japan · Call 119 (tel:119), Other countries · contact local emergency services (no guessed telephone target).
2. No default selected country, geolocation, language inference or new persistent preference. Choosing a labelled call link is the explicit country choice. Emergency advice must never wait for completing screening.
3. Use general local-emergency guidance on Public display surfaces; qualify any retained 1669 reference as Thailand. Audit TH/EN/JA and every urgent/incomplete/historical Result surface.
4. Explicitly resolve shared Thai warning/spoken strings and prerecorded 1669 alert. This needs an owner-approved scope/wording decision because the current task forbids audio changes. Do not silently alter clinical/audio resources.
5. Keep Research/Consent policy isolated; the existing Thailand-qualified Consent link must stay clear. Verify every displayed country/number against its actual href without navigating to tel: during tests.

Until this decision is resolved, this candidate is suitable for code review but NOT recommended as the final JSSF emergency-safe release or final acceptance Preview. A Preview solely to inspect cleanup would require separate authorization and a clear blocker notice.

## Validation and final-SHA device UAT

All tests are local/synthetic and do not establish audible or physical-camera behavior. Face engine and accepted presentation remain exact. No live Research submissions, database calls or real emergency calls are authorized for validation.

After CI and separately authorized protected Preview, verify deployment SHA equals the PR's final head; do not use the historical config build label as proof. Record actual SHA, iPhone/Android model, OS/browser and language for each result.

- Fresh JSSF Home EN; explicit TH/EN/JA selection; disclaimer, reload/return/resume/reset.
- Full Home -> Face -> Arm -> Speech -> Result using actual handlers.
- Face Preparing/Ready -> Start -> alignment/countdown/capture -> completion/Retry. Owner's PR #121 pass is baseline evidence, not automatic acceptance of a different build. Confirm black bands remain absent; original bottom panel and fullscreen presentation remain.
- Individual Face/Arm/Speech -> Result; Result retest and historical findings retained.
- Arm left -> right confirmation, original holds/countdown/audio, completion and Retry. Do not fix cosmetic image movement in this candidate.
- Speech initial/invalid/completion/retry attempts: document failures; never infer iPhone Retry fixed from fixtures.
- TH/EN/JA at normal/enlarged text and 320/390/430-class screens; emergency guidance and controls reachable.
- Staff Dev demonstration routes; protected Research recovery and consent isolation with approved synthetic fixtures only. No production enrollment/sync.
- Cold load, returning PWA/cache refresh and supported offline styles. faceLayoutDebug=1 must add no diagnostic UI/API behavior.
- Emergency country-labelled CTA tests remain blocked until approved implementation. Never place test emergency calls.

Known issues retained: Arm illustration/countdown movement; iPhone Face audio silence; iPhone Speech Retry unreliability. No Production/Preview deployment, main merge or release tag in this task.
