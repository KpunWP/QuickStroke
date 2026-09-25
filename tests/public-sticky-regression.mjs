// Public sticky-abnormal regression checks against the actual result.html helpers.
// These are deterministic logic tests, not substitutes for iPhone/browser device tests.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../result.html', import.meta.url), 'utf8');
const armSource = readFileSync(new URL('../arm-test.html', import.meta.url), 'utf8');

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

// The canonical result path must apply Public sticky history as well as the legacy fallback.
assert.match(
  source,
  /const canonicalModuleData = buildCanonicalModule\(name, bundle, legacyModules\[name\], integrity\);[\s\S]*?applyPublicAbnormalHistory\(name, canonicalModuleData\)/,
  'Canonical result data must receive Public abnormal history before rendering'
);

// A completed valid abnormal Arm run must survive an in-page retry, even if
// Result was never opened between the abnormal and normal module runs.
const armHelperStart = 'function rememberCompletedPublicArmAbnormal(payload, context) {';
const armHelperEnd = 'function showFinal() {';
const armHelperBegin = armSource.indexOf(armHelperStart);
const armHelperFinish = armSource.indexOf(armHelperEnd, armHelperBegin);
assert.ok(armHelperBegin >= 0 && armHelperFinish > armHelperBegin);
const rememberCompletedPublicArmAbnormal = new Function(
  'sessionStorage', 'console',
  armSource.slice(armHelperBegin, armHelperFinish) + '\nreturn rememberCompletedPublicArmAbnormal;'
)(sessionStorage, console);
assert.match(
  armSource,
  /rememberCompletedPublicArmAbnormal\(armPayload, context\);\s*sessionStorage\.setItem\('fast_arm'/,
  'Arm must retain Public history before overwriting its latest payload'
);
sessionId = 'public-internal-retry';
const internalContext = { appMode: 'public', screeningSessionId: sessionId };
rememberCompletedPublicArmAbnormal(initialArm, internalContext);
rememberCompletedPublicArmAbnormal(initialArm, internalContext);
rememberCompletedPublicArmAbnormal(
  { ...initialArm, moduleRunId: 'invalid-attempt', validityStatus: 'invalid' },
  internalContext
);
rememberCompletedPublicArmAbnormal(
  { ...initialArm, moduleRunId: 'research-run' },
  { ...internalContext, appMode: 'research' }
);
const retainedFromArmPage = result.readPublicAbnormalHistory().arm;
assert.equal(retainedFromArmPage.count, 1);
const normalAfterInPageRetry = result.applyPublicAbnormalHistory('arm', retryArm);
assert.equal(result.moduleClass(normalAfterInPageRetry), 'ok');
assert.equal(normalAfterInPageRetry.historicalAbnormalRetained, true);
assert.equal(normalAfterInPageRetry.abnormalHistoryCount, 1);
sessionId = 'public-session-1';

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

// Execute the real Result summary rendering logic with a minimal DOM. A green
// individual summary must not conceal an earlier valid abnormal in the session.
const summarySource = section(
  'function individualSummaryCopy(r) {',
  'function moduleStatus(name, d) {'
);
const summaryNodes = new Map();
const documentStub = {
  getElementById(id) {
    if (!summaryNodes.has(id)) {
      summaryNodes.set(id, { className: '', textContent: '', hidden: false, innerHTML: '' });
    }
    return summaryNodes.get(id);
  }
};
const resultCopy = {
  arm: 'แขน',
  individualResultTitle: 'ผล · {module}',
  individualOkDesc: 'ไม่พบสัญญาณ',
  individualKicker: 'ผลรายการนี้',
  historicalAbnormalSummary: 'เคยพบความผิดปกติในการทดสอบก่อนหน้านี้',
  metricDetected: 'พบสัญญาณ',
  summaryKicker: 'ผลรวม',
  metricTested: 'ทดสอบแล้ว',
  completionShort: '{n}'
};
const renderSummary = new Function(
  'document', 'MODULES', 'T', 'moduleClass', 'stateCopy', 'emergencyPhone',
  summarySource + '\nreturn renderSummary;'
)(
  documentStub, ['face', 'arm', 'speech'], resultCopy, result.moduleClass,
  () => ['ผลรวม', 'ไม่พบสัญญาณ'], () => null
);
renderSummary({ scope: 'individual', source: 'arm', data: { arm: latest }, state: 'ok' });
assert.equal(summaryNodes.get('summary-card').className, 'summary-card review');
assert.match(summaryNodes.get('summary-desc').textContent, /เคยพบความผิดปกติ/);
assert.equal(summaryNodes.get('metric-value').textContent, '0/1'); // Current result is unchanged

renderSummary({ scope: 'individual', source: 'arm', data: { arm: retryArm }, state: 'ok' });
assert.equal(summaryNodes.get('summary-card').className, 'summary-card ok');
assert.doesNotMatch(summaryNodes.get('summary-desc').textContent, /เคยพบความผิดปกติ/);

renderSummary({ scope: 'combined', data: { arm: latest }, state: 'ok', valid: ['arm'], attention: 0 });
assert.equal(summaryNodes.get('summary-card').className, 'summary-card review');
assert.match(summaryNodes.get('summary-desc').textContent, /เคยพบความผิดปกติ/);

console.log('PASS: Public abnormal -> normal retry retains separate history');
console.log('PASS: No double count, no Speech attention/invalid sticky, new session isolated');
console.log('PASS: Research mode does not access Public history');
console.log('PASS: Individual and combined summaries prominently retain prior abnormal warning');
console.log('PASS: Arm in-page abnormal -> retry -> normal retains history across pages');
