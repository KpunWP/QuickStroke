// QuickStroke JSSF nonclinical remote-usability ingestion.
// Staging-only by default. Set JSSF_REMOTE_ENABLED=true ONLY after consent, rate limiting
// and origin policy are reviewed. No client-facing database key is exposed.
// Supabase Edge Function: verify_jwt=false because /enroll is opt-in anonymous;
// /events and /withdraw require a 256-bit per-session capability token.
import { createClient } from "@supabase/supabase-js";
import { sanitizeBatch, CONTRACT_VERSION } from "./payload.mjs";

type JsonObject = Record<string, unknown>;

const MAX_BODY = 64000;
const origins = new Set((Deno.env.get("JSSF_ALLOWED_ORIGINS") || "").split(",").map(x => x.trim()).filter(Boolean));
const consentVersion = Deno.env.get("JSSF_CONSENT_VERSION") || "";
const RELEASE_CONSENT_VERSION = "JSSF-REMOTE-2026-10-06-v4";
const SPEECH_TELEMETRY_CONSENT_VERSIONS = new Set([
  "JSSF-REMOTE-2026-10-04-v2",
  "JSSF-REMOTE-2026-10-04-v3",
  RELEASE_CONSENT_VERSION
]);
const FACE_TELEMETRY_CONSENT_VERSIONS = new Set([
  RELEASE_CONSENT_VERSION
]);
function consentVersionAccepted(value: unknown): value is string {
  // Enrollment is release-locked to v3. The environment value remains an
  // operational readiness gate, but it can no longer reopen legacy enrollment.
  return value === RELEASE_CONSENT_VERSION;
}
const rateLimitSecret = Deno.env.get("JSSF_RATE_LIMIT_SECRET") || "";
const testGateEnabled = Deno.env.get("JSSF_TEST_GATE_ENABLED") === "true";
const testCredential = Deno.env.get("JSSF_TEST_CREDENTIAL") || "";
const testGateReady = !testGateEnabled || testCredential.length >= 32;

const enabled =
  Deno.env.get("JSSF_REMOTE_ENABLED") === "true" &&
  origins.size > 0 &&
  consentVersion.length >= 5 &&
  rateLimitSecret.length >= 32 &&
  testGateReady;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
function serverKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    try { const value = JSON.parse(modern); if (typeof value.default === "string") return value.default; }
    catch (_) { /* fall back to legacy key */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
const privilegedKey = serverKey();
const db = (supabaseUrl && privilegedKey)
  ? createClient(supabaseUrl, privilegedKey, { auth: { persistSession:false, autoRefreshToken:false } })
  : null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION = /^S-[A-Za-z0-9_-]{12,100}$/;
const COARSE_PLATFORM = new Set(["ios", "android", "desktop", "other"]);
const COARSE_BROWSER = new Set(["safari", "chrome", "firefox", "edge", "other"]);
const LOCALES = new Set(["th", "en", "ja"]);

function response(
  status: number,
  body: unknown,
  origin: string | null = null,
  extraHeaders: Record<string, string> = {}
): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });

  for (const [name, value] of Object.entries(extraHeaders)) {
    headers.set(name, value);
  }

  if (origin && origins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set(
      "access-control-allow-headers",
      "content-type, x-qs-session-token, x-qs-test-credential"
    );
    headers.set("vary", "Origin");
  }

  return new Response(
    status === 204 ? null : JSON.stringify(body),
    { status, headers }
  );
}
function hex(bytes: Uint8Array): string { return Array.from(bytes, x => x.toString(16).padStart(2,"0")).join(""); }
async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}
async function developerGateAllowed(request: Request): Promise<boolean> {
  if (!testGateEnabled) return true;
  if (testCredential.length < 32) return false;
  const supplied = request.headers.get("x-qs-test-credential") || "";
  if (!supplied) return false;
  const [expectedDigest, suppliedDigest] = await Promise.all([
    sha256(testCredential),
    sha256(supplied)
  ]);
  let diff = 0;
  for (let i = 0; i < expectedDigest.length; i++) {
    diff |= expectedDigest.charCodeAt(i) ^ suppliedDigest.charCodeAt(i);
  }
  return diff === 0;
}
async function rateLimitBucket(request: Request): Promise<string | null> {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim()
    || request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "";

  if (!clientIp || rateLimitSecret.length < 32) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rateLimitSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("jssf-rate-limit:" + clientIp)
  );

  return hex(new Uint8Array(digest));
}
type RateLimitRoute = "enroll" | "events" | "withdraw";

