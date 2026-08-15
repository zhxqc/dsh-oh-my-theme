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

/**
 * Typert Remote Service giving the browser half read-only, workspace-scoped
 * file access. Registered under the `workspaceFiles` Cordis key; methods are
 * invoked by the client through `ctx.remote.$mount` + `remote.workspaceFiles`.
 */
export declare class WorkspaceFilesRuntime {
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
}

/** Required services: the Typert registry that accepts the manifest. */
export declare const inject: string[];

/** Host loader entry: register the file service and its typert manifest. */
export declare function apply(ctx: Context): void;
