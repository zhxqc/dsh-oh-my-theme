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
import { execFile as execFileCallback } from 'node:child_process';
import { opendir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

/** Directory names never surfaced by the file tree or the @-picker. */
const IGNORED_DIRS = new Set([
	'.git', '.hg', '.svn', 'node_modules', 'bower_components', 'vendor',
	'dist', 'build', 'out', 'coverage', '.next', '.nuxt', '.turbo',
	'.cache', '.parcel-cache', '.idea', '.vscode', '.DS_Store',
	'__pycache__', '.venv', 'venv', '.tox', 'target', '.gradle', '.pytest_cache',
	'.pnpm', '.pnpm-store', '.yarn', 'jspm_packages'
]);

/** Keep hidden files and dependency/build trees out of both file surfaces. */
function shouldIgnoreEntry(name) {
	return typeof name !== 'string' || name.startsWith('.') || IGNORED_DIRS.has(name);
}

/** Image extensions the preview endpoint may serve, mapped to their MIME type. */
const IMAGE_EXTENSIONS = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.bmp': 'image/bmp',
	'.avif': 'image/avif'
};
/** Max bytes the image endpoint serves (defense against giant files). */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Max files the @-picker index visits; beyond this the walk stops. */
const MAX_INDEX_FILES = 5000;
/** Max bytes `readText` returns; larger files are truncated. */
const MAX_TEXT_BYTES = 512 * 1024;
/** Max entries `listDir` returns per call (flat directory safety). */
const MAX_DIR_ENTRIES = 2000;
/** Max @-picker candidates returned to the client. */
const MAX_CANDIDATES = 50;
/** Git command timeout and output caps. Git is read-only in this plugin. */
const GIT_TIMEOUT_MS = 10_000;
const MAX_GIT_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_GIT_DIFF_BYTES = 1 * 1024 * 1024;
const MAX_GIT_COMMITS = 50;

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

/** Normalize a workspace-relative Git path and reject traversal/absolute paths. */
function normalizeGitPath(root, relative, { allowEmpty = false } = {}) {
	if (typeof relative !== 'string' || (!allowEmpty && relative === '')) {
		throw new Error('git: a relative path is required');
	}
	const normalized = relative.replace(/\\/g, '/').replace(/^\.\//, '');
	if (normalized.includes('\0') || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)
		|| normalized.split('/').some((part) => part === '..')) {
		throw new Error(`git: path "${relative}" escapes the workspace root`);
	}
	resolveInside(root, normalized);
	return normalized === '.' ? '' : normalized;
}

/** Validate a Git object id before passing it to a command. */
function normalizeCommitHash(hash) {
	if (typeof hash !== 'string' || !/^[0-9a-f]{7,64}$/i.test(hash)) {
		throw new Error('git: invalid commit hash');
	}
	return hash;
}

/** Execute a bounded, non-interactive Git command in the session workspace. */
async function runGit(root, args, signal, { allowExitCodes = [] } = {}) {
	try {
		const result = await execFile('git', ['--no-pager', ...args], {
			cwd: root,
			env: {
				...process.env,
				GIT_OPTIONAL_LOCKS: '0',
				GIT_TERMINAL_PROMPT: '0'
			},
			encoding: 'utf8',
			maxBuffer: MAX_GIT_OUTPUT_BYTES,
			timeout: GIT_TIMEOUT_MS,
			windowsHide: true,
			signal
		});
		return result.stdout;
	} catch (error) {
		if (allowExitCodes.includes(error?.code) && typeof error?.stdout === 'string') return error.stdout;
		const detail = String(error?.stderr ?? error?.message ?? 'command failed').trim();
		if (error?.code === 'ENOENT') throw new Error('git: Git executable is not available');
		if (error?.killed || error?.signal === 'SIGTERM') throw new Error('git: command timed out');
		throw new Error(`git: ${detail.slice(0, 300)}`);
	}
}

/** Ensure the active workspace is inside a non-bare Git work tree. */
async function ensureGitWorkspace(root, signal) {
	const result = await runGit(root, ['rev-parse', '--is-inside-work-tree'], signal, { allowExitCodes: [128] });
	if (result.trim() !== 'true') throw new Error('git: current workspace is not a repository');
}

