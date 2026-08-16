import type { Context } from '@deepseek-ai/cordis';

/** One indexed workspace entry returned by `search`. */
export interface FileEntry {
	/** Slash path relative to the workspace root. */
	relative: string;
	/** 'file' or 'dir'. */
	kind: 'file' | 'dir';
}

/** One directory row returned by `listDir`. */
export interface DirEntry {
	/** Slash path relative to the workspace root. */
	relative: string;
	/** Bare entry name. */
	name: string;
	/** 'file' or 'dir'. */
	kind: 'file' | 'dir';
	/** Stub (0) — sizes are not surfaced. */
	size: number;
}

/** One workspace-scoped Git status row. */
export interface GitStatusEntry {
	relative: string;
	previousPath: string | null;
	code: string;
	kind: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflicted';
	staged: boolean;
	unstaged: boolean;
	untracked: boolean;
	conflicted: boolean;
}

export interface GitStatus {
	branch: string | null;
	detached: boolean;
	branches: readonly string[];
	files: readonly GitStatusEntry[];
}

export interface GitDiffResult {
	content: string;
	truncated: boolean;
}

export interface GitCommitSummary {
	hash: string;
	shortHash: string;
	author: string;
	date: string;
	subject: string;
	refs: readonly string[];
}

export interface GitCommitFile {
	relative: string;
	previousPath: string | null;
	status: string;
}

export interface GitCommit extends GitCommitSummary {
	files: readonly GitCommitFile[];
}

export interface GitLogResult {
	commits: readonly GitCommitSummary[];
	hasMore: boolean;
	nextSkip: number;
}

/** One currency balance returned by the official DeepSeek account API. */
export interface DeepSeekBalanceInfo {
	currency: 'CNY' | 'USD';
	total_balance: string;
	granted_balance: string;
	topped_up_balance: string;
}

/** Sanitized real-time DeepSeek balance; the API key never crosses this boundary. */
export interface DeepSeekBalance {
	is_available: boolean;
	balance_infos: readonly DeepSeekBalanceInfo[];
	fetched_at: string;
}

/**
 * Typert Remote Service giving the browser half read-only, workspace-scoped
 * file access. Registered under the `workspaceFiles` Cordis key; methods are
 * invoked by the client through `ctx.remote.$mount` + `remote.workspaceFiles`.
 */
export declare class WorkspaceFilesRuntime {
	balance(signal?: AbortSignal): Promise<DeepSeekBalance>;
	/**
	 * Index the session's workspace and return query-matching entries.
	 * @param agent - session agent injected by the typert lookup provider.
	 * @param query - free-text query ('' returns the default order).
	 * @param signal - cooperative cancellation.
	 */
	search(agent: unknown, query: string, signal?: AbortSignal): Promise<readonly FileEntry[]>;
	/**
	 * List one directory level inside the workspace (lazy file tree).
	 * @param agent - session agent injected by the typert lookup provider.
	 * @param relPath - '' or '.' for the root; otherwise a slash path.
	 * @param signal - cooperative cancellation.
	 */
	listDir(agent: unknown, relPath: string, signal?: AbortSignal): Promise<readonly DirEntry[]>;
	/**
	 * Read a UTF-8 text file inside the workspace (Markdown preview).
	 * @param agent - session agent injected by the typert lookup provider.
	 * @param relPath - slash path relative to the workspace root.
	 * @param signal - cooperative cancellation.
	 */
	readText(agent: unknown, relPath: string, signal?: AbortSignal): Promise<{ content: string; truncated: boolean }>;
	gitStatus(agent: unknown, signal?: AbortSignal): Promise<GitStatus>;
	gitDiff(agent: unknown, relPath: string, mode: 'working' | 'staged', signal?: AbortSignal): Promise<GitDiffResult>;
	gitLog(agent: unknown, skip: number, limit: number, signal?: AbortSignal): Promise<GitLogResult>;
	gitShow(agent: unknown, hash: string, signal?: AbortSignal): Promise<GitCommit>;
	gitCommitDiff(agent: unknown, hash: string, relPath: string, signal?: AbortSignal): Promise<GitDiffResult>;
}

/** Required services: the Typert registry that accepts the manifest. */
export declare const inject: string[];

/** Host loader entry: register the file service and its typert manifest. */
export declare function apply(ctx: Context): void;
