#!/usr/bin/env python3
"""Audit a QuickStroke 1.0.20 session export without modifying it."""
from __future__ import annotations

import argparse
import collections
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

COLLECTION_IDS = {
    "moduleRuns": "moduleRunId",
    "testAttempts": "testAttemptId",
    "moduleMeasurements": "moduleMeasurementId",
    "sensorObservations": "observationId",
    "technicalEvents": "technicalEventId",
    "resultProjections": "projectionId",
}


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def duplicate_values(records: list[dict[str, Any]], field: str) -> list[str]:
    values = [record.get(field) for record in records if record.get(field)]
    return sorted(value for value, count in collections.Counter(values).items() if count > 1)


def find_sensitive_microphone_fields(node: Any, path: str = "") -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    if isinstance(node, dict):
        for key, value in node.items():
            child_path = f"{path}.{key}" if path else key
            normalized = key.lower().replace("_", "")
            if normalized in {"label", "deviceid", "groupid", "rawaudio", "audioblob"}:
                if "microphone" in path.lower() or normalized != "label":
                    findings.append({"path": child_path, "value": value})
            findings.extend(find_sensitive_microphone_fields(value, child_path))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            findings.extend(find_sensitive_microphone_fields(value, f"{path}.{index}"))
    return findings


def audit(data: dict[str, Any]) -> dict[str, Any]:
    session = data.get("screeningSession") or {}
    runs = data.get("moduleRuns") or []
    attempts = data.get("testAttempts") or []
    measurements = data.get("moduleMeasurements") or []
    observations = data.get("sensorObservations") or []
    events = data.get("technicalEvents") or []
    projections = data.get("resultProjections") or []

    run_ids = {r.get("moduleRunId") for r in runs if r.get("moduleRunId")}
    attempt_ids = {a.get("testAttemptId") for a in attempts if a.get("testAttemptId")}
    measurement_ids = {m.get("moduleMeasurementId") for m in measurements if m.get("moduleMeasurementId")}

    attempts_by_run: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for attempt in attempts:
        attempts_by_run[attempt.get("moduleRunId")].append(attempt)

    completed_by_module: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for run in runs:
        if run.get("moduleRunStatus") == "completed" and run.get("completedAt"):
            completed_by_module[run.get("module")].append(run)

    required_modules = ["face", "arm", "speech"]
    first_completed_runs: dict[str, dict[str, Any]] = {}
    for module in required_modules:
        candidates = completed_by_module.get(module, [])
        if candidates:
            first_completed_runs[module] = min(candidates, key=lambda r: parse_iso(r.get("completedAt")) or datetime.max.replace(tzinfo=timezone.utc))

    expected_protocol_completed_at = None
    if len(first_completed_runs) == len(required_modules):
        expected_protocol_completed_at = max(
            first_completed_runs[module]["completedAt"] for module in required_modules
        )

    orphan_attempts = [
        a.get("testAttemptId") for a in attempts if a.get("moduleRunId") not in run_ids
    ]
    orphan_measurements = [
        m.get("moduleMeasurementId")
        for m in measurements
        if m.get("moduleRunId") not in run_ids or m.get("testAttemptId") not in attempt_ids
    ]
    orphan_observations = [
        o.get("observationId")
        for o in observations
        if o.get("moduleRunId") not in run_ids or (o.get("testAttemptId") and o.get("testAttemptId") not in attempt_ids)
    ]
    orphan_events = [
        e.get("technicalEventId")
        for e in events
        if (e.get("moduleRunId") and e.get("moduleRunId") not in run_ids)
        or (e.get("testAttemptId") and e.get("testAttemptId") not in attempt_ids)
    ]
    orphan_projections = [
        p.get("projectionId")
        for p in projections
        if p.get("selectedModuleRunId") and p.get("selectedModuleRunId") not in run_ids
    ]

    broken_retry_run_links = [
        r.get("moduleRunId")
        for r in runs
        if r.get("retryOfModuleRunId") and r.get("retryOfModuleRunId") not in run_ids
    ]
    broken_retry_attempt_links = [
        a.get("testAttemptId")
        for a in attempts
        if a.get("retryOfAttemptId") and a.get("retryOfAttemptId") not in attempt_ids
    ]

    attempt_count_issues = []
    for run in runs:
        actual = len(attempts_by_run.get(run.get("moduleRunId"), []))
        stored = run.get("attemptCount")
        if stored != actual:
            attempt_count_issues.append({
                "moduleRunId": run.get("moduleRunId"),
                "module": run.get("module"),
                "storedAttemptCount": stored,
                "actualAttemptCount": actual,
            })

    raw_mic_findings = find_sensitive_microphone_fields(measurements, "moduleMeasurements")

    duplicate_summary = {
        collection: duplicate_values(data.get(collection) or [], id_field)
        for collection, id_field in COLLECTION_IDS.items()
    }
    duplicate_count = sum(len(values) for values in duplicate_summary.values())
    orphan_summary = {
        "testAttempts": orphan_attempts,
        "moduleMeasurements": orphan_measurements,
        "sensorObservations": orphan_observations,
        "technicalEvents": orphan_events,
        "resultProjections": orphan_projections,
    }
    orphan_count = sum(len(values) for values in orphan_summary.values())

    valid_abnormal_runs = [
        r.get("moduleRunId")
        for r in runs
        if r.get("validityStatus") == "valid" and r.get("observationStatus") == "abnormal"
    ]

    issues = []
    if session.get("sessionStatus") == "active" and expected_protocol_completed_at:
        issues.append("SESSION_ACTIVE_AFTER_PROTOCOL_COMPLETION")
    if not session.get("protocolCompletedAt") and expected_protocol_completed_at:
        issues.append("PROTOCOL_COMPLETED_AT_MISSING")
    if attempt_count_issues:
        issues.append("MODULE_RUN_ATTEMPT_COUNT_MISMATCH")
    if raw_mic_findings:
        issues.append("RAW_MICROPHONE_IDENTIFIER_IN_RESEARCH_PAYLOAD")
    if duplicate_count:
        issues.append("DUPLICATE_IDS")
    if orphan_count:
        issues.append("ORPHAN_RECORDS")
    if broken_retry_run_links or broken_retry_attempt_links:
        issues.append("BROKEN_RETRY_LINEAGE")

    return {
        "auditSchemaVersion": "quickstroke-session-audit-1.0.0",
        "auditedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {
            "exportSchemaVersion": data.get("exportSchemaVersion"),
            "exportedAt": data.get("exportedAt"),
            "appVersion": (data.get("versionSnapshot") or {}).get("appVersion"),
            "screeningSessionId": session.get("screeningSessionId"),
            "sha256": None,
        },
        "counts": {
            "moduleRuns": len(runs),
            "testAttempts": len(attempts),
            "moduleMeasurements": len(measurements),
            "sensorObservations": len(observations),
            "technicalEvents": len(events),
            "resultProjections": len(projections),
        },
        "lifecycle": {
            "storedSessionStatus": session.get("sessionStatus"),
            "storedProtocolCompletedAt": session.get("protocolCompletedAt"),
            "storedFinalizedAt": session.get("finalizedAt"),
            "requiredModulesCompleted": sorted(first_completed_runs.keys()),
            "firstCompletedModuleRunIds": {
                module: first_completed_runs[module].get("moduleRunId") for module in first_completed_runs
            },
            "expectedProtocolCompletedAt": expected_protocol_completed_at,
            "protocolCompletionDetected": expected_protocol_completed_at is not None,
        },
        "attemptCounts": {
            "issueCount": len(attempt_count_issues),
            "issues": attempt_count_issues,
        },
        "integrity": {
            "duplicateCount": duplicate_count,
            "duplicates": duplicate_summary,
            "orphanCount": orphan_count,
            "orphans": orphan_summary,
            "brokenRetryRunLinks": broken_retry_run_links,
            "brokenRetryAttemptLinks": broken_retry_attempt_links,
            "measurementIdCount": len(measurement_ids),
        },
        "safetyAndSelectionEvidence": {
            "validAbnormalModuleRunIds": valid_abnormal_runs,
            "hasHistoricalValidAbnormal": bool(valid_abnormal_runs),
            "latestArmRunId": max(
                (r for r in runs if r.get("module") == "arm"),
                key=lambda r: r.get("moduleRunSequenceNo") or 0,
                default={},
            ).get("moduleRunId"),
        },
        "microphonePrivacy": {
            "rawIdentifierFindingCount": len(raw_mic_findings),
            "findings": raw_mic_findings,
        },
        "issueCodes": issues,
        "pass": not issues,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--json", dest="json_output", type=Path)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8-sig"))
    result = audit(data)
    result["source"]["sha256"] = hashlib.sha256(args.input.read_bytes()).hexdigest()
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_output:
        args.json_output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")


if __name__ == "__main__":
    main()
