// Smoke test for dsh-oh-my-theme lib/client.js — runs the real plugin body in a
// mocked browser/cordis environment and asserts all wiring behaves:
// theme skins + hover preview, @-mention source, sidebar file tree drawer.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { TYPERT_MANIFEST } from '../lib/index.js';

const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

let capturedFactory = null;
const registered = { locales: {}, slots: [], themeRegs: [], setThemes: [], remoteMounted: null, source: null };
const storageWrites = [];

// --- snapshot store mock (zustand-like, matching createSnapshotStore) -----
function createSnapshotStore(init) {
  let state = init;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    update: (mutator) => {
      const draft = structuredClone(state);
      mutator(draft);
      state = draft;
      for (const fn of [...listeners]) fn(state);
    },
    set: (next) => { state = next; for (const fn of [...listeners]) fn(state); },
  };
}

const jsx = { jsx: (...a) => ({ type: 'jsx', a }), jsxs: (...a) => ({ type: 'jsxs', a }) };
const runtimeClient = {
  defineStore: (def) => ({ spec: def }),
  createSnapshotStore,
};
const primitives = { MarkdownText: (props) => ({ type: 'MarkdownText', props }) };

const requireMock = (spec) => {
  if (spec === 'react/jsx-runtime') return jsx;
  if (spec === 'react') return {};
  if (spec === '@deepseek-ai/dsh-client-runtime/client') return runtimeClient;
  if (spec === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
  throw new Error(`unexpected require: ${spec}`);
};

const sandbox = {
  AbortController,
  window: {
    __ModuleLoader__: { load: (def) => { capturedFactory = def.factory; } },
    localStorage: {
      getItem: () => 'aurora',
      setItem: (k, v) => storageWrites.push([k, v]),
      removeItem: (k) => storageWrites.push([k, null]),
    },
  },
  document: { body: { contains: () => true } },
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
if (!capturedFactory) throw new Error('factory not captured');

const plugin = capturedFactory(requireMock);
console.log('exports:', Object.keys(plugin).join(', '));
console.log('SKINS:', plugin.SKINS.length, '| inject:', plugin.inject.join(', '));

// --- mocks ---------------------------------------------------------------
const themeService = {
  themes: [],
  preference: 'system',
  revision: 0,
  getTheme: () => ({ preference: themeService.preference, active: {}, revision: themeService.revision, themes: [...themeService.themes] }),
  register: (def) => { themeService.themes.push(def); registered.themeRegs.push(def.id); return () => {}; },
  setTheme: (id) => { registered.setThemes.push(id); themeService.preference = id; },
  overrideTokens: () => () => {},
};

const mockFilesRemote = {
  search: async () => ({
    ok: true,
    value: [
      { relative: 'README.md', kind: 'file' },
      { relative: 'src', kind: 'dir' },
      { relative: 'src/index.ts', kind: 'file' },
      { relative: 'src/components/Button.tsx', kind: 'file' },
    ],
  }),
  listDir: async (_sessionId, relPath) => {
    if (relPath === '') return { ok: true, value: [{ relative: 'src', name: 'src', kind: 'dir' }, { relative: 'README.md', name: 'README.md', kind: 'file' }] };
    if (relPath === 'src') return { ok: true, value: [{ relative: 'src/index.ts', name: 'index.ts', kind: 'file' }] };
    return { ok: true, value: [] };
  },
  readText: async () => ({ ok: true, value: { content: '# Hello\n\nSome *markdown*.', truncated: false } }),
};

const ctx = {
  theme: themeService,
  slots: {
    register: (config, component) => { registered.slots.push({ config, component }); return () => {}; },
    inject: (name, cb) => { cb(); },
  },
  locale: { register: (ns, dicts) => { registered.locales[ns] = dicts; } },
  on: () => {},
  effect: (fn) => {
    // cordis runs the callback now; async callbacks settle on the microtask
    // queue. Disposers fire only on fiber unload — never invoke them here.
    const out = fn();
    if (out !== undefined && typeof out.then === 'function') {
      out.catch((error) => { throw error; });
    }
    return () => {};
  },
  inputTriggers: { registerSource: (source) => { registered.source = source; return () => {}; } },
  sessions: { list: { getSnapshot: () => ({ current: 'session-1' }), subscribe: () => () => {} } },
  connection: { api: { host: {} } },
  remote: { $mount: async (remote) => { registered.remoteMounted = remote; return () => {}; } },
  reflect: { get: (key) => (key === 'remote.workspaceFiles' ? mockFilesRemote : undefined) },
  get: (name) => (name === 'inputTriggers' ? ctx.inputTriggers : name === 'sessions' ? ctx.sessions : undefined),
};

plugin.apply(ctx);

// --- assertions ------------------------------------------------------------
const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('ok -', msg); };

// theme
assert(plugin.SKINS.length === 3, '3 starter skins');
assert(new Set(plugin.SKINS.map((s) => s.id)).size === 3, 'skin ids unique');
assert(plugin.SKINS.every((s) => s.colorScheme === 'light' || s.colorScheme === 'dark'), 'valid colorScheme');
assert(plugin.SKINS.every((s) => s.id !== 'system'), 'no reserved "system" id');
assert(registered.themeRegs.join(',') === plugin.SKINS.map((s) => s.id).join(','), 'theme.register called for every skin');
assert(registered.setThemes[0] === 'aurora', 'saved skin restored (aurora)');
const themeRow = registered.slots.find((r) => r.config.id === 'oh-my-theme');
assert(themeRow && themeRow.config.name === 'settings.general.item', 'theme row targets settings.general.item');
assert(themeRow.config.order === 20, 'theme row order 20');
const ns = plugin.SETTINGS_NS;
const { zh, en } = registered.locales[ns];
assert(JSON.stringify(Object.keys(zh).sort()) === JSON.stringify(Object.keys(en).sort()), 'zh/en key sets identical');
for (const s of plugin.SKINS) assert(zh[`theme.${s.id}`] && en[`theme.${s.id}`], `dictionary has theme.${s.id}`);

// remote
assert(registered.remoteMounted !== null, 'remote.$mount called');
assert(registered.remoteMounted.package === 'dsh-oh-my-theme', 'remote package id correct');
assert(registered.remoteMounted.descriptors.length === 3, 'three remote descriptors');
const hostInvocations = TYPERT_MANIFEST.invocations;
assert(
  JSON.stringify(registered.remoteMounted.descriptors) === JSON.stringify(hostInvocations),
  'client descriptors identical to the host manifest (codecs included)'
);

// @-mention source
assert(registered.source !== null, 'inputTriggers source registered');
assert(registered.source.trigger === '@', 'source trigger is "@"');
assert(registered.source.name === 'oh-my-theme-files', 'source name set');
await new Promise((resolve) => setTimeout(resolve, 10)); // let the async remote effect settle
const mockSession = { sessionId: 'session-1' };
const candidates = await registered.source.candidates(mockSession, { query: 'read', signal: undefined });
assert(candidates.some((c) => c.value === 'README.md'), 'candidates include README.md for query "read"');
const picked = registered.source.onPick({ candidate: candidates.find((c) => c.value === 'README.md'), session: mockSession });
assert(picked.text === '@README.md ', 'onPick inserts "@README.md "');
const pickedDir = registered.source.onPick({ candidate: { value: 'src' }, session: mockSession });
assert(pickedDir.text === '@src/ ', 'directory pick appends a trailing slash');
assert(Array.isArray(registered.source.lexicon(mockSession)), 'lexicon returns the indexed list');

// file tree drawer
const footer = registered.slots.find((r) => r.config.id === 'oh-my-theme-files');
assert(footer && footer.config.name === 'sidebar.footer.action', 'footer button targets sidebar.footer.action');
const overlay = registered.slots.find((r) => r.config.id === 'oh-my-theme-file-tree');
assert(overlay && overlay.config.name === 'shell.overlay', 'drawer targets shell.overlay');
assert(footer.config.inject().hooks.scope === overlay.config.inject().hooks.scope, 'footer and drawer share one drawer scope');

const drawerScope = footer.config.inject().hooks.scope;
const footerInjected = footer.config.inject();
const overlayInjected = overlay.config.inject();

// session sync ran: scope.sessionId set to the current session
assert(drawerScope.getSnapshot().sessionId === 'session-1', 'drawer scope follows the current session');

// toggle opens the drawer and lazily loads the root
assert(drawerScope.getSnapshot().open === false, 'drawer starts closed');
footerInjected.onToggle();
assert(drawerScope.getSnapshot().open === true, 'footer toggle opens the drawer');
await new Promise((resolve) => setTimeout(resolve, 0)); // let the lazy root load settle
assert(drawerScope.getSnapshot().dirs[''] !== undefined, 'root directory loaded lazily on open');
assert(drawerScope.getSnapshot().dirs[''].length === 2, 'root rows present');

// expand a directory loads its children lazily
overlayInjected.onToggleDir('src');
await new Promise((resolve) => setTimeout(resolve, 0));
assert(drawerScope.getSnapshot().expanded['src'] === true, 'directory expanded');
assert(drawerScope.getSnapshot().dirs['src'] !== undefined, 'child directory loaded lazily');
assert(drawerScope.getSnapshot().dirs['src'][0].relative === 'src/index.ts', 'child file listed');

// selecting a .md file loads and stores the preview
overlayInjected.onSelectFile('README.md');
await new Promise((resolve) => setTimeout(resolve, 0));
const preview = drawerScope.getSnapshot().preview;
assert(preview !== null, 'preview populated');
assert(preview.relative === 'README.md', 'preview carries the relative path');
assert(preview.content.includes('# Hello'), 'preview carries the markdown content');

// close resets the open flag
overlayInjected.onClose();
assert(drawerScope.getSnapshot().open === false, 'close hides the drawer');

// theme hover preview still works through the theme row actions
const themeActions = themeRow.config.inject(themeRow.config.store.actions);
themeActions.previewSkin('matrix');
assert(themeService.preference === 'matrix', 'previewSkin switches theme');
themeActions.restoreSkin();
assert(themeService.preference === 'aurora', 'restoreSkin returns to the base preference');

console.log('\nALL CHECKS PASSED');
