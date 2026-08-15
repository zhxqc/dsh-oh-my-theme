/**
 * dsh-oh-my-theme — host half.
 *
 * Host side: a Typert Remote Service named `workspaceFiles` that gives the
 * browser half read-only, workspace-scoped file access:
 *
 *   - `search(agent, query, signal)` — index the session's workspace and
 *     return matching entries (drives the composer's `@` mention picker);
 *   - `listDir(agent, relPath, signal)` — list one directory level, lazily
 *     (drives the sidebar file tree; parent directories load on demand);
 *   - `readText(agent, relPath, signal)` — read a UTF-8 text file with a size
 *     cap and binary detection (drives the Markdown preview).
 *
 * Every method resolves paths strictly inside the session's workspace
 * (`agent.session.header.cwd`) — relative paths are normalized and rejected
 * when they escape the root. Nothing here writes or executes anything.
 *
 * The browser half is picked up by dsh-client-modules through the package's
 * `dsh.client` declaration; the typert manifest below is what lets the
 * client's `ctx.remote.$mount(...)` reach these methods over the same wire
 * the shipped ui-* packages use. The skin feature remains browser-only; the
 * saved choice stays in localStorage (Host settings only exposes an
 * allowlisted namespace set to browser clients).
 */
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { opendir, readFile } from 'node:fs/promises';
import path from 'node:path';

/** Directory names never surfaced by the file tree or the @-picker. */
const IGNORED_DIRS = new Set([
	'.git', '.hg', '.svn', 'node_modules', 'bower_components', 'vendor',
	'dist', 'build', 'out', 'coverage', '.next', '.nuxt', '.turbo',
	'.cache', '.parcel-cache', '.idea', '.vscode', '.DS_Store',
	'__pycache__', '.venv', 'venv', '.tox', 'target', '.gradle', '.pytest_cache'
]);

/** Max files the @-picker index visits; beyond this the walk stops. */
const MAX_INDEX_FILES = 5000;
/** Max bytes `readText` returns; larger files are truncated. */
const MAX_TEXT_BYTES = 512 * 1024;
/** Max entries `listDir` returns per call (flat directory safety). */
const MAX_DIR_ENTRIES = 2000;
/** Max @-picker candidates returned to the client. */
const MAX_CANDIDATES = 50;

/** Resolve a relative path inside `root`; throws when it escapes. */
function resolveInside(root, relative) {
	const base = path.resolve(root);
	const target = relative === '' || relative === '.'
		? base
		: path.resolve(base, relative);
	if (target !== base && !target.startsWith(base + path.sep)) {
		throw new Error(`path "${relative}" escapes the workspace root`);
	}
	return target;
}

/** Basename of a slash-separated relative path ('' for the root). */
function basenameOf(relative) {
	const at = relative.lastIndexOf('/');
	return at < 0 ? relative : relative.slice(at + 1);
}

/** Score a path segment against one query token (higher is better; <0 = no match). */
function scoreName(name, query) {
	if (name === query) return 5000;
	if (name.startsWith(query)) return 4500 - name.length;
	const contained = name.indexOf(query);
	if (contained >= 0) return 4000 - contained * 10 - name.length;
	let first = -1;
	let previous = -1;
	let gaps = 0;
	for (const ch of query) {
		const found = name.indexOf(ch, first + 1);
		if (found < 0) return -1;
		if (first < 0) first = found;
		if (previous >= 0 && found > previous + 1) gaps += 1;
		previous = found;
	}
	return 3000 - gaps * 100 - name.length;
}

/** Rank indexed entries against the @-picker query (dsh-at-file-style scoring). */
function rankEntries(entries, query, limit) {
	const q = query.trim().toLowerCase();
	if (q === '') {
		return [...entries]
			.sort((a, b) => a.kind === b.kind
				? a.relative < b.relative ? -1 : 1
				: a.kind === 'dir' ? -1 : 1)
			.slice(0, limit);
	}
	return entries
		.map((entry) => ({ entry, score: scorePath(entry.relative, q) }))
		.filter((item) => item.score >= 0)
		.sort((a, b) => b.score - a.score
			|| (a.entry.kind === 'dir' ? 1 : 0) - (b.entry.kind === 'dir' ? 1 : 0)
			|| a.entry.relative.length - b.entry.relative.length
			|| (a.entry.relative < b.entry.relative ? -1 : 1))
		.slice(0, limit)
		.map((item) => item.entry);
}

/** Score a full slash path against a query (segment-aware). */
function scorePath(relative, q) {
	const lower = relative.toLowerCase();
	const segments = lower.split('/');
	const tokens = q.split('/').filter(Boolean);
	if (!q.includes('/')) return scoreName(segments.at(-1), tokens[0]);
	let cursor = 0;
	let total = 0;
	let lastMatch = -1;
	for (const token of tokens) {
		let matched = -1;
		let matchedScore = -1;
		for (let index = cursor; index < segments.length; index += 1) {
			const score = scoreName(segments[index], token);
			if (score < 0) continue;
			matchedScore = score;
			matched = index;
			break;
		}
		if (matched < 0) return -1;
		total += matchedScore;
		lastMatch = matched;
		cursor = matched + 1;
	}
	return total + (lastMatch === segments.length - 1 ? 1000 : 0) - relative.length;
}