async function consumeRateLimit(
  request: Request,
  route: RateLimitRoute
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!db) return { allowed: false, retryAfterSeconds: 60 };

  const bucketKey = await rateLimitBucket(request);
  if (!bucketKey) return { allowed: false, retryAfterSeconds: 60 };

  const { data, error } = await db.rpc("consume_jssf_rate_limit", {
    p_bucket_key: bucketKey,
    p_route: route
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row.allowed !== "boolean") {
    throw new Error("Invalid rate-limit response");
  }

  return {
    allowed: row.allowed,
    retryAfterSeconds:
      Number.isInteger(row.retry_after_seconds)
        ? row.retry_after_seconds
        : 60
  };
}
function studyId() {
  const h = hex(crypto.getRandomValues(new Uint8Array(12))).toUpperCase();
  return "QS-" + (h.match(/.{4}/g) || []).join("-");
}
async function jsonBody(request: Request): Promise<JsonObject> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY) throw new TypeError("Request exceeds size limit");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY) throw new TypeError("Request exceeds size limit");
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Expected JSON object");
  return parsed as JsonObject;
}
function requiredText(value: unknown, max: number, field: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > max || !/^[A-Za-z0-9_.:-]+$/.test(value)) throw new TypeError("Invalid " + field);
  return value;
}
function optionalInt(value: unknown, min: number, max: number, field: string): number | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) throw new TypeError("Invalid " + field);
  return Number(value);
}
function optionalDeviceModel(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 80 || !/^[A-Za-z0-9 ._+()\/-]+$/.test(value)) throw new TypeError("Invalid deviceModel");
  return value;
}
function parseEnrollment(body: JsonObject) {
  if (body.consentAccepted !== true || body.age18plus !== true ||
      body.participationScope !== "usability_nonclinical" ||
      !consentVersionAccepted(body.consentVersion)) {
    throw new TypeError("Explicit adult nonclinical consent with an accepted version is required");
  }
  const clientSessionId = typeof body.clientSessionId === "string" ? body.clientSessionId : "";
  const optionalStudyId = body.studyId;
  const uploadToken = typeof body.uploadToken === "string" ? body.uploadToken : "";
  const locale = typeof body.locale === "string" ? body.locale : "";
  const platform = typeof body.platformFamily === "string" ? body.platformFamily : "";
  const browser = typeof body.browserFamily === "string" ? body.browserFamily : "";
  const dataCollectionPhase = typeof body.dataCollectionPhase === "string" ? body.dataCollectionPhase : "";
  const runtimeProvenanceVersion = requiredText(body.runtimeProvenanceVersion, 80, "runtimeProvenanceVersion");
  const osMajorVersion = optionalInt(body.osMajorVersion, 1, 99, "osMajorVersion");
  const browserMajorVersion = optionalInt(body.browserMajorVersion, 1, 999, "browserMajorVersion");
  const deviceClass = requiredText(body.deviceClass, 20, "deviceClass");
  const deviceModel = optionalDeviceModel(body.deviceModel);
  if (!SESSION.test(clientSessionId)) throw new TypeError("Invalid clientSessionId");
  if (optionalStudyId != null && (typeof optionalStudyId !== "string" || !/^QS-([A-F0-9]{4}-){5}[A-F0-9]{4}$/.test(optionalStudyId))) throw new TypeError("Invalid studyId");
  if (!/^[0-9a-f]{64}$/.test(uploadToken)) throw new TypeError("Invalid uploadToken");
  if (!LOCALES.has(locale)) throw new TypeError("Invalid locale");
  if (!COARSE_PLATFORM.has(platform) || !COARSE_BROWSER.has(browser)) throw new TypeError("Invalid device category");
  if (!["phone","tablet","desktop"].includes(deviceClass)) throw new TypeError("Invalid deviceClass");
  if (!["engineering_preflight","jssf_pilot"].includes(dataCollectionPhase)) throw new TypeError("Invalid dataCollectionPhase");
  return {
    uploadToken,
    row: {
      client_session_id:clientSessionId,
      study_id:typeof optionalStudyId === "string" ? optionalStudyId : studyId(),
      consent_version:body.consentVersion,
      consented_at:new Date().toISOString(),
      age_18_or_older:true,
      locale,
      platform_family:platform,
      browser_family:browser,
      os_major_version:osMajorVersion,
      browser_major_version:browserMajorVersion,
      device_class:deviceClass,
      device_model:deviceModel,
      runtime_provenance_version:runtimeProvenanceVersion,
      app_version:requiredText(body.appVersion, 40, "appVersion"),
      app_build_id:requiredText(body.appBuildId, 120, "appBuildId"),
      data_collection_phase:dataCollectionPhase,
      participation_scope:"usability_nonclinical",
      research_profile:"community_remote_qr"
    }
  };
}
function enforceConsentScopedEventPayload(events: ReturnType<typeof sanitizeBatch>, sessionConsentVersion: string) {
  return events.map(event => {
    if (event.event_type !== "test_attempt_completed" || !event.payload || typeof event.payload !== "object") {
      return event;
    }
    let payload = event.payload as Record<string, unknown>;
    if (event.module === "speech" && !SPEECH_TELEMETRY_CONSENT_VERSIONS.has(sessionConsentVersion) && "speechResearch" in payload) {
      const { speechResearch: _discardedSpeechResearch, ...rest } = payload;
      payload = rest;
    }
    if (event.module === "face" && !FACE_TELEMETRY_CONSENT_VERSIONS.has(sessionConsentVersion) && "faceResearch" in payload) {
      const { faceResearch: _discardedFaceResearch, ...rest } = payload;
      payload = rest;
    }
    return payload === event.payload ? event : { ...event, payload };
  });
}

