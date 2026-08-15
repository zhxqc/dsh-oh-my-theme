// Smoke test for dsh-oh-my-theme lib/client.js — runs the real plugin body in a
// mocked browser/cordis environment and asserts all wiring behaves:
// theme skins + hover preview, @-mention source, top-right file workspace.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { TYPERT_MANIFEST } from '../lib/index.js';

const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

let capturedFactory = null;
const registered = { locales: {}, slots: [], themeRegs: [], setThemes: [], remoteMounted: null, source: null, layoutCalls: [] };
const storageWrites = [];
const externalOpenCalls = [];
const rootStyleValues = new Map();
const mockStyles = new Map();
let sessionSnapshot = { current: 'session-1', byId: { 'session-1': { blank: false, cwd: '/workspace' } } };
let sessionListListener;

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
const Icon = (props) => ({ type: 'Icon', props });
const primitives = {
  MarkdownText: (props) => ({ type: 'MarkdownText', props }),
  IconBrowseOutline16: Icon,
  IconCloseOutline16: Icon,
  IconCodeOutline16: Icon,
  IconDataOutline16: Icon,
  IconFolderClose16: Icon,
  IconFolderOpen16: Icon,
  IconFolderOpenOutline16: Icon,
  IconListPenOutline16: Icon,
  IconPanelLeftOutline16: Icon,
  IconRightUpOutline16: Icon,
  IconSkillOutline16: Icon,
  IconTriangleRightFill14: Icon,
};

const requireMock = (spec) => {
  if (spec === 'react/jsx-runtime') return jsx;
  if (spec === 'react') return {
    useSyncExternalStore: (_s, get) => get(),
    useRef: (value) => ({ current: value }),
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: (fn) => { fn(); },
  };
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
  document: {
    body: { contains: () => true },
    documentElement: { style: {
      setProperty: (name, value) => rootStyleValues.set(name, value),
      removeProperty: (name) => rootStyleValues.delete(name),
    } },
    head: { appendChild: (node) => mockStyles.set(node.id, node) },
    getElementById: (id) => mockStyles.get(id) ?? null,
    createElement: () => ({ id: '', textContent: '', remove() {} }),
  },
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
  readText: async (_sessionId, relPath) => ({
    ok: true,
    value: relPath === 'docs/guide.md'
      ? { content: '# Guide\n\n![logo](./img/logo.png)\n', truncated: false }
      : { content: '# Hello\n\nSome *markdown*.', truncated: false },
  }),
};

const workspaces = {
  openPath: async (path) => { externalOpenCalls.push(path); },
};

