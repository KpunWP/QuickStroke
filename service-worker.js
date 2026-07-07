/* QuickStroke Service Worker — Emergency-Ready Edition (v3)
 *
 * ออกแบบสำหรับสถานการณ์ฉุกเฉิน + สัญญาณอินเทอร์เน็ตไม่ดี:
 *   - หน้า HTML        → network-first "แบบมี timeout 3 วินาที"
 *                        เน็ตดี = ได้ของใหม่, เน็ตอืด/ไม่มีเน็ต = หยิบ cache ทันที ไม่มีวันค้าง
 *   - โมเดล AI (MediaPipe) → precache ตั้งแต่เปิดครั้งแรก → หน้ากล้องขึ้นทันทีแม้ offline
 *   - js/รูป/ไฟล์อื่น    → stale-while-revalidate (ตอบจาก cache ทันที + อัปเดตเบื้องหลัง)
 *
 * ไม่ต้อง bump เวอร์ชันเมื่อแก้โค้ดทั่วไป — bump เฉพาะเมื่อ "เปลี่ยนไฟล์โมเดล" เท่านั้น
 */
const CACHE_NAME = "quickstroke-pwa-v5";

/* ไฟล์หลักของแอป — ถ้าตัวใดโหลดไม่สำเร็จตอน install ถือว่า install ล้มเหลว (ต้องมีครบ) */
const CORE_SHELL = [
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
       เน็ตดี → ของใหม่ล่าสุดเสมอ | เน็ตอืด/ขาด → cache ขึ้นทันทีภายใน 3 วิ ไม่มีหน้าค้าง */
    event.respondWith(
      fetchWithTimeout(event.request, HTML_NETWORK_TIMEOUT_MS)
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
