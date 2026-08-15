import type { Context } from '@deepseek-ai/cordis';

/** A curated skin: a third-party theme for the built-in ThemeRuntime. */
export interface SkinDefinition {
	/** Unique theme id registered into the theme service (never `system`). */
	id: string;
	/** Base palette the skin builds on; drives `body[data-ds-dark-theme]`. */
	colorScheme: 'light' | 'dark';
	/** `--dsw-alias-*` / `--dsw-specific-*` token overrides (concrete CSS colors). */
	tokens: Record<string, string>;
}

/** Settings row locale namespace. */
export declare const SETTINGS_NS: string;
/** The curated skin catalog. */
export declare const SKINS: SkinDefinition[];
/** Sentinel meaning "follow the built-in appearance". */
export declare const DEFAULT_SKIN: 'system';

/** Services the client plugin requires. */
export declare const inject: string[];

/**
 * Client plugin body: register the skins, restore the saved one, mount the
 * workspaceFiles remote, register the @-mention source, and mount the sidebar
 * file tree drawer (lazy tree + Markdown preview).
 */
export declare function apply(ctx: Context): void;
