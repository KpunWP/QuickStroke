/* QuickStroke Service Worker
 * กฎเหล็ก: ทุกครั้งที่ deploy โค้ดใหม่ → bump เลขเวอร์ชันบรรทัดล่างนี้เสมอ */
const CACHE_NAME = "quickstroke-pwa-v2";

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

  // ไฟล์ cross-origin (เช่น MediaPipe CDN) — ปล่อยให้เบราว์เซอร์จัดการเอง
  // ไม่เก็บลง cache ของเรา (ไฟล์โมเดลใหญ่หลาย MB และ CDN มี cache ในตัวอยู่แล้ว)
  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";

  if (isHTML) {
    // ✨ NETWORK-FIRST สำหรับหน้า HTML:
    //    ออนไลน์  → ได้เวอร์ชันล่าสุดจาก server ทันที (ไม่ต้องเปิดสองรอบ)
    //    ออฟไลน์ → fallback ไปใช้ตัวใน cache (PWA ยังทำงานออฟไลน์ได้เหมือนเดิม)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  // CACHE-FIRST สำหรับ asset อื่นๆ (js/css/รูป/ไอคอน) — เร็ว และเวอร์ชันถูกคุมด้วย CACHE_NAME อยู่แล้ว
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