/** Parse `git status --porcelain=v1 -z` records. */
function parseGitStatus(output) {
	const tokens = output.split('\0');
	const files = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (!token) continue;
		const code = token.slice(0, 2);
		let relative = token.slice(3);
		let previousPath;
		if (code[0] === 'R' || code[0] === 'C' || code[1] === 'R' || code[1] === 'C') {
			previousPath = tokens[index + 1] ?? '';
			index += 1;
		}
		if (!relative) continue;
		const staged = code[0] !== ' ' && code[0] !== '?';
		const unstaged = code[1] !== ' ' && code[1] !== '?';
		const untracked = code === '??';
		const conflicted = code.includes('U');
		const kind = untracked ? 'untracked'
			: conflicted ? 'conflicted'
			: code.includes('R') ? 'renamed'
			: code.includes('A') ? 'added'
			: code.includes('D') ? 'deleted'
			: 'modified';
		files.push({ relative, previousPath: previousPath || null, code, kind, staged, unstaged, untracked, conflicted });
	}
	return files;
}

/** Parse NUL-delimited `diff-tree --name-status` rows. */
function parseGitNameStatus(output) {
	const tokens = output.split('\0');
	const files = [];
	for (let index = 0; index < tokens.length;) {
		const status = tokens[index++];
		if (!status) continue;
		const type = status[0];
		if (type === 'R' || type === 'C') {
			const previousPath = tokens[index++] ?? '';
			const relative = tokens[index++] ?? '';
			if (relative) files.push({ relative, previousPath: previousPath || null, status });
		} else {
			const relative = tokens[index++] ?? '';
			if (relative) files.push({ relative, previousPath: null, status });
		}
	}
	return files;
}

/** Parse the fixed unit-separator commit log format. */
function parseGitLog(output) {
	return output.split('\x1e').filter(Boolean).map((record) => {
		// Git may place a platform newline after the record separator. It is
		// not part of the object id and must not reach hash validation.
		const [hash, shortHash, author, date, subject, decoration = ''] = record.replace(/^[\r\n]+/, '').split('\x1f');
		const refs = decoration
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
			.map((value) => value.replace(/^HEAD -> /, ''));
		return { hash, shortHash, author, date, subject, refs };
	}).filter((commit) => commit.hash && commit.shortHash);
}

