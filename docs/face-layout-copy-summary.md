# Face diagnostic Copy Summary

Baseline: PR #118, `7ed7ee6aa7670bfce30286a13eb01748b79076ab`.
Branch: `fix/face-layout-copy-summary-20261026`.

Adds **Copy Summary** to the existing explicitly enabled Preview-only Face layout controls. **Copy diagnostic report** and **Mark black bands visible** are retained. The original JSON copy listener is byte-for-byte frozen by a regression assertion. The server gate, geometry sampler, timing, limits, camera layout and Face application behavior are unchanged. Only the diagnostic JS URL version is bumped so a cached older helper is not reused.

The formatter is pure: it reads the existing in-memory report, not the DOM or video. It does not trigger a snapshot, poll, fetch, upload or persist anything. It resolves CSS table references into readable positioning, object-fit/position, overflow and background descriptions. It includes SHA/tool version, viewport dimensions/offsets, body/container/video rectangles, source/track dimensions, class changes, and potential overlapping layer candidates. Canvas pixels and child paint are explicitly unknown; candidates do not establish occlusion or a black-band cause.

Required stages always appear: before Start, immediate after Start, bands visible, and completion/result. Delayed 250ms/1s stages also appear. Missing stages are explicitly labelled MISSING. For multiple clicks/marks the text states that after-Start samples come from the first click while bands/result use the latest saved snapshots; relative times expose this distinction.

The standard six-stage synthetic example is around 2,500 characters. Output exceeding 3,000 characters is split at whole-stage boundaries into two parts with repeated build/version headers. Nothing is silently cut. **Copy Summary** copies part 1; an additional **Copy Summary Part 2** button appears when needed. Send both parts to ChatGPT. Clipboard denial/unavailability reveals a separate selectable plain-text fallback; the original JSON fallback remains unchanged.

## Owner use after a separately authorized Preview deployment

1. Enable the existing `faceLayoutDebug=1` flag on the immutable protected Preview Face URL within an ordinary Public session. Do not enable Dev/mesh.
2. Capture before Start, Start and mark the bands using the existing workflow.
3. After completion and after pending snapshots finish, choose **Copy Summary**. If offered, choose **Copy Summary Part 2** and transfer both parts through LINE or another messaging app. Copy before leaving Face; data remains memory-only.
4. Use **Copy diagnostic report** if more detailed JSON is subsequently required.

[Exact synthetic example output](face-layout-summary-example.txt). This uses invented snapshots and SHA `aaaa…`; it is not new physical-device evidence and does not establish a root cause.

## Safety and verification

Unit tests cover required/missing stages, nonmutation of frozen input, normal length, a long two-part case, readable CSS/state/layers, malicious identifier/URL sentinels, and preservation of the original JSON-copy listener. Browser tests cover summary clipboard/fallback, optional part 2, no additional samples/gate requests, original JSON copying and marking, Preview-only gate, Public/Research/Dev/mesh isolation and unchanged video geometry at 320/360/390/430px. Existing core and frozen Face/startup/completion/capture/language checks also run.

No images/frames/audio/landmarks/clinical metrics, identity, device/session IDs, raw URLs or tokens are included. Build host and unused report fields are not copied. Values are allowlisted or numeric; invalid data is marked unavailable. The summary does not claim sampled metadata proves anything about source-frame pixels or Safari composition.

Clipboard and layout tests are simulated Chromium. Real iPhone Safari Clipboard permissions/manual selection and LINE transfer still require owner UAT. The existing diagnostic control may perturb composition, as already documented for PR #118. Face audio silence and Speech Retry remain unresolved and untouched.

No Preview/Production deployment, merge or change to the server authorization gate is included.
