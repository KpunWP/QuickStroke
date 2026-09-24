// Public sticky-abnormal regression checks against the actual result.html helpers.
// These are deterministic logic tests, not substitutes for iPhone/browser device tests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../result.html', import.meta.url), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `Missing result.html section: ${startMarker}`);
  return source.slice(start, end);
}

const classification = section(
  'function moduleClass(d) {',
  'function moduleResearchScoreIsUsable(d) {'
);
const publicHistory = section(
  "const PUBLIC_ABNORMAL_HISTORY_PREFIX = 'fast_public_abnormal_history_v1_';",
  'function readLegacyModule(name) {'
);

const entries = new Map();
let sessionId = 'public-session-1';
let mode = 'public';
const sessionStorage = {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, String(value)),
  removeItem: key => entries.delete(key)
};

const loadHelpers = new Function(
  'sessionStorage', 'currentSessionIdentity', 'isPublicResultSession', 'MODULES', 'console',
  classification + '\n' + publicHistory +
  '\nreturn { moduleClass, rememberPublicAbnormal, applyPublicAbnormalHistory, readPublicAbnormalHistory };'
);
const result = loadHelpers(
  sessionStorage,
  () => ({ screeningSessionId: sessionId }),
  () => mode === 'public',
  ['face', 'arm', 'speech'],
  console
);

const initialArm = {
  moduleRunId: 'arm-run-1',
  validityStatus: 'valid',
  observationStatus: 'abnormal',
  completedAt: '2026-08-13T09:00:00.000Z'
};
const retryArm = {
  moduleRunId: 'arm-run-2',
  validityStatus: 'valid',
  observationStatus: 'normal',
  completedAt: '2026-08-13T09:05:00.000Z'
};

// A valid abnormal remains in safety history; the current retry remains normal.
assert.equal(result.moduleClass(initialArm), 'bad');
result.rememberPublicAbnormal('arm', initialArm);
result.rememberPublicAbnormal('arm', initialArm); // repeated rendering must not double count
const latest = result.applyPublicAbnormalHistory('arm', retryArm);
assert.equal(result.moduleClass(latest), 'ok');
assert.equal(latest.historicalAbnormalRetained, true);
assert.equal(latest.abnormalHistoryCount, 1);
assert.equal(latest.publicAbnormalHistoryRetained, true);

// Invalid observations and Speech attention must never become abnormal history.
result.rememberPublicAbnormal('face', { moduleRunId: 'face-invalid', validityStatus: 'invalid', observationStatus: 'abnormal' });
result.rememberPublicAbnormal('speech', { moduleRunId: 'speech-attention', validityStatus: 'valid', observationStatus: 'attention' });
assert.equal(result.readPublicAbnormalHistory().face, undefined);
assert.equal(result.readPublicAbnormalHistory().speech, undefined);

// A new Public session must not inherit the previous session's warning.
sessionId = 'public-session-2';
assert.deepEqual(Object.keys(result.readPublicAbnormalHistory()), []);
const fresh = result.applyPublicAbnormalHistory('arm', retryArm);
assert.equal(fresh.historicalAbnormalRetained, undefined);

// Research mode must not read or write the Public history store.
sessionId = 'public-session-1';
mode = 'research';
assert.deepEqual(Object.keys(result.readPublicAbnormalHistory()), []);
result.rememberPublicAbnormal('arm', initialArm);
assert.equal(result.applyPublicAbnormalHistory('arm', retryArm).historicalAbnormalRetained, undefined);

console.log('PASS: Public abnormal -> normal retry retains separate history');
console.log('PASS: No double count, no Speech attention/invalid sticky, new session isolated');
console.log('PASS: Research mode does not access Public history');
