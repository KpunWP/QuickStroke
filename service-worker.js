/* QuickStroke Service Worker — Emergency-Ready Edition (v7)
 *
 * ออกแบบสำหรับสถานการณ์ฉุกเฉิน + สัญญาณอินเทอร์เน็ตไม่ดี:
 *   - หน้า HTML → network-first พร้อม timeout
 *   - โมเดล MediaPipe → precache แบบ best-effort
 *   - JS / JSON / รูปภาพ → stale-while-revalidate
 */

const CACHE_NAME = "quickstroke-pwa-v12";
// v7: เพิ่ม shared i18n และ locale packs สำหรับใช้งาน offline

const CORE_SHELL = [
  "/",
  "/index.html",
  "/face-test.html",
  "/arm-test.html",
  "/speech-test.html",
  "/result.html",
  "/config.js",

  // Shared internationalization system
  "/js/i18n.js",
  "/locales/th-TH/ui.json",
  "/locales/en-US/ui.json",
  "/locales/ja-JP/ui.json",

  "/fast-permissions.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* ไฟล์หนัก (โมเดล AI ~30MB) — พยายาม precache แบบ best-effort:
 * ถ้าเน็ตหลุดกลางคันหรือไฟล์ยังไม่ถูกวางใน repo จะไม่ทำให้ SW ทั้งตัวติดตั้งล้มเหลว
 * (ไฟล์ที่พลาดจะถูกเก็บอัตโนมัติผ่าน stale-while-revalidate ในครั้งแรกที่หน้ากล้องเรียกใช้) */
const HEAVY_ASSETS = [
  "/models/tasks-vision/vision_bundle.mjs",
  "/models/wasm/vision_wasm_internal.js",
  "/models/wasm/vision_wasm_internal.wasm",
  "/models/wasm/vision_wasm_nosimd_internal.js",
  "/models/wasm/vision_wasm_nosimd_internal.wasm",
  "/models/face_landmarker.task",
  "/models/hand_landmarker.task"
];

const HTML_NETWORK_TIMEOUT_MS = 3000; // เน็ตอืดเกิน 3 วิ → ใช้ cache ทันที

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_SHELL); // ต้องครบ
      // โมเดล: เก็บทีละไฟล์ พลาดตัวไหนข้ามตัวนั้น (best-effort)
      await Promise.allSettled(
        HEAVY_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn("[SW] skip precache:", url))
        )
      );
    })
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

/* fetch พร้อมยอมแพ้เมื่อช้าเกิน — หัวใจของโหมด "สัญญาณอ่อน" */
function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("network-timeout")), ms);
    fetch(request).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // cross-origin (Google Fonts ฯลฯ) — ปล่อยเบราว์เซอร์จัดการ, offline แล้ว font จะ
  // fallback เป็น system font เองโดยหน้าเว็บยังใช้งานได้ปกติ
  if (url.origin !== self.location.origin) return;

  const isHTML =
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";

  if (isHTML) {
    /* NETWORK-FIRST + TIMEOUT:
       เน็ตดี → ของใหม่ล่าสุดเสมอ | เน็ตอืด/ขาด → cache ขึ้นทันทีภายใน 3 วิ ไม่มีหน้าค้าง

       FIX: cache:"no-cache" บังคับให้ถาม server เสมอ (ผ่าน revalidate)
       ไม่งั้น fetch จะหยิบ HTML เก่าจาก HTTP cache ของ browser โดยไม่ออกเน็ต
       → network-first กลายเป็นได้ของเก่าตลอด แม้ deploy ไฟล์ใหม่แล้ว */
    const freshRequest = new Request(event.request, { cache: "no-cache" });
    event.respondWith(
      fetchWithTimeout(freshRequest, HTML_NETWORK_TIMEOUT_MS)
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

  /* STALE-WHILE-REVALIDATE สำหรับ asset ทั้งหมด (รวมโมเดล):
     ตอบจาก cache ทันที + refresh เบื้องหลัง → แก้ไฟล์เมื่อไหร่ ผู้ใช้ได้ของใหม่เองใน 1-2 ครั้งที่เปิด */
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
          .catch(() => cached);
        return cached || refresh;
      })
    )
  );
});
