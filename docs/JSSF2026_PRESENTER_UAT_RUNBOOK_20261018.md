# JSSF 2026 — Public App + Presenter Demo UAT / Offline / Backup
**Workstream B — 2026-10-18 ICT. Status: Engineering preview, NOT UAT-passed, NOT frozen.**
**Branch:** research/jssf2026-public-presenter-demo-20261018 (child of kickoff branch).
**Path:** /presenter-demo.html (standalone presenter-only route, not linked from the Public home page).

## Implementation boundary
Public remains /index.html with Full Face→Arm→Speech and Individual tests. Original Result distinguishes a module not tested from valid measurement, and retains Public previous-abnormal warning.

Presenter embeds the existing Face/Arm/Speech test pages in explicit Public mode in a same-origin iframe. Existing ?mesh=1 draws real MediaPipe Face landmarks; presenter reads original Face visible status, Arm displayed drift and Speech expected/recognized text. Arm graph is drawn only from the real displayed drift value while the original drift display is active. Presenter does not introduce a new threshold, scoring pipeline, speech recognizer or research upload.

Starting Presenter inside a Research/Dev session fails closed. Launch Presenter in an isolated private browser session, separate from JSSF Consent. Starting a new demo resets same-tab ephemeral fast_ session keys only AFTER the guard. Existing remote upload requires consented Research/community_remote_qr context.

**Important:** iOS iframe camera, mic and motion support needs testing. Open the original module directly on phone when permissions fail. The standalone Presenter TTS probe checks an installed matching voice but does not validate the exact module instructions; speech ASR still uses the existing recognition.lang=T.langCode engine.

## Physical-device UAT matrix (record device model, OS/browser version, date and failures)
| Case | iPhone Safari | Android Chrome | iPad Gen 10 Safari | iPad Pro |
|---|---|---|---|---|
| Fresh Public Full all modules + Result | pending | pending | optional | optional |
| Individual each module + NOT TESTED other modules | pending | pending | optional | optional |
| Result invalid/retry/prior abnormal warning | pending | pending | optional | optional |
| Presenter Face actual mesh, camera permission, tracking warning, no Dev controls | pending | pending | pending | pending |
| Presenter Arm stationary vs intentional drift, live trace, both arms | pending | pending | informational only | informational only |
| Presenter Speech exact vs partial EN/JA/TH phrase, mic-ready, retry | pending | pending | pending | pending |
| EN/JA/TH module instructions, audible TTS, errors and visual fallback | pending | pending | pending | pending |
| Real Airplane Mode after complete online precache | pending | pending | pending | pending |
| Research/Dev guard, no JSSF upload or Study ID in demo | pending | pending | pending | pending |

UAT passes only after real measurement and completion, not simply loading the app. Use non-identifying test captures, never actual pilot participant photos or audio without media consent.

## Airplane Mode procedure
1. While online, load Public and Presenter, activate Service Worker, check locale packs, MediaPipe model and WASM downloaded. Reload once after activation. A Service Worker controller alone does **not** confirm all resources are complete.
2. Run Face camera and Arm sensors online once and grant actual OS/browser permissions.
3. Enable Airplane Mode; separately turn Wi-Fi and cellular OFF. Restart browser/PWA, reload local cached app URL.
4. Verify Face camera, mesh and tracking messages actually run; then Arm orientation and drift reading while stationary/moving. Do not count an animation alone as a measurement.
5. Speak the entire EN/JA/TH Speech phrase. Log whether browser SpeechRecognition is available, returns a real transcript, or reports network/service/permission failure. Do **not** claim ASR works offline merely because the UI loads.
6. Verify language strings, audible TTS, missing-voice fallback, incomplete-result messages and no Research enrollment.
7. Save pass/fail, browser/build, airplane status and local timestamp for each device; separately identify cached-only and fully functional operation.

## No-TV / no-Wi-Fi sequence (phone-first)
1. Public poster QR is https://quickstroke.vercel.app/ (NOT /jssf-consent.html). First visit needs connectivity. Place a printed manual URL beside QR.
2. Use a phone preloaded with isolated /presenter-demo.html. Face: show actual mesh and tracking. Arm: hold phone and show displayed orientation drift chart. Speech: show expected sentence beside live browser transcript if ASR available.
3. One iPad can show preloaded explanation/captured stills independently. Do not rely on phone-to-iPad streaming, TV, AirPlay or venue Wi-Fi.
4. If iOS nested frame blocks camera or motion, use the standalone module-on-phone link. If ASR requires network, demonstrate using a clearly labeled pre-recorded capture, not fake live results.
5. Close with: QuickStroke is an early screening/measurement prototype; it cannot diagnose or rule out stroke.

## Backup and acceptance
- Save face mesh screenshot, valid real phone-orientation drift example, and EN/JA/TH expected/actual ASR text. Label staged engineering captures clearly.
- Store a consent-cleared 30–60s local screen recording, offline PDF/explanation slides and files on at least two devices; bring power banks and cables.
- Failure handling: camera denied → labeled video/still; sensor denied → trace screenshot; ASR offline → labeled recorded transcript; cache missing → local PDF/video.
- CI must pass the new Presenter source/guard tests, existing Public result, JSSF result and algorithm freeze tests. Review PR diff: no threshold, consent, remote ingestion or schema change.
- Oct 26–27: physical UAT, EN/JA/TH voice and airplane tests. Oct 27: freeze only after review, passing CI, UAT and explicit release approval; otherwise preserve known-good Public and rely on backup. Oct 29: pack; Oct 30: travel.

**Current limitation:** physical device access is not available in this session. Real camera/IMU/ASR/TTS, language speech quality, iOS iframe permissions and airplane-mode success are not yet verified.
