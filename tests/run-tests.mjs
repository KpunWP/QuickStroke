import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BASELINE = JSON.parse(fs.readFileSync(path.join(HERE, 'baseline-1.0.20.json'), 'utf8'));

class Storage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

function makeContext(search = '') {
  const listeners = new Map();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    WeakMap,
    Promise,
    URLSearchParams,
    sessionStorage: new Storage(),
    localStorage: new Storage(),
    location: { search, pathname: '/index.html' },
    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) Version/18.3 Mobile Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      language: 'th-TH',
      serviceWorker: { controller: null }
    },
    screen: { width: 390, height: 844 },
    innerWidth: 390,
    innerHeight: 695,
    devicePixelRatio: 3,
    isSecureContext: true,
    crypto: { randomUUID: () => crypto.randomUUID() },
    structuredClone,
    CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) || []) fn(event);
      return true;
    },
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    setTimeout,
    clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

function runFile(context, file) {
  const source = fs.readFileSync(file, 'utf8');
  vm.runInContext(source, context, { filename: file });
}

function loadCurrent(search = '') {
  const c = makeContext(search);
  for (const file of ['config.js', 'js/app-mode.js', 'js/research-policy.js', 'js/data-contract.js']) {
    runFile(c, path.join(ROOT, file));
  }
  return c;
}

function loadConfig(file) {
  const c = makeContext();
  runFile(c, file);
  return JSON.parse(JSON.stringify(c.QS_CONFIG));
}