function truncateGitOutput(content, limit = MAX_GIT_DIFF_BYTES) {
	if (Buffer.byteLength(content, 'utf8') <= limit) return { content, truncated: false };
	let output = content;
	while (Buffer.byteLength(output, 'utf8') > limit) output = output.slice(0, Math.floor(output.length * 0.9));
	return { content: output, truncated: true };
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
				if (shouldIgnoreEntry(name)) continue;
				const childRel = relative === '' ? name : `${relative}/${name}`;
				entries.push({ relative: childRel, kind: 'dir' });
				await walk(path.join(abs, name), childRel);
			} else if (dirent.isFile()) {
				if (shouldIgnoreEntry(name)) continue;
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
				if (shouldIgnoreEntry(name)) continue;
				rows.push({ relative: childRel, name, kind: 'dir', size: 0 });
			} else if (dirent.isFile()) {
				if (shouldIgnoreEntry(name)) continue;
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
 * Serve one workspace image (Markdown preview support). Resolves the session
 * id to its workspace root, validates the relative path stays inside it, and
 * only serves allow-listed image extensions under a size cap.
 * @param sessions - the host sessions service (may be undefined).
 * @param sessionId - session whose workspace holds the image.
 * @param relative - workspace-relative path to the image.
 * @returns a response triple: HTTP status, optional content type, optional body.
 */
async function readImageResponse(sessions, sessionId, relative) {
	if (typeof sessionId !== 'string' || sessionId === '') return { status: 400 };
	if (typeof relative !== 'string' || relative === '') return { status: 400 };
	const ext = path.extname(relative).toLowerCase();
	const type = IMAGE_EXTENSIONS[ext];
	if (type === undefined) return { status: 400 };
	const session = sessions?.get(sessionId);
	const cwd = session?.header?.cwd;
	if (typeof cwd !== 'string' || cwd === '') return { status: 404 };
	let abs;
	try {
		abs = resolveInside(path.resolve(cwd), relative);
	} catch {
		return { status: 400 };
	}
	try {
		const info = await stat(abs);
		if (!info.isFile() || info.size > MAX_IMAGE_BYTES) return { status: 404 };
		const body = await readFile(abs);
		return { status: 200, type, body };
	} catch {
		return { status: 404 };
	}
}

/** The web-server route serving workspace images for the Markdown preview. */
function imageRoute(ctx) {
	const sessions = ctx.get('sessions');
	return {
		kind: 'exact',
		path: '/api/oh-my-theme/image',
		handler: async (req, res) => {
			if (req.method !== 'GET' && req.method !== 'HEAD') {
				res.writeHead(405);
				res.end();
				return;
			}
			const url = new URL(req.url ?? '/', 'http://x');
			const sessionId = url.searchParams.get('session') ?? '';
			const relative = url.searchParams.get('path') ?? '';
			const result = await readImageResponse(sessions, sessionId, relative);
			if (result.status !== 200 || result.body === undefined) {
				res.writeHead(result.status);
				res.end();
				return;
			}
			res.writeHead(200, {
				'content-type': result.type,
				'content-length': result.body.length,
				'cache-control': 'no-cache'
			});
			if (req.method === 'GET') res.end(result.body);
			else res.end();
		}
	};
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
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/gitStatus',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'gitStatus',
		invocation: { kind: 'direct' },
		parameters: [
			{
				name: 'agent',
				wire: 'agentId',
				source: 'lookup',
				lookup: 'agent',
				codec: strictCodec('@deepseek-ai/dsh-session/types#SessionId')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#GitStatus')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/gitDiff',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'gitDiff',
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
			},
			{
				name: 'mode',
				wire: 'mode',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#GitDiffMode')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#GitDiffResult')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/gitLog',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'gitLog',
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
				name: 'skip',
				wire: 'skip',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#GitLogSkip')
			},
			{
				name: 'limit',
				wire: 'limit',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#GitLogLimit')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#GitLogResult')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/gitShow',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'gitShow',
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
				name: 'hash',
				wire: 'hash',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#GitCommitHash')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#GitCommit')
	},
	{
		id: 'dsh-oh-my-theme#workspaceFiles/gitCommitDiff',
		service: 'workspaceFiles',
		namespace: 'workspaceFiles',
		method: 'gitCommitDiff',
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
				name: 'hash',
				wire: 'hash',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#GitCommitHash')
			},
			{
				name: 'relPath',
				wire: 'relPath',
				source: 'json',
				codec: strictCodec('dsh-oh-my-theme#RelPath')
			}
		],
		cancellation: { parameter: 'signal' },
		result: strictCodec('dsh-oh-my-theme#GitDiffResult')
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
				description: 'Read-only, workspace-scoped file access and Git status, history, and diff methods for the browser half.',
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
					},
					{
						kind: 'method',
						name: 'gitStatus',
						signature: 'gitStatus(agent, signal): Promise<GitStatus>'
					},
					{
						kind: 'method',
						name: 'gitDiff',
						signature: 'gitDiff(agent, relPath, mode, signal): Promise<GitDiffResult>'
					},
					{
						kind: 'method',
						name: 'gitLog',
						signature: 'gitLog(agent, skip, limit, signal): Promise<GitLogResult>'
					},
					{
						kind: 'method',
						name: 'gitShow',
						signature: 'gitShow(agent, hash, signal): Promise<GitCommit>'
					},
					{
						kind: 'method',
						name: 'gitCommitDiff',
						signature: 'gitCommitDiff(agent, hash, relPath, signal): Promise<GitDiffResult>'
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

	/** Resolve the active session workspace or fail before touching Git. */
	workspaceRoot(agent) {
		const cwd = agent?.session?.header?.cwd;
		if (typeof cwd !== 'string' || cwd === '') {
			throw new Error('workspaceFiles: the session has no workspace directory');
		}
		return path.resolve(cwd);
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
		const normalizedQuery = typeof query === 'string' ? query : '';
		// Empty-query callers (the client-side @ picker and Quick Open) need the
		// complete capped index so they can rank locally without rescanning.
		return rankEntries(entries, normalizedQuery, normalizedQuery.trim() === '' ? MAX_INDEX_FILES : MAX_CANDIDATES);
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
		const cwd = this.workspaceRoot(agent);
		if (typeof relPath !== 'string' || relPath === '') {
			throw new Error('workspaceFiles: readText requires a relative path');
		}
		return readTextFile(cwd, relPath, signal);
	}

	/** Return branch metadata and staged/unstaged/untracked workspace changes. */
	async gitStatus(agent, signal) {
		const cwd = this.workspaceRoot(agent);
		await ensureGitWorkspace(cwd, signal);
		const [branchOutput, branchesOutput, statusOutput] = await Promise.all([
			runGit(cwd, ['branch', '--show-current'], signal),
			runGit(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes'], signal),
			runGit(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.'], signal)
		]);
		const branch = branchOutput.trim();
		return {
			branch: branch || null,
			detached: branch === '',
			branches: branchesOutput.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
			files: parseGitStatus(statusOutput)
		};
	}

	/** Read a working-tree or staged diff for one workspace-relative path. */
	async gitDiff(agent, relPath, mode, signal) {
		const cwd = this.workspaceRoot(agent);
		await ensureGitWorkspace(cwd, signal);
		const relative = normalizeGitPath(cwd, relPath);
		if (mode !== 'staged' && mode !== 'working') throw new Error('git: diff mode must be staged or working');
		const statusOutput = await runGit(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', relative], signal);
		const row = parseGitStatus(statusOutput).find((entry) => entry.relative === relative);
		if (mode === 'working' && row?.untracked === true) {
			const output = await runGit(cwd, [
				'diff', '--no-index', '--no-ext-diff', '--no-color', '--unified=80', '--', '/dev/null', relative
			], signal, { allowExitCodes: [1] });
			return truncateGitOutput(output);
		}
		const args = ['diff', '--no-ext-diff', '--no-color', '--unified=80'];
		if (mode === 'staged') args.push('--cached');
		const output = await runGit(cwd, [...args, '--', relative], signal);
		return truncateGitOutput(output);
	}

	/** List commits that touch the current workspace, newest first. */
	async gitLog(agent, skip, limit, signal) {
		const cwd = this.workspaceRoot(agent);
		await ensureGitWorkspace(cwd, signal);
		const safeSkip = Number.isInteger(skip) && skip >= 0 ? Math.min(skip, 10_000) : 0;
		const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_GIT_COMMITS) : 20;
		const output = await runGit(cwd, [
			'log', `--max-count=${safeLimit}`, `--skip=${safeSkip}`,
			'--all', '--decorate=short', '--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1f%D%x1e', '--', '.'
		], signal);
		const commits = parseGitLog(output);
		return { commits, hasMore: commits.length === safeLimit, nextSkip: safeSkip + commits.length };
	}

	/** Return commit metadata plus changed files constrained to this workspace. */
	async gitShow(agent, hash, signal) {
		const cwd = this.workspaceRoot(agent);
		await ensureGitWorkspace(cwd, signal);
		const safeHash = normalizeCommitHash(hash);
		const [metadataOutput, filesOutput] = await Promise.all([
			runGit(cwd, ['show', '-s', '--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s', safeHash], signal),
			runGit(cwd, ['diff-tree', '--no-commit-id', '--root', '--name-status', '-z', '-r', '--relative', safeHash, '--', '.'], signal)
		]);
		const [commit] = parseGitLog(`${metadataOutput}\x1e`);
		if (commit === undefined) throw new Error('git: commit not found');
		return { ...commit, files: parseGitNameStatus(filesOutput) };
	}

	/** Read a commit diff, optionally limited to one changed workspace path. */
	async gitCommitDiff(agent, hash, relPath, signal) {
		const cwd = this.workspaceRoot(agent);
		await ensureGitWorkspace(cwd, signal);
		const safeHash = normalizeCommitHash(hash);
		const relative = normalizeGitPath(cwd, typeof relPath === 'string' ? relPath : '', { allowEmpty: true });
		const output = await runGit(cwd, [
			'show', '--no-ext-diff', '--no-color', '--unified=80', '--format=', '--relative', safeHash,
			'--', relative || '.'
		], signal);
		return truncateGitOutput(output);
	}
}

/** Required services: the Typert registry (manifest), the web server (image
 * route), and sessions (workspace root lookup for the image route). */
const inject = ['typert', 'webServer', 'sessions'];

/** Host loader entry: register the file service, its typert manifest, and
 * the workspace-image route (Markdown preview) when a web server is present. */
function apply(ctx) {
	const runtime = new WorkspaceFilesRuntime(ctx);
	void runtime;
	ctx.effect(() => {
		const dispose = ctx.typert.register(TYPERT_MANIFEST);
		return () => {
			void dispose();
		};
	}, 'dsh-oh-my-theme: typert manifest');
	const webServer = ctx.get('webServer');
	if (webServer !== undefined) {
		ctx.effect(() => webServer.register(imageRoute(ctx)), 'dsh-oh-my-theme: image route');
	}
}

export { WorkspaceFilesRuntime, TYPERT_MANIFEST, readImageResponse, apply, inject };