async function authorizedSession(req: Request, body: JsonObject, { allowExpired = false }: { allowExpired?: boolean } = {}) {
  if (!db) return null;
  const sessionId = body.sessionId;
  const bearer = req.headers.get("x-qs-session-token") || "";
  if (typeof sessionId !== "string" || !UUID.test(sessionId) || !/^[0-9a-f]{64}$/.test(bearer)) return null;
  const digest = await sha256(bearer);
  const { data, error } = await db.from("jssf_remote_sessions")
    .select("id,status,expires_at,consent_version").eq("id",sessionId).eq("upload_token_sha256",digest).maybeSingle();
  if (error) throw error;
  // Users retain the ability to withdraw during the full 90-day retention window,
  // even after their 30-day upload capability expires.
  if (!data || (!allowExpired && Date.parse(data.expires_at) <= Date.now())) return null;
  return { ...data, tokenDigest:digest };
}
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (req.method === "GET" && url.pathname.endsWith("/health")) {
    return response(200,{ ok:true, collectionEnabled:enabled && Boolean(db), schemaVersion:CONTRACT_VERSION },origin);
  }
  if (!origin || !origins.has(origin)) return response(403,{error:"Origin not permitted"});
  if (req.method === "OPTIONS") return response(204,{},origin);
  if (req.method !== "POST") return response(405,{error:"Method not allowed"},origin);
  // Isolated hosted-staging admission gate. When enabled, every mutation route
  // rejects missing/wrong developer credentials before consent parsing, rate
  // limiting, enrollment, event ingestion, or withdrawal lookup. Production
  // remains unaffected when JSSF_TEST_GATE_ENABLED is false.
  if (!(await developerGateAllowed(req))) {
    return response(401,{error:"TEST_ADMISSION_REQUIRED"},origin);
  }
  // Closed by default, including for callers that try bypassing the client UI.
  // Withdrawal remains available if collection is paused or the consent version
  // changes. Keep previously approved Origins enabled for 90 days after closing.
  const isWithdrawal = url.pathname.endsWith("/withdraw");
  if (!db || (!enabled && !isWithdrawal)) return response(503,{error:"JSSF_REMOTE_DISABLED"},origin);
  try {
    let rateLimitRoute: RateLimitRoute;

    if (url.pathname.endsWith("/enroll")) {
      rateLimitRoute = "enroll";
    } else if (url.pathname.endsWith("/events")) {
      rateLimitRoute = "events";
    } else if (url.pathname.endsWith("/withdraw")) {
      rateLimitRoute = "withdraw";
    } else {
      return response(404, { error: "Not found" }, origin);
    }

    const limit = await consumeRateLimit(req, rateLimitRoute);

    if (!limit.allowed) {
      return response(
        429,
        { error: "Too many requests" },
        origin,
        { "retry-after": String(limit.retryAfterSeconds) }
      );
    }

    const body = await jsonBody(req);

    if (url.pathname.endsWith("/enroll")) {
      const enrollment = parseEnrollment(body);
      const input = enrollment.row;
      const issued = enrollment.uploadToken;
      const issuedHash = await sha256(issued);

      const { data, error } = await db.from("jssf_remote_sessions")
        .insert({
          ...input,
          upload_token_sha256: issuedHash
        })
        .select("id,study_id,created_at,expires_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: existing, error: lookupError } = await db.from("jssf_remote_sessions")
            .select("id,study_id,created_at,expires_at")
            .eq("client_session_id", input.client_session_id)
            .eq("upload_token_sha256", issuedHash)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (existing) {
            return response(
              200,
              {
                sessionId: existing.id,
                studyId: existing.study_id,
                uploadToken: issued,
                createdAt: existing.created_at,
                expiresAt: existing.expires_at,
                schemaVersion: CONTRACT_VERSION,
                reused: true
              },
              origin
            );
          }
          return response(
            409,
            { error: "Session already enrolled" },
            origin
          );
        }
        throw error;
      }

      return response(
        201,
        {
          sessionId: data.id,
          studyId: data.study_id,
          uploadToken: issued,
          createdAt: data.created_at,
          expiresAt: data.expires_at,
          schemaVersion: CONTRACT_VERSION
        },
        origin
      );
    }

    const session = await authorizedSession(
      req,
      body,
      { allowExpired: isWithdrawal }
    );
    if (!session && isWithdrawal &&
        typeof body.sessionId === "string" && UUID.test(body.sessionId) &&
        /^[0-9a-f]{64}$/.test(req.headers.get("x-qs-session-token") || "")) {
      // Withdrawal acknowledgement may have been lost after the first delete.
      // If the session no longer exists, another acknowledgement is safe;
      // a still-existing session with the wrong token must NEVER be declared deleted.
      const { data:stillExists, error:existenceError } = await db.from("jssf_remote_sessions")
        .select("id").eq("id",body.sessionId).maybeSingle();
      if (existenceError) throw existenceError;
      if (!stillExists) return response(200,{withdrawn:true,remoteDataDeleted:true,alreadyAbsent:true},origin);
    }
    if (!session) return response(401,{error:"Session not authorized or not available"},origin);
    if (isWithdrawal) {
      // One atomic database operation instead of deleting events then updating a
      // session in two nontransactional REST requests. Parent delete CASCADEs events.
      const { data:deleted, error:withdrawError } = await db.rpc("withdraw_jssf_session",{
        p_session_id:session.id,p_token_sha256:session.tokenDigest
      });
      if (withdrawError) throw withdrawError;
      if (!deleted) return response(409,{error:"Session no longer available for withdrawal"},origin);
      return response(200,{withdrawn:true,remoteDataDeleted:true},origin);
    }
    if (session.status === "withdrawn") return response(410,{error:"Session withdrawn"},origin);
    const events = enforceConsentScopedEventPayload(
      sanitizeBatch(body.events),
      String(session.consent_version || "")
    );
    const ids = events.map(x => x.client_event_id);
    if (session.status === "completed") {
      const { data:existing, error:lookupError } = await db.from("jssf_remote_events")
        .select("client_event_id").eq("session_id",session.id).in("client_event_id",ids);
      if (lookupError) throw lookupError;
      if (existing?.length === ids.length) return response(200,{acknowledged:ids,duplicates:true},origin);
      return response(409,{error:"Session already completed"},origin);
    }
    if (events.some(x => x.event_type === "session_completed") && events[events.length-1].event_type !== "session_completed") {
      return response(422,{error:"Session completion must be the last event in the batch"},origin);
    }
    const { error:insertError } = await db.from("jssf_remote_events").upsert(
      events.map(x => ({ ...x, session_id:session.id })),
      { onConflict:"session_id,client_event_id", ignoreDuplicates:true }
    );
    if (insertError) throw insertError;
    const completion = events.some(x => x.event_type === "session_completed");
    const { error:statusError } = await db.from("jssf_remote_sessions")
      .update(completion ? { status:"completed",completed_at:new Date().toISOString(),last_event_at:new Date().toISOString() } : { last_event_at:new Date().toISOString() })
      .eq("id",session.id).eq("status","active");
    if (statusError) throw statusError;
    return response(200,{acknowledged:ids, sessionCompleted:completion, schemaVersion:CONTRACT_VERSION},origin);
  } catch (error) {
    if (error instanceof TypeError || error instanceof SyntaxError) return response(422,{error:"Invalid request format"},origin);
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "INTERNAL";
    const kind = error instanceof Error ? error.name : "Error";
    console.error("JSSF ingest failed", { code, kind });
    return response(500,{error:"Ingestion unavailable. Retry later."},origin);
  }
});
