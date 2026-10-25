# PR #108 final review and atomic offline CSS delivery

The original UI commit is `0f7a65bc1a947f50361b77f01a8d805106255357`.
This separate follow-up commit is limited to asset delivery and its verification.
No Result interpretation, handler, Research/Dev UI, media engine, locale resource
or session/submission behavior changes.

## Confirmed cache gap and fix

The unchanged v101 service worker precaches `/result.html`, but not the new
`/assets/public-result.css`. It caches generic assets only when requested. Thus a
fresh successful PWA installation followed by a first Result visit offline could
have Result HTML without the new styling. A returning old cache can have the same
gap until CSS has been fetched online.

The fix bundles the reviewed Public CSS as `<style id="public-result-style">`
inside Result HTML instead of a separate stylesheet request. The existing CSS
file remains the canonical reviewed source. The targeted regression test asserts
an exact byte match between it and the bundled style and rejects an external
Result CSS link. Existing Public-only selectors remain intact. All existing
Result JavaScript still passes the frozen baseline digest test.

No service worker change, version migration, cache deletion, cache-prefix change,
model/audio/locale caching change or activation change is made. Existing HTML
network-first refresh now delivers the Result UI and styles atomically; existing
HTML precaching makes a successfully installed new shell ready offline. This
avoids changing lifecycle/consent configuration freshness or forcing a large model
cache rebuild solely for a CSS file. Future CSS changes must update the HTML copy;
the equality test prevents unnoticed drift.

## Actual local browser checks

`tests/public-result-final-review.cjs` exercises the actual Result page and actual
unchanged service worker against a localhost static server. Playwright/Chromium
must be installed separately; no dependency or service configuration is changed:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium \
  node tests/public-result-final-review.cjs
```

- Three Public fixtures: incomplete/unassessable, retained abnormal history and
  fully complete. EN→TH→JA→EN, three builds per language = 36 repeated rebuilds.
  One completion DOM node, exactly one inability label where appropriate, three
  distinct correct module icons, no duplicated tiles/icons after each rebuild.
- Away/back navigation retains the appropriate result and label count.
- Fresh browser page: bundled styling applies without a stylesheet request.
- Fresh real service-worker installation, before ever visiting Result/CSS:
  Result boots and uses the approved Public module layout offline.
- Returning v101 cache seeded with the prior Result HTML: offline access retains
  that older HTML. After online network-first Result refresh, new bundled HTML
  is cached and styled Result reloads offline. Existing caches are not deleted.
- External network calls are blocked. Synthetic Public session fixtures only;
  no enrollment, real capture, Research data synchronization or submissions.
- Existing Research protected-recovery comparison remains pixel-identical to
  baseline; Dev/Public scope guards and frozen scripts pass targeted tests.

The original cache-gap behavior of an old, still-offline HTML version cannot be
retroactively fixed without receiving new HTML. Users of an older installed PWA
must connect once and refresh/update before expecting the new design offline.
No claim is made that an already-offline device receives a release automatically.

## Compatibility conclusion and limitations

CSS delivery now follows HTML in fresh and upgraded caches, independent of a
separate CSS fetch. Service-worker behavior/version is unchanged. This is actual
Chromium SW/cache testing, not a physical iOS/Android installed-PWA test. Google
Fonts remain external and are not guaranteed offline; system fallback typography
must remain readable. No claim of offline Face/media/ASR compatibility is made
from these Result tests. A protected Preview still requires the reviewer's valid
Vercel access; app cache behavior does not bypass deployment protection.

Physical UAT remains: iOS Safari/installed PWA, Android Chrome/Samsung Internet;
native font scaling, Thai/Japanese glyphs and font delivery; dynamic browser bars,
cutouts/landscape; VoiceOver/TalkBack; native confirmation and safe dialer handoff;
real update/relaunch/offline behavior under browser storage eviction. Do not place
an actual emergency call or enroll volunteers during UAT.
