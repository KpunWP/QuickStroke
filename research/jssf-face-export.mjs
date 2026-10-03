#!/usr/bin/env node
import fs from "node:fs";

export function normalizeBundle(input) {
  if (Array.isArray(input)) return { sessions: [], events: input };
  if (!input || typeof input !== "object") throw new TypeError("Expected JSON array or {sessions,events} object");
  return {
    sessions: Array.isArray(input.sessions) ? input.sessions : [],
    events: Array.isArray(input.events) ? input.events : []
  };
}

function eventType(event) { return event?.event_type ?? event?.eventType ?? null; }
function payload(event) { return event?.payload && typeof event.payload === "object" ? event.payload : {}; }
function sessionId(event) { return event?.session_id ?? event?.sessionId ?? null; }

export function flattenFaceResearch(input) {
  const { sessions, events } = normalizeBundle(input);
  const sessionById = new Map(sessions.map((row)=>[row.id ?? row.session_id ?? row.sessionId,row]));
  const attemptById = new Map();

  for (const event of events) {
    if (eventType(event) !== "face_research_attempt") continue;
    const p = payload(event);
    if (typeof p.testAttemptId !== "string") continue;
    attemptById.set(p.testAttemptId,{
      event,
      payload:p,
      session:sessionById.get(sessionId(event)) ?? null
    });
  }

  const samples=[];
  for (const event of events) {
    if (eventType(event) !== "face_research_samples") continue;
    const p=payload(event);
    if (!Array.isArray(p.fields)||!Array.isArray(p.rows)) continue;
    const summary=attemptById.get(p.testAttemptId) ?? null;
    const session=summary?.session ?? sessionById.get(sessionId(event)) ?? null;
    for (let rowIndex=0; rowIndex<p.rows.length; rowIndex++) {
      const row=p.rows[rowIndex];
      if (!Array.isArray(row)||row.length!==p.fields.length) {
        throw new TypeError("Face sample row/field length mismatch");
      }
      const sample=Object.fromEntries(p.fields.map((field,index)=>[field,row[index]]));
      samples.push({
        sessionId:sessionId(event),
        studyId:session?.study_id ?? session?.studyId ?? null,
        platformFamily:session?.platform_family ?? session?.platformFamily ?? null,
        browserFamily:session?.browser_family ?? session?.browserFamily ?? null,
        locale:session?.locale ?? null,
        testAttemptId:p.testAttemptId,
        moduleRunId:p.moduleRunId ?? summary?.payload?.moduleRunId ?? null,
        batchNo:p.batchNo ?? null,
        sampleIndexInBatch:rowIndex,
        ...sample,
        baseline:summary?.payload?.baseline ?? null,
        capacity:summary?.payload?.capacity ?? null,
        detection:summary?.payload?.detection ?? null,
        dynamic:summary?.payload?.dynamic ?? null,
        runtime:summary?.payload?.runtime ?? null,
        versions:summary?.payload?.versions ?? null,
        thresholds:summary?.payload?.thresholds ?? null,
        quality:summary?.payload?.quality ?? null,
        outcome:summary?.payload?.outcome ?? null,
        invalidReasonCode:summary?.payload?.invalidReasonCode ?? null
      });
    }
  }

  return {
    attempts:[...attemptById.values()].map(({event,payload:p,session})=>({
      sessionId:sessionId(event),
      studyId:session?.study_id ?? session?.studyId ?? null,
      platformFamily:session?.platform_family ?? session?.platformFamily ?? null,
      browserFamily:session?.browser_family ?? session?.browserFamily ?? null,
      locale:session?.locale ?? null,
      ...p
    })),
    samples
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file=process.argv[2];
  if (!file) {
    console.error("Usage: node research/jssf-face-export.mjs <events-or-bundle.json>");
    process.exit(2);
  }
  const input=JSON.parse(fs.readFileSync(file,"utf8"));
  process.stdout.write(JSON.stringify(flattenFaceResearch(input),null,2)+"\n");
}
