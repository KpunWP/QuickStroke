# Public Face startup UX — PR #114 baseline

Baseline: `921686603cc30b42d0c3aa1bb3999a616ca92366`.
Branch: `fix/public-face-startup-ux-20261026`. Review only; no deployment or merge.

## Findings supported by source

1. `bootstrapFaceTest` awaits `switchFaceLang` (including existing fallback/recovery requests), then invokes `startCamera()` and `loadModel()` consecutively without awaiting either. Camera and ML initialization are already concurrent; this change does not serialize or reorder them.
2. `loadModel` dynamically imports local tasks-vision, resolves the WASM fileset, initializes Face (GPU with existing CPU fallback), then attempts Hand (same existing fallback policy). `modelReady = true` occurs after that sequence. A non-enforced Hand failure may still be usable; the existing policy is retained. Cold downloads, WASM/GPU initialization or locale/camera permission can contribute to startup time. No real-device timings/logs establish which accounts for the reported ten seconds.
3. `initCamera` attaches the stream, calls `play`, sets `isCameraRunning = true` and starts the existing detection loop. This flag means stream attached, not proof of a decoded/playing frame. Detection itself checks `videoEl.readyState >= 2`, paused and ended. No new frame gate was added.
4. Both startup completion paths expose Start only when the other existing readiness flag is true. Visible Start therefore indicates both flags, not that MediaPipe must still be loading. Start remains manual: its original click listener calls `primeSpeech` and then the existing screening handler.
5. Baseline CSS uses a viewport-height body and absolute inset camera container, with full-width/full-height cover video and the existing mirror. There is no loading-versus-ready video sizing branch. Synthetic Chromium loading/ready geometry is full-screen and matches baseline exactly. The reported upper-only iPhone video and dark lower region were **not reproduced**. They could involve frame delivery/compositing/browser viewport behavior, but no cause is established. No video/canvas framing, crop, sizing, mirroring or lifecycle correction is asserted here.

Conclusion: genuine initialization has a vague progress presentation, which this hotfix improves. A ten-second model bottleneck and a ready-state video defect remain unproven. This PR must not be presented as resolving the physical-device partial-preview artifact.

## Exact presentation changes

- Add one Public-only startup status section, a nonanimated indeterminate symbol and TH/EN/JA copy. Pending initialization explains that the camera/detection tools are preparing. Start is not actionable during that pending presentation.
- When both existing flags are true, show a concise manual-Start hint with the original Start. Natural grid rows reserve space between hint/button; enlarged text can grow and scroll. The camera surface stays unchanged.
- Add a small explicitly delimited presentation block inside the existing module so it can **read** lexical readiness flags. A MutationObserver reacts to existing UI/locale/error DOM writes. No polling, timers, media events, initialization calls, flag writes, persisted preference or independent readiness machine. A DOM attribute projects the existing state for CSS only.
- Existing terminal model-failure flags do not become a new busy presentation. Errors/results/measurement/retry and Research/Dev/mesh do not qualify.
- New CSS is mirrored inline in the cached HTML for atomic offline delivery. No Service Worker/config/version changes. Old cached locale packs fall back to their existing localized `loadingModel`/`pressStart`; no forced fetch/cache reset.
- The complete baseline HTML/scripts are retained after stripping only the explicitly delimited additions; existing frozen-source checks retain their original hashes. Completion-panel CSS is unchanged. Tests update synthetic ready fixtures to set both actual readiness flags; locale failure fixtures now accurately represent `FL === null`.

## New text (display only; never spoken)

| Key under `face` | EN | TH | JA |
|---|---|---|---|
| publicStartupTitle | Preparing face detection | กำลังเตรียมตรวจใบหน้า | 顔の検出を準備中 |
| publicStartupHint | Getting the camera and detection tools ready. Please wait. | กำลังเตรียมกล้องและระบบตรวจจับ กรุณารอสักครู่ | カメラと検出機能を準備しています。しばらくお待ちください。 |
| publicReadyHint | Ready. Tap Start to begin. | พร้อมแล้ว กดเริ่มได้เลย | 準備完了。「開始」を押してください。 |

Only these keys are added to the three locale JSON files. Existing safety, clinical and audio strings are unchanged. Japanese editorial review by the owner/native speaker is recommended.

## Evidence and limitations

[Before/after contact sheet](ui-reviews/public-face-startup/comparison.png). All portraits are synthetic browser fixtures, not camera captures; before screenshots show baseline startup presentation and do not reproduce the reported iPhone partial-frame artifact.

Automated checks execute the original bootstrap to prove locale-first concurrent invocation, the original model initializer with deferred synthetic Face/Hand promises to prove readiness ordering, and its original model-failure path. Browser tests cover camera-first, model-first, both-ready, slow pending, permission/model/locale errors; all languages at 320/360/390/430px, normal/200% root text; live language changes and old locale packs; unchanged camera geometry, completion/capture/countdown/retry, Research/Dev and actual original Start/Retry/navigation boundaries.

Real iPhone Safari UAT remains required: cold/warm startup timing and network waterfall; permission prompt and actual first frame; video readyState/paused/intrinsic dimensions and computed rect before/after Start; dynamic toolbars, notch/home indicator and native text enlargement; audible manual-Start unlock; full camera measurement. Chromium synthetic fixtures prove presentation/state contracts, not iPhone camera, MediaPipe performance or speech-audio behavior. Speech Retry remains unresolved and untouched. No participant/Research records are submitted by these tests.

## Local verification results

PASS: core 23/23; unchanged engine/capture/threshold/audio/navigation script hashes and capture contracts; Public language/event continuity and Home/Result/Arm/Speech/Consent-isolation contracts. Existing Face browser matrix 432/432; completion panel 144 combinations + 4 simulated safe-area cases; new startup 48 language/width/text/state combinations plus loading-order, failure, cached-locale, isolation and real-handler boundary checks. Zero page errors in all three browser suites. The preparation ring is deliberately static; screen-reader status text and busy semantics provide progress information without decorative motion. During initial locale fetch, a short English fallback is explicitly marked English; after locale resolution it follows the selected pack.

All browser tests are local synthetic Chromium. No claim of physical iPhone performance or camera/model execution is made. Existing Speech Retry remains unresolved despite unrelated source-contract tests passing.