const ctx = {
  theme: themeService,
  slots: {
    register: (config, component) => {
      const entry = { config, component };
      registered.slots.push(entry);
      return () => {
        const index = registered.slots.indexOf(entry);
        if (index !== -1) registered.slots.splice(index, 1);
      };
    },
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
  sessions: { list: { getSnapshot: () => sessionSnapshot, subscribe: (listener) => { sessionListListener = listener; return () => {}; } } },
  connection: { api: { host: {} } },
  workspaces,
  remote: { $mount: async (remote) => { registered.remoteMounted = remote; return () => {}; } },
  reflect: { get: (key) => (key === 'remote.workspaceFiles' ? mockFilesRemote : undefined) },
  get: (name) => (name === 'inputTriggers' ? ctx.inputTriggers : name === 'sessions' ? ctx.sessions : name === 'layout' ? ctx.layout : name === 'workspaces' ? ctx.workspaces : undefined),
  layout: { openDetails: () => registered.layoutCalls.push('open'), closeDetails: () => registered.layoutCalls.push('close') },
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
assert(rootStyleValues.get('--oh-my-theme-conversation-font-size') === '16px', 'conversation font size initialized globally');
assert(rootStyleValues.get('--oh-my-theme-tree-font-size') === '13px', 'file-tree font size initialized globally');
assert(rootStyleValues.get('--oh-my-theme-preview-font-size') === '14px', 'preview font size initialized globally');
assert(mockStyles.get('dsh-oh-my-theme-display-style')?.textContent.includes('Md3f7G_column'), 'global conversation typography stylesheet mounted');
const ns = plugin.SETTINGS_NS;
const { zh, en } = registered.locales[ns];
assert(JSON.stringify(Object.keys(zh).sort()) === JSON.stringify(Object.keys(en).sort()), 'zh/en key sets identical');
for (const s of plugin.SKINS) assert(zh[`theme.${s.id}`] && en[`theme.${s.id}`], `dictionary has theme.${s.id}`);

// remote
assert(registered.remoteMounted !== null, 'remote.$mount called');
assert(registered.remoteMounted.package === 'dsh-oh-my-theme', 'remote package id correct');
assert(registered.remoteMounted.descriptors.length === 3, 'three remote descriptors');
// Client descriptors must match the host manifest on every wire-visible field;
// schemas are functions (not JSON-serializable), so compare them structurally.
function codecEqual(a, b) {
  return a.mode === b.mode && a.typeSymbol === b.typeSymbol && typeof a.schema?.parse === 'function' && typeof b.schema?.parse === 'function';
}
function descriptorEqual(a, b) {
  return a.id === b.id && a.service === b.service && a.namespace === b.namespace && a.method === b.method
    && JSON.stringify(a.invocation) === JSON.stringify(b.invocation)
    && JSON.stringify(a.cancellation) === JSON.stringify(b.cancellation)
    && codecEqual(a.result, b.result)
    && a.parameters.length === b.parameters.length
    && a.parameters.every((p, i) => JSON.stringify({ name: p.name, wire: p.wire, source: p.source, lookup: p.lookup }) === JSON.stringify({ name: b.parameters[i].name, wire: b.parameters[i].wire, source: b.parameters[i].source, lookup: b.parameters[i].lookup }) && codecEqual(p.codec, b.parameters[i].codec));
}
const hostInvocations = TYPERT_MANIFEST.invocations;
assert(
  registered.remoteMounted.descriptors.length === hostInvocations.length
    && hostInvocations.every((d, i) => descriptorEqual(registered.remoteMounted.descriptors[i], d)),
  'client descriptors identical to the host manifest (strict codecs included)'
);

// @-mention source
assert(registered.source !== null, 'inputTriggers source registered');
assert(registered.source.trigger === '@', 'source trigger is "@"');
assert(registered.source.name === 'oh-my-theme-files', 'source name set');
await new Promise((resolve) => setTimeout(resolve, 10)); // let the async remote effect settle
const mockSession = { sessionId: 'session-1' };
const candidates = await registered.source.candidates(mockSession, { query: 'read', signal: undefined });
assert(candidates.some((c) => c.value === 'README.md'), 'candidates include README.md for query "read"');
assert(candidates.find((c) => c.value === 'README.md').icon.codePointAt(0) >= 0xe100, '@ candidates use a VSCode icon marker');

// The details replacement is dynamic: plugin startup must not collide with
// dsh's built-in priority-0 details panel.
const launcher = registered.slots.find((r) => r.config.id === 'oh-my-theme-file-toggle');
assert(launcher && launcher.config.name === 'conversation.session.header.utilities', 'launcher sits in the Session header utilities');
assert(launcher.config.order === -10, 'launcher is ordered before Session log');
const drawerScope = launcher.config.inject().scope;
const launcherInjected = launcher.config.inject();
assert(!registered.slots.some((r) => r.config.name === 'details'), 'file panel does not claim details during plugin startup');
assert(drawerScope.getSnapshot().sessionId === 'session-1', 'drawer scope follows the current session');
assert(drawerScope.getSnapshot().open === false, 'drawer starts closed');
assert(drawerScope.getSnapshot().viewMode === 'tree', 'file panel starts in project-tree view');

// Picking an @ file both inserts the mention and opens its preview on the right.
const picked = registered.source.onPick({ candidate: candidates.find((c) => c.value === 'README.md'), session: mockSession });
assert(picked.text === '@README.md ', 'onPick inserts "@README.md "');
const mentionPanel = registered.slots.find((r) => r.config.name === 'details');
assert(mentionPanel && mentionPanel.config.priority === -10, '@ file pick mounts a lower-priority details replacement');
assert(drawerScope.getSnapshot().open === true, '@ file pick opens the file panel');
assert(drawerScope.getSnapshot().viewMode === 'preview', '@ file pick opens standalone preview mode');
assert(registered.layoutCalls.at(-1) === 'open', '@ file pick opens the details column');
await new Promise((resolve) => setTimeout(resolve, 0));
assert(drawerScope.getSnapshot().preview?.relative === 'README.md', '@ file pick loads the selected preview');
mentionPanel.config.inject().onClose();
assert(drawerScope.getSnapshot().open === false, 'closing the @ preview hides the panel');
assert(!registered.slots.some((r) => r.config.name === 'details'), 'closing the file panel releases built-in details');

sessionSnapshot = { current: 'session-1', byId: { 'session-1': { blank: true, cwd: '/workspace' } } };
const pickedDir = registered.source.onPick({ candidate: { value: 'src' }, session: mockSession });
assert(pickedDir.text === '@src/ ', 'directory pick appends a trailing slash');
assert(drawerScope.getSnapshot().open === false, 'directory pick does not open a file preview');
assert(Array.isArray(registered.source.lexicon(mockSession)), 'lexicon returns the indexed list');

// file tree panel
// toggle opens the drawer and lazily loads the root
launcherInjected.onToggle();
const overlay = registered.slots.find((r) => r.config.id === 'oh-my-theme-file-panel');
assert(overlay && overlay.config.id === 'oh-my-theme-file-panel', 'blank session uses the root overlay panel');
assert(launcher.config.inject().scope === overlay.config.inject().scope, 'launcher and panel share one drawer scope');
const overlayInjected = overlay.config.inject();
assert(drawerScope.getSnapshot().open === true, 'top-right launcher opens the panel');
assert(registered.layoutCalls.at(-1) === 'open', 'toggle opens the details column');
await new Promise((resolve) => setTimeout(resolve, 0)); // let the lazy root load settle
assert(drawerScope.getSnapshot().remoteReady === true, 'remote ready published after mount');
assert(drawerScope.getSnapshot().dirs[''] !== undefined, 'root directory loaded lazily on open');
assert(drawerScope.getSnapshot().dirs[''].length === 2, 'root rows present');

// When a blank session becomes a real conversation, keep the panel open but
// migrate it from the fixed overlay into dsh's native details column.
sessionSnapshot = { current: 'session-1', byId: { 'session-1': { blank: false, cwd: '/workspace' } } };
sessionListListener();
await new Promise((resolve) => setTimeout(resolve, 0));
assert(drawerScope.getSnapshot().open === true, 'panel stays open when the session becomes non-blank');
assert(!registered.slots.some((r) => r.config.id === 'oh-my-theme-file-panel'), 'session transition releases the overlay panel');
assert(registered.slots.some((r) => r.config.name === 'details' && r.config.priority === -10), 'session transition mounts the native details panel');

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
assert(preview.kind === 'markdown', 'md files preview as markdown');
assert(drawerScope.getSnapshot().viewMode === 'preview', 'tree selection can display preview independently');

// relative markdown images are rewritten to the host endpoint
const mdPreview = await (async () => {
  overlayInjected.onSelectFile('docs/guide.md');
  await new Promise((resolve) => setTimeout(resolve, 0));
  return drawerScope.getSnapshot().preview;
})();
const expectedImageUrl = `/api/oh-my-theme/image?session=session-1&path=${encodeURIComponent('docs/img/logo.png')}`;
assert(mdPreview !== null && mdPreview.content.includes(expectedImageUrl), 'relative image rewritten to the host endpoint');
assert(mdPreview.content.includes('![logo]('), 'image alt preserved');
overlayInjected.onSetView('split');
assert(drawerScope.getSnapshot().viewMode === 'split', 'panel supports a split files-and-preview view');
overlayInjected.onSetView('tree');
assert(drawerScope.getSnapshot().viewMode === 'tree', 'panel supports a standalone project-tree view');

// selecting a plain text file previews as text
overlayInjected.onSelectFile('src/index.ts');
await new Promise((resolve) => setTimeout(resolve, 0));
const textPreview = drawerScope.getSnapshot().preview;
assert(textPreview.kind === 'text', 'non-md files preview as text');

// Conversation file links route through workspaces.openPath. Current-workspace
// text files now open in this preview, while outside paths keep host behavior.
await workspaces.openPath('/workspace/README.md');
assert(drawerScope.getSnapshot().preview?.relative === 'README.md', 'conversation file link opens the right preview');
assert(externalOpenCalls.length === 0, 'previewable conversation file does not launch a system app');
await workspaces.openPath('/outside/report.md');
assert(externalOpenCalls.at(-1) === '/outside/report.md', 'outside-workspace file keeps the system opener');

// close resets the open flag and collapses the details column
overlayInjected.onClose();
assert(drawerScope.getSnapshot().open === false, 'close hides the drawer');
assert(registered.layoutCalls.at(-1) === 'close', 'close collapses the details column');
assert(!registered.slots.some((r) => r.config.name === 'details' || r.config.id === 'oh-my-theme-file-panel'), 'close releases the active file panel');

// component rendering: the footer button and the panel must render without
// crashing (regression for the useScope "w is not a function" crash)
const t = (key) => key;
const buttonEl = launcher.component({ t, scope: drawerScope, onToggle: launcherInjected.onToggle });
assert(buttonEl !== null && buttonEl.a[0] === 'button', 'FileTreeButton renders a <button>');
assert(buttonEl.a[1].style.width === 32, 'launcher uses the compact Session-header button size');
launcherInjected.onToggle();
const panelEl = overlay.component({ t, scope: drawerScope, onClose: overlayInjected.onClose, onToggleDir: overlayInjected.onToggleDir, onSelectFile: overlayInjected.onSelectFile, onSetView: overlayInjected.onSetView, onOpenExternal: overlayInjected.onOpenExternal });
assert(panelEl !== null && panelEl.a[0] === 'div', 'FileSidePanel renders a <div> when open');
overlayInjected.onClose();
const closedEl = overlay.component({ t, scope: drawerScope, onClose: overlayInjected.onClose, onToggleDir: overlayInjected.onToggleDir, onSelectFile: overlayInjected.onSelectFile, onSetView: overlayInjected.onSetView, onOpenExternal: overlayInjected.onOpenExternal });
assert(closedEl === null, 'FileSidePanel returns null while closed');

// theme hover preview still works through the theme row actions
const themeActions = themeRow.config.inject(themeRow.config.store.actions);
themeActions.setDisplayPreference('conversationSize', 18);
assert(rootStyleValues.get('--oh-my-theme-conversation-font-size') === '18px', 'conversation font size applies immediately');
assert(storageWrites.some(([key, value]) => key === 'dsh-oh-my-theme:conversation-font-size' && value === '18'), 'conversation font size persists');
themeActions.previewSkin('matrix');
assert(themeService.preference === 'matrix', 'previewSkin switches theme');
themeActions.restoreSkin();
assert(themeService.preference === 'aurora', 'restoreSkin returns to the base preference');

console.log('\nALL CHECKS PASSED');
