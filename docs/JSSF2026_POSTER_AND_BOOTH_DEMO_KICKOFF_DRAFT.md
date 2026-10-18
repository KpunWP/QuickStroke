# QuickStroke — Japan Super Science Fair 2026 | Poster & Booth Demo kickoff

**Status:** design/specification only. No app runtime changes on this research branch. Kickoff Oct 18, 2026. Poster draft and long handoff are conversation attachments `QuickStroke_JSSF2026_Kickoff_Package.zip`.

## Decisions to preserve

1. **Public visitor experience:** provide real QuickStroke Public App from `https://quickstroke.vercel.app/`, with Full Screening (Face → Arm → Speech) and Individual Tests. Individual result must distinguish not tested from normal. Visitor sessions are `public_ephemeral`, NOT JSSF research uploads; no unrestricted Dev tools.
2. **Presenter Technical Demo:** separate demo route/UI using existing Face MediaPipe processing, Arm IMU engine and browser ASR. Show Face live mesh / left-right movement / tracking quality, Arm drift angle vs time / maximum drift, Speech microphone-ready state / full expected vs recognized phrase. Hide advanced fields by default. Do not change research thresholds, data contract or consent. Demo NOT yet implemented.
3. **JSSF Research:** existing consented nonclinical pilot 18+ at `/jssf-consent.html` remains separate.
4. **Language:** English first, Japanese and Thai toggles. Test EN/JA across face/arm/speech/result; locale JSON existence alone does not establish ASR, TTS or phrasing works.
5. **Hardware:** two iPad Gen 10, possibly iPad Pro, plus phone(s). TV/Wi-Fi unknown. Phone preferred for natural Arm demonstration; standalone iPad Presenter view is fallback. No dependency on phone-to-iPad streaming.
6. **PWA:** Service Worker caches app shell, locale packs, MediaPipe WASM/models. First QR access requires connectivity. Motion sensors can work locally, but SpeechRecognition is not guaranteed offline. Perform true airplane-mode tests before marketing offline claim.
7. **Poster:** English A0 portrait initial editable PPTX. NOT print-ready. Confirm official board size, author names, school, affiliations, printer lead time; poster print target Oct 25; leave Oct 26–29 for demo UAT and rehearsal; depart Oct 30 early.
8. **Medical framing:** early screening prototype, not diagnosis. Do not report sensitivity/specificity without clinical validation. Do not imply that an apparently normal result excludes stroke.

## Verified engineering/pilot snapshot — Oct 18, 2026 15:40 ICT

From Supabase production `pzzjfnfwppdeketjdhfo`:
- Total sessions: 162, including 26 engineering-preflight sessions (22 completed, 4 active).
- JSSF pilot sessions: **136**, of which **121 completed**, **15 active**, giving **89.0% session completion**.
- Platform pilot breakdown: iOS Safari 101/89 completed; iOS Chrome 3/2; Android Chrome 29/28; Samsung Internet 3/2. Grouped iOS 104/91, Android 32/30.
- Software version confounding: **124/136** pilot sessions on v1.0.21 (110 completed); only 1 v1.0.30 pilot session as of snapshot. Multiple engineering tests/repeated sessions appear in the cohort.
- Session IDs / Study IDs do **not** equal unique people. Refer to these as **session records across software builds**, not 136 participants, and do not treat as clinical accuracy.
- Next: data QA by build, technical failure and retry rates by module/device, dedupe what can be justified, post-freeze volunteer usability data if time permits. Freeze numbers before PDF print master.

## Existing implementation anchors

- Repo: `KpunWP/QuickStroke`, production `quickstroke.vercel.app`.
- At kickoff v1.0.30 / PWA v101 / JSSF speech algorithm v1.6.0.
- `face-test.html`: developer Face Mesh overlay exists (e.g., `?mesh=1`), reuse carefully in Presenter without leaking developer controls.
- `arm-test.html`: Developer sensor HUD with drift, orientation and quality stats.
- `speech-test.html`: JSSF ASR readiness uses `onaudiostart` for Android; full prompt phrase required, partial allowed to retry. Presenter view may visualize state; no raw recording uploads.
- `index.html` already offers full versus individual routes.
- `service-worker.js` offline cache includes Face model/WASM, UI and language resources.
- Research/Dev/Public isolation critical. Follow inspect-before-mutate → new research branch → CI → reviewed merge. Do not change medical thresholds casually.

## Minimum poster sections

WHY / SYSTEM ARCHITECTURE / FACE-ARM-SPEECH PIPELINE / PILOT SESSION METRICS / LIMITATIONS / QR TO PUBLIC APP / NEXT STEPS.

## Suggested child-friendly demo messages

- Face: "MediaPipe identifies facial landmarks. We compare movements on each side of the face and check tracking quality."
- Arm: "Phone sensors measure orientation changes over time. This measures phone motion, not muscle strength directly."
- Speech: "The browser converts speech to text. The app compares the full sentence and asks for another try if recognition is incomplete."
- Safety: "It supports early awareness; it cannot diagnose or rule out stroke."

## Handoff to next chat

Ask ChatGPT: "Continue QuickStroke JSSF 2026 from this GitHub spec and the Kickoff Package. **Poster and printer deadline first.** Review current repo and verified Supabase data before writing claims. Refine an English A0 editable poster, create quality-split graphs with source dates, prepare a separate Presenter Demo using existing engines and ephemeral sessions, then produce a 30-second and 2-minute English student explanation. Do not touch Production or Research schema without a research-branch PR and CI. The existing QR should point to Public, not the JSSF consent URL."