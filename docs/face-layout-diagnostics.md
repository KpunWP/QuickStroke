# Temporary physical-iPhone Face layout diagnostics

Baseline: PR #117, `1631ed077a04847c8b681ab01397f191d909eb4e`.
Branch: `diagnostics/public-face-layout-20261026`.

No black-band fix is included. No physical-iPhone data has been collected in this implementation session.

## Activation and Production isolation

The ordinary Face page adds only an explicit-flag module loader. Without `faceLayoutDebug=1`, there is no module request, gate request, control, capture or diagnostic listener. Research, Dev and mesh do not enable the module/tool.

The module sends one **empty, same-origin POST** to `/api/face-layout-debug-gate?faceLayoutDebug=1`. No report or browser/participant metadata is in this request. POST is deliberate: the unchanged Service Worker caches generic GET responses and could return stale gate results. The gate uses `no-store` and performs no writes/logging. It returns only schema, Preview status, immutable deployment hostname and Git SHA.

The server requires Vercel runtime, `VERCEL_ENV=preview`, Preview target if supplied, a valid Git SHA, and a request host matching `VERCEL_URL`. Production, custom aliases, local/unknown environments, missing deployment metadata and requests without the explicit flag fail closed. There is no hostname-only fallback or browser override to enable it. Do not change project settings/environment variables to weaken this gate. If metadata is absent on an authorized future Preview, report that blocker.

Actual Vercel runtime gate delivery remains to be verified after separately authorized Preview deployment; CI exercises the real handler with controlled environment fixtures. No deployment is part of this task.

## Owner procedure after an authorized Preview deployment

1. Open the JSSF Home in ordinary Public mode and choose the desired language. Enter Face normally, then append `faceLayoutDebug=1` to the Face URL in the same tab and reload **before Start**. Alternatively use `/face-test.html?faceLayoutDebug=1` within that existing Public session. Do not use Dev or `mesh`.
2. Wait for the small **Layout** control. Expand it and confirm `before-start` was captured, then collapse it before pressing the original Start button.
3. When bands appear, expand Layout and press **Mark black bands visible**. The tool records metadata after a rendering opportunity; it does not take a photograph or screenshot.
4. After the result/completion UI appears, press **Copy diagnostic report**, then paste the JSON back into ChatGPT. Copy **before Continue/navigation**, since all data is memory-only and disappears with the page.
5. If Clipboard API access is denied, select/copy the read-only JSON field manually. Prefer copying after completion: manual selection/keyboard behavior may affect Safari's visual viewport.

Without the flag, including for ordinary Public visitors, the app remains unchanged. The existing Public mode gate stays active; existing Dev/mesh mode must not be enabled for the primary reproduction. A late mode change stops diagnostics on the next observed class change/capture/copy and removes the control/buffer.

## Captured metadata

Six expected stages: `before-start`, `after-start`, `after-start-250ms`, `after-start-1000ms`, `bands-visible`, `after-result-visible`. The last is the existing result DOM indicator, not an assertion of clinical validity.

Each snapshot includes relative requested/actual times, window/document/visualViewport dimensions and offsets, HTML/body/container/video/canvas and relevant overlay rectangles, client/scroll sizes, allowlisted computed layout/paint properties, body pseudo-element paint metadata, video intrinsic dimensions/readiness and only track width/height/aspect ratio. Body classes/startup values are allowlisted. It never reads result text, images, pixels, landmarks, scores, transcripts, track labels/IDs, camera device/group IDs, session objects, full URLs/query strings, user-agent or participant identifiers.

The compact JSON uses `css.keys` plus deduplicated `css.values`; each element's `cs` indexes that table. `r` is `[x,y,width,height]`. `viewport.visual` is `[width,height,offsetLeft,offsetTop,scale]`. `styles` lists ordered inline style lengths and FNV fingerprints (not source contents), and `build` identifies the verified Preview SHA/hostname. This helps exclude stale CSS/deployment. FNV is a change fingerprint, not a security signature.

No report is uploaded, downloaded automatically or stored in Supabase, IndexedDB, localStorage, sessionStorage or caches. Clipboard writing is explicit. Maximum 12 snapshots, two Start-click groups and four manual marks; no polling or per-frame instrumentation. Before-Start readiness is sampled only once; if the owner starts before it is captured, `beforeStartCaptured=false` explicitly marks the report incomplete.

## Measurement safety and limitations

The real Start handler is not wrapped/replaced/awaited/cancelled. The tool uses a passive listener and bounded scheduled reads after rendering opportunities, approximately 0/250/1000ms after the click. Actual sample times are recorded because rendering/model load can delay callbacks. It never hooks MediaPipe/detection frames, acquires or alters a stream, changes intrinsic sizes or modifies any application state/stylesheet. Layout reads are batched before diagnostic UI writes; browser layout work cannot be guaranteed zero, but reads do not occur synchronously inside the Start handler or per video frame.

The control is fixed, out of app flow, and styled within Shadow DOM with no blur/transform. It moves away from completion controls; its expanded state is logged. Any visible overlay can still perturb Safari compositing. Compare the known flag-off reproduction with this diagnostic run; if enabling/collapsing the tool changes the symptom, report that observation rather than claiming a fix.

Metadata can identify reduced DOM boxes, viewport mismatches and candidate occlusion. It may not conclusively separate black pixels already in a source frame from a native video-compositor defect. No pixel/frame inspection is added. The next correction must be based on actual iPhone evidence, not synthetic Chromium geometry.

## Validation

Focused tests cover the real server gate in Preview/Production/development/custom-target/alias/missing-SHA cases, non-cacheable/empty handshake, exact baseline HTML outside the loader, forbidden media/storage/upload APIs, no-flag/Research/Dev/mesh inactivity, denied gate, four phone widths with unchanged video geometry, all six stages through the actual original Start handler, JSON privacy sentinels, timing records, clipboard fallback, caps and late Dev teardown. Browser tests mock only the gate response and use synthetic readiness/media metadata; they do not establish a real Vercel environment or physical camera behavior. Frozen Face/active/startup/completion/capture and core/language contracts run in CI.

Face audio silence and Speech Retry remain unresolved and untouched. No CSS correction, engine/model/camera/audio/scoring change, PR merge or deployment is included.