/** Recursively index a workspace, honoring ignore rules and the file cap. */
async function indexWorkspace(root, signal) {
	const entries = [];
	const walk = async (abs, relative) => {
		if (signal?.aborted === true) return;
		if (entries.length >= MAX_INDEX_FILES) return;
		let handle;
		try {
			handle = await opendir(abs);
		} catch {
			return; // unreadable directory — skip silently
		}
		const dirents = [];
		try {
			for await (const dirent of handle) {
				if (signal?.aborted === true) return;
				dirents.push(dirent);
			}
		} finally {
			// Node auto-closes the handle when iteration completes; an early
			// return (abort / cap) needs the explicit close. Ignore the
			// ERR_DIR_CLOSED that the auto-close path produces.
			try {
				await handle.close();
			} catch {
				// already closed by the iterator
			}
		}
		for (const dirent of dirents) {
			if (signal?.aborted === true) return;
			if (entries.length >= MAX_INDEX_FILES) return;
			const name = dirent.name;
			if (dirent.isDirectory()) {
				if (IGNORED_DIRS.has(name)) continue;
				const childRel = relative === '' ? name : `${relative}/${name}`;
				entries.push({ relative: childRel, kind: 'dir' });
				await walk(path.join(abs, name), childRel);
			} else if (dirent.isFile()) {
				if (name === '.DS_Store') continue;
				entries.push({
					relative: relative === '' ? name : `${relative}/${name}`,
					kind: 'file'
				});
			}
		}
	};
	await walk(root, '');
	return entries;
}

/** List one directory level (sorted, dirs first), lazy per call. */
async function listDirectory(root, relative, signal) {
	const abs = resolveInside(root, relative);
	const handle = await opendir(abs);
	const rows = [];
	try {
		for await (const dirent of handle) {
			if (signal?.aborted === true) return [];
			if (rows.length >= MAX_DIR_ENTRIES) break;
			const name = dirent.name;
			const childRel = relative === '' ? name : `${relative}/${name}`;
			if (dirent.isDirectory()) {
				if (IGNORED_DIRS.has(name)) continue;
				rows.push({ relative: childRel, name, kind: 'dir', size: 0 });
			} else if (dirent.isFile()) {
				if (name === '.DS_Store') continue;
				rows.push({ relative: childRel, name, kind: 'file', size: 0 });
			}
		}
	} finally {
		try {
			await handle.close();
		} catch {
			// already closed by the iterator
		}
	}
	rows.sort((a, b) => a.kind === b.kind
		? a.name < b.name ? -1 : 1
		: a.kind === 'dir' ? -1 : 1);
	return rows;
}

/** Read a UTF-8 text file with a size cap and binary detection. */
async function readTextFile(root, relative, signal) {
	const abs = resolveInside(root, relative);
	const buffer = await readFile(abs, { signal });
	if (buffer.length === 0) return { content: '', truncated: false };
	const truncated = buffer.length > MAX_TEXT_BYTES;
	const slice = truncated ? buffer.subarray(0, MAX_TEXT_BYTES) : buffer;
	if (slice.includes(0)) {
		throw new Error(`"${relative}" is not a text file`);
	}
	return { content: slice.toString('utf8'), truncated };
}

/**
 * Minimal strict codec. The client-side gateway (`requireStrictCodec`) rejects
 * `src-json`, so every parameter/result must carry `mode: "strict"` plus a
 * type symbol and a schema whose `parse` is callable. We hand-write a
 * pass-through schema instead of pulling in zod — the values crossing the
 * wire are already owned JSON, and strict decoding only needs `parse` to
 * exist and return the value.
 * @param typeSymbol - stable `<package>#<name>` identity; the `agent` lookup
 * parameter must match the lookup provider's `@deepseek-ai/dsh-session/types#SessionId` exactly.
 */
function strictCodec(typeSymbol) {
	return {
		mode: 'strict',
		typeSymbol,
		schema: {
			parse: (value) => value
		}
	};
}

