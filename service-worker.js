/* QuickStroke Service Worker — Offline-Ready Face Edition (v15)
 *
 * กลยุทธ์:
 * - HTML: network-first พร้อม timeout 3 วินาที
 * - MediaPipe และโมเดล Face: ต้อง cache สำเร็จครบ
 * - โมเดล: cache-first เพื่อใช้งาน offline
 * - JS / JSON / รูปภาพ: stale-while-revalidate
 */

const CACHE_NAME = "quickstroke-pwa-v15";
const CACHE_PREFIX = "quickstroke-pwa-";

const CORE_SHELL = [
  "/",
  "/index.html",
  "/face-test.html",
  "/arm-test.html",
  "/speech-test.html",
  "/result.html",
  "/config.js",

  "/js/i18n.js",
  "/js/languages.js",
  "/locales/th-TH/ui.json",
  "/locales/en-US/ui.json",
  "/locales/ja-JP/ui.json",

  "/fast-permissions.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/*
 * ไฟล์ที่หน้า Face ต้องใช้ขณะ offline
 * ถ้าขาดไฟล์ใดไฟล์หนึ่ง Service Worker รุ่นนี้จะไม่ติดตั้ง
 */
const FACE_OFFLINE_ASSETS = [
  "/models/tasks-vision/vision_bundle.mjs",
  "/models/wasm/vision_wasm_internal.js",
  "/models/wasm/vision_wasm_internal.wasm",
  "/models/wasm/vision_wasm_nosimd_internal.js",
  "/models/wasm/vision_wasm_nosimd_internal.wasm",
  "/models/face_landmarker.task",
  "/models/hand_landmarker.task"
];

const REQUIRED_OFFLINE_ASSETS = [
  ...CORE_SHELL,
  ...FACE_OFFLINE_ASSETS
];

const HTML_NETWORK_TIMEOUT_MS = 3000;

/*
 * โหลดไฟล์ที่จำเป็นทีละไฟล์
 * ถ้ามีไฟล์ใดผิดพลาด จะลบ cache ที่ไม่สมบูรณ์ทิ้ง
 */
async function precacheRequiredAssets() {
  await caches.delete(CACHE_NAME);

  const cache = await caches.open(CACHE_NAME);

  try {
    for (const asset of REQUIRED_OFFLINE_ASSETS) {
      const request = new Request(asset, {
        cache: "reload"
      });

      const response = await fetch(request);

      if (!response || !response.ok) {
        throw new Error(
          `[SW] Required offline asset failed: ${asset} ` +
          `(${response?.status || "no response"})`
        );
      }

      await cache.put(asset, response);
    }
  } catch (error) {
    // ป้องกัน cache ที่มีไฟล์ไม่ครบ
    await caches.delete(CACHE_NAME);
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheRequiredAssets().then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

/*
 * ยกเลิก network request เมื่อเกินเวลาที่กำหนด
 */
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("network-timeout"));
    }, ms);

    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isFaceOfflineAsset(pathname) {
  return (
    pathname.startsWith("/models/") ||
    FACE_OFFLINE_ASSETS.includes(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /*
   * ปล่อยไฟล์ข้ามโดเมน เช่น Google Fonts
   * ให้ browser จัดการเอง
   */
  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";

  /*
   * HTML: network-first
   * ถ้าไม่มีอินเทอร์เน็ตจะใช้ cache
   */
  if (isHTML) {
    const freshRequest = new Request(event.request, {
      cache: "no-cache"
    });

    event.respondWith(
      fetchWithTimeout(
        freshRequest,
        HTML_NETWORK_TIMEOUT_MS
      )
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();

            event.waitUntil(
              caches
                .open(CACHE_NAME)
                .then((cache) => {
                  return cache.put(
                    url.pathname || "/",
                    clone
                  );
                })
            );
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(
            event.request,
            {
              ignoreSearch: true
            }
          );

          return cached || caches.match("/index.html");
        })
    );

    return;
  }

  /*
   * MediaPipe, WASM และโมเดล:
   * ใช้ cache ก่อน เพื่อให้ทำงาน offline
   */
  if (isFaceOfflineAsset(url.pathname)) {
    event.respondWith(
      caches
        .match(event.request, {
          ignoreSearch: true
        })
        .then(async (cached) => {
          if (cached) return cached;

          const response = await fetch(event.request);

          if (response && response.ok) {
            const clone = response.clone();

            event.waitUntil(
              caches
                .open(CACHE_NAME)
                .then((cache) => {
                  return cache.put(
                    url.pathname,
                    clone
                  );
                })
            );
          }

          return response;
        })
    );

    return;
  }

  /*
   * JS, JSON และไฟล์ทั่วไป:
   * ใช้ของใน cache ก่อน พร้อมอัปเดตเบื้องหลัง
   */
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Keep the query string in the cache key. A URL such as ui.json?v=BUILD
      // must not be satisfied by an older unversioned locale pack.
      const cachedExact = await cache.match(event.request);

      const refresh = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            return cache
              .put(event.request, response.clone())
              .then(() => response);
          }

          return response;
        });

      event.waitUntil(
        refresh.catch(() => undefined)
      );

      if (cachedExact) return cachedExact;

      try {
        return await refresh;
      } catch (error) {
        // Offline fallback for a first request with a new version query:
        // use the precached unversioned shell asset if available.
        const cachedUnversioned = await cache.match(url.pathname);
        if (cachedUnversioned) return cachedUnversioned;
        throw error;
      }
    })
  );
});