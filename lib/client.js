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
//  3. Sidebar file tree + Markdown preview — a toggle in the sidebar footer
//     opens a lazy-loading project tree in the shell overlay; clicking a
//     .md file renders it through the shared Markdown component.
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
			"files.title": "文件树",
			"files.toggle": "打开 / 关闭文件树",
			"files.close": "关闭",
			"files.empty": "打开一个会话后，这里会显示它的工作区",
			"files.emptyTree": "工作区是空的",
			"files.remotePending": "文件服务未就绪，请刷新页面重试",
			"files.loading": "加载中…",
			"files.noSession": "当前没有会话",
			"files.previewTitle": "预览",
			"files.noPreview": "点击 .md 文件查看渲染预览",
			"files.error": "加载失败：",
			"files.truncated": "（内容已截断）"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"theme.title": "Oh My Theme",
			"theme.default": "Default",
			"theme.aurora": "Aurora",
			"theme.coffee": "Coffee",
			"theme.matrix": "Matrix",
			"theme.hint": "Hover to preview live, click to commit; “Default” follows the system scheme",
			"files.title": "Files",
			"files.toggle": "Toggle file tree",
			"files.close": "Close",
			"files.empty": "Open a session to browse its workspace",
			"files.emptyTree": "Workspace is empty",
			"files.remotePending": "File service not ready — refresh to retry",
			"files.loading": "Loading…",
			"files.noSession": "No active session",
			"files.previewTitle": "Preview",
			"files.noPreview": "Click a .md file to preview it",
			"files.error": "Failed to load:",
			"files.truncated": "(truncated)"
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
		function ThemeRow({ t, setSkin, previewSkin, restoreSkin, useStore }) {
			const skin = useStore((s) => s.skin);
			const selected = SKINS.some((candidate) => candidate.id === skin) ? skin : null;
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
		/** Typert invocation descriptors — must mirror lib/index.js exactly. */
		const INVOCATIONS = [
			{
				id: "dsh-oh-my-theme#workspaceFiles/search",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "search",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: { mode: "src-json" } },
					{ name: "query", wire: "query", source: "json", codec: { mode: "src-json" } }
				],
				cancellation: { parameter: "signal" },
				result: { mode: "src-json" }
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/listDir",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "listDir",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: { mode: "src-json" } },
					{ name: "relPath", wire: "relPath", source: "json", codec: { mode: "src-json" } }
				],
				cancellation: { parameter: "signal" },
				result: { mode: "src-json" }
			},
			{
				id: "dsh-oh-my-theme#workspaceFiles/readText",
				service: "workspaceFiles",
				namespace: "workspaceFiles",
				method: "readText",
				invocation: { kind: "direct" },
				parameters: [
					{ name: "agent", wire: "agentId", source: "lookup", lookup: "agent", codec: { mode: "src-json" } },
					{ name: "relPath", wire: "relPath", source: "json", codec: { mode: "src-json" } }
				],
				cancellation: { parameter: "signal" },
				result: { mode: "src-json" }
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
					icon: null,
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

		//#region dsh-oh-my-theme: file tree drawer
		/** Inline icons for the tree (16x16, currentColor). */
		const icons = {
			chevron: (open) => (0, react_jsx_runtime.jsx)("svg", {
				width: 12,
				height: 12,
				viewBox: "0 0 16 16",
				"aria-hidden": true,
				style: {
					flex: "none",
					transform: open ? "rotate(90deg)" : "none",
					transition: "transform 120ms ease",
					opacity: 0.7
				},
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M6 4l4 4-4 4",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.4",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			}),
			folder: (0, react_jsx_runtime.jsx)("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				"aria-hidden": true,
				style: { flex: "none", opacity: 0.85 },
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M2 3.5A1.5 1.5 0 0 1 3.5 2h2.8l1.5 1.5H12.5A1.5 1.5 0 0 1 14 5v6.5A1.5 1.5 0 0 1 12.5 13h-9A1.5 1.5 0 0 1 2 11.5v-8Z",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.2"
				})
			}),
			file: (0, react_jsx_runtime.jsx)("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				"aria-hidden": true,
				style: { flex: "none", opacity: 0.75 },
				children: (0, react_jsx_runtime.jsxs)("g", {
					children: [
						(0, react_jsx_runtime.jsx)("path", {
							d: "M3 2.5A1.5 1.5 0 0 1 4.5 1h3l3 3v9.5A1.5 1.5 0 0 1 9 15H4.5A1.5 1.5 0 0 1 3 13.5v-11Z",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.2"
						}),
						(0, react_jsx_runtime.jsx)("path", {
							d: "M7.5 1v3h3",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.2"
						})
					]
				})
			})
		};

		/** Right-side panel styles (Codex-style file explorer + preview). */
		const drawerStyles = {
			panel: {
				position: "fixed",
				right: 0,
				top: 0,
				bottom: 0,
				width: 520,
				zIndex: 30,
				display: "flex",
				flexDirection: "column",
				background: "var(--dsw-alias-bg-layer-1)",
				borderLeft: "1px solid var(--dsw-alias-border-l2)",
				boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.18)",
				fontSize: "13px"
			},
			header: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "8px",
				padding: "12px 14px",
				borderBottom: "1px solid var(--dsw-alias-border-l1)",
				flex: "none"
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
			tree: {
				width: 200,
				flex: "none",
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
				fontSize: "13px",
				lineHeight: "20px",
				textAlign: "left",
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis"
			},
			rowHover: {
				background: "var(--dsw-alias-interactive-bg-hover)"
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
			previewCode: {
				margin: 0,
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
				fontSize: "12px",
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
								icons.folder,
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
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelectFile(entry.relative),
				style: { ...drawerStyles.row, paddingLeft: paddingLeft + 12 },
				children: [
					icons.file,
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

		/**
		 * The right-side file panel (Codex-style): a project file tree on the
		 * left column, and the opened file's preview on the right column.
		 * Markdown files render through the shared Markdown component; other
		 * UTF-8 text files show as plain text.
		 */
		function FileSidePanel({ t, scope, onClose, onToggleDir, onSelectFile }) {
			// Subscribe to the shared panel scope directly — the slot framework's
			// useScope hook requires a selector, and this component reads the
			// whole snapshot (open/sessionId/dirs/expanded/preview/error).
			const state = (0, _react.useSyncExternalStore)(scope.subscribe, scope.getSnapshot);
			if (!state.open) return null;
			const rootRows = state.dirs[""];
			const preview = state.preview;
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
				? (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.noPreview") })
				: [
					(0, react_jsx_runtime.jsx)("div", {
						style: drawerStyles.previewHeader,
						children: [
							(0, react_jsx_runtime.jsx)("span", { children: t("files.previewTitle") }),
							(0, react_jsx_runtime.jsx)("span", { style: drawerStyles.previewPath, children: preview.relative })
						]
					}),
					preview.kind === "markdown"
						? (0, react_jsx_runtime.jsx)("div", {
							children: (0, react_jsx_runtime.jsx)(_ui_primitives.MarkdownText, {
								text: preview.content
							})
						})
						: (0, react_jsx_runtime.jsx)("pre", {
							style: drawerStyles.previewCode,
							children: preview.content
						}),
					preview.truncated && (0, react_jsx_runtime.jsx)("div", { style: drawerStyles.empty, children: t("files.truncated") })
				];
			return (0, react_jsx_runtime.jsxs)("div", {
				style: drawerStyles.panel,
				"data-oh-my-theme-file-panel": true,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.header,
						children: [
							(0, react_jsx_runtime.jsx)("div", { style: drawerStyles.title, children: t("files.title") }),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onClose,
								"aria-label": t("files.close"),
								title: t("files.close"),
								style: drawerStyles.close,
								children: (0, react_jsx_runtime.jsx)("svg", {
									width: 14,
									height: 14,
									viewBox: "0 0 16 16",
									"aria-hidden": true,
									children: (0, react_jsx_runtime.jsx)("path", {
										d: "M4 4l8 8M12 4l-8 8",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round"
									})
								})
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
					(0, react_jsx_runtime.jsxs)("div", {
						style: drawerStyles.body,
						children: [
							(0, react_jsx_runtime.jsx)("div", { style: drawerStyles.tree, children: treeContent }),
							(0, react_jsx_runtime.jsx)("div", { style: drawerStyles.preview, children: previewContent })
						]
					})
				]
			});
		}

		/** The sidebar-footer toggle button for the file tree drawer. */
		function FileTreeButton({ t, scope, onToggle }) {
			const state = (0, _react.useSyncExternalStore)(scope.subscribe, scope.getSnapshot);
			return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onToggle,
				title: t("files.toggle"),
				"aria-label": t("files.toggle"),
				"aria-pressed": state.open,
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 36,
					height: 36,
					border: "none",
					borderRadius: 8,
					background: state.open ? "var(--dsw-alias-interactive-bg-hover)" : "transparent",
					color: state.open ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-label-secondary)",
					cursor: "pointer",
					font: "inherit"
				},
				children: (0, react_jsx_runtime.jsx)("svg", {
					width: 16,
					height: 16,
					viewBox: "0 0 16 16",
					"aria-hidden": true,
					children: (0, react_jsx_runtime.jsxs)("g", {
						children: [
							(0, react_jsx_runtime.jsx)("path", {
								d: "M1.5 3.5A1.5 1.5 0 0 1 3 2h2.8l1.5 1.5H13A1.5 1.5 0 0 1 14.5 5v6.5A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-8Z",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.2"
							}),
							(0, react_jsx_runtime.jsx)("path", {
								d: "M6 8.2l1.5 1.5L11 6",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.2",
								strokeLinecap: "round",
								strokeLinejoin: "round"
							})
						]
					})
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
			"remote"
		];

		/**
		 * Client plugin body: register the curated skins, restore the saved
		 * skin, mount the workspaceFiles remote, register the @-mention source,
		 * and mount the sidebar file tree drawer.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			// ---- theme --------------------------------------------------------
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

			// The footer button and the shell overlay share this snapshot store.
			const drawerScope = (0, _runtime_client.createSnapshotStore)({
				open: false,
				sessionId: null,
				remoteReady: false,
				dirs: {},
				expanded: {},
				loadingDirs: {},
				preview: null,
				error: null
			});
			const sessions = ctx.get("sessions");

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
					d.dirs = {};
					d.expanded = {};
					d.preview = null;
					d.error = null;
				});
				if (sessionId !== null) await loadDir("", sessionId);
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
				return () => {
					filesRemote = undefined;
					drawerScope.update((d) => {
						d.remoteReady = false;
					});
					void dispose();
				};
			}, "dsh-oh-my-theme: remote");

			// Keep the panel's sessionId in sync with the current session.
			ctx.effect(() => {
				if (sessions === undefined) return;
				const syncSession = () => {
					const id = sessions.list.getSnapshot().current ?? null;
					if (id !== drawerScope.getSnapshot().sessionId) {
						void refreshTree(id);
					}
				};
				syncSession();
				return sessions.list.subscribe(syncSession);
			}, "dsh-oh-my-theme: panel session sync");

			// ---- @-mention source ---------------------------------------------
			const inputTriggers = ctx.get("inputTriggers");
			if (inputTriggers === undefined) {
				console.error("dsh-oh-my-theme: inputTriggers service unavailable — @ mentions disabled");
			}
			const searchIndex = async (sessionId, signal) => {
				const rows = await callRemote("search", [sessionId, ""]);
				return rows;
			};
			const { source, invalidateAll } = createMentionSource({ search: searchIndex });
			ctx.effect(() => {
				if (inputTriggers === undefined) return;
				const dispose = inputTriggers.registerSource(source);
				console.log(`[dsh-oh-my-theme] @ mention source registered (${SOURCE_NAME})`);
				return () => {
					dispose();
				};
			}, "dsh-oh-my-theme: @ mention source");
			ctx.on("connection/reset", () => {
				invalidateAll();
			});

			const drawerActions = {
				onToggle: () => {
					drawerScope.update((d) => {
						d.open = !d.open;
					});
					if (drawerScope.getSnapshot().open && drawerScope.getSnapshot().sessionId !== null && drawerScope.getSnapshot().dirs[""] === undefined) {
						void loadDir("", drawerScope.getSnapshot().sessionId);
					}
				},
				onClose: () => {
					drawerScope.update((d) => {
						d.open = false;
					});
				},
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
					if (sessionId === null) return;
					const isMd = relPath.toLowerCase().endsWith(".md");
					drawerScope.update((d) => {
						d.preview = null;
						d.error = null;
					});
					try {
						const result = await callRemote("readText", [sessionId, relPath]);
						drawerScope.update((d) => {
							d.preview = {
								relative: relPath,
								content: result.content,
								truncated: result.truncated === true,
								kind: isMd ? "markdown" : "text"
							};
						});
					} catch (error) {
						drawerScope.update((d) => {
							d.error = error instanceof Error ? error.message : String(error);
						});
					}
				}
			};

			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "oh-my-theme-files",
				order: 100,
				locale: SETTINGS_NS,
				inject: () => ({
					scope: drawerScope,
					onToggle: drawerActions.onToggle
				})
			}, FileTreeButton));

			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "oh-my-theme-file-panel",
				order: 100,
				locale: SETTINGS_NS,
				inject: () => ({
					scope: drawerScope,
					onClose: drawerActions.onClose,
					onToggleDir: drawerActions.onToggleDir,
					onSelectFile: drawerActions.onSelectFile
				})
			}, FileSidePanel));
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.SKINS = SKINS;
		exports.DEFAULT_SKIN = DEFAULT_SKIN;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