/** Typert invocation descriptors (strict codecs, hand-written). */
const INVOCATIONS = [
	{
		id: 'dsh-oh-my-theme#workspaceFiles/search',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'search',
		invocation: { kind: 'direct' },
		parameters: [
			{
				name: 'agent',
				wire: 'agentId',
				source: 'lookup',
				lookup: 'agent',
				codec: strictCodec('@deepseek-ai/dsh-session/types#SessionId')
			},
			{
				name: 'query',
				wire: 'query',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#SearchQuery')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#FileEntry[]')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/listDir',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'listDir',
		invocation: { kind: 'direct' },
		parameters: [
			{
				name: 'agent',
				wire: 'agentId',
				source: 'lookup',
				lookup: 'agent',
				codec: strictCodec('@deepseek-ai/dsh-session/types#SessionId')
			},
			{
				name: 'relPath',
				wire: 'relPath',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#RelPath')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#DirEntry[]')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/readText',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'readText',
		invocation: { kind: 'direct' },
		parameters: [
			{
				name: 'agent',
				wire: 'agentId',
				source: 'lookup',
				lookup: 'agent',
				codec: strictCodec('@deepseek-ai/dsh-session/types#SessionId')
			},
			{
				name: 'relPath',
				wire: 'relPath',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#RelPath')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#TextResult')
	}
];

/** Typert manifest: what the client's `ctx.remote.$mount` contract expects. */
const TYPERT_MANIFEST = {
	package: 'dsh-oh-my-theme',
	face: 'host',
	schemas: [],
	model: {
		services: [
			{
				key: 'workspaceFiles',
				exportName: 'WorkspaceFilesRuntime',
				description: 'Read-only, workspace-scoped file search, directory listing, and text reading for the browser half.',
				tags: [],
				members: [
					{
						kind: 'method',
						name: 'search',
						signature: 'search(agent, query, signal): Promise<readonly FileEntry[]>'
					},
					{
						kind: 'method',
						name: 'listDir',
						signature: 'listDir(agent, relPath, signal): Promise<readonly DirEntry[]>'
					},
					{
						kind: 'method',
						name: 'readText',
						signature: 'readText(agent, relPath, signal): Promise<{ content: string; truncated: boolean }>'
					}
				],
				types: []
			}
		],
		events: [],
		objects: []
	},
	invocations: INVOCATIONS
};

/**
 * The live service. Registered under the `workspaceFiles` Cordis key (the
 * same string is the wire namespace), so the Typert Gateway dispatches the
 * client's remote calls here. Method order matches the invocation
 * descriptors: lookup `agent` first, then JSON parameters, then `signal`.
 */
class WorkspaceFilesRuntime extends TypertRemoteService {
	/**
	 * Register the service and bind the Typert wire namespace.
	 * @param ctx - owning cordis context.
	 */
	constructor(ctx) {
		super(ctx, 'workspaceFiles');
	}

	/**
	 * Index the session's workspace and return query-matching entries.
	 * @param agent - session agent injected by the lookup provider.
	 * @param query - free-text query ('' returns the default order).
	 * @param signal - cooperative cancellation.
	 * @returns matched {@link FileEntry} rows, ranked, capped.
	 */
	async search(agent, query, signal) {
		const cwd = agent?.session?.header?.cwd;
		if (typeof cwd !== 'string' || cwd === '') {
			throw new Error('workspaceFiles: the session has no workspace directory');
		}
		const entries = await indexWorkspace(path.resolve(cwd), signal);
		return rankEntries(entries, typeof query === 'string' ? query : '', MAX_CANDIDATES);
	}

	/**
	 * List one directory level inside the workspace (lazy file tree).
	 * @param agent - session agent injected by the lookup provider.
	 * @param relPath - '' or '.' for the root; otherwise a slash path.
	 * @param signal - cooperative cancellation.
	 * @returns sorted {@link DirEntry} rows (dirs first).
	 */
	async listDir(agent, relPath, signal) {
		const cwd = agent?.session?.header?.cwd;
		if (typeof cwd !== 'string' || cwd === '') {
			throw new Error('workspaceFiles: the session has no workspace directory');
		}
		const relative = typeof relPath === 'string' && relPath !== '' ? relPath : '';
		return listDirectory(path.resolve(cwd), relative, signal);
	}

	/**
	 * Read a UTF-8 text file inside the workspace (Markdown preview).
	 * @param agent - session agent injected by the lookup provider.
	 * @param relPath - slash path relative to the workspace root.
	 * @param signal - cooperative cancellation.
	 * @returns the decoded text, truncated to {@link MAX_TEXT_BYTES} when larger.
	 */
	async readText(agent, relPath, signal) {
		const cwd = agent?.session?.header?.cwd;
		if (typeof cwd !== 'string' || cwd === '') {
			throw new Error('workspaceFiles: the session has no workspace directory');
		}
		if (typeof relPath !== 'string' || relPath === '') {
			throw new Error('workspaceFiles: readText requires a relative path');
		}
		return readTextFile(path.resolve(cwd), relPath, signal);
	}
}

/** Required services: the Typert registry that accepts the manifest. */
const inject = ['typert'];

/** Host loader entry: register the file service and its typert manifest. */
function apply(ctx) {
	const runtime = new WorkspaceFilesRuntime(ctx);
	void runtime;
	ctx.effect(() => {
		const dispose = ctx.typert.register(TYPERT_MANIFEST);
		return () => {
			void dispose();
		};
	}, 'dsh-oh-my-theme: typert manifest');
}

export { WorkspaceFilesRuntime, TYPERT_MANIFEST, apply, inject };
