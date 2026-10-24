import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function source(name) {
  const match = html.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}
class Node {
  constructor() {
    this.textContent = ''; this.hidden = false; this.className = ''; this.children = [];
    this.attrs = {}; this.classList = { toggle() {} };
  }
  setAttribute(key, value) { this.attrs[key] = value; }
  appendChild(node) { node.parentElement = this; this.children.push(node); }
  after(node) { node.parentElement = this.parentElement; }
  replaceChildren() { this.children = []; }
}
for (const locale of ['th-TH', 'en-US', 'ja-JP']) {
  const pack = JSON.parse(fs.readFileSync(new URL(`../locales/${locale}/ui.json`, import.meta.url)));
  for (const fixture of ['fresh', 'incomplete', 'completed', 'invalid', 'malformed']) {
    for (const [staff, legacy] of [[false, false], [true, false], [false, true]]) {
      const messages = legacy ? { ...pack, index:Object.fromEntries(Object.entries(pack.index).filter(([key]) => !key.startsWith('public'))) } : pack;
      const ids = new Map();
      const get = id => { if (!ids.has(id)) ids.set(id, new Node()); return ids.get(id); };
      get('btn-clear').parentElement = new Node();
      get('public-more-options').parentElement = new Node();
      const stored = new Map();
      const put = (name, riskLevel) => stored.set(`fast_${name}`, JSON.stringify({ riskLevel }));
      if (fixture === 'incomplete') put('face', 'warn');
      if (fixture === 'completed') { put('face', 'ok'); put('arm', 'bad'); put('speech', 'warn'); }
      if (fixture === 'invalid') put('face', 'invalid');
      if (fixture === 'malformed') stored.set('fast_face', '{');
      const context = {
        console: { warn() {} },
        MODULES: ['face', 'arm', 'speech'],
        APP_MODE: { resolveMode: () => 'public' },
        lang: locale.slice(0, 2), indOpen: false, screeningState: {},
        sessionStorage: { getItem: key => stored.get(key) ?? null },
        document: {
          documentElement: { dataset: { qsStaffEntry: staff ? '1' : '0' } },
          getElementById: get,
          querySelectorAll: () => [new Node()],
          querySelector: () => new Node(),
          createElement: () => new Node()
        },
        getModuleListText: () => pack.index.subtitle,
        tr(key, fallback, params = {}) {
          const value = key.split('.').reduce((obj, part) => obj?.[part], messages) ?? fallback;
          return value.replace(/{{(\w+)}}/g, (_, part) => params[part] ?? '');
        }
      };
      vm.createContext(context);
      for (const name of ['readModuleResult', 'shouldRestartCompletedPublicFull', 'updateModeSwitchText', 'updatePublicHomePresentation', 'updateProgress']) {
        vm.runInContext(source(name), context);
      }
      vm.runInContext('updateProgress()', context);
      const completed = fixture === 'completed';
      const attempted = fixture !== 'fresh';
      const expectedLabel = completed
        ? pack.index[staff || legacy ? 'primaryRestart' : 'publicPrimaryRestart']
        : attempted ? pack.index.primaryContinue : pack.index[staff || legacy ? 'primaryStart' : 'publicPrimaryStart'];
      assert.equal(get('primary-label').textContent, expectedLabel, `${locale}/${fixture}/staff=${staff}`);
      assert.equal(get('view-last-result').hidden, !completed);
      assert.equal(get('public-module-overview').hidden, staff);
      assert.equal(get('public-more-options').hidden, staff || !completed);
      assert.equal(get('new-person-body').textContent, '', 'Presentation helper must not rewrite reset explanation');
      if (!staff) {
        for (const name of ['face', 'arm', 'speech']) {
          assert.equal(get(`overview-state-${name}`).textContent, attempted ? get(`state-${name}`).textContent : '');
        }
        assert.equal(get('btn-clear').textContent, pack.index[legacy ? 'newPersonButton' : 'publicResetAction']);
        if (completed) assert.equal(get('primary-meta').textContent, pack.index[legacy ? 'fullName' : 'publicRestartSupport']);
      }
      if (fixture === 'invalid' || fixture === 'malformed') {
        assert.equal(context.screeningState.validCompleted, 0);
        assert.equal(context.screeningState.nextModule, 'face');
        assert.equal(get('state-face').textContent, pack.index.statusRetry);
      }
      if (!staff) {
        context.indOpen = true;
        vm.runInContext('updateProgress()', context);
        assert.equal(get('public-module-overview').hidden, true);
      }
    }
  }
}
assert.match(html, /class="jssf-draft"/);
assert.match(html, /html\[data-qs-staff-entry="0"\] \.jssf-draft\{display:none\}/);
assert.doesNotMatch(source('updatePublicHomePresentation'), /setItem|removeItem|finalizePersistedSession|prepareScreeningSession/);
console.log('PASS: Public Home TH/EN/JA states, invalid/malformed attempts, status mirroring, Individual overview, staff isolation, cached legacy locales and render-only boundary');
