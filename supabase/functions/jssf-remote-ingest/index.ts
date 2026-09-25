// QuickStroke JSSF nonclinical remote-usability ingestion.
// Staging-only by default. Set JSSF_REMOTE_ENABLED=true ONLY after consent, rate limiting
// and origin policy are reviewed. No client-facing database key is exposed.
// Supabase Edge Function: verify_jwt=false because /enroll is opt-in anonymous;
// /events and /withdraw require a 256-bit per-session capability token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sanitizeBatch, CONTRACT_VERSION } from "./payload.mjs";

const MAX_BODY = 64000;
const origins = new Set((Deno.env.get("JSSF_ALLOWED_ORIGINS") || "").split(",").map(x => x.trim()).filter(Boolean));
const consentVersion = Deno.env.get("JSSF_CONSENT_VERSION") || "";
const enabled = Deno.env.get("JSSF_REMOTE_ENABLED") === "true" && origins.size > 0 && consentVersion.length >= 5;
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

function response(status, body, origin = null) {
  const headers = { "content-type":"application/json; charset=utf-8", "cache-control":"no-store", "x-content-type-options":"nosniff" };
  if (origin && origins.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type, x-qs-session-token";
    headers["vary"] = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}
function hex(bytes) { return Array.from(bytes, x => x.toString(16).padStart(2,"0")).join(""); }
async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}
function token() { const bytes = crypto.getRandomValues(new Uint8Array(32)); return hex(bytes); }
function studyId() {
  const h = hex(crypto.getRandomValues(new Uint8Array(12))).toUpperCase();
  return "QS-" + h.match(/.{4}/g).join("-");
}
async function jsonBody(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY) throw new TypeError("Request exceeds size limit");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY) throw new TypeError("Request exceeds size limit");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Expected JSON object");
  return parsed;
}
function requiredText(value, max, field) {
  if (typeof value !== "string" || value.length < 1 || value.length > max || !/^[A-Za-z0-9_.:-]+$/.test(value)) throw new TypeError("Invalid " + field);
  return value;
}
function parseEnrollment(body) {
  if (body.consentAccepted !== true || body.age18plus !== true || body.participationScope !== "usability_nonclinical" || body.consentVersion !== consentVersion) {
    throw new TypeError("Explicit adult nonclinical consent with current version is required");
  }
  if (!SESSION.test(body.clientSessionId || "")) throw new TypeError("Invalid clientSessionId");
  if (!LOCALES.has(body.locale)) throw new TypeError("Invalid locale");
  if (!COARSE_PLATFORM.has(body.platformFamily) || !COARSE_BROWSER.has(body.browserFamily)) throw new TypeError("Invalid device category");
  return {
    client_session_id:body.clientSessionId,
    consent_version:consentVersion,
    consented_at:new Date().toISOString(),
    age_18_or_older:true,
    locale:body.locale,
    platform_family:body.platformFamily,
    browser_family:body.browserFamily,
    app_version:requiredText(body.appVersion, 40, "appVersion"),
    app_build_id:requiredText(body.appBuildId, 120, "appBuildId"),
    participation_scope:"usability_nonclinical",
    research_profile:"community_remote_qr"
  };
}
async function authorizedSession(req, body) {
  const sessionId = body.sessionId;
  const bearer = req.headers.get("x-qs-session-token") || "";
  if (typeof sessionId !== "string" || !UUID.test(sessionId) || !/^[0-9a-f]{64}$/.test(bearer)) return null;
  const digest = await sha256(bearer);
  const { data, error } = await db.from("jssf_remote_sessions")
    .select("id,status,expires_at").eq("id",sessionId).eq("upload_token_sha256",digest).maybeSingle();
  if (error) throw error;
  if (!data || Date.parse(data.expires_at) <= Date.now()) return null;
  return data;
}
Deno.serve(async req => {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (req.method === "GET" && url.pathname.endsWith("/health")) {
    return response(200,{ ok:true, collectionEnabled:enabled && Boolean(db), schemaVersion:CONTRACT_VERSION },origin);
  }
  if (!origin || !origins.has(origin)) return response(403,{error:"Origin not permitted"});
  if (req.method === "OPTIONS") return response(204,{},origin);
  if (req.method !== "POST") return response(405,{error:"Method not allowed"},origin);
  // Closed by default, including for callers that try bypassing the client UI.
  if (!enabled || !db) return response(503,{error:"JSSF_REMOTE_DISABLED"},origin);
  try {
    const body = await jsonBody(req);
    if (url.pathname.endsWith("/enroll")) {
      const input = parseEnrollment(body);
      const issued = token();
      const { data, error } = await db.from("jssf_remote_sessions")
        .insert({ ...input, study_id:studyId(), upload_token_sha256:await sha256(issued) })
        .select("id,study_id,expires_at").single();
      if (error) {
        if (error.code === "23505") return response(409,{error:"Session already enrolled"},origin);
        throw error;
      }
      return response(201,{ sessionId:data.id, studyId:data.study_id, uploadToken:issued, expiresAt:data.expires_at, schemaVersion:CONTRACT_VERSION },origin);
    }
    if (!url.pathname.endsWith("/events") && !url.pathname.endsWith("/withdraw")) return response(404,{error:"Not found"},origin);
    const session = await authorizedSession(req,body);
    if (!session) return response(401,{error:"Session not authorized or expired"},origin);
    if (url.pathname.endsWith("/withdraw")) {
      if (session.status === "withdrawn") return response(200,{withdrawn:true},origin);
      const { error:deleteError } = await db.from("jssf_remote_events").delete().eq("session_id",session.id);
      if (deleteError) throw deleteError;
      const { error:updateError } = await db.from("jssf_remote_sessions").update({
        status:"withdrawn", withdrawn_at:new Date().toISOString(), upload_token_sha256:await sha256(token())
      }).eq("id",session.id);
      if (updateError) throw updateError;
      return response(200,{withdrawn:true},origin);
    }
    if (session.status === "withdrawn") return response(410,{error:"Session withdrawn"},origin);
    const events = sanitizeBatch(body.events);
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
    console.error("JSSF ingest failed", { code:error?.code || "INTERNAL", kind: error?.name || "Error" });
    return response(500,{error:"Ingestion unavailable. Retry later."},origin);
  }
});