function extractFunction(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Function ${name} not found`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let state = 'code';
  let quote = null;
  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (state === 'line') { if (ch === '\n') state = 'code'; continue; }
    if (state === 'block') { if (ch === '*' && next === '/') { state = 'code'; i += 1; } continue; }
    if (state === 'string') {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) { state = 'code'; quote = null; }
      continue;
    }
    if (ch === '/' && next === '/') { state = 'line'; i += 1; continue; }
    if (ch === '/' && next === '*') { state = 'block'; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { state = 'string'; quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1).replace(/\s+/g, ' ').trim();
    }
  }
  throw new Error(`Function ${name} is unterminated`);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('app version and policy versions are 1.0.21', () => {
  const c = loadCurrent();
  assert.equal(c.QS_CONFIG.version, '1.0.21');
  assert.equal(c.QuickStrokeDataContract.version, 'quickstroke-common-data-0.2.0');
  assert.equal(c.QuickStrokeResearchPolicy.selectionPolicyVersion, 'quickstroke-selection-policy-1.0.0');
});

test('Face/Arm/Speech thresholds are unchanged from 1.0.20', () => {
  const newConfig = loadConfig(path.join(ROOT, 'config.js'));
  assert.deepEqual(newConfig.thresholds, BASELINE.thresholds);
  assert.deepEqual(newConfig.scoring, BASELINE.scoring);
});

test('critical algorithm functions are unchanged', () => {
  const targets = {
    'face-test.html': ['makeResultPayload', 'saveAndShow', 'finalizeInvalidResult'],
    'arm-test.html': ['classifyArmMotion', 'driftToScore', 'evaluateReadiness', 'startMeasure'],
    'speech-test.html': ['makeSpeechResultPayload', 'finalizeCanonicalSpeechAttempt', 'finalizeSpeechModuleRun'],
    'result.html': ['moduleClass', 'calculate']
  };
  for (const [file, functions] of Object.entries(targets)) {
    const after = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const fn of functions) {
      const normalized = extractFunction(after, fn);
      const digest = crypto.createHash('sha256').update(normalized).digest('hex');
      assert.equal(digest, BASELINE.criticalFunctionSha256[file][fn], `${file}:${fn} changed`);
    }
  }
});

test('Public Mode is ephemeral and has no Study ID snapshot', () => {
  const c = loadCurrent();
  const ctx = c.QuickStrokeDataContract.ensureScreeningContext();
  assert.equal(ctx.appMode, 'public');
  assert.equal(ctx.analysisRole, 'public_ephemeral');
  assert.equal(ctx.researchMetadata, null);
  const record = c.QuickStrokeDataContract.createScreeningSessionRecord({ context: ctx });
  assert.equal(record.uploadState, 'not_applicable');
  assert.equal(record.exportState, 'not_applicable');
});

test('Research Mode auto-generates Study ID, snapshots clinic metadata, and lifecycle is monotonic', () => {
  const c = loadCurrent();
  const app = c.QuickStrokeAppMode;
  const dc = c.QuickStrokeDataContract;
  app.configureResearchContext({
    researchProfile: 'clinic_supervised', consentStatus: 'consented',
    consentVersion: 'ICF-1.0', recruitmentSource: 'clinic_outpatient', operatorRole: 'research_assistant',
    operatorId: 'RA-01', siteCode: 'SITE-A'
  });
  let ctx = dc.ensureScreeningContext({ forceNewParticipant: true, forceNewSession: true, mode: 'full' });
  assert.equal(ctx.appMode, 'research');
  assert.equal(ctx.analysisRole, 'research_candidate');
  assert.match(ctx.researchMetadata.studyId, /^QS-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(ctx.researchMetadata.studyIdSource, 'system_generated_random');
  assert.equal(ctx.researchMetadata.studyIdGenerationPolicyVersion, 'quickstroke-study-id-random-1.0.0');
  assert.equal(ctx.sessionStatus, 'active');

  const first = dc.createModuleRun({ module: 'face', trigger: 'full_flow' });
  const second = dc.createModuleRun({ module: 'face', trigger: 'continue_incomplete' });
  assert.equal(first.protocolPhase, 'initial_protocol');
  assert.equal(second.protocolPhase, 'protocol_retry');
  assert.equal(first.attemptCount, 0);

  ctx = dc.markProtocolCompleted('2026-08-01T10:00:00.000Z');
  assert.equal(ctx.sessionStatus, 'protocol_completed');
  assert.equal(ctx.protocolCompletedAt, '2026-08-01T10:00:00.000Z');
  const post = dc.createModuleRun({ module: 'face', trigger: 'result_retry' });
  assert.equal(post.protocolPhase, 'post_protocol_repeatability');
  assert.equal(dc.getSessionContext().sessionStatus, 'protocol_completed');

  ctx = dc.finalizeScreeningSession({ reasonCode: 'PARTICIPANT_DATA_COLLECTION_ENDED' });
  assert.equal(ctx.sessionStatus, 'finalized');
  assert.ok(ctx.finalizedAt);
  assert.throws(() => dc.createModuleRun({ module: 'face' }), /finalized session/i);
});


test('Study ID generator uses secure random IDs with stable non-time format', () => {
  const c = loadCurrent();
  const app = c.QuickStrokeAppMode;
  const ids = Array.from({ length: 256 }, () => app.generateStudyId());
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^QS-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(app.studyIdPolicyVersion, 'quickstroke-study-id-random-1.0.0');
  const invalid = app.validateResearchMetadata({
    researchProfile:'clinic_supervised', studyId:'QS-BAD', studyIdSource:'system_generated_random',
    studyIdGenerationPolicyVersion:app.studyIdPolicyVersion, consentStatus:'consented', consentVersion:'ICF-1',
    recruitmentSource:'clinic_outpatient', operatorRole:'nurse'
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.includes('STUDY_ID_FORMAT_INVALID'));
  const source = fs.readFileSync(path.join(ROOT, 'js/app-mode.js'), 'utf8');
  assert.match(source, /cryptoApi\?\.randomUUID|cryptoApi\?\.getRandomValues/);
  assert.doesNotMatch(source, /Math\.random\s*\(/);
});

test('Dev Mode records are engineering_only', () => {
  const c = loadCurrent('?dev=1');
  const ctx = c.QuickStrokeDataContract.ensureScreeningContext({ forceNewParticipant: true, forceNewSession: true });
  assert.equal(ctx.appMode, 'dev');
  assert.equal(ctx.analysisRole, 'engineering_only');
  const run = c.QuickStrokeDataContract.createModuleRun({ module: 'arm' });
  assert.equal(run.analysisRole, 'engineering_only');
});

test('selection policy locks feasibility, clinical, repeatability, safety, and current result', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const session = { protocolCompletedAt: '2026-08-01T10:03:00.000Z' };
  const runs = [
    { module:'arm', moduleRunId:'R1', moduleRunSequenceNo:1, moduleRunStatus:'completed', validityStatus:'invalid', observationStatus:'indeterminate', startedAt:'2026-08-01T10:00:00Z', completedAt:'2026-08-01T10:01:00Z', analysisRole:'research_candidate' },
    { module:'arm', moduleRunId:'R2', moduleRunSequenceNo:2, moduleRunStatus:'completed', validityStatus:'valid', observationStatus:'abnormal', startedAt:'2026-08-01T10:01:10Z', completedAt:'2026-08-01T10:02:00Z', analysisRole:'research_candidate' },
    { module:'arm', moduleRunId:'R3', moduleRunSequenceNo:3, moduleRunStatus:'completed', validityStatus:'valid', observationStatus:'no_alert', protocolPhase:'post_protocol_repeatability', startedAt:'2026-08-01T10:04:00Z', completedAt:'2026-08-01T10:05:00Z', analysisRole:'research_candidate' }
  ];
  const selected = policy.deriveModuleSelection('arm', session, runs);
  assert.equal(selected.initialModuleRunId, 'R1');
  assert.equal(selected.firstValidModuleRunId, 'R2');
  assert.equal(selected.latestModuleRunId, 'R3');
  assert.equal(selected.firstAbnormalModuleRunId, 'R2');
  assert.equal(selected.currentResultModuleRunId, 'R3');
  assert.deepEqual([...selected.repeatabilityValidModuleRunIds], ['R2','R3']);
  assert.equal(selected.historicalAbnormalWarning, true);
});

test('Research microphone payload excludes raw label and device IDs', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const research = policy.standardizeMicrophoneRuntime({
    label:'iPhone Microphone', settings:{ sampleRate:48000, channelCount:1, echoCancellation:true, deviceId:'secret', groupId:'secret2' }
  }, { includeRawLabel:false });
  assert.equal(research.microphoneClass, 'built_in_microphone');
  assert.equal(research.inputRoute, 'built_in');
  assert.equal(research.sampleRate, 48000);
  assert.equal('rawLabel' in research, false);
  assert.equal(JSON.stringify(research).includes('secret'), false);
  const dev = policy.standardizeMicrophoneRuntime({ label:'iPhone Microphone', settings:{} }, { includeRawLabel:true });
  assert.equal(dev.rawLabel, 'iPhone Microphone');
});

test('integrity validator accepts a complete clean research session', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const session = {
    screeningSessionId:'S1', participantId:'P1', sessionStatus:'protocol_completed', appMode:'research',
    analysisRole:'research_candidate', protocolCompletedAt:'2026-08-01T10:03:00Z',
    researchMetadata:{ researchProfile:'clinic_supervised', researchProfileEnabled:true, dataCollectionEnabled:true,
      studyId:'QS-1', consentStatus:'consented', consentVersion:'ICF-1', recruitmentSource:'clinic_outpatient', operatorRole:'research_assistant' }
  };
  const moduleRuns = ['face','arm','speech'].map((module,index) => ({
    screeningSessionId:'S1', participantId:'P1', module, moduleRunId:`R${index+1}`, moduleRunSequenceNo:1,
    moduleRunStatus:'completed', validityStatus:'valid', observationStatus:'no_alert', attemptCount:1,
    selectedTestAttemptId:`A${index+1}`,
    startedAt:`2026-08-01T10:0${index}:00Z`, completedAt:`2026-08-01T10:0${index+1}:00Z`, analysisRole:'research_candidate'
  }));
  const testAttempts = moduleRuns.map((run,index) => ({
    screeningSessionId:'S1', participantId:'P1', module:run.module, moduleRunId:run.moduleRunId,
    testAttemptId:`A${index+1}`, measurementTarget:run.module === 'arm' ? 'left_arm' : run.module,
    attemptStatus:'completed', validityStatus:'valid', analysisRole:'research_candidate'
  }));
  const moduleMeasurements = testAttempts.map((attempt,index) => ({
    moduleMeasurementId:`MM${index+1}`, screeningSessionId:'S1', participantId:'P1',
    moduleRunId:attempt.moduleRunId, testAttemptId:attempt.testAttemptId, module:attempt.module,
    measurementTarget:attempt.measurementTarget, analysisRole:'research_candidate', payload:{ rawAudioStored:false }
  }));
  session.selectionPolicyVersion = policy.selectionPolicyVersion;
  session.moduleSelection = policy.deriveSelectionSummary(session, moduleRuns).byModule;
  const report = policy.validateSessionBundle({ screeningSession:session, moduleRuns, testAttempts, moduleMeasurements }, { requireProtocolComplete:true, requireResearch:true });
  assert.equal(report.canFinalize, true, report.errors.join(','));
  assert.equal(report.protocol.protocolComplete, true);
  assert.equal(report.protocol.expectedProtocolCompletedAt, '2026-08-01T10:03:00.000Z');
  assert.equal(report.attemptCountMismatches.length, 0);
});

test('integrity validator rejects lifecycle regression and protocol timestamp mismatch', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const moduleRuns = ['face','arm','speech'].map((module,index) => ({
    screeningSessionId:'S1', participantId:'P1', module, moduleRunId:`R${index+1}`, moduleRunSequenceNo:1,
    moduleRunStatus:'completed', validityStatus:'valid', observationStatus:'no_alert', attemptCount:0,
    startedAt:`2026-08-01T10:0${index}:00Z`, completedAt:`2026-08-01T10:0${index+1}:00Z`, analysisRole:'research_candidate'
  }));
  const report = policy.validateSessionBundle({
    screeningSession:{ screeningSessionId:'S1', participantId:'P1', sessionStatus:'active', protocolCompletedAt:'2026-08-01T10:09:00Z',
      appMode:'research', analysisRole:'research_candidate',
      researchMetadata:{ researchProfile:'clinic_supervised', studyId:'QS-1', consentStatus:'consented', consentVersion:'ICF-1', recruitmentSource:'clinic', operatorRole:'nurse' } },
    moduleRuns, testAttempts:[]
  }, { requireProtocolComplete:true, requireResearch:true });
  assert.equal(report.canFinalize, false);
  assert.ok(report.errors.includes('SESSION_ACTIVE_AFTER_PROTOCOL_COMPLETION'));
  assert.ok(report.errors.includes('PROTOCOL_COMPLETED_AT_MISMATCH'));
});

test('integrity validator catches completed-run completeness and selection pointer drift', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const session = {
    screeningSessionId:'S1', participantId:'P1', sessionStatus:'protocol_completed', appMode:'research',
    analysisRole:'research_candidate', protocolCompletedAt:'2026-08-01T10:03:00Z',
    selectionPolicyVersion:policy.selectionPolicyVersion,
    researchMetadata:{ researchProfile:'clinic_supervised', studyId:'QS-1', consentStatus:'consented', consentVersion:'ICF-1', recruitmentSource:'clinic', operatorRole:'nurse' },
    moduleSelection:{ face:{ initialModuleRunId:'WRONG' }, arm:{}, speech:{} }
  };
  const moduleRuns = ['face','arm','speech'].map((module,index) => ({
    screeningSessionId:'S1', participantId:'P1', module, moduleRunId:`R${index+1}`, moduleRunSequenceNo:1,
    moduleRunStatus:'completed', validityStatus:'valid', observationStatus:'no_alert', attemptCount:1,
    selectedTestAttemptId:`A${index+1}`,
    startedAt:`2026-08-01T10:0${index}:00Z`, completedAt:`2026-08-01T10:0${index+1}:00Z`, analysisRole:'research_candidate'
  }));
  const testAttempts = moduleRuns.map((run,index) => ({
    screeningSessionId:'S1', participantId:'P1', module:run.module, moduleRunId:run.moduleRunId,
    testAttemptId:`A${index+1}`, measurementTarget:run.module === 'arm' ? 'left_arm' : run.module,
    attemptStatus:'completed', validityStatus:'valid', analysisRole:'research_candidate'
  }));
  const report = policy.validateSessionBundle({ screeningSession:session, moduleRuns, testAttempts, moduleMeasurements:[] }, { requireProtocolComplete:true, requireResearch:true });
  assert.equal(report.canFinalize, false);
  assert.ok(report.errors.includes('COMPLETED_RUN_DATA_INCOMPLETE'));
  assert.ok(report.errors.includes('SESSION_SELECTION_POINTER_MISMATCH'));
  assert.ok(report.completedRunDataIssues.some((item) => item.code === 'COMPLETED_RUN_WITHOUT_MEASUREMENT'));
  assert.ok(report.selectionPointerMismatches.length > 0);
});

test('integrity validator catches attempt counts, orphans, and microphone privacy', () => {
  const c = loadCurrent();
  const policy = c.QuickStrokeResearchPolicy;
  const report = policy.validateSessionBundle({
    screeningSession:{ screeningSessionId:'S1', participantId:'P1', sessionStatus:'active', appMode:'research', analysisRole:'research_candidate',
      researchMetadata:{ researchProfile:'clinic_supervised', studyId:'QS-1', consentStatus:'consented', consentVersion:'ICF-1', recruitmentSource:'clinic', operatorRole:'nurse' } },
    moduleRuns:[{ screeningSessionId:'S1',participantId:'P1',module:'speech',moduleRunId:'R1',moduleRunStatus:'completed',completedAt:'2026-08-01T10:00:00Z',attemptCount:0,analysisRole:'research_candidate' }],
    testAttempts:[{ screeningSessionId:'S1',participantId:'P1',module:'speech',moduleRunId:'MISSING',testAttemptId:'A1',measurementTarget:'speech',attemptStatus:'completed',analysisRole:'research_candidate' }],
    moduleMeasurements:[{ moduleMeasurementId:'MM1',screeningSessionId:'S1',moduleRunId:'R1',testAttemptId:'A1',payload:{runtime:{microphone:{label:'iPhone Microphone'}}} }]
  }, { requireProtocolComplete:true, requireResearch:true });
  assert.equal(report.canFinalize, false);
  assert.ok(report.errors.some((x) => x.includes('ORPHAN_ATTEMPTS')));
  assert.ok(report.errors.some((x) => x.includes('MICROPHONE_PRIVACY_VIOLATION')));
  assert.ok(report.errors.includes('PROTOCOL_NOT_COMPLETED'));
});



test('Research mode setup highlights Research immediately and consent version is deployment-configured', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const config = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
  assert.match(index, /pendingModeSelection\s*=\s*'research'/);
  assert.match(index, /RESEARCH SETUP/);
  assert.match(index, /configuredConsentVersion\(\)/);
  assert.match(index, /id="research-consent-version"[^>]*readonly/);
  assert.match(config, /consent:\s*\{[\s\S]*version:\s*"PRE_IRB_TEST_ONLY"[\s\S]*source:\s*"deployment_config"/);
});

test('Research urgent abnormal result permits protocol-limited module retry', () => {
  const result = fs.readFileSync(path.join(ROOT, 'result.html'), 'utf8');
  assert.match(result, /function researchProtocolRetryAllowed\(name\)/);
  assert.match(result, /RESEARCH_MODE && r\.state === 'urgent' && researchProtocolRetryAllowed\(name\)/);
  assert.match(result, /retryableAbnormalModule = \(r\.bad \|\| \[\]\)\.find\(name => canRetryModule\(name\)\)/);
  assert.match(result, /if \(RESEARCH_MODE && !researchProtocolRetryAllowed\(name\)\)/);
  assert.match(result, /ครบจำนวน retry ตาม research protocol แล้ว/);
});

test('static mode isolation and finalization controls are present', () => {
  const store = fs.readFileSync(path.join(ROOT, 'js/research-store.js'), 'utf8');
  assert.match(store, /quickstroke_research/);
  assert.match(store, /quickstroke_engineering/);
  assert.match(store, /FINALIZED_SESSION_WRITE_REJECTED/);
  assert.match(store, /MODE_NAMESPACE_MISMATCH/);
  assert.match(store, /ANALYSIS_ROLE_NAMESPACE_MISMATCH/);
  assert.match(store, /createSessionAmendment/);
  const result = fs.readFileSync(path.join(ROOT, 'result.html'), 'utf8');
  assert.match(result, /id="finalize-session"/);
  assert.match(result, /validateSessionIntegrity/);
  assert.match(result, /SESSION_EXPORTED_LOCALLY/);
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(index, /clinic_supervised/);
  assert.match(index, /community_remote_qr/);
  assert.match(index, /RESEARCH_CONTEXT_RECONFIGURED/);
  assert.match(index, /id="research-study-id"[^>]*readonly/);
  assert.match(index, /prepareNextResearchParticipant/);
  assert.match(index, /studyIdSource:'system_generated_random'/);
  const speech = fs.readFileSync(path.join(ROOT, 'speech-test.html'), 'utf8');
  assert.match(speech, /ensure Speech screening session/);
  assert.match(speech, /createScreeningSessionRecord\(\{ context \}\)/);
});

let passed = 0;
const failures = [];
for (const { name, fn } of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error?.stack || error);
  }
}
console.log(`\n${passed}/${tests.length} tests passed`);
if (failures.length) process.exitCode = 1;
