// dsh-oh-my-theme — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-oh-my-theme/client.js and
// executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table — the same shape the
// shipped ui-* packages' tsdown bundles emit. No build step is needed: this
// file is served verbatim.
//
// Features:
//  1. Theme skins — curated --dsw-alias-* palettes with a Settings → General
//     picker; hovering a swatch previews it live, clicking persists it in
//     localStorage (Host settings only exposes an allowlisted namespace set
//     to browser clients, so third-party preferences stay process-local).
//  2. @file mentions — a composer trigger source (inputTriggers, trigger
//     "@") that searches the session's workspace through the host half's
//     `workspaceFiles` Typert remote and inserts "@path " on pick.
//  3. Header file workspace + Markdown preview — a Session utility opens
//     tree-only, split, or preview-only views; Markdown uses dsh's shared
//     Shiki renderer and files use VSCode Material Icon Theme SVGs.
window.__ModuleLoader__.load({
	id: "dsh-oh-my-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let _ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		//#region dsh-oh-my-theme: definitions
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.oh-my-theme";
		/** localStorage key holding the selected skin id. */
		const STORAGE_KEY = "dsh-oh-my-theme:skin";
		const DETAILS_WIDTH_KEY = "dsh-oh-my-theme:details-width";
		const DETAILS_MIN_WIDTH = 300;
		const DETAILS_MAX_WIDTH = 1200;
		const CONVERSATION_MIN_WIDTH = 320;
		const CONVERSATION_FONT_SIZE_KEY = "dsh-oh-my-theme:conversation-font-size";
		const TREE_FONT_SIZE_KEY = "dsh-oh-my-theme:tree-font-size";
		const PREVIEW_FONT_SIZE_KEY = "dsh-oh-my-theme:preview-font-size";
		const PREVIEW_FONT_KEY = "dsh-oh-my-theme:preview-font";
		const DISPLAY_STYLE_ID = "dsh-oh-my-theme-display-style";
		/** Sentinel meaning "no custom skin — follow the built-in appearance". */
		const DEFAULT_SKIN = "system";
		/** Typert package name shared by the host half and this bundle. */
		const REMOTE_PACKAGE = "dsh-oh-my-theme";
		/** How long a cached @-index stays fresh, in ms. */
		const INDEX_TTL_MS = 60 * 1000;
		/** Max @-picker candidates returned to the menu. */
		const MAX_CANDIDATES = 50;
		/** The input trigger source id (distinct from dsh-at-file's). */
		const SOURCE_NAME = "oh-my-theme-files";
		/** Shiki language ids used by dsh's shared Markdown renderer. */
		const CODE_LANGUAGE_BY_EXTENSION = {
			js: "javascript", cjs: "javascript", mjs: "javascript",
			jsx: "jsx", ts: "typescript", cts: "typescript", mts: "typescript", tsx: "tsx",
			json: "json", jsonc: "jsonc", json5: "json5",
			html: "html", htm: "html", css: "css", scss: "scss", sass: "sass", less: "less",
			vue: "vue", svelte: "svelte", astro: "astro",
			yml: "yaml", yaml: "yaml", toml: "toml", xml: "xml",
			sh: "bash", bash: "bash", zsh: "bash", fish: "fish", ps1: "powershell",
			py: "python", rb: "ruby", php: "php", java: "java", kt: "kotlin", kts: "kotlin",
			c: "c", h: "c", cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp",
			cs: "csharp", go: "go", rs: "rust", swift: "swift", scala: "scala",
			sql: "sql", graphql: "graphql", gql: "graphql", prisma: "prisma",
			diff: "diff", patch: "diff", ini: "ini", conf: "ini", properties: "properties",
			lua: "lua", dart: "dart", r: "r", ex: "elixir", exs: "elixir"
		};
		const CODE_LANGUAGE_BY_FILENAME = {
			"dockerfile": "dockerfile",
			"makefile": "makefile",
			"cmakelists.txt": "cmake",
			"package.json": "json",
			"package-lock.json": "json",
			"tsconfig.json": "jsonc",
			"jsconfig.json": "jsonc",
			"pnpm-lock.yaml": "yaml",
			"yarn.lock": "yaml",
			".gitignore": "gitignore",
			".gitattributes": "gitignore",
			".editorconfig": "ini"
		};

		/** Infer a Shiki language id from a workspace-relative file path. */
		function codeLanguageForPath(relPath) {
			const filename = String(relPath).split(/[\\/]/).pop()?.toLowerCase() ?? "";
			if (CODE_LANGUAGE_BY_FILENAME[filename] !== undefined) return CODE_LANGUAGE_BY_FILENAME[filename];
			if (filename === ".env" || filename.startsWith(".env.")) return "dotenv";
			const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1) : "";
			return CODE_LANGUAGE_BY_EXTENSION[extension] ?? null;
		}

		/** Wrap source safely even when the file itself contains Markdown fences. */
		function codeMarkdown(content, language) {
			const longestFence = Math.max(2, ...(String(content).match(/`+/g) ?? []).map((run) => run.length));
			const fence = "`".repeat(longestFence + 1);
			return `${fence}${language}\n${content}${String(content).endsWith("\n") ? "" : "\n"}${fence}`;
		}

		/**
		 * The curated skin catalog. Every skin is a third-party theme for the
		 * built-in ThemeRuntime: an id, the base palette it builds on
		 * (colorScheme drives body[data-ds-dark-theme]), and --dsw-alias-*
		 * overrides applied as inline custom properties on <body> by ui-layout's
		 * ThemePresenter. Values are concrete CSS colors (no var() indirection),
		 * tuned per skin for contrast on both surface and text roles.
		 *
		 * To add a skin: copy one entry, change id / colorScheme / tokens, add a
		 * `theme.<id>` key to both dictionaries below, and reload the page. The
		 * settings picker, the registry, and the persisted restore all derive
		 * from this array — no other wiring is needed.
		 */
		const SKINS = [
			{
				id: "aurora",
				colorScheme: "dark",
				tokens: {
					"--dsw-alias-bg-base": "#0b0e1a",
					"--dsw-alias-bg-layer-1": "#12162a",
					"--dsw-alias-bg-layer-2": "#1a1f3d",
					"--dsw-alias-bg-layer-3": "#232952",
					"--dsw-alias-bg-overlay": "#1e2445",
					"--dsw-alias-border-l1": "rgba(148, 163, 184, 0.14)",
					"--dsw-alias-border-l2": "rgba(148, 163, 184, 0.26)",
					"--dsw-alias-label-primary": "#eef0fb",
					"--dsw-alias-label-secondary": "#a9b1d4",
					"--dsw-alias-label-tertiary": "#828cb4",
					"--dsw-alias-brand-primary": "#6d7cff",
					"--dsw-alias-brand-text": "#ffffff",
					"--dsw-alias-button-primary-hover": "#8a97ff",
					"--dsw-alias-button-primary-dimmed": "#1a1f3d",
					"--dsw-alias-state-business-primary": "#6d7cff",
					"--dsw-alias-state-business-tertiary": "#1a1f3d",
					"--dsw-alias-interactive-bg-hover": "rgba(109, 124, 255, 0.14)",
					"--dsw-alias-interactive-bg-active": "rgba(109, 124, 255, 0.24)",
					"--dsw-alias-markdown-code-block": "#0e1224",
					"--dsw-alias-markdown-inline-code": "#1a1f3d",
					"--dsw-specific-sidebar-fill": "#0e1224",
					"--dsw-specific-sidebar-nav-item-active": "#1a1f3d",
					"--dsw-specific-sidebar-nav-item-hover": "#141930",
					"--dsw-alias-scrollbar-bg-l1": "#232952",
					"--dsw-alias-scrollbar-bg-l2": "#2d3466",
					"--dsw-alias-scrollbar-hover-l1": "#3a4380",
					"--dsw-alias-scrollbar-hover-l2": "#3a4380"
				}
			},
			{
				id: "coffee",
				colorScheme: "light",
				tokens: {
					"--dsw-alias-bg-base": "#f7f3ec",
					"--dsw-alias-bg-layer-1": "#fffdf8",
					"--dsw-alias-bg-layer-2": "#f0e8db",
					"--dsw-alias-bg-layer-3": "#e6dac8",
					"--dsw-alias-bg-overlay": "#fffdf8",
					"--dsw-alias-border-l1": "rgba(94, 68, 36, 0.1)",
					"--dsw-alias-border-l2": "rgba(94, 68, 36, 0.18)",
					"--dsw-alias-label-primary": "#2f2921",
					"--dsw-alias-label-secondary": "#776a58",
					"--dsw-alias-label-tertiary": "#958877",
					"--dsw-alias-brand-primary": "#8b5e34",
					"--dsw-alias-brand-text": "#ffffff",
					"--dsw-alias-button-primary-hover": "#a3744a",
					"--dsw-alias-button-primary-dimmed": "#f0e8db",
					"--dsw-alias-state-business-primary": "#8b5e34",
					"--dsw-alias-state-business-tertiary": "#f0e8db",
					"--dsw-alias-interactive-bg-hover": "rgba(139, 94, 52, 0.08)",
					"--dsw-alias-interactive-bg-active": "rgba(139, 94, 52, 0.14)",
					"--dsw-alias-markdown-code-block": "#f0e8db",
					"--dsw-alias-markdown-inline-code": "#eadfcd",
					"--dsw-specific-sidebar-fill": "#f0e8db",
					"--dsw-specific-sidebar-nav-item-active": "#e6dac8",
					"--dsw-specific-sidebar-nav-item-hover": "#ece2d2",
					"--dsw-alias-scrollbar-bg-l1": "#e0d3bd",
					"--dsw-alias-scrollbar-bg-l2": "#d7c7ac",
					"--dsw-alias-scrollbar-hover-l1": "#cbb899",
					"--dsw-alias-scrollbar-hover-l2": "#cbb899"
				}
			},
			{
				id: "matrix",
				colorScheme: "dark",
				tokens: {
					"--dsw-alias-bg-base": "#07120a",
					"--dsw-alias-bg-layer-1": "#0c1c10",
					"--dsw-alias-bg-layer-2": "#122715",
					"--dsw-alias-bg-layer-3": "#19331c",
					"--dsw-alias-bg-overlay": "#152d18",
					"--dsw-alias-border-l1": "rgba(74, 222, 128, 0.12)",
					"--dsw-alias-border-l2": "rgba(74, 222, 128, 0.22)",
					"--dsw-alias-label-primary": "#e4f7e9",
					"--dsw-alias-label-secondary": "#93c9a0",
					"--dsw-alias-label-tertiary": "#71a87f",
					"--dsw-alias-brand-primary": "#22c55e",
					"--dsw-alias-brand-text": "#031207",
					"--dsw-alias-button-primary-hover": "#4ade80",
					"--dsw-alias-button-primary-dimmed": "#122715",
					"--dsw-alias-state-business-primary": "#22c55e",
					"--dsw-alias-state-business-tertiary": "#122715",
					"--dsw-alias-interactive-bg-hover": "rgba(34, 197, 94, 0.14)",
					"--dsw-alias-interactive-bg-active": "rgba(34, 197, 94, 0.24)",
					"--dsw-alias-markdown-code-block": "#0a1810",
					"--dsw-alias-markdown-inline-code": "#122715",
					"--dsw-specific-sidebar-fill": "#0a1810",
					"--dsw-specific-sidebar-nav-item-active": "#122715",
					"--dsw-specific-sidebar-nav-item-hover": "#0f2014",
					"--dsw-alias-scrollbar-bg-l1": "#19331c",
					"--dsw-alias-scrollbar-bg-l2": "#214526",
					"--dsw-alias-scrollbar-hover-l1": "#2a5731",
					"--dsw-alias-scrollbar-hover-l2": "#2a5731"
				}
			}
		];

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"theme.title": "Oh My Theme",
			"theme.default": "默认",
			"theme.aurora": "极光紫",
			"theme.coffee": "暖咖",
			"theme.matrix": "代码绿",
			"theme.hint": "悬停可实时预览，点击确认生效；「默认」恢复跟随系统明暗",
			"theme.typography.title": "文字显示",
			"theme.typography.hint": "修改后立即应用，并保存在当前浏览器",
			"theme.typography.conversation": "对话流",
			"theme.typography.tree": "文件树",
			"theme.typography.preview": "文件预览",
			"theme.typography.previewFont": "预览字体",
			"files.title": "文件树",
			"files.toggle": "打开 / 关闭文件树",
			"files.close": "关闭",
			"files.empty": "打开一个会话后，这里会显示它的工作区",
			"files.emptyTree": "工作区是空的",
			"files.remotePending": "文件服务未就绪，请刷新页面重试",
			"files.loading": "加载中…",
			"files.noSession": "当前没有会话",
			"files.previewTitle": "预览",
			"files.noPreview": "从项目文件中选择一个文件进行预览",
			"files.quickOpen": "快速打开文件",
			"files.quickOpenPlaceholder": "搜索文件名或路径…",
			"files.quickOpenEmpty": "没有匹配的文件",
			"files.viewTree": "仅显示项目文件",
			"files.viewSplit": "同时显示文件和预览",
			"files.viewPreview": "仅显示文件预览",
			"files.copyCode": "复制代码",
			"files.copiedCode": "已复制",
			"files.openExternal": "使用系统应用打开",
			"files.fontSize": "预览文字大小",
			"files.fontFamily": "预览字体",
			"files.fontSystem": "系统",
			"files.fontSerif": "衬线",
			"files.fontMono": "等宽",
			"files.error": "加载失败：",
			"files.truncated": "（内容已截断）",
			"git.files": "文件",
			"git.git": "Git",
			"git.changes": "更改",
			"git.commits": "提交",
			"git.refresh": "刷新",
			"git.branch": "分支",
			"git.detached": "分离头指针",
			"git.noRepo": "当前工作区不是 Git 仓库",
			"git.noChanges": "工作区干净",
			"git.staged": "已暂存",
			"git.unstaged": "未暂存",
			"git.untracked": "未跟踪",
			"git.conflicted": "冲突",
			"git.noDiff": "选择一个文件查看 Diff",
			"git.working": "工作区",
			"git.index": "暂存区",
			"git.loadMore": "加载更多",
			"git.noCommits": "当前工作区没有提交记录",
			"git.commitFiles": "变更文件",
			"git.commitDiff": "提交 Diff",
			"git.noCommitFile": "选择一个文件查看提交 Diff",
			"git.authorUnknown": "未知作者"
			,"git.timeline": "提交时间线"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"theme.title": "Oh My Theme",
			"theme.default": "Default",
			"theme.aurora": "Aurora",
			"theme.coffee": "Coffee",
			"theme.matrix": "Matrix",
			"theme.hint": "Hover to preview live, click to commit; “Default” follows the system scheme",
			"theme.typography.title": "Text display",
			"theme.typography.hint": "Changes apply immediately and are saved in this browser",
			"theme.typography.conversation": "Conversation",
			"theme.typography.tree": "File tree",
			"theme.typography.preview": "File preview",
			"theme.typography.previewFont": "Preview font",
			"files.title": "Files",
			"files.toggle": "Toggle file tree",
			"files.close": "Close",
			"files.empty": "Open a session to browse its workspace",
			"files.emptyTree": "Workspace is empty",
			"files.remotePending": "File service not ready — refresh to retry",
			"files.loading": "Loading…",
			"files.noSession": "No active session",
			"files.previewTitle": "Preview",
			"files.noPreview": "Select a project file to preview it",
			"files.quickOpen": "Quick Open File",
			"files.quickOpenPlaceholder": "Search file name or path…",
			"files.quickOpenEmpty": "No matching files",
			"files.viewTree": "Project files only",
			"files.viewSplit": "Files and preview",
			"files.viewPreview": "File preview only",
			"files.copyCode": "Copy code",
			"files.copiedCode": "Copied",
			"files.openExternal": "Open with system app",
			"files.fontSize": "Preview text size",
			"files.fontFamily": "Preview font",
			"files.fontSystem": "System",
			"files.fontSerif": "Serif",
			"files.fontMono": "Monospace",
			"files.error": "Failed to load:",
			"files.truncated": "(truncated)",
			"git.files": "Files",
			"git.git": "Git",
			"git.changes": "Changes",
			"git.commits": "Commits",
			"git.refresh": "Refresh",
			"git.branch": "Branch",
			"git.detached": "Detached HEAD",
			"git.noRepo": "The workspace is not a Git repository",
			"git.noChanges": "Working tree clean",
			"git.staged": "Staged",
			"git.unstaged": "Unstaged",
			"git.untracked": "Untracked",
			"git.conflicted": "Conflicted",
			"git.noDiff": "Select a file to view its diff",
			"git.working": "Working tree",
			"git.index": "Staged index",
			"git.loadMore": "Load more",
			"git.noCommits": "No commits touch this workspace",
			"git.commitFiles": "Changed files",
			"git.commitDiff": "Commit diff",
			"git.noCommitFile": "Select a file to view the commit diff",
			"git.authorUnknown": "Unknown author"
			,"git.timeline": "Commit timeline"
		};
		//#endregion

		//#region dsh-oh-my-theme: persistence
		/** Read a localStorage string value (null on absence or error). */
		function readStorage(key) {
			try {
				const value = window.localStorage.getItem(key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}

		/** Write (or remove with null) a localStorage value. */
		function writeStorage(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
			} catch {
				// storage unavailable / quota — the preference stays process-local
			}
		}

		/** Saved skin id (may be unknown/absent). */
		function readSavedSkin() {
			return readStorage(STORAGE_KEY);
		}

		/** Persist a skin choice; DEFAULT_SKIN clears the stored value. */
		function writeSavedSkin(id) {
			writeStorage(STORAGE_KEY, id === DEFAULT_SKIN ? null : id);
		}

		const DISPLAY_DEFAULTS = {
			conversationSize: 16,
			treeSize: 13,
			previewSize: 14,
			previewFont: "system"
		};
		const DISPLAY_STORAGE_KEYS = {
			conversationSize: CONVERSATION_FONT_SIZE_KEY,
			treeSize: TREE_FONT_SIZE_KEY,
			previewSize: PREVIEW_FONT_SIZE_KEY,
			previewFont: PREVIEW_FONT_KEY
		};

		function readDisplayPreferences() {
			const numeric = (key) => {
				const value = Number(readStorage(DISPLAY_STORAGE_KEYS[key]));
				return Number.isFinite(value) && value >= 12 && value <= 22 ? value : DISPLAY_DEFAULTS[key];
			};
			const previewFont = readStorage(PREVIEW_FONT_KEY);
			return {
				conversationSize: numeric("conversationSize"),
				treeSize: numeric("treeSize"),
				previewSize: numeric("previewSize"),
				previewFont: ["system", "serif", "mono"].includes(previewFont) ? previewFont : DISPLAY_DEFAULTS.previewFont
			};
		}

		function previewFontFamily(value) {
			if (value === "serif") return "Iowan Old Style, Songti SC, Noto Serif CJK SC, serif";
			if (value === "mono") return "SFMono-Regular, Menlo, Monaco, Consolas, monospace";
			return "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
		}

		/** Apply all display preferences immediately, including dsh's conversation stream. */
		function applyDisplayPreferences(preferences) {
			const rootStyle = typeof document === "undefined" ? undefined : document.documentElement?.style;
			rootStyle?.setProperty("--oh-my-theme-conversation-font-size", `${preferences.conversationSize}px`);
			rootStyle?.setProperty("--oh-my-theme-tree-font-size", `${preferences.treeSize}px`);
			rootStyle?.setProperty("--oh-my-theme-preview-font-size", `${preferences.previewSize}px`);
			rootStyle?.setProperty("--oh-my-theme-preview-font-family", previewFontFamily(preferences.previewFont));
			if (typeof document === "undefined" || document.getElementById === undefined || document.createElement === undefined) return;
			let style = document.getElementById(DISPLAY_STYLE_ID);
			if (style === null) {
				style = document.createElement("style");
				style.id = DISPLAY_STYLE_ID;
				document.head?.appendChild(style);
			}
			style.textContent = `
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) :where(p, li, blockquote, td, th, summary, button, code),
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) .gdEzaW_bubble {
  font-size: var(--oh-my-theme-conversation-font-size, 16px) !important;
}
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) :where(p, li, blockquote, td, th),
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) .gdEzaW_bubble {
  line-height: calc(var(--oh-my-theme-conversation-font-size, 16px) + 8px) !important;
}
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) h1 { font-size: calc(var(--oh-my-theme-conversation-font-size, 16px) * 1.75) !important; }
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) h2 { font-size: calc(var(--oh-my-theme-conversation-font-size, 16px) * 1.5) !important; }
:where(.Md3f7G_column, [class$="_column"]:has(> [class$="_flowItem"])) h3 { font-size: calc(var(--oh-my-theme-conversation-font-size, 16px) * 1.25) !important; }
[data-oh-my-theme-tree] :where(button, span) {
  font-size: var(--oh-my-theme-tree-font-size, 13px) !important;
}
[data-oh-my-theme-preview] :where(p, li, blockquote, td, th, pre, code) {
  font-size: var(--oh-my-theme-preview-font-size, 14px) !important;
  line-height: calc(var(--oh-my-theme-preview-font-size, 14px) + 10px) !important;
  font-family: var(--oh-my-theme-preview-font-family) !important;
}
[data-oh-my-theme-preview] h1 { font-size: calc(var(--oh-my-theme-preview-font-size, 14px) * 1.75) !important; }
[data-oh-my-theme-preview] h2 { font-size: calc(var(--oh-my-theme-preview-font-size, 14px) * 1.5) !important; }
[data-oh-my-theme-preview] h3 { font-size: calc(var(--oh-my-theme-preview-font-size, 14px) * 1.25) !important; }`;
		}
		//#endregion

		//#region dsh-oh-my-theme: theme settings row
		/** Inline style sheet for the row (kept dependency-free). */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 400,
				lineHeight: "22px"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px"
			},
			grid: {
				display: "flex",
				flexWrap: "wrap",
				gap: "10px"
			},
			card: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "6px",
				width: "96px",
				padding: "3px",
				borderRadius: "10px",
				border: "2px solid transparent",
				background: "transparent",
				cursor: "pointer",
				font: "inherit",
				boxSizing: "border-box"
			},
			cardSelected: {
				borderColor: "var(--dsw-alias-brand-primary)",
				background: "var(--dsw-alias-interactive-bg-hover)"
			},
			cardLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				lineHeight: "16px",
				whiteSpace: "nowrap"
			},
			cardLabelSelected: {
				color: "var(--dsw-alias-label-primary)"
			},
			swatch: {
				width: "100%",
				height: "52px",
				borderRadius: "8px",
				boxSizing: "border-box",
				padding: "8px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				gap: "6px"
			},
			swatchLine: {
				height: "7px",
				borderRadius: "4px"
			},
			defaultSwatch: {
				width: "100%",
				height: "52px",
				borderRadius: "8px",
				boxSizing: "border-box",
				display: "flex",
				overflow: "hidden",
				border: "1px solid var(--dsw-alias-border-l2)"
			},
			typographySection: {
				borderTop: "1px solid var(--dsw-alias-border-l2)",
				paddingTop: "14px",
				display: "flex",
				flexDirection: "column",
				gap: "10px"
			},
			typographyGrid: {
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
				gap: "10px"
			},
			field: {
				display: "flex",
				flexDirection: "column",
				gap: "5px",
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px"
			},
			select: {
				height: "32px",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: "8px",
				background: "var(--dsw-alias-bg-layer-2)",
				color: "var(--dsw-alias-label-primary)",
				padding: "0 9px",
				font: "inherit"
			}
		};

		/** Mini palette preview driven by one skin's token table. */
		function Swatch({ tokens }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: {
					...styles.swatch,
					background: tokens["--dsw-alias-bg-layer-1"],
					border: `1px solid ${tokens["--dsw-alias-border-l2"]}`
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "70%",
							background: tokens["--dsw-alias-label-primary"],
							opacity: 0.85
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "45%",
							background: tokens["--dsw-alias-brand-primary"]
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.swatchLine,
							width: "55%",
							background: tokens["--dsw-alias-label-secondary"],
							opacity: 0.55
						}
					})
				]
			});
		}

		/** "Default" chip: follow the built-in appearance (light + dark halves). */
		function DefaultSwatch() {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.defaultSwatch,
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: { flex: 1, background: "#f4f4f5" } }),
					(0, react_jsx_runtime.jsx)("div", { style: { flex: 1, background: "#1c1c20" } })
				]
			});
		}

		/**
		 * One selectable skin card. Hovering previews the skin live on the whole
		 * page (temporary, not persisted); clicking applies it for real.
		 */
		function SkinCard({ skin, selected, onSelect, onPreview, onRestore, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onSelect,
				onMouseEnter: () => onPreview(skin.id),
				onMouseLeave: onRestore,
				"aria-pressed": selected,
				style: {
					...styles.card,
					...(selected ? styles.cardSelected : {})
				},
				children: [
					(0, react_jsx_runtime.jsx)(Swatch, { tokens: skin.tokens }),
					(0, react_jsx_runtime.jsx)("span", {
						style: {
							...styles.cardLabel,
							...(selected ? styles.cardLabelSelected : {})
						},
						children: t(`theme.${skin.id}`)
					})
				]
			});
		}

		/**
		 * Skin picker row registered into the Settings → General item slot,
		 * right after the built-in Appearance row: title + a "Default" chip and
		 * one swatch card per curated skin. Hovering a card previews it on the
		 * whole page until the pointer leaves; only a click persists the choice.
		 */
		function ThemeRow({ t, setSkin, previewSkin, restoreSkin, setDisplayPreference, useStore }) {
			const skin = useStore((s) => s.skin);
			const selected = SKINS.some((candidate) => candidate.id === skin) ? skin : null;
			const [display, setDisplay] = (0, _react.useState)(readDisplayPreferences);
			const changeDisplay = (key, value) => {
				setDisplay((current) => ({ ...current, [key]: value }));
				setDisplayPreference(key, value);
			};
			const sizeOptions = [12, 13, 14, 15, 16, 18, 20, 22];
			const sizeField = (key, label) => (0, react_jsx_runtime.jsxs)("label", {
				style: styles.field,
				children: [
					(0, react_jsx_runtime.jsx)("span", { children: label }),
					(0, react_jsx_runtime.jsx)("select", {
						style: styles.select,
						value: display[key],
						onChange: (event) => changeDisplay(key, Number(event.target.value)),
						children: sizeOptions.map((value) => (0, react_jsx_runtime.jsx)("option", { value, children: `${value}px` }, value))
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("theme.title")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.grid,
						children: [
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setSkin(DEFAULT_SKIN),
								onMouseEnter: () => previewSkin(DEFAULT_SKIN),
								onMouseLeave: restoreSkin,
								"aria-pressed": selected === null,
								style: {
									...styles.card,
									...(selected === null ? styles.cardSelected : {})
								},
								children: [
									(0, react_jsx_runtime.jsx)(DefaultSwatch, {}),
									(0, react_jsx_runtime.jsx)("span", {
										style: {
											...styles.cardLabel,
											...(selected === null ? styles.cardLabelSelected : {})
										},
										children: t("theme.default")
									})
								]
							}),
							SKINS.map((skinDefinition) => (0, react_jsx_runtime.jsx)(SkinCard, {
								skin: skinDefinition,
								selected: selected === skinDefinition.id,
								onSelect: () => setSkin(skinDefinition.id),
								onPreview: previewSkin,
								onRestore: restoreSkin,
								t
							}, skinDefinition.id))
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.hint,
						children: t("theme.hint")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.typographySection,
						children: [
							(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: t("theme.typography.title") }),
							(0, react_jsx_runtime.jsxs)("div", {
								style: styles.typographyGrid,
								children: [
									sizeField("conversationSize", t("theme.typography.conversation")),
									sizeField("treeSize", t("theme.typography.tree")),
									sizeField("previewSize", t("theme.typography.preview")),
									(0, react_jsx_runtime.jsxs)("label", {
										style: styles.field,
										children: [
											(0, react_jsx_runtime.jsx)("span", { children: t("theme.typography.previewFont") }),
											(0, react_jsx_runtime.jsxs)("select", {
												style: styles.select,
												value: display.previewFont,
												onChange: (event) => changeDisplay("previewFont", event.target.value),
												children: [
													(0, react_jsx_runtime.jsx)("option", { value: "system", children: t("files.fontSystem") }),
													(0, react_jsx_runtime.jsx)("option", { value: "serif", children: t("files.fontSerif") }),
													(0, react_jsx_runtime.jsx)("option", { value: "mono", children: t("files.fontMono") })
												]
											})
										]
									})
								]
							}),
							(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("theme.typography.hint") })
						]
					})
				]
			});
		}
		//#endregion

		//#region dsh-oh-my-theme: theme settings row store
		/**
		 * Theme row slot store: a mirror of the theme service snapshot. The
		 * plugin's apply-world change listener is the only writer; the row
		 * component reads via props.useStore.
		 */
		function createThemeStore() {
			return (0, _runtime_client.defineStore)({
				init: () => ({
					skin: DEFAULT_SKIN,
					revision: -1
				}),
				actions: {
					sync: (d, skin, revision) => {
						if (revision <= d.revision) return;
						d.skin = skin;
						d.revision = revision;
					}
				}
			});
		}
		//#endregion

		//#region dsh-oh-my-theme: remote (workspaceFiles)
		/**
		 * Minimal strict codec — must mirror lib/index.js exactly. The client
		 * gateway (`requireStrictCodec`) rejects `src-json`, so every field
		 * carries `mode: "strict"`, a type symbol, and a pass-through schema.
		 */
		function strictCodec(typeSymbol) {
			return {
				mode: "strict",
				typeSymbol,
				schema: { parse: (value) => value }
			};
		}
		/** Typert invocation descriptors — must mirror lib/index.js exactly. */
		const INVOCATIONS = [
			{
				id: "dsh-oh-my-theme#workspaceFiles/search",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "search",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "query", wire: "query", source: "json", codec: strictCodec("dsh-oh-my-theme#SearchQuery") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#FileEntry[]")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/listDir",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "listDir",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "relPath", wire: "relPath", source: "json", codec: strictCodec("dsh-oh-my-theme#RelPath") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#DirEntry[]")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/readText",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "readText",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "relPath", wire: "relPath", source: "json", codec: strictCodec("dsh-oh-my-theme#RelPath") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#TextResult")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/gitStatus",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "gitStatus",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#GitStatus")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/gitDiff",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "gitDiff",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "relPath", wire: "relPath", source: "json", codec: strictCodec("dsh-oh-my-theme#RelPath") },
					{ name: "mode", wire: "mode", source: "json", codec: strictCodec("dsh-oh-my-theme#GitDiffMode") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#GitDiffResult")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/gitLog",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "gitLog",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "skip", wire: "skip", source: "json", codec: strictCodec("dsh-oh-my-theme#GitLogSkip") },
					{ name: "limit", wire: "limit", source: "json", codec: strictCodec("dsh-oh-my-theme#GitLogLimit") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#GitLogResult")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/gitShow",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "gitShow",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "hash", wire: "hash", source: "json", codec: strictCodec("dsh-oh-my-theme#GitCommitHash") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#GitCommit")
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/gitCommitDiff",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "gitCommitDiff",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: strictCodec("@deepseek-ai/dsh-session/types#SessionId") },
					{ name: "hash", wire: "hash", source: "json", codec: strictCodec("dsh-oh-my-theme#GitCommitHash") },
					{ name: "relPath", wire: "relPath", source: "json", codec: strictCodec("dsh-oh-my-theme#RelPath") }
				],
				cancellation: { parameter: "signal" },
				result: strictCodec("dsh-oh-my-theme#GitDiffResult")
			}
		];

		/** The client-side remote contract handed to ctx.remote.$mount. */
		const OHMY_REMOTE = {
			package: REMOTE_PACKAGE,
			descriptors: INVOCATIONS
		};
		//#endregion

		//#region dsh-oh-my-theme: @ mention source
		/** Basename of a slash path. */
		function basenameOf(relative) {
			const at = relative.lastIndexOf("/");
			return at < 0 ? relative : relative.slice(at + 1);
		}

		/** Directory part of a slash path ('' when at the root). */
		function dirnameOf(relative) {
			const at = relative.lastIndexOf("/");
			return at < 0 ? "" : relative.slice(0, at);
		}

		/**
		 * Resolve an image `src` relative to a markdown file's directory into a
		 * workspace-relative path (handles `./`, `../`, and repeated slashes).
		 * @param mdRelative - workspace-relative path of the markdown file.
		 * @param src - image source from the markdown.
		 * @returns normalized workspace-relative path, or the original when it
		 * would escape the workspace root (keeps the src as-is).
		 */
		function resolveWorkspacePath(mdRelative, src) {
			const dir = dirnameOf(mdRelative);
			const normalized = src.replace(/\\/g, "/");
			const out = normalized.startsWith("/") || dir === "" ? [] : dir.split("/");
			const parts = normalized.split("/");
			for (const part of parts) {
				if (part === "" || part === ".") continue;
				if (part === "..") {
					if (out.length > 0) out.pop();
					else return src; // escapes the workspace — leave untouched
					continue;
				}
				out.push(part);
			}
			return out.join("/");
		}

		/** Build the absolute HTTP(S) URL accepted by dsh's MarkdownText. */
		function workspaceImageUrl(mdRelative, source, sessionId) {
			const target = source.trim().replace(/^<|>$/g, "");
			if (/^https?:/i.test(target)) return target;
			if (/^(?:data:|blob:|#|\/\/)/i.test(target)) return null;
			const origin = window.location?.origin;
			if (typeof origin !== "string" || !/^https?:\/\//i.test(origin)) return null;
			const resolved = resolveWorkspacePath(mdRelative, target);
			return `${origin}/api/oh-my-theme/image?session=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(resolved)}`;
		}

		/** Read one quoted or unquoted attribute from a trusted-to-parse img tag. */
		function htmlImageAttribute(tag, name) {
			const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i");
			const match = pattern.exec(tag);
			return match === null ? "" : match[1] ?? match[2] ?? match[3] ?? "";
		}

		/** Convert a raw HTML img tag into safe Markdown understood by MarkdownText. */
		function htmlImageToMarkdown(tag, mdRelative, sessionId) {
			const src = htmlImageAttribute(tag, "src");
			if (src === "") return null;
			const url = workspaceImageUrl(mdRelative, src, sessionId);
			if (url === null) return null;
			const alt = htmlImageAttribute(tag, "alt").replace(/([\\\]])/g, "\\$1");
			return `![${alt}](${url})`;
		}

		/**
		 * Normalize the common README forms MarkdownText intentionally does not
		 * render: standalone HTML images and linked badge images. No arbitrary
		 * HTML is passed into the DOM; only src/alt are retained.
		 */
		function rewriteHtmlImages(markdown, mdRelative, sessionId) {
			let out = markdown.replace(/<a\b[^>]*>\s*(<img\b[^>]*\/?>)\s*<\/a>/gi, (match, imageTag) =>
				htmlImageToMarkdown(imageTag, mdRelative, sessionId) ?? match);
			out = out.replace(/<img\b[^>]*\/?>/gi, (tag) =>
				htmlImageToMarkdown(tag, mdRelative, sessionId) ?? tag);
			// A centered badge group is usually wrapped in <p align="center">.
			// Strip that wrapper only when its body now consists solely of images.
			return out.replace(/<p\b[^>]*>\s*((?:!\[[^\n]*\]\([^\n]*\)\s*)+)<\/p>/gi, "$1");
		}

		/**
		 * Rewrite markdown image sources so relative images load through the
		 * host's workspace-image endpoint (the browser cannot resolve a path
		 * that is relative to a workspace file). Absolute URLs, data: URIs, and
		 * anchor links are left untouched.
		 * @param markdown - the markdown text.
		 * @param mdRelative - workspace-relative path of the markdown file.
		 * @param sessionId - current session (endpoint resolves its workspace).
		 * @returns markdown with image sources rewritten.
		 */
		function rewriteMarkdownImages(markdown, mdRelative, sessionId) {
			const normalized = rewriteHtmlImages(markdown, mdRelative, sessionId);
			return normalized.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
				const target = src.trim();
				if (/^(https?:|data:|blob:|#)/i.test(target)) return match;
				const url = workspaceImageUrl(mdRelative, target, sessionId);
				if (url === null) return match;
				return `![${alt}](${url})`;
			});
		}

		/** Score one path segment against a query token (higher is better; <0 = no match). */
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

		/** Score a full slash path against a query (segment-aware). */
		function scorePath(relative, q) {
			const lower = relative.toLowerCase();
			const segments = lower.split("/");
			const tokens = q.split("/").filter(Boolean);
			if (!q.includes("/")) return scoreName(segments.at(-1), tokens[0]);
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

		/** Rank indexed entries for the menu (dirs first on ties, then path length). */
		function rankFiles(files, query, limit) {
			const q = query.trim().toLowerCase();
			if (q === "") {
				return [...files]
					.sort((a, b) => a.kind === b.kind
						? a.relative < b.relative ? -1 : 1
						: a.kind === "dir" ? -1 : 1)
					.slice(0, limit);
			}
			return files
				.map((file) => ({ file, score: scorePath(file.relative, q) }))
				.filter((item) => item.score >= 0)
				.sort((a, b) => b.score - a.score
					|| (a.file.kind === "dir" ? 1 : 0) - (b.file.kind === "dir" ? 1 : 0)
					|| a.file.relative.length - b.file.relative.length
					|| (a.file.relative < b.file.relative ? -1 : 1))
				.slice(0, limit)
				.map((item) => item.file);
		}

		/** Turn ranked entries into the menu's candidate rows. */
		function candidateRows(files) {
			const counts = new Map();
			for (const file of files) {
				const basename = basenameOf(file.relative);
				counts.set(basename, (counts.get(basename) ?? 0) + 1);
			}
			return files.map((file) => {
				const basename = basenameOf(file.relative);
				const directory = dirnameOf(file.relative);
				const duplicate = counts.get(basename) > 1;
				return {
					name: duplicate && directory !== "" ? `${basename} - ${directory}` : basename,
					value: file.relative,
					atFileKind: file.kind,
					icon: ICON_MARKERS[fileIconDescriptor(basename, file.kind).key],
					...directory === "" ? {} : { description: directory }
				};
			});
		}

		/**
		 * Build the inputTriggers source for "@". The index is fetched once per
		 * session with a TTL, then filtered/ranked per keystroke in-memory.
		 */
		function createMentionSource({ search }) {
			const fetches = new Map();
			const listeners = new Map();
			const notify = (sessionId) => {
				for (const listener of [...(listeners.get(sessionId) ?? [])]) {
					try {
						listener();
					} catch (error) {
						console.error("[dsh-oh-my-theme] lexicon listener failed:", error);
					}
				}
			};
			const fetchIndex = (sessionId, signal) => {
				const existing = fetches.get(sessionId);
				const fresh = existing !== undefined && Date.now() - existing.at < INDEX_TTL_MS;
				if (fresh) {
					if (existing.settled !== undefined) return Promise.resolve(existing.settled);
					return existing.promise;
				}
				if (existing !== undefined) {
					fetches.delete(sessionId);
					existing.abort.abort();
				}
				const abort = new AbortController();
				const promise = search(sessionId, abort.signal).catch((error) => {
					fetches.delete(sessionId);
					throw error;
				});
				const entry = { promise, abort, at: Date.now() };
				fetches.set(sessionId, entry);
				promise.then(
					(files) => {
						entry.settled = files;
						notify(sessionId);
					},
					() => {
						if (fetches.get(sessionId) === entry) fetches.delete(sessionId);
					}
				);
				return signal !== undefined
					? promise.then((files) => (signal.aborted ? [] : files))
					: promise;
			};
			const findEntry = (sessionId, relative) => fetches.get(sessionId)?.settled?.find((file) => file.relative === relative);
			const invalidateAll = () => {
				for (const [key, entry] of [...fetches]) {
					fetches.delete(key);
					entry.abort.abort();
				}
				for (const sessionListeners of [...listeners.values()]) {
					for (const listener of sessionListeners) listener();
				}
			};
			const source = {
				trigger: "@",
				name: SOURCE_NAME,
				async candidates(session, { query, signal }) {
					try {
						const files = await fetchIndex(session.sessionId, signal);
						if (signal?.aborted) return [];
						return candidateRows(rankFiles(files, query, MAX_CANDIDATES));
					} catch (error) {
						// Never let a search failure kill the menu — surface it as
						// an empty result so the picker still opens.
						console.error("[dsh-oh-my-theme] @ candidates failed:", error instanceof Error ? error.message : error);
						return [];
					}
				},
				warm(session) {
					fetchIndex(session.sessionId).catch(() => {
					});
				},
				onPick({ candidate, session }) {
					const file = findEntry(session.sessionId, candidate.value);
					if (file === undefined) return undefined;
					const suffix = file.kind === "dir" ? "/" : "";
					return { text: `@${file.relative}${suffix} ` };
				},
				lexicon(session) {
					return fetches.get(session.sessionId)?.settled?.map((file) => file.relative);
				},
				getFiles(sessionId, signal) {
					return fetchIndex(sessionId, signal);
				},
				subscribeLexicon(session, listener) {
					const sessionId = session.sessionId;
					const set = listeners.get(sessionId) ?? new Set();
					set.add(listener);
					listeners.set(sessionId, set);
					return () => {
						set.delete(listener);
						if (set.size === 0) listeners.delete(sessionId);
					};
				}
			};
			return { source, invalidateAll };
		}
		//#endregion

		//#region dsh-oh-my-theme: file workspace panel
		/**
		 * SVG subset from Material Icon Theme (MIT), the VSCode icon theme requested
		 * by the user. Kept inline because dsh serves this client bundle verbatim.
		 * Source: https://github.com/material-extensions/vscode-material-icon-theme
		 */
		const VSCODE_ICON_SVG = {
			folder: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m6.922 3.768-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232" fill="#90a4ae"/></svg>',
			folderOpen: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.483 6H4.721a1 1 0 0 0-.949.684L2 12V5h12a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232l-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11l2.403-5.606A1 1 0 0 0 14.483 6" fill="#90a4ae"/></svg>',
			file: '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m8.668 6h3.664L8.668 2.332V6M4 1.332h5.332l4 4v8c0 .738-.594 1.336-1.332 1.336H4c-.738 0-1.332-.598-1.332-1.336V2.668c0-.742.594-1.336 1.332-1.336m3.332 1.336H4v10.664h8v-6H7.332z" fill="#90a4ae"/></svg>',
			markdown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#42a5f5" d="m14 10-4 3.5L6 10H4v12h4v-6l2 2 2-2v6h4V10zm12 6v-6h-4v6h-4l6 8 6-8z"/></svg>',
			javascript: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#ffca28" d="M2 2v12h12V2zm6 6h1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1h1v1h1zm3 0h2v1h-2v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-1h2v-1h-1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1"/></svg>',
			typescript: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#0288d1" d="M2 2v12h12V2zm4 6h3v1H8v4H7V9H6zm5 0h2v1h-2v1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-2v-1h2v-1h-1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1"/></svg>',
			vue: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#41b883" d="M1.8 3.85 12 21.47 22.2 3.94v-.09h-3.96l-6.18 10.62L5.9 3.85z"/><path fill="#35495e" d="m5.9 3.85 6.16 10.62 6.18-10.62h-3.72L12.08 8.03 9.66 3.85z"/></svg>',
			html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#e65100" d="m4 4 2 22 10 2 10-2 2-22Zm19.72 7H11.28l.29 3h11.86l-.8 9.34L15.99 25l-6.64-1.65L8.93 19h3.02l.19 2 3.86.77 3.84-.77.29-4H8.84L8 8h16Z"/></svg>',
			css: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#7e57c2" d="M24 4H4v20a4 4 0 0 0 4 4h16.16A3.84 3.84 0 0 0 28 24.16V8a4 4 0 0 0-4-4m2 14h-2v-2h-2v2c0 .2 0 .7 1.25 1.03A3.35 3.35 0 0 1 26 22v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2Z"/></svg>',
			json: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#f9a825" d="M9 1v2h2a1 1 0 0 1 1 1v1c0 1 .6 1.8 1.5 2.2v1.6A2.4 2.4 0 0 0 12 11v1a1 1 0 0 1-1 1H9v2h2a3 3 0 0 0 3-3v-1a1 1 0 0 1 1-1h1V6h-1a1 1 0 0 1-1-1V4a3 3 0 0 0-3-3zM7 1H5a3 3 0 0 0-3 3v1a1 1 0 0 1-1 1H0v4h1a1 1 0 0 1 1 1v1a3 3 0 0 0 3 3h2v-2H5a1 1 0 0 1-1-1v-1c0-1-.6-1.8-1.5-2.2V7.2A2.4 2.4 0 0 0 4 5V4a1 1 0 0 1 1-1h2z"/></svg>',
			npm: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#e53935" d="M4 4v24h24V4Zm20 20h-4V12h-4v12H8V8h16Z"/></svg>',
			git: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#e64a19" d="M13.17 2.83 11.78 4.22l4.31 4.31A3 3 0 0 0 16 13.62V20a3 3 0 1 0 2 0v-6.38l2.31 2.37A3 3 0 1 0 22 14.12l-2.31-2A3 3 0 0 0 18.83 8l-4-4a4 4 0 0 0-1.66-1.17"/></svg>',
			license: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#ff5722" d="M8 1a5.5 5.5 0 0 0-4 9.26V15l4-1.5 4 1.5v-4.74A5.49 5.49 0 0 0 8 1m0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>'
		};
		const vscodeIconUrl = (key) => `data:image/svg+xml,${encodeURIComponent(VSCODE_ICON_SVG[key] ?? VSCODE_ICON_SVG.file)}`;
		const ICON_MARKERS = Object.fromEntries(Object.keys(VSCODE_ICON_SVG).map((key, index) => [key, String.fromCodePoint(0xe100 + index)]));
		const MARKER_ICONS = Object.fromEntries(Object.entries(ICON_MARKERS).map(([key, marker]) => [marker, key]));

		function fileIconDescriptor(name, kind = "file") {
			if (kind === "dir") return { key: "folder", label: "Folder" };
			const lower = name.toLowerCase();
			if (lower === "package.json" || lower.endsWith("lock.json") || lower.endsWith("lock.yaml")) return { key: "npm", label: "Package" };
			if (lower === "license" || lower.startsWith("license.")) return { key: "license", label: "License" };
			if (lower === ".gitignore" || lower === ".gitattributes" || lower === ".gitmodules") return { key: "git", label: "Git" };
			if (/\.(?:md|mdx)$/i.test(lower)) return { key: "markdown", label: "Markdown" };
			if (/\.(?:js|jsx|mjs|cjs)$/i.test(lower)) return { key: "javascript", label: "JavaScript" };
			if (/\.(?:ts|tsx)$/i.test(lower)) return { key: "typescript", label: "TypeScript" };
			if (/\.vue$/i.test(lower)) return { key: "vue", label: "Vue" };
			if (/\.(?:html|htm)$/i.test(lower)) return { key: "html", label: "HTML" };
			if (/\.(?:css|scss|sass|less)$/i.test(lower)) return { key: "css", label: "Stylesheet" };
			if (/\.(?:json|jsonc|ya?ml|toml|xml|ini|conf|config)$/i.test(lower)) return { key: "json", label: "Configuration" };
			return { key: "file", label: "File" };
		}

		/** Shared icon renderers used by the workspace tree. */
		const icons = {
			chevron: (open) => (0, react_jsx_runtime.jsx)("span", {
				style: {
					display: "inline-flex",
					flex: "none",
					transform: open ? "rotate(90deg)" : "none",
					transition: "transform 120ms ease",
					opacity: 0.7
				},
				children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconTriangleRightFill14, { size: 12 })
			}),
			file: (name, kind = "file") => {
				const descriptor = fileIconDescriptor(name, kind);
				return (0, react_jsx_runtime.jsx)("img", {
					style: drawerStyles.fileIcon,
					title: descriptor.label,
					src: vscodeIconUrl(descriptor.key),
					alt: "",
					"aria-hidden": true,
				});
			}
		};

		/** Right-side panel styles (fills the layout's details column). */
		const drawerStyles = {
			panel: {
				position: "relative",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: "var(--dsw-alias-bg-layer-1)",
				fontSize: "13px"
			},
			overlayPanel: {
				position: "fixed",
				right: 0,
				top: 0,
				bottom: 0,
				width: `min(${DETAILS_MAX_WIDTH}px, calc(100vw - 48px))`,
				height: "auto",
				zIndex: 30,
				pointerEvents: "auto",
				borderLeft: "1px solid var(--dsw-alias-border-l2)",
				boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.18)"
			},
			header: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "8px",
				padding: "10px 12px",
				borderBottom: "1px solid var(--dsw-alias-border-l1)",
				flex: "none"
			},
			headerActions: {
				display: "flex",
				alignItems: "center",
				gap: "6px"
			},
			viewSwitch: {
				display: "flex",
				alignItems: "center",
				padding: 2,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 7,
				background: "var(--dsw-alias-bg-layer-2)"
			},
			viewButton: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: 26,
				height: 24,
				padding: 0,
				border: "none",
				borderRadius: 5,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "13px",
				fontWeight: 500,
				lineHeight: "20px"
			},
			close: {
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: 24,
				height: 24,
				border: "none",
				borderRadius: 6,
				background: "transparent",
				color: "var(--dsw-alias-label-secondary)",
				cursor: "pointer",
				font: "inherit"
			},
			body: {
				flex: 1,
				minHeight: 0,
				display: "flex",
				flexDirection: "row"
			},
			topToggle: {
				position: "fixed",
				top: 12,
				right: 14,
				zIndex: 24,
				pointerEvents: "auto",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: 34,
				height: 34,
				padding: 0,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 9,
				background: "var(--dsw-alias-bg-layer-1)",
				boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
				color: "var(--dsw-alias-label-secondary)",
				cursor: "pointer"
			},
			headerToggle: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: 32,
				height: 32,
				padding: 0,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 9,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer"
			},
			panelIconRight: {
				display: "inline-flex",
				transform: "rotate(180deg)"
			},
			fileIcon: {
				flex: "0 0 18px",
				width: 18,
				height: 18,
				objectFit: "contain"
			},
			wideResizeHandle: {
				position: "absolute", zIndex: 8, left: 0, top: 0, bottom: 0,
				width: 10, cursor: "col-resize", touchAction: "none",
				opacity: 0, background: "transparent", transition: "opacity 120ms ease, background 120ms ease"
			},
			wideResizeHandleActive: {
				opacity: 1,
				background: "transparent",
				borderLeft: "2px solid var(--dsw-alias-brand-primary)"
			},
			tree: {
				flex: "0 0 42%",
				minWidth: 140,
				minHeight: 0,
				overflowY: "auto",
				borderRight: "1px solid var(--dsw-alias-border-l1)",
				padding: "6px 4px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "5px",
				width: "100%",
				boxSizing: "border-box",
				padding: "3px 6px",
				border: "none",
				borderRadius: 6,
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: "var(--oh-my-theme-tree-font-size, 13px)",
				lineHeight: "20px",
				textAlign: "left",
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis"
			},
			rowHover: {
				background: "var(--dsw-alias-interactive-bg-hover)"
			},
			rowSelected: {
				background: "var(--dsw-alias-interactive-bg-active)",
				color: "var(--dsw-alias-label-primary)"
			},
			name: {
				minWidth: 0,
				overflow: "hidden",
				textOverflow: "ellipsis",
				flex: 1
			},
			mdName: {
				color: "var(--dsw-alias-state-business-primary)"
			},
			loading: {
				padding: "4px 10px",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px"
			},
			preview: {
				flex: 1,
				minWidth: 0,
				minHeight: 0,
				overflowY: "auto",
				padding: "10px 14px",
				display: "flex",
				flexDirection: "column",
				gap: "8px"
			},
			markdownPreview: {
				width: "100%",
				maxWidth: 1100,
				margin: "0 auto",
				fontSize: "var(--oh-my-theme-preview-font-size, 14px)",
				fontFamily: "var(--oh-my-theme-preview-font-family)",
				lineHeight: 1.7
			},
			previewCode: {
				margin: 0,
				fontFamily: "var(--oh-my-theme-preview-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
				fontSize: "var(--oh-my-theme-preview-font-size, 14px)",
				lineHeight: "1.6",
				color: "var(--dsw-alias-label-primary)",
				whiteSpace: "pre-wrap",
				wordBreak: "break-all"
			},
			previewHeader: {
				display: "flex",
				alignItems: "center",
				gap: "6px",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px"
			},
			previewPath: {
				flex: 1,
				minWidth: 0,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			empty: {
				padding: "20px 14px",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px"
			},
			error: {
				padding: "8px 14px",
				color: "var(--dsw-alias-state-error-primary)",
				fontSize: "12px",
				lineHeight: "18px",
				wordBreak: "break-all"
			},
			workspaceTabs: {
				display: "flex",
				alignItems: "center",
				gap: 2,
				padding: 2,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 7,
				background: "var(--dsw-alias-bg-layer-2)"
			},
			workspaceTab: {
				display: "inline-flex",
				alignItems: "center",
				gap: 4,
				height: 26,
				padding: "0 8px",
				border: "none",
				borderRadius: 5,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12
			},
			gitSubtabs: {
				display: "flex",
				alignItems: "center",
				gap: 2,
				padding: 2,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 7,
				background: "var(--dsw-alias-bg-layer-2)"
			},
			gitSubtab: {
				display: "inline-flex",
				alignItems: "center",
				height: 26,
				padding: "0 8px",
				border: "none",
				borderRadius: 5,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12
			},
			gitToolbar: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "8px 12px",
				borderBottom: "1px solid var(--dsw-alias-border-l1)",
				color: "var(--dsw-alias-label-secondary)",
				fontSize: 12
			},
			gitToolbarLabel: {
				minWidth: 0,
				flex: 1,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			tabStrip: {
				display: "flex",
				alignItems: "stretch",
				gap: 2,
				overflowX: "auto",
				padding: "0 0 6px",
				borderBottom: "1px solid var(--dsw-alias-border-l1)"
			},
			fileTab: {
				display: "inline-flex",
				alignItems: "center",
				gap: 5,
				flex: "0 0 auto",
				maxWidth: 190,
				height: 28,
				padding: "0 6px 0 8px",
				border: "1px solid transparent",
				borderRadius: 5,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12
			},
			fileTabName: {
				minWidth: 0,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			tabClose: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: 18,
				height: 18,
				padding: 0,
				border: "none",
				borderRadius: 4,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer"
			},
			quickOpenBackdrop: {
				position: "fixed",
				inset: 0,
				zIndex: 80,
				background: "rgba(0, 0, 0, 0.28)",
				display: "flex",
				alignItems: "flex-start",
				justifyContent: "center",
				paddingTop: "12vh"
			},
			quickOpen: {
				width: "min(560px, calc(100vw - 32px))",
				maxHeight: "min(560px, calc(100vh - 96px))",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: 8,
				background: "var(--dsw-alias-bg-layer-1)",
				boxShadow: "0 14px 42px rgba(0, 0, 0, 0.28)"
			},
			quickOpenInput: {
				width: "100%",
				boxSizing: "border-box",
				padding: "12px 14px",
				border: "none",
				borderBottom: "1px solid var(--dsw-alias-border-l1)",
				outline: "none",
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				font: "inherit",
				fontSize: 14
			},
			quickOpenList: {
				minHeight: 0,
				overflowY: "auto",
				padding: 6
			},
			gitAction: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				height: 26,
				padding: "0 8px",
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 6,
				background: "transparent",
				color: "var(--dsw-alias-label-secondary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12
			},
			gitBody: {
				flex: 1,
				minHeight: 0,
				display: "flex",
				flexDirection: "row"
			},
			gitList: {
				flex: "0 0 42%",
				minWidth: 180,
				overflowY: "auto",
				borderRight: "1px solid var(--dsw-alias-border-l1)",
				padding: "6px 4px"
			},
			gitGroupTitle: {
				display: "flex",
				alignItems: "center",
				gap: 6,
				padding: "8px 8px 4px",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: 11,
				fontWeight: 600,
				textTransform: "uppercase",
				letterSpacing: "0.04em"
			},
			gitCount: {
				padding: "1px 5px",
				borderRadius: 8,
				background: "var(--dsw-alias-bg-layer-2)",
				fontSize: 10
			},
			gitRow: {
				display: "flex",
				alignItems: "center",
				gap: 6,
				width: "100%",
				boxSizing: "border-box",
				padding: "5px 7px",
				border: "none",
				borderRadius: 6,
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12,
				textAlign: "left"
			},
			gitTimeline: {
				padding: "8px 8px 12px"
			},
			gitTimelineItem: {
				display: "grid",
				gridTemplateColumns: "18px minmax(0, 1fr)",
				gap: 8,
				minHeight: 58
			},
			gitTimelineRail: {
				position: "relative",
				display: "flex",
				justifyContent: "center"
			},
			gitTimelineLine: {
				position: "absolute",
				top: 11,
				bottom: -8,
				width: 1,
				background: "var(--dsw-alias-border-l2)"
			},
			gitTimelineDot: {
				position: "relative",
				zIndex: 1,
				width: 9,
				height: 9,
				marginTop: 5,
				borderRadius: "50%",
				background: "var(--dsw-alias-brand-primary)",
				boxShadow: "0 0 0 3px var(--dsw-alias-bg-layer-1)"
			},
			gitTimelineContent: {
				minWidth: 0,
				padding: "3px 4px 10px",
				borderBottom: "1px solid var(--dsw-alias-border-l1)"
			},
			gitCommitSubject: {
				display: "block",
				width: "100%",
				padding: 0,
				border: "none",
				background: "transparent",
				color: "var(--dsw-alias-label-primary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 12,
				fontWeight: 500,
				lineHeight: "18px",
				textAlign: "left",
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			gitCommitMeta: {
				display: "flex",
				alignItems: "center",
				gap: 6,
				marginTop: 3,
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: 11,
				overflow: "hidden"
			},
			gitCommitDate: {
				marginLeft: "auto",
				flex: "none",
				whiteSpace: "nowrap"
			},
			gitRefBadge: {
				display: "inline-flex",
				maxWidth: 150,
				padding: "1px 5px",
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 4,
				color: "var(--dsw-alias-state-business-primary)",
				fontSize: 10,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			gitRowMeta: {
				flex: "none",
				color: "var(--dsw-alias-label-tertiary)",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
				fontSize: 11
			},
			gitRowPath: {
				minWidth: 0,
				flex: 1,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap"
			},
			gitStatusCode: {
				flex: "none",
				minWidth: 20,
				color: "var(--dsw-alias-state-business-primary)",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
				fontSize: 11,
				fontWeight: 600
			},
			gitDetail: {
				flex: 1,
				minWidth: 0,
				overflowY: "auto",
				padding: "10px 14px"
			},
			gitDetailHeader: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				paddingBottom: 8,
				color: "var(--dsw-alias-label-secondary)",
				fontSize: 12
			},
			gitDetailTitle: {
				minWidth: 0,
				flex: 1,
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
				color: "var(--dsw-alias-label-primary)",
				fontWeight: 500
			},
			gitDiffMode: {
				display: "inline-flex",
				gap: 2,
				padding: 2,
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: 6,
				background: "var(--dsw-alias-bg-layer-2)"
			},
			gitDiffModeButton: {
				height: 23,
				padding: "0 6px",
				border: "none",
				borderRadius: 4,
				background: "transparent",
				color: "var(--dsw-alias-label-tertiary)",
				cursor: "pointer",
				font: "inherit",
				fontSize: 11
			}
		};

		/** One lazy tree row; directories expand on demand through the actions. */
		function TreeNode({ entry, depth, state, onToggleDir, onSelectFile, t }) {
			const paddingLeft = 8 + depth * 14;
			if (entry.kind === "dir") {
				const open = state.expanded[entry.relative] === true;
				const loaded = state.dirs[entry.relative];
				const isLoading = state.loadingDirs[entry.relative] === true;
				return (0, react_jsx_runtime.jsxs)("div", {
					children: [
						(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => onToggleDir(entry.relative),
							style: { ...drawerStyles.row, paddingLeft },
							children: [
								icons.chevron(open),
								icons.file(entry.name, "dir"),
								(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.name, children: entry.name })
							]
						}),
						open && (0, react_jsx_runtime.jsxs)("div", {
							children: loaded !== undefined
								? loaded.map((child) => (0, react_jsx_runtime.jsx)(TreeNode, {
									entry: child,
									depth: depth + 1,
									state,
									onToggleDir,
									onSelectFile,
									t
								}, child.relative))
								: (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.loading, children: isLoading ? t("files.loading") : "" })
						})
					]
				});
			}
			const isMd = entry.name.toLowerCase().endsWith(".md");
			const selected = state.preview?.relative === entry.relative;
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelectFile(entry.relative),
				title: entry.relative,
				"aria-current": selected ? "page" : undefined,
				style: {
					...drawerStyles.row,
					...(selected ? drawerStyles.rowSelected : {}),
					paddingLeft: paddingLeft + 12
				},
				children: [
					icons.file(entry.name),
					(0, react_jsx_runtime.jsx)("span", {
						style: {
							...drawerStyles.name,
							...(isMd ? drawerStyles.mdName : {})
						},
						children: entry.name
					})
				]
			});
		}

		function formatCommitDate(value) {
			const date = new Date(value);
			return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
		}

		/** Trim transport line breaks before sending a commit id back to the host. */
		function normalizeClientCommitHash(value) {
			const hash = typeof value === "string" ? value.trim() : "";
			return /^[0-9a-f]{7,64}$/i.test(hash) ? hash : null;
		}

		/** Convert one or more unified diffs to the shape of dsh's DiffBlock. */
		function unifiedDiffHunks(content, fallbackPath) {
			const hunks = [];
			const lines = String(content).split("\n");
			let currentPath = fallbackPath ?? "diff";
			let oldLines = [];
			let newLines = [];
			let oldNull = false;
			let newNull = false;
			let inHunk = false;
			const flush = () => {
				if (!inHunk || (oldLines.length === 0 && newLines.length === 0)) return;
				hunks.push({
					path: currentPath,
					oldText: oldNull ? null : `${oldLines.join("\n")}${oldLines.length ? "\n" : ""}`,
					newText: newNull ? "" : `${newLines.join("\n")}${newLines.length ? "\n" : ""}`
				});
				oldLines = [];
				newLines = [];
				oldNull = false;
				newNull = false;
			};
			for (const line of lines) {
				if (line.startsWith("diff --git ")) {
					flush();
					const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
					currentPath = match?.[2] ?? fallbackPath ?? "diff";
					inHunk = false;
					continue;
				}
				if (line.startsWith("--- ")) {
					oldNull = line.slice(4).trim() === "/dev/null";
					continue;
				}
				if (line.startsWith("+++ ")) {
					const headerPath = line.slice(4).trim();
					newNull = headerPath === "/dev/null";
					if (headerPath.startsWith("b/")) currentPath = headerPath.slice(2);
					continue;
				}
				if (line.startsWith("@@")) {
					flush();
					inHunk = true;
					continue;
				}
				if (!inHunk || line.startsWith("\\")) continue;
				if (line.startsWith("-")) oldLines.push(line.slice(1));
				else if (line.startsWith("+")) newLines.push(line.slice(1));
				else if (line.startsWith(" ")) {
					const context = line.slice(1);
					oldLines.push(context);
					newLines.push(context);
				}
			}
			flush();
			return hunks;
		}

		function GitDiffPreview({ t, diff, title, emptyLabel }) {
			if (diff === null) {
				return (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: emptyLabel ?? t("git.noDiff") });
			}
			return (0, react_jsx_runtime.jsxs)("div", {
				style: { ...drawerStyles.gitDetail, padding: 0 },
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.gitDetailHeader,
						children: [
							(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitDetailTitle, title, children: title }),
							diff.truncated && (0, react_jsx_runtime.jsx)("span", { children: t("files.truncated") })
						]
					}),
						diff.content === ""
						? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("git.noDiff") })
						: (() => {
							const hunks = unifiedDiffHunks(diff.content, title);
							return hunks.length > 0
								? (0, react_jsx_runtime.jsx)(_ui_primitives.DiffBlock, { diffs: hunks, maxLines: 32 })
								: (0, react_jsx_runtime.jsx)("div", {
									style: drawerStyles.markdownPreview,
									"data-oh-my-theme-git-diff": true,
									children: (0, react_jsx_runtime.jsx)(_ui_primitives.MarkdownText, {
										text: codeMarkdown(diff.content, "diff"),
										streaming: false,
										codeLabels: { copyLabel: t("files.copyCode"), copiedLabel: t("files.copiedCode") }
									})
								});
						})()
				]
			});
		}

		function GitChangesView({ t, status, loading, error, onRefresh, onSelectFile, selectedPath, diff, diffMode, onDiffMode }) {
			const groups = [
				{ key: "staged", label: t("git.staged"), rows: status?.files?.filter((row) => row.staged) ?? [] },
				{ key: "unstaged", label: t("git.unstaged"), rows: status?.files?.filter((row) => row.unstaged && !row.untracked) ?? [] },
				{ key: "untracked", label: t("git.untracked"), rows: status?.files?.filter((row) => row.untracked) ?? [] }
			];
			return (0, react_jsx_runtime.jsxs)("div", {
				style: drawerStyles.gitBody,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: { ...drawerStyles.gitList, ...(selectedPath === null ? { flex: "1 1 100%", borderRight: "none" } : {}) },
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								style: drawerStyles.gitToolbar,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										style: drawerStyles.gitToolbarLabel,
										children: status?.detached
											? t("git.detached")
											: `${t("git.branch")}: ${status?.branch ?? "-"}${status?.branches?.length > 1 ? ` · ${status.branches.length}` : ""}`
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: drawerStyles.gitAction,
										onClick: onRefresh,
										disabled: loading,
										children: t("git.refresh")
									})
								]
							}),
							loading && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.loading, children: t("files.loading") }),
							error !== null && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.error, children: error }),
						!loading && error === null && status === null
								&& (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.noSession") }),
						!loading && error === null && status !== null && groups.every((group) => group.rows.length === 0)
								&& (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("git.noChanges") }),
							...groups.map((group) => group.rows.length === 0 ? null : (0, react_jsx_runtime.jsxs)("div", {
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										style: drawerStyles.gitGroupTitle,
										children: [(0, react_jsx_runtime.jsx)("span", { children: group.label }), (0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitCount, children: group.rows.length })]
									}),
									...group.rows.map((row) => (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onSelectFile(row.relative, row.unstaged || row.untracked ? "working" : "staged"),
										style: {
											...drawerStyles.gitRow,
											...(selectedPath === row.relative ? drawerStyles.rowSelected : {})
										},
										children: [
											(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitStatusCode, children: row.code }),
											(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitRowPath, title: row.relative, children: row.relative })
										]
									}, `${group.key}:${row.relative}`))
								]
							}, group.key))
						]
					}),
					selectedPath !== null && (0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.gitDetail,
						children: [
							selectedPath !== null && (0, react_jsx_runtime.jsxs)("div", {
								style: drawerStyles.gitDetailHeader,
								children: [
									(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitDetailTitle, title: selectedPath, children: selectedPath }),
									(0, react_jsx_runtime.jsxs)("div", {
										style: drawerStyles.gitDiffMode,
										children: [
											[["working", t("git.working")], ["staged", t("git.index")]].map(([value, label]) => (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => onDiffMode(value),
												style: {
													...drawerStyles.gitDiffModeButton,
													...(diffMode === value ? { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)" } : {})
												},
												children: label
											}, value))
										]
									})
								]
							}),
							(0, react_jsx_runtime.jsx)(GitDiffPreview, { t, diff, title: selectedPath, emptyLabel: t("git.noDiff") })
						]
					})
				]
			});
		}

		function GitCommitsView({ t, commits, loading, error, hasMore, selectedCommit, commit, diff, selectedPath, onRefresh, onSelectCommit, onLoadMore, onSelectFile }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: drawerStyles.gitBody,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: { ...drawerStyles.gitList, ...(commit === null ? { flex: "1 1 100%", borderRight: "none" } : {}) },
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								style: drawerStyles.gitToolbar,
								children: [
									(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitToolbarLabel, children: t("git.timeline") }),
									(0, react_jsx_runtime.jsx)("button", { type: "button", style: drawerStyles.gitAction, onClick: onRefresh, disabled: loading, children: t("git.refresh") })
								]
							}),
							loading && commits.length === 0 && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.loading, children: t("files.loading") }),
							error !== null && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.error, children: error }),
						!loading && error === null && commits.length === 0 && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("git.noCommits") }),
						(0, react_jsx_runtime.jsx)("div", {
							style: drawerStyles.gitTimeline,
							children: commits.map((item, index) => (0, react_jsx_runtime.jsxs)("div", {
								style: drawerStyles.gitTimelineItem,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										style: drawerStyles.gitTimelineRail,
										children: [
											index < commits.length - 1 && (0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitTimelineLine }),
											(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitTimelineDot })
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										style: { ...drawerStyles.gitTimelineContent, ...(selectedCommit?.hash === item.hash ? { background: "var(--dsw-alias-interactive-bg-active)", borderRadius: 6, padding: "5px 7px 10px" } : {}) },
										children: [
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => onSelectCommit(item.hash),
												style: drawerStyles.gitCommitSubject,
												title: item.subject,
												children: item.subject
											}),
											(0, react_jsx_runtime.jsxs)("div", {
												style: drawerStyles.gitCommitMeta,
												children: [
													(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitRowMeta, children: item.shortHash }),
													...((item.refs ?? []).slice(0, 2).map((ref) => (0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitRefBadge, title: ref, children: ref }, ref))),
													(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitCommitDate, children: formatCommitDate(item.date) })
												]
											})
										]
									})
								]
							}, item.hash))
						}),
						hasMore && (0, react_jsx_runtime.jsx)("button", { type: "button", style: { ...drawerStyles.gitAction, margin: 8 }, onClick: onLoadMore, disabled: loading, children: t("git.loadMore") })
						]
					}),
					commit !== null && (0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.gitDetail,
						children: [
								(0, react_jsx_runtime.jsxs)("div", {
									style: drawerStyles.gitDetailHeader,
									children: [
										(0, react_jsx_runtime.jsxs)("span", {
											style: drawerStyles.gitDetailTitle,
											title: commit.subject,
											children: [commit.subject, " · ", commit.shortHash]
										}),
										(0, react_jsx_runtime.jsx)("span", { children: formatCommitDate(commit.date) })
									]
								}),
								(0, react_jsx_runtime.jsxs)("div", { style: drawerStyles.gitToolbar, children: [commit.author || t("git.authorUnknown"), " · ", t("git.commitFiles"), " ", commit.files.length] }),
								...commit.files.map((file) => (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => onSelectFile(file.relative),
									style: { ...drawerStyles.gitRow, ...(selectedPath === file.relative ? drawerStyles.rowSelected : {}) },
									children: [
										(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitStatusCode, children: file.status }),
										(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.gitRowPath, title: file.relative, children: file.relative })
									]
								}, file.relative)),
								(0, react_jsx_runtime.jsx)(GitDiffPreview, { t, diff, title: selectedPath === null ? t("git.commitDiff") : selectedPath, emptyLabel: t("git.noCommitFile") })
							]
					})
				]
			});
		}

		/** Lightweight command-palette style file opener using the indexed tree. */
		function QuickOpen({ t, files, query, selectedIndex, onQuery, onKeyDown, onSelect, onClose }) {
			const inputRef = (0, _react.useRef)(null);
			(0, _react.useEffect)(() => {
				inputRef.current?.focus?.();
			}, []);
			const matches = rankFiles(files.filter((file) => file.kind === "file"), query, MAX_CANDIDATES);
			return (0, react_jsx_runtime.jsx)("div", {
				style: drawerStyles.quickOpenBackdrop,
				role: "presentation",
				onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); },
				children: (0, react_jsx_runtime.jsxs)("div", {
					style: drawerStyles.quickOpen,
					role: "dialog",
					"aria-label": t("files.quickOpen"),
					onMouseDown: (event) => event.stopPropagation(),
					children: [
						(0, react_jsx_runtime.jsx)("input", {
							ref: inputRef,
							type: "search",
							value: query,
							onChange: (event) => onQuery(event.target.value),
							onKeyDown,
							placeholder: t("files.quickOpenPlaceholder"),
							"aria-label": t("files.quickOpenPlaceholder"),
							style: drawerStyles.quickOpenInput
						}),
						(0, react_jsx_runtime.jsx)("div", {
							style: drawerStyles.quickOpenList,
							role: "listbox",
							children: matches.length === 0
								? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.quickOpenEmpty") })
								: matches.map((file, index) => (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "option",
									"aria-selected": index === selectedIndex,
									onMouseDown: (event) => event.preventDefault(),
									onClick: () => onSelect(file.relative),
									style: { ...drawerStyles.row, ...(index === selectedIndex ? drawerStyles.rowSelected : {}) },
									children: [
										icons.file(basenameOf(file.relative), file.kind),
										(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.name, children: basenameOf(file.relative) }),
										(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.previewPath, title: file.relative, children: dirnameOf(file.relative) })
									]
								}, file.relative))
						})
					]
				})
			});
		}

		/**
		 * The right-side file panel (Codex-style): a project file tree on the
		 * left column, and the opened file's preview on the right column.
		 * Markdown and recognized code files render through the shared Shiki
		 * Markdown component; unknown UTF-8 text files show as plain text.
		 */
		function FileSidePanel({
			t, scope, onClose, onToggleDir, onSelectFile, onSetView, onSetWorkspace, onOpenExternal,
			onQuickOpen, onQuickOpenQuery, onQuickOpenKey, onCloseQuickOpen, onSelectTab, onCloseTab,
			onGitRefresh, onGitSelectFile, onGitDiffMode, onGitRefreshCommits, onGitSelectCommit,
			onGitLoadMore, onGitSelectCommitFile, mode = "details"
		}) {
			// Subscribe to the shared panel scope directly — the slot framework's
			// useScope hook requires a selector, and this component reads the
			// whole snapshot (open/sessionId/dirs/expanded/tabs/preview/error).
			const state = (0, _react.useSyncExternalStore)(scope.subscribe, scope.getSnapshot);
			const panelRef = (0, _react.useRef)(null);
			const [resizeHover, setResizeHover] = (0, _react.useState)(false);
			const [resizeActive, setResizeActive] = (0, _react.useState)(false);
			const [compactHeader, setCompactHeader] = (0, _react.useState)(false);
			const findDetailsFrame = () => {
				const panel = panelRef.current;
				if (panel === null) return null;
				let column = panel.parentElement;
				while (column?.parentElement !== null && getComputedStyle(column.parentElement).display !== "grid") {
					column = column.parentElement;
				}
				return column?.parentElement ?? null;
			};
			const resizePanel = (width) => {
				const panel = panelRef.current;
				if (panel === null) return 0;
				if (mode === "overlay") {
					const maxWidth = Math.max(DETAILS_MIN_WIDTH, Math.min(DETAILS_MAX_WIDTH, window.innerWidth - 48));
					const next = Math.max(DETAILS_MIN_WIDTH, Math.min(maxWidth, Math.round(width)));
					panel.style.setProperty("width", `${next}px`);
					panel.dataset.detailsWidth = String(next);
					return next;
				}
				const frame = findDetailsFrame();
				if (frame === null) return 0;
				const frameWidth = frame.getBoundingClientRect().width;
				const sidebarWidth = frame.firstElementChild?.getBoundingClientRect().width ?? 0;
				const maxWidth = Math.max(DETAILS_MIN_WIDTH, Math.min(
					DETAILS_MAX_WIDTH,
					frameWidth - sidebarWidth - CONVERSATION_MIN_WIDTH
				));
				const next = Math.max(DETAILS_MIN_WIDTH, Math.min(maxWidth, Math.round(width)));
				frame.style.setProperty("grid-template-columns", `${sidebarWidth}px minmax(0, 1fr) ${next}px`, "important");
				panel.dataset.detailsWidth = String(next);
				return next;
			};
			(0, _react.useEffect)(() => {
				if (!state.open) return;
				const frame = mode === "details" ? findDetailsFrame() : null;
				const nativeHandle = frame?.querySelector('[data-side="details"]') ?? null;
				const isNativeHandle = typeof HTMLElement !== "undefined" && nativeHandle instanceof HTMLElement;
				const previousHandleDisplay = isNativeHandle ? nativeHandle.style.display : "";
				const previousGrid = frame?.style.getPropertyValue("grid-template-columns") ?? "";
				const previousGridPriority = frame?.style.getPropertyPriority("grid-template-columns") ?? "";
				if (isNativeHandle) nativeHandle.style.display = "none";
				const savedWidth = Number(readStorage(DETAILS_WIDTH_KEY));
				if (Number.isFinite(savedWidth) && savedWidth >= DETAILS_MIN_WIDTH) resizePanel(savedWidth);
				return () => {
					if (isNativeHandle) nativeHandle.style.display = previousHandleDisplay;
					if (frame !== null) {
						if (previousGrid === "") frame.style.removeProperty("grid-template-columns");
						else frame.style.setProperty("grid-template-columns", previousGrid, previousGridPriority);
					}
				};
			}, [state.open, mode]);
			(0, _react.useEffect)(() => {
				if (!state.open) return;
				const update = () => {
					const width = panelRef.current?.getBoundingClientRect().width ?? 0;
					setCompactHeader(width > 0 && width < 430);
				};
				update();
				if (typeof ResizeObserver === "undefined" || panelRef.current === null) return;
				const observer = new ResizeObserver(update);
				observer.observe(panelRef.current);
				return () => observer.disconnect();
			}, [state.open, mode]);
			const startResize = (event) => {
				event.preventDefault();
				setResizeActive(true);
				const startX = event.clientX;
				const startWidth = panelRef.current?.getBoundingClientRect().width ?? 360;
				const move = (moveEvent) => resizePanel(startWidth + startX - moveEvent.clientX);
				const end = (upEvent) => {
					const width = resizePanel(startWidth + startX - upEvent.clientX);
					if (width > 0) writeStorage(DETAILS_WIDTH_KEY, String(width));
					setResizeActive(false);
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", end);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", end);
			};
			if (!state.open) return null;
			const rootRows = state.dirs[""];
			const preview = state.preview;
			const tabs = Array.isArray(state.tabs) ? state.tabs : [];
			const viewMode = state.viewMode ?? "tree";
			const workspaceMode = state.workspaceMode ?? "files";
			const showTree = viewMode !== "preview";
			const showPreview = viewMode !== "tree";
			const split = showTree && showPreview;
			const tabStrip = tabs.length === 0 ? null : (0, react_jsx_runtime.jsx)("div", {
				style: drawerStyles.tabStrip,
				role: "tablist",
				children: tabs.map((tab) => (0, react_jsx_runtime.jsxs)("div", {
					style: {
						...drawerStyles.fileTab,
						...(tab.id === state.activeTabId ? {
							background: "var(--dsw-alias-bg-layer-2)",
							borderColor: "var(--dsw-alias-border-l1)",
							color: "var(--dsw-alias-label-primary)"
						} : {})
					},
					role: "tab",
					"aria-selected": tab.id === state.activeTabId,
					title: tab.relative,
					onClick: () => onSelectTab?.(tab.id),
					children: [
						icons.file(basenameOf(tab.relative), "file"),
						(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.fileTabName, children: basenameOf(tab.relative) }),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: drawerStyles.tabClose,
							"aria-label": `${t("files.close")} ${basenameOf(tab.relative)}`,
							title: t("files.close"),
							onClick: (event) => { event.stopPropagation(); onCloseTab?.(tab.id); },
							children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconCloseOutline16, { size: 12 })
						})
					]
				}, tab.id))
			});
			const treeContent = state.sessionId === null
				? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.empty") })
				: rootRows === undefined
					? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.loading, children: t("files.loading") })
					: rootRows.length === 0
						? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.emptyTree") })
						: rootRows.map((entry) => (0, react_jsx_runtime.jsx)(TreeNode, {
							entry,
							depth: 0,
							state,
							onToggleDir,
							onSelectFile,
							t
						}, entry.relative));
			const previewContent = preview === null
				? [tabStrip, (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.noPreview") })]
				: [
					tabStrip,
					(0, react_jsx_runtime.jsx)("div", {
						style: drawerStyles.previewHeader,
					children: [
						(0, react_jsx_runtime.jsx)("span", { children: t("files.previewTitle") }),
						(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.previewPath, children: preview.relative }),
						onOpenExternal !== undefined && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onOpenExternal(preview.relative),
							style: drawerStyles.close,
							title: t("files.openExternal"),
							"aria-label": t("files.openExternal"),
							children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconRightUpOutline16, { size: 14 })
						})
					]
					}),
					preview.kind === "markdown" || preview.kind === "code"
						? (0, react_jsx_runtime.jsx)("div", {
						style: drawerStyles.markdownPreview,
						"data-oh-my-theme-preview": true,
							children: (0, react_jsx_runtime.jsx)(_ui_primitives.MarkdownText, {
								text: preview.kind === "code" ? codeMarkdown(preview.content, preview.language) : preview.content,
								streaming: false,
								codeLabels: {
									copyLabel: t("files.copyCode"),
									copiedLabel: t("files.copiedCode")
								}
							})
						})
						: (0, react_jsx_runtime.jsx)("pre", {
						style: drawerStyles.previewCode,
						"data-oh-my-theme-preview": true,
							children: preview.content
						}),
					preview.truncated && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.truncated") })
				];
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				style: {
					...drawerStyles.panel,
					...(mode === "overlay" ? drawerStyles.overlayPanel : {})
				},
				"data-oh-my-theme-file-panel": true,
				"data-view-mode": viewMode,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						role: "separator",
						"aria-orientation": "vertical",
						"aria-label": "调整侧边面板宽度",
						"data-oh-my-theme-resize": true,
					style: {
						...drawerStyles.wideResizeHandle,
						...(resizeHover || resizeActive ? drawerStyles.wideResizeHandleActive : {})
					},
					onPointerDown: startResize,
					onPointerEnter: () => setResizeHover(true),
					onPointerLeave: () => setResizeHover(false)
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: compactHeader ? { ...drawerStyles.header, padding: "6px 7px", gap: 4 } : drawerStyles.header,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								style: compactHeader ? { ...drawerStyles.headerActions, gap: 3, minWidth: 0 } : drawerStyles.headerActions,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										style: compactHeader ? { ...drawerStyles.workspaceTabs, padding: 1, gap: 1 } : drawerStyles.workspaceTabs,
										role: "tablist",
										children: [
											["files", _ui_primitives.IconFolderOpenOutline16, "git.files"],
											["git", _ui_primitives.IconPanelLeftOutline16, "git.git"]
										].map(([value, Icon, label]) => (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => onSetWorkspace?.(value === "git" ? "changes" : "files"),
											role: "tab",
											"aria-selected": value === "files" ? workspaceMode === "files" : workspaceMode !== "files",
											title: t(label),
											style: {
												...drawerStyles.workspaceTab,
												...(compactHeader ? { width: 27, padding: 0, gap: 0, justifyContent: "center" } : {}),
												...(value === "files" ? workspaceMode === "files" : workspaceMode !== "files")
													? { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)" }
													: {}
											},
											children: [(0, react_jsx_runtime.jsx)(Icon, { size: 14 }), !compactHeader && (0, react_jsx_runtime.jsx)("span", { children: t(label) })]
										}, value))
									}),
									workspaceMode !== "files" && (0, react_jsx_runtime.jsxs)("div", {
										style: compactHeader ? { ...drawerStyles.gitSubtabs, padding: 1, gap: 1 } : drawerStyles.gitSubtabs,
										role: "tablist",
										children: [
											["changes", _ui_primitives.IconPanelLeftOutline16, "git.changes"], ["commits", _ui_primitives.IconBrowseOutline16, "git.commits"]
										].map(([value, Icon, label]) => (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => onSetWorkspace?.(value),
											role: "tab",
											"aria-selected": workspaceMode === value,
											title: t(label),
											style: {
												...drawerStyles.gitSubtab,
												...(compactHeader ? { width: 27, padding: 0, justifyContent: "center" } : {}),
												...(workspaceMode === value ? { background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)" } : {})
											},
											children: [
												(0, react_jsx_runtime.jsx)(Icon, { size: 14 }),
												!compactHeader && t(label)
											]
										}, value))
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								style: compactHeader ? { ...drawerStyles.headerActions, gap: 3, minWidth: 0 } : drawerStyles.headerActions,
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: onQuickOpen,
										"aria-label": t("files.quickOpen"),
										title: t("files.quickOpen"),
										style: drawerStyles.close,
										children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconBrowseOutline16, { size: 16 })
									}),
									(0, react_jsx_runtime.jsx)("div", {
									style: drawerStyles.viewSwitch,
										role: "group",
										"aria-label": t("files.title"),
										children: [
											["tree", _ui_primitives.IconFolderOpenOutline16, "files.viewTree"],
											["split", _ui_primitives.IconPanelLeftOutline16, "files.viewSplit"],
											["preview", _ui_primitives.IconBrowseOutline16, "files.viewPreview"]
										].map(([value, Icon, label]) => (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => onSetView(value),
											"aria-label": t(label),
											title: t(label),
											"aria-pressed": viewMode === value,
											style: {
												...drawerStyles.viewButton,
												...(viewMode === value ? {
													background: "var(--dsw-alias-bg-layer-1)",
													color: "var(--dsw-alias-label-primary)"
												} : {})
											},
											children: (0, react_jsx_runtime.jsx)(Icon, { size: 16 })
										}, value))
									}),
									(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onClose,
								"aria-label": t("files.close"),
								title: t("files.close"),
								style: drawerStyles.close,
								children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconCloseOutline16, { size: 14 })
									})
								]
							})
						]
					}),
					!state.remoteReady && (0, react_jsx_runtime.jsx)("div", {
						style: drawerStyles.error,
						children: t("files.remotePending")
					}),
					state.error !== null && (0, react_jsx_runtime.jsx)("div", {
						style: drawerStyles.error,
						children: `${t("files.error")} ${state.error}`
					}),
					workspaceMode === "files" && (0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.body,
						children: [
							showTree && (0, react_jsx_runtime.jsx)("div", {
								"data-oh-my-theme-tree": true,
								style: {
									...drawerStyles.tree,
									flex: split ? drawerStyles.tree.flex : "1 1 100%",
									borderRight: split ? drawerStyles.tree.borderRight : "none"
								},
								children: treeContent
							}),
							showPreview && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.preview, "data-oh-my-theme-preview": true, children: previewContent })
						]
					}),
					workspaceMode === "changes" && (0, react_jsx_runtime.jsx)(GitChangesView, {
						t,
						status: state.gitStatus,
						loading: state.gitStatusLoading,
						error: state.gitError,
						onRefresh: onGitRefresh,
						onSelectFile: onGitSelectFile,
						selectedPath: state.gitSelectedPath,
						diff: state.gitDiff,
						diffMode: state.gitDiffMode,
						onDiffMode: onGitDiffMode
					}),
					workspaceMode === "commits" && (0, react_jsx_runtime.jsx)(GitCommitsView, {
						t,
						commits: state.gitCommits,
						loading: state.gitCommitsLoading,
						error: state.gitError,
						hasMore: state.gitCommitsHasMore,
						selectedCommit: state.gitSelectedCommit,
						commit: state.gitCommit,
						diff: state.gitCommitDiff,
						selectedPath: state.gitCommitSelectedPath,
						onRefresh: onGitRefreshCommits,
						onSelectCommit: onGitSelectCommit,
						onLoadMore: onGitLoadMore,
						onSelectFile: onGitSelectCommitFile
					}),
					state.quickOpen?.open === true && (0, react_jsx_runtime.jsx)(QuickOpen, {
						t,
						files: state.fileIndex ?? [],
						query: state.quickOpen.query,
						selectedIndex: state.quickOpen.selectedIndex,
						onQuery: onQuickOpenQuery,
						onKeyDown: onQuickOpenKey,
						onSelect: (relative) => { onCloseQuickOpen?.(); void onSelectFile(relative); },
						onClose: onCloseQuickOpen
					})
				]
			});
		}

		/** Session-header launcher; blank sessions use the floating fallback. */
		function FileTreeButton({ t, scope, onToggle, sessions, floating = false }) {
			const state = (0, _react.useSyncExternalStore)(scope.subscribe, scope.getSnapshot);
			const sessionList = sessions === undefined
				? null
				: (0, _react.useSyncExternalStore)(sessions.list.subscribe, sessions.list.getSnapshot);
			if (state.open) return null;
			if (floating && sessionList?.byId?.[sessionList.current]?.blank === false) return null;
			return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onToggle,
				title: t("files.toggle"),
				"aria-label": t("files.toggle"),
				"aria-pressed": state.open,
				style: floating ? drawerStyles.topToggle : drawerStyles.headerToggle,
				children: (0, react_jsx_runtime.jsx)("span", {
					style: drawerStyles.panelIconRight,
					children: (0, react_jsx_runtime.jsx)(_ui_primitives.IconPanelLeftOutline16, { size: 18 })
				})
			});
		}
		//#endregion

		//#region dsh-oh-my-theme: client plugin body
		/**
		 * Required services: theme runtime (skins), slots/locale (UI), the
		 * input trigger registry (@ mentions), sessions (current workspace),
		 * and the Typert remote transport for the host file service.
		 */
		const inject = [
			"slots",
			"locale",
			"theme",
			"inputTriggers",
			"sessions",
			"connection",
			"remote",
			"layout",
			"workspaces"
		];

		/**
		 * Client plugin body: register the curated skins, restore the saved
		 * skin, mount the workspaceFiles remote, register the @-mention source,
		 * and mount the Session-header file workspace panel.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			// ---- theme --------------------------------------------------------
			const initialDisplayPreferences = readDisplayPreferences();
			applyDisplayPreferences(initialDisplayPreferences);
			ctx.effect(() => () => {
				if (typeof document === "undefined") return;
				for (const name of [
					"--oh-my-theme-conversation-font-size",
					"--oh-my-theme-tree-font-size",
					"--oh-my-theme-preview-font-size",
					"--oh-my-theme-preview-font-family"
				]) document.documentElement?.style?.removeProperty(name);
				document.getElementById?.(DISPLAY_STYLE_ID)?.remove();
			}, "dsh-oh-my-theme: display preferences");
			const disposers = SKINS.map((skinDefinition) => ctx.theme.register(skinDefinition));
			ctx.effect(() => () => {
				for (const dispose of disposers) dispose();
			}, "dsh-oh-my-theme: theme registration");

			const saved = readSavedSkin();
			if (typeof saved === "string" && saved !== DEFAULT_SKIN && SKINS.some((skinDefinition) => skinDefinition.id === saved)) {
				const current = ctx.theme.getTheme().preference;
				if (current !== saved) ctx.theme.setTheme(saved);
			}

			const store = createThemeStore();
			let bound;
			const sync = (snapshot) => {
				bound?.sync(snapshot.preference, snapshot.revision);
			};
			ctx.on("theme/change", sync);

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "dsh-oh-my-theme: dictionaries");

			let previewBase = null;
			const themeInjected = (actions) => {
				bound = actions;
				sync(ctx.theme.getTheme());
				return {
					setSkin: (id) => {
						previewBase = null;
						ctx.theme.setTheme(id);
						writeSavedSkin(id);
					},
					previewSkin: (id) => {
						previewBase = ctx.theme.getTheme().preference;
						if (previewBase !== id) ctx.theme.setTheme(id);
					},
					restoreSkin: () => {
					if (previewBase === null) return;
					ctx.theme.setTheme(previewBase);
					previewBase = null;
				},
				setDisplayPreference: (key, value) => {
					if (!(key in DISPLAY_STORAGE_KEYS)) return;
					const preferences = readDisplayPreferences();
					preferences[key] = value;
					writeStorage(DISPLAY_STORAGE_KEYS[key], String(value));
					applyDisplayPreferences(preferences);
				}
			};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "oh-my-theme",
				order: 20,
				store,
				locale: SETTINGS_NS,
				inject: themeInjected
			}, ThemeRow));

			// ---- remote + shared file panel scope ------------------------------
			let filesRemote;
			let getFileIndex = async () => [];
			const callRemote = async (method, args) => {
				const remote = filesRemote;
				if (remote === undefined) throw new Error("workspaceFiles remote is not mounted");
				const result = await remote[method](...args);
				if (!result.ok) {
					const detail = result.error?.message ?? result.error?.code ?? "unknown error";
					throw new Error(String(detail));
				}
				return result.value;
			};
			const loadGitStatus = async (sessionId = drawerScope.getSnapshot().sessionId) => {
				if (sessionId === null || filesRemote === undefined) return;
				drawerScope.update((d) => {
					d.gitStatusLoading = true;
					d.gitError = null;
				});
				try {
					const status = await callRemote("gitStatus", [sessionId]);
					drawerScope.update((d) => {
						if (d.sessionId !== sessionId) return;
						d.gitStatus = status;
						d.gitStatusLoading = false;
					});
				} catch (error) {
					drawerScope.update((d) => {
						if (d.sessionId !== sessionId) return;
						d.gitStatusLoading = false;
						d.gitStatus = null;
						d.gitError = error instanceof Error ? error.message : String(error);
					});
				}
			};
			const loadGitDiff = async (relative, mode = "working") => {
				const sessionId = drawerScope.getSnapshot().sessionId;
				if (sessionId === null || filesRemote === undefined || relative === null) return;
				drawerScope.update((d) => {
					d.gitSelectedPath = relative;
					d.gitDiffMode = mode;
					d.gitDiff = null;
					d.gitError = null;
				});
				try {
					const diff = await callRemote("gitDiff", [sessionId, relative, mode]);
					drawerScope.update((d) => {
						if (d.sessionId === sessionId && d.gitSelectedPath === relative && d.gitDiffMode === mode) d.gitDiff = diff;
					});
				} catch (error) {
					drawerScope.update((d) => {
						if (d.sessionId !== sessionId || d.gitSelectedPath !== relative) return;
						d.gitError = error instanceof Error ? error.message : String(error);
					});
				}
			};
			const loadGitLog = async ({ append = false } = {}) => {
				const sessionId = drawerScope.getSnapshot().sessionId;
				if (sessionId === null || filesRemote === undefined) return;
				const snapshot = drawerScope.getSnapshot();
				const skip = append ? snapshot.gitCommitsSkip : 0;
				drawerScope.update((d) => {
					d.gitCommitsLoading = true;
					if (!append) {
						d.gitCommits = [];
						d.gitCommitsSkip = 0;
						d.gitCommitsHasMore = false;
						d.gitSelectedCommit = null;
						d.gitCommit = null;
						d.gitCommitSelectedPath = null;
						d.gitCommitDiff = null;
					}
					d.gitError = null;
				});
				try {
					const result = await callRemote("gitLog", [sessionId, skip, 20]);
					drawerScope.update((d) => {
						if (d.sessionId !== sessionId) return;
						d.gitCommits = append ? [...d.gitCommits, ...(result.commits ?? [])] : (result.commits ?? []);
						d.gitCommitsSkip = result.nextSkip ?? (skip + (result.commits?.length ?? 0));
						d.gitCommitsHasMore = result.hasMore === true;
						d.gitCommitsLoading = false;
					});
				} catch (error) {
					drawerScope.update((d) => {
						if (d.sessionId !== sessionId) return;
						d.gitCommitsLoading = false;
						d.gitError = error instanceof Error ? error.message : String(error);
					});
				}
			};
			const loadGitCommit = async (hash) => {
				const sessionId = drawerScope.getSnapshot().sessionId;
				const safeHash = normalizeClientCommitHash(hash);
				if (sessionId === null || filesRemote === undefined || safeHash === null) return;
				drawerScope.update((d) => {
					d.gitSelectedCommit = { hash: safeHash };
					d.gitCommit = null;
					d.gitCommitSelectedPath = null;
					d.gitCommitDiff = null;
					d.gitError = null;
				});
				try {
					const commit = await callRemote("gitShow", [sessionId, safeHash]);
					drawerScope.update((d) => {
						if (d.sessionId === sessionId && d.gitSelectedCommit?.hash === safeHash) {
							d.gitSelectedCommit = commit;
							d.gitCommit = commit;
						}
					});
					const diff = await callRemote("gitCommitDiff", [sessionId, safeHash, ""]);
					drawerScope.update((d) => {
						if (d.sessionId === sessionId && d.gitSelectedCommit?.hash === safeHash) d.gitCommitDiff = diff;
					});
				} catch (error) {
					drawerScope.update((d) => {
						if (d.sessionId === sessionId) d.gitError = error instanceof Error ? error.message : String(error);
					});
				}
			};
			const loadGitCommitFileDiff = async (relative) => {
				const snapshot = drawerScope.getSnapshot();
				const sessionId = snapshot.sessionId;
				const hash = normalizeClientCommitHash(snapshot.gitSelectedCommit?.hash);
				if (sessionId === null || filesRemote === undefined || hash === null) return;
				drawerScope.update((d) => {
					d.gitCommitSelectedPath = relative;
					d.gitCommitDiff = null;
					d.gitError = null;
				});
				try {
					const diff = await callRemote("gitCommitDiff", [sessionId, hash, relative]);
					drawerScope.update((d) => {
						if (d.sessionId === sessionId && d.gitSelectedCommit?.hash === hash && d.gitCommitSelectedPath === relative) d.gitCommitDiff = diff;
					});
				} catch (error) {
					drawerScope.update((d) => {
						if (d.sessionId === sessionId) d.gitError = error instanceof Error ? error.message : String(error);
					});
				}
			};

			// The header launcher and both panel presentations share this store.
			const drawerScope = (0, _runtime_client.createSnapshotStore)({
				open: false,
				viewMode: "tree",
				workspaceMode: "files",
				sessionId: null,
				remoteReady: false,
				dirs: {},
				expanded: {},
				loadingDirs: {},
				fileIndex: [],
				quickOpen: { open: false, query: "", selectedIndex: 0 },
				tabs: [],
				activeTabId: null,
				preview: null,
				error: null,
				gitStatus: null,
				gitStatusLoading: false,
				gitCommits: [],
				gitCommitsLoading: false,
				gitCommitsHasMore: false,
				gitCommitsSkip: 0,
				gitSelectedCommit: null,
				gitCommit: null,
				gitCommitSelectedPath: null,
				gitDiff: null,
				gitDiffMode: "working",
				gitCommitDiff: null,
				gitSelectedPath: null,
				gitError: null
			});
			const sessions = ctx.get("sessions");
			const workspaces = ctx.get("workspaces");
			const originalOpenPath = typeof workspaces?.openPath === "function" ? workspaces.openPath : undefined;
			const currentWorkspacePath = (relative) => {
				const snapshot = sessions?.list.getSnapshot();
				const cwd = snapshot?.current === undefined ? undefined : snapshot.byId?.[snapshot.current]?.cwd;
				if (typeof cwd !== "string" || cwd === "") return undefined;
				const root = cwd.replace(/[\\/]+$/, "");
				return relative === "" ? root : `${root}/${relative.replace(/^[/\\]+/, "")}`;
			};
			const relativeToCurrentWorkspace = (target) => {
				if (typeof target !== "string" || target === "") return undefined;
				const snapshot = sessions?.list.getSnapshot();
				const cwd = snapshot?.current === undefined ? undefined : snapshot.byId?.[snapshot.current]?.cwd;
				if (typeof cwd !== "string" || cwd === "") return undefined;
				const normalizedRoot = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
				const normalizedTarget = target.replace(/\\/g, "/");
				if (!normalizedTarget.startsWith(`${normalizedRoot}/`)) return undefined;
				const relative = normalizedTarget.slice(normalizedRoot.length + 1);
				if (relative === "" || relative.split("/").some((part) => part === "..")) return undefined;
				return relative;
			};

			const loadDir = async (relPath, sessionId) => {
				if (filesRemote === undefined) {
					// Remote not mounted yet — leave the level unloaded so the
					// mount effect can retry; the panel shows the pending hint.
					drawerScope.update((d) => {
						d.loadingDirs[relPath] = false;
					});
					return;
				}
				drawerScope.update((d) => {
					d.loadingDirs[relPath] = true;
					d.error = null;
				});
				try {
					const rows = await callRemote("listDir", [sessionId, relPath]);
					drawerScope.update((d) => {
						d.dirs[relPath] = rows;
						d.loadingDirs[relPath] = false;
					});
				} catch (error) {
					drawerScope.update((d) => {
						d.loadingDirs[relPath] = false;
						d.dirs[relPath] = d.dirs[relPath] ?? [];
						d.error = error instanceof Error ? error.message : String(error);
					});
				}
			};

			const refreshTree = async (sessionId) => {
				drawerScope.update((d) => {
					d.sessionId = sessionId;
					d.workspaceMode = "files";
					d.dirs = {};
					d.expanded = {};
					d.fileIndex = [];
					d.quickOpen = { open: false, query: "", selectedIndex: 0 };
					d.tabs = [];
					d.activeTabId = null;
					d.preview = null;
					d.viewMode = "tree";
					d.error = null;
					d.gitStatus = null;
					d.gitStatusLoading = false;
					d.gitCommits = [];
					d.gitCommitsLoading = false;
					d.gitCommitsHasMore = false;
					d.gitCommitsSkip = 0;
					d.gitSelectedCommit = null;
					d.gitCommit = null;
					d.gitCommitSelectedPath = null;
					d.gitDiff = null;
					d.gitDiffMode = "working";
					d.gitCommitDiff = null;
					d.gitSelectedPath = null;
					d.gitError = null;
				});
				if (sessionId !== null) {
					await loadDir("", sessionId);
					void loadGitStatus(sessionId);
				}
			};

			// ---- remote: workspaceFiles ---------------------------------------
			ctx.effect(async () => {
				const dispose = await ctx.remote.$mount(OHMY_REMOTE);
				filesRemote = ctx.reflect.get("remote.workspaceFiles");
				if (filesRemote === undefined) {
					console.error("dsh-oh-my-theme: workspaceFiles remote did not mount");
				} else {
					console.log("[dsh-oh-my-theme] workspaceFiles remote mounted");
				}
				drawerScope.update((d) => {
					d.remoteReady = filesRemote !== undefined;
				});
				// Retry the root if a session already exists and the level never
				// loaded while the remote was still mounting.
				const snapshot = drawerScope.getSnapshot();
				if (filesRemote !== undefined && snapshot.sessionId !== null && snapshot.dirs[""] === undefined) {
					void loadDir("", snapshot.sessionId);
				}
				if (filesRemote !== undefined && snapshot.sessionId !== null && snapshot.gitStatus === null) {
					void loadGitStatus(snapshot.sessionId);
				}
				return () => {
					filesRemote = undefined;
					drawerScope.update((d) => {
						d.remoteReady = false;
					});
					void dispose();
				};
			}, "dsh-oh-my-theme: remote");

			// Keep the panel's sessionId in sync with the current session.
			let handlePanelSessionChange;
			ctx.effect(() => {
				if (sessions === undefined) return;
				const syncSession = () => {
					const id = sessions.list.getSnapshot().current ?? null;
					if (handlePanelSessionChange === undefined) {
						if (id !== drawerScope.getSnapshot().sessionId) void refreshTree(id);
					} else void handlePanelSessionChange(id);
				};
				syncSession();
				return sessions.list.subscribe(syncSession);
			}, "dsh-oh-my-theme: panel session sync");

			const layout = ctx.get("layout");
			let mountDetailsPanel;
			let mountOverlayPanel;
			let disposeDetailsPanel;
			let disposeOverlayPanel;
			let activePanelMode = null;
			const canUseDetailsColumn = () => {
				if (sessions === undefined) return false;
				const snapshot = sessions.list.getSnapshot();
				const sessionId = snapshot.current;
				return sessionId !== undefined && snapshot.byId?.[sessionId] !== undefined;
			};
			const openPanel = () => {
				activePanelMode = canUseDetailsColumn() ? "details" : "overlay";
				if (activePanelMode === "details") mountDetailsPanel?.();
				else mountOverlayPanel?.();
				drawerScope.update((d) => {
					d.open = true;
				});
				layout?.openDetails?.();
				const snapshot = drawerScope.getSnapshot();
				if (snapshot.sessionId !== null && snapshot.dirs[""] === undefined) {
					void loadDir("", snapshot.sessionId);
				}
			};
			const closePanel = () => {
				drawerScope.update((d) => {
					d.open = false;
				});
				layout?.closeDetails?.();
				disposeDetailsPanel?.();
				disposeOverlayPanel?.();
				disposeDetailsPanel = undefined;
				disposeOverlayPanel = undefined;
				activePanelMode = null;
			};
			const drawerActions = {
				onSetWorkspace: (workspaceMode) => {
					if (!["files", "changes", "commits"].includes(workspaceMode)) return;
					drawerScope.update((d) => {
						d.workspaceMode = workspaceMode;
						d.gitError = null;
					});
					if (workspaceMode === "changes" && drawerScope.getSnapshot().gitStatus === null) void loadGitStatus();
					if (workspaceMode === "commits" && drawerScope.getSnapshot().gitCommits.length === 0) void loadGitLog();
				},
				onGitRefresh: () => loadGitStatus(),
				onGitSelectFile: (relative, mode) => loadGitDiff(relative, mode),
				onGitDiffMode: (mode) => {
					const relative = drawerScope.getSnapshot().gitSelectedPath;
					if (relative !== null) void loadGitDiff(relative, mode);
				},
				onGitRefreshCommits: () => loadGitLog(),
				onGitSelectCommit: (hash) => loadGitCommit(hash),
				onGitLoadMore: () => loadGitLog({ append: true }),
				onGitSelectCommitFile: (relative) => loadGitCommitFileDiff(relative),
				onToggle: () => {
					if (drawerScope.getSnapshot().open) closePanel();
					else openPanel();
				},
				onClose: closePanel,
				onToggleDir: (relPath) => {
					const snapshot = drawerScope.getSnapshot();
					const isOpen = snapshot.expanded[relPath] === true;
					drawerScope.update((d) => {
						if (isOpen) delete d.expanded[relPath];
						else d.expanded[relPath] = true;
					});
					if (!isOpen && snapshot.dirs[relPath] === undefined && snapshot.sessionId !== null) {
						void loadDir(relPath, snapshot.sessionId);
					}
				},
				onSelectFile: async (relPath) => {
					const sessionId = drawerScope.getSnapshot().sessionId;
					if (sessionId === null) return false;
					const tabId = relPath;
					const isMd = /\.(?:md|mdx)$/i.test(relPath);
					const language = isMd ? null : codeLanguageForPath(relPath);
					const snapshot = drawerScope.getSnapshot();
					const existing = snapshot.tabs.find((tab) => tab.id === tabId);
					drawerScope.update((d) => {
						if (d.tabs.find((tab) => tab.id === tabId) === undefined) {
							d.tabs.push({ id: tabId, relative: relPath, content: null, loading: false, error: null, truncated: false, kind: null, language, sessionId });
						}
						d.activeTabId = tabId;
						d.preview = existing?.content === null || existing === undefined ? null : {
							relative: existing.relative, content: existing.content, truncated: existing.truncated,
							kind: existing.kind, language: existing.language
						};
						if (d.viewMode === "tree") d.viewMode = "preview";
						d.error = null;
					});
					if (existing?.content !== null && existing !== undefined) return true;
					if (existing?.loading === true) return true;
					drawerScope.update((d) => {
						const tab = d.tabs.find((item) => item.id === tabId);
						if (tab !== undefined) tab.loading = true;
					});
					try {
						const result = await callRemote("readText", [sessionId, relPath]);
						const content = isMd ? rewriteMarkdownImages(result.content, relPath, sessionId) : result.content;
						drawerScope.update((d) => {
							if (d.sessionId !== sessionId) return;
							const tab = d.tabs.find((item) => item.id === tabId);
							if (tab === undefined) return;
							tab.content = content;
							tab.truncated = result.truncated === true;
							tab.kind = isMd ? "markdown" : language === null ? "text" : "code";
							tab.language = language;
							tab.loading = false;
							tab.error = null;
							if (d.activeTabId === tabId) d.preview = { relative: relPath, content, truncated: tab.truncated, kind: tab.kind, language };
						});
						return true;
					} catch (error) {
						drawerScope.update((d) => {
							const tab = d.tabs.find((item) => item.id === tabId);
							if (tab !== undefined) { tab.loading = false; tab.error = error instanceof Error ? error.message : String(error); }
							if (d.activeTabId === tabId) d.error = error instanceof Error ? error.message : String(error);
						});
						return false;
					}
				},
				onSelectTab: (tabId) => {
					const tab = drawerScope.getSnapshot().tabs.find((item) => item.id === tabId);
					if (tab === undefined) return;
					if (tab.content === null) { void drawerActions.onSelectFile(tab.relative); return; }
					drawerScope.update((d) => {
						d.activeTabId = tabId;
						d.preview = { relative: tab.relative, content: tab.content, truncated: tab.truncated, kind: tab.kind, language: tab.language };
						d.viewMode = "preview";
					});
				},
				onCloseTab: (tabId) => {
					drawerScope.update((d) => {
						const index = d.tabs.findIndex((tab) => tab.id === tabId);
						if (index < 0) return;
						d.tabs.splice(index, 1);
						if (d.activeTabId !== tabId) return;
						const next = d.tabs[index - 1] ?? d.tabs[index] ?? null;
						d.activeTabId = next?.id ?? null;
						d.preview = next?.content === null || next === null ? null : { relative: next.relative, content: next.content, truncated: next.truncated, kind: next.kind, language: next.language };
					});
				},
				onQuickOpen: async () => {
					openPanel();
					drawerScope.update((d) => {
						d.quickOpen = { open: true, query: "", selectedIndex: 0 };
					});
					const sessionId = drawerScope.getSnapshot().sessionId;
					if (sessionId === null) return;
					try {
						const files = await getFileIndex(sessionId);
						drawerScope.update((d) => { if (d.sessionId === sessionId) d.fileIndex = files; });
					} catch (error) {
						drawerScope.update((d) => { d.error = error instanceof Error ? error.message : String(error); });
					}
				},
				onQuickOpenQuery: (query) => drawerScope.update((d) => {
					d.quickOpen.query = query;
					d.quickOpen.selectedIndex = 0;
				}),
				onCloseQuickOpen: () => drawerScope.update((d) => {
					d.quickOpen.open = false;
				}),
				onQuickOpenKey: (event) => {
					const quick = drawerScope.getSnapshot().quickOpen;
					if (quick?.open !== true) return;
					const matches = rankFiles((drawerScope.getSnapshot().fileIndex ?? []).filter((file) => file.kind === "file"), quick.query, MAX_CANDIDATES);
					if (event.key === "Escape") {
						event.preventDefault();
						drawerActions.onCloseQuickOpen();
					} else if (event.key === "ArrowDown" && matches.length > 0) {
						event.preventDefault();
						drawerScope.update((d) => { d.quickOpen.selectedIndex = (d.quickOpen.selectedIndex + 1) % matches.length; });
					} else if (event.key === "ArrowUp" && matches.length > 0) {
						event.preventDefault();
						drawerScope.update((d) => { d.quickOpen.selectedIndex = (d.quickOpen.selectedIndex - 1 + matches.length) % matches.length; });
					} else if (event.key === "Enter" && matches[quick.selectedIndex] !== undefined) {
						event.preventDefault();
						drawerActions.onCloseQuickOpen();
						void drawerActions.onSelectFile(matches[quick.selectedIndex].relative);
					}
				},
				onOpenFile: async (relPath) => {
					openPanel();
					drawerScope.update((d) => {
						d.viewMode = "preview";
					});
					return drawerActions.onSelectFile(relPath);
				},
				onOpenExternal: (relPath) => {
					const absolute = currentWorkspacePath(relPath);
					if (absolute === undefined || originalOpenPath === undefined) return Promise.resolve();
					return originalOpenPath.call(workspaces, absolute);
				},
				onSetView: (viewMode) => {
					if (viewMode !== "tree" && viewMode !== "split" && viewMode !== "preview") return;
					drawerScope.update((d) => {
						d.viewMode = viewMode;
					});
				}
			};
			// Conversation tool rows and produced-file chips use workspaces.openPath.
			// Redirect current-workspace text files into this panel; retain the host
			// behavior for outside paths and unsupported/binary files.
			ctx.effect(() => {
				if (workspaces === undefined || originalOpenPath === undefined) return;
				const previewOpenPath = async (target) => {
					const relative = relativeToCurrentWorkspace(target);
					if (relative !== undefined && await drawerActions.onOpenFile(relative)) return;
					return originalOpenPath.call(workspaces, target);
				};
				workspaces.openPath = previewOpenPath;
				return () => {
					if (workspaces.openPath === previewOpenPath) workspaces.openPath = originalOpenPath;
				};
			}, "dsh-oh-my-theme: preview conversation files");
			handlePanelSessionChange = async (sessionId) => {
				const reopen = drawerScope.getSnapshot().open;
				const desiredMode = canUseDetailsColumn() ? "details" : "overlay";
				const sameSession = sessionId === drawerScope.getSnapshot().sessionId;
				if (sameSession && (!reopen || activePanelMode === desiredMode)) return;
				if (reopen) closePanel();
				if (!sameSession) await refreshTree(sessionId);
				if (reopen) openPanel();
			};

			// ---- @-mention source ---------------------------------------------
			const inputTriggers = ctx.get("inputTriggers");
			if (inputTriggers === undefined) {
				console.error("dsh-oh-my-theme: inputTriggers service unavailable — @ mentions disabled");
			}
			const searchIndex = async (sessionId, signal) => {
				const rows = await callRemote("search", [sessionId, ""]);
				return rows;
			};
			const { source, invalidateAll } = createMentionSource({
				search: searchIndex
			});
			getFileIndex = (sessionId, signal) => source.getFiles(sessionId, signal);
			ctx.effect(() => {
				if (inputTriggers === undefined) return;
				const dispose = inputTriggers.registerSource(source);
				console.log(`[dsh-oh-my-theme] @ mention source registered (${SOURCE_NAME})`);
				return () => {
					dispose();
				};
			}, "dsh-oh-my-theme: @ mention source");
			ctx.effect(() => {
				if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
				const onInputReferenceClick = (event) => {
					if (event.defaultPrevented) return;
					const target = event.target;
					if (target === null || target.tagName !== "TEXTAREA" || typeof target.value !== "string") return;
					const caret = Number(target.selectionStart);
					if (!Number.isInteger(caret) || caret < 0) return;
					let relative = "";
					const referencePattern = /(?:^|\s)@([^\s]*)/g;
					let match;
					while ((match = referencePattern.exec(target.value)) !== null) {
						const start = match.index + (match[0].length - (match[1]?.length ?? 0) - 1);
						const end = start + 1 + (match[1]?.length ?? 0);
						if (caret >= start && caret <= end + 1) {
							relative = match[1] ?? "";
							break;
						}
					}
					if (relative === "" || relative.endsWith("/")) return;
					const sessionId = drawerScope.getSnapshot().sessionId;
					if (sessionId === null) return;
					void getFileIndex(sessionId).then((files) => {
						const file = files.find((entry) => entry.relative === relative && entry.kind === "file");
						if (file !== undefined) void drawerActions.onOpenFile(file.relative);
					}).catch(() => {
					});
				};
				document.addEventListener("click", onInputReferenceClick);
				return () => document.removeEventListener("click", onInputReferenceClick);
			}, "dsh-oh-my-theme: open clicked @ file");
			ctx.effect(() => {
				if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
				const onKeyDown = (event) => {
					if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
						event.preventDefault();
						void drawerActions.onQuickOpen();
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, "dsh-oh-my-theme: quick open shortcut");
			// InputTriggerCandidate.icon is string-only. Replace our private marker
			// glyphs with the exact same VSCode SVGs used by the right file tree.
			ctx.effect(() => {
				if (typeof MutationObserver === "undefined") return;
				const hydrate = (root = document) => {
					for (const node of root.querySelectorAll?.('[role="listbox"] [aria-hidden="true"]') ?? []) {
						const key = MARKER_ICONS[node.textContent ?? ""];
						if (key === undefined || node.dataset.ohMyThemeIcon === key) continue;
						node.textContent = "";
						node.dataset.ohMyThemeIcon = key;
						node.style.width = "18px";
						node.style.height = "18px";
						node.style.flex = "0 0 18px";
						node.style.background = `center / contain no-repeat url("${vscodeIconUrl(key)}")`;
					}
				};
				const observer = new MutationObserver(() => hydrate());
				observer.observe(document.body, { childList: true, subtree: true });
				hydrate();
				return () => observer.disconnect();
			}, "dsh-oh-my-theme: VSCode icons in @ menu");
			ctx.on("connection/reset", () => {
				invalidateAll();
			});

			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "oh-my-theme-file-toggle",
				order: -10,
				locale: SETTINGS_NS,
				inject: () => ({
					scope: drawerScope,
					onToggle: drawerActions.onToggle
				})
			}, FileTreeButton));

			// Blank/new sessions hide the whole Session header. Keep a floating
			// fallback there only; real conversations use the utility left of log.
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "oh-my-theme-file-toggle-fallback",
				order: 90,
				locale: SETTINGS_NS,
				inject: () => ({
					scope: drawerScope,
					onToggle: drawerActions.onToggle,
					sessions,
					floating: true
				})
			}, FileTreeButton));

			// `details` is a single slot already occupied by dsh's tool panel.
			// Register our lower-priority replacement only while it is open, then
			// dispose it on close so built-in tool details keep working normally.
			ctx.slots.inject("details", () => {
				mountDetailsPanel = () => {
					if (disposeDetailsPanel !== undefined) return;
					disposeDetailsPanel = ctx.slots.register({
						name: "details",
						priority: -10,
						locale: SETTINGS_NS,
						inject: () => ({
							scope: drawerScope,
							onClose: drawerActions.onClose,
							onToggleDir: drawerActions.onToggleDir,
							onSelectFile: drawerActions.onSelectFile,
							onSelectTab: drawerActions.onSelectTab,
							onCloseTab: drawerActions.onCloseTab,
							onQuickOpen: drawerActions.onQuickOpen,
							onQuickOpenQuery: drawerActions.onQuickOpenQuery,
							onQuickOpenKey: drawerActions.onQuickOpenKey,
							onCloseQuickOpen: drawerActions.onCloseQuickOpen,
							onSetView: drawerActions.onSetView,
							onSetWorkspace: drawerActions.onSetWorkspace,
							onGitRefresh: drawerActions.onGitRefresh,
							onGitSelectFile: drawerActions.onGitSelectFile,
							onGitDiffMode: drawerActions.onGitDiffMode,
							onGitRefreshCommits: drawerActions.onGitRefreshCommits,
							onGitSelectCommit: drawerActions.onGitSelectCommit,
							onGitLoadMore: drawerActions.onGitLoadMore,
							onGitSelectCommitFile: drawerActions.onGitSelectCommitFile,
							onOpenExternal: drawerActions.onOpenExternal,
							mode: "details"
						})
					}, FileSidePanel);
				};
				return () => {
					disposeDetailsPanel?.();
					disposeDetailsPanel = undefined;
					mountDetailsPanel = undefined;
				};
			});

			// Keep an additive overlay registration available as a last-resort
			// fallback for shells that do not expose a details column at all.
			ctx.slots.inject("shell.overlay", () => {
				mountOverlayPanel = () => {
					if (disposeOverlayPanel !== undefined) return;
					disposeOverlayPanel = ctx.slots.register({
						name: "shell.overlay",
						id: "oh-my-theme-file-panel",
						order: 100,
						locale: SETTINGS_NS,
						inject: () => ({
							scope: drawerScope,
							onClose: drawerActions.onClose,
							onToggleDir: drawerActions.onToggleDir,
							onSelectFile: drawerActions.onSelectFile,
							onSelectTab: drawerActions.onSelectTab,
							onCloseTab: drawerActions.onCloseTab,
							onQuickOpen: drawerActions.onQuickOpen,
							onQuickOpenQuery: drawerActions.onQuickOpenQuery,
							onQuickOpenKey: drawerActions.onQuickOpenKey,
							onCloseQuickOpen: drawerActions.onCloseQuickOpen,
							onSetView: drawerActions.onSetView,
							onSetWorkspace: drawerActions.onSetWorkspace,
							onGitRefresh: drawerActions.onGitRefresh,
							onGitSelectFile: drawerActions.onGitSelectFile,
							onGitDiffMode: drawerActions.onGitDiffMode,
							onGitRefreshCommits: drawerActions.onGitRefreshCommits,
							onGitSelectCommit: drawerActions.onGitSelectCommit,
							onGitLoadMore: drawerActions.onGitLoadMore,
							onGitSelectCommitFile: drawerActions.onGitSelectCommitFile,
							onOpenExternal: drawerActions.onOpenExternal,
							mode: "overlay"
						})
					}, FileSidePanel);
				};
				return () => {
					disposeOverlayPanel?.();
					disposeOverlayPanel = undefined;
					mountOverlayPanel = undefined;
				};
			});
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.SKINS = SKINS;
		exports.DEFAULT_SKIN = DEFAULT_SKIN;
		exports.codeLanguageForPath = codeLanguageForPath;
		exports.codeMarkdown = codeMarkdown;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
