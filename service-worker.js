/* QuickStroke Service Worker — Zero-Maintenance Edition
 *
 * ไม่ต้อง bump เวอร์ชันอีกต่อไป:
 *   - หน้า HTML        → network-first        (ได้ของใหม่ทันทีที่เปิด, ออฟไลน์ใช้ cache)
 *   - js/รูป/ไฟล์อื่นๆ → stale-while-revalidate (เสิร์ฟจาก cache ทันที + แอบอัปเดตเบื้องหลัง)
 *
 * CACHE_NAME ด้านล่างแก้ "ครั้งเดียว" ตอนติดตั้งไฟล์นี้ ให้เลขใหม่กว่าที่ deploy อยู่
 * เพื่อล้าง cache ยุคเก่าทิ้ง — หลังจากนั้นปล่อยทิ้งไว้ได้ตลอดไป
 */
const CACHE_NAME = "quickstroke-pwa-v3";

const APP_SHELL = [
  "/",
  "/index.html",
  "/face-test.html",
  "/arm-test.html",
  "/speech-test.html",
  "/result.html",
  "/config.js",
  "/fast-permissions.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ไฟล์ cross-origin (MediaPipe CDN ฯลฯ) — ให้เบราว์เซอร์จัดการเอง ไม่เก็บลง cache เรา
  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";

  if (isHTML) {
    /* NETWORK-FIRST: หน้าเว็บได้เวอร์ชันล่าสุดเสมอเมื่อออนไลน์
       ออฟไลน์ → ใช้ตัวที่เก็บไว้ล่าสุด → PWA ยังทำงานได้ */
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  /* STALE-WHILE-REVALIDATE: ตอบจาก cache ทันที (เร็ว)
     พร้อมยิงขอเวอร์ชันใหม่จาก server มาเก็บทับเบื้องหลัง
     → แก้ config.js / รูป / js เมื่อไหร่ ผู้ใช้ได้ของใหม่เองภายใน 1-2 ครั้งที่เปิด
     → ไม่ต้อง bump เวอร์ชันอีกเลย */
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const refresh = fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached); // ออฟไลน์ → ใช้ cache

        // มี cache → ส่งทันที (refresh ทำงานต่อเบื้องหลัง), ไม่มี → รอ network
        return cached || refresh;
      })
    )
  );
});
