// dsh-oh-my-theme — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-oh-my-theme/client.js and
// executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table — the same shape the
// shipped ui-* packages' tsdown bundles emit, and what the dsh-skin plugin
// ships by hand. No build step is needed: this file is served verbatim.
//
// Persistence note: the skin choice is stored in localStorage. DSH's Host
// settings wire only exposes an allowlisted set of namespaces to browser
// clients (dsh-host-apiproxy's WEB_SETTINGS_NAMESPACES), so a third-party
// namespace would answer `settings-not-exposed`; the product itself keeps
// remote browser preferences process-local, and localStorage matches that
// boundary for visual preferences while surviving reloads on the same
// origin.
window.__ModuleLoader__.load({
	id: "dsh-oh-my-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");

		//#region dsh-oh-my-theme: definitions
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.oh-my-theme";
		/** localStorage key holding the selected skin id. */
		const STORAGE_KEY = "dsh-oh-my-theme:skin";
		/** Sentinel meaning "no custom skin — follow the built-in appearance". */
		const DEFAULT_SKIN = "system";

		/**
		 * The curated skin catalog. Every skin is a third-party theme for the
		 * built-in ThemeRuntime: an id, the base palette it builds on
		 * (colorScheme drives body[data-ds-dark-theme]), and --dsw-alias-*
		 * overrides applied as inline custom properties on <body> by ui-layout's
		 * ThemePresenter. Values are concrete CSS colors (no var() indirection),
		 * tuned per skin for contrast on both surface and text roles.
		 *
		 * To add a skin: copy one entry, change id / colorScheme / tokens, add a
		 * `skin.<id>` key to both dictionaries below, and reload the page. The
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
			"theme.hint": "选择一套皮肤覆盖内置外观；「默认」恢复跟随系统明暗"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"theme.title": "Oh My Theme",
			"theme.default": "Default",
			"theme.aurora": "Aurora",
			"theme.coffee": "Coffee",
			"theme.matrix": "Matrix",
			"theme.hint": "Pick a skin to override the built-in appearance; “Default” follows the system scheme"
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

		//#region dsh-oh-my-theme: settings row
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

		/** One selectable skin card. */
		function SkinCard({ skin, selected, onSelect, t }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onSelect,
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
		 * one swatch card per curated skin.
		 */
		function ThemeRow({ t, setSkin, useStore }) {
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

		//#region dsh-oh-my-theme: settings row store
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

		//#region dsh-oh-my-theme: client plugin body
		/**
		 * Required services: theme runtime (skin registry, switching, snapshot),
		 * slots/locale (the settings row). Persistence is localStorage, so no
		 * settings transport is needed.
		 */
		const inject = [
			"slots",
			"locale",
			"theme"
		];

		/**
		 * Client plugin body: register the curated skins into the theme runtime,
		 * restore the saved skin, keep the row's store in sync with
		 * theme/change, and register the row into Settings → General.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			const disposers = SKINS.map((skinDefinition) => ctx.theme.register(skinDefinition));
			ctx.effect(() => () => {
				for (const dispose of disposers) dispose();
			}, "dsh-oh-my-theme: theme registration");

			// Restore the saved skin once (before any user interaction).
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
			}), "dsh-oh-my-theme: settings row dictionaries");

			const injected = (actions) => {
				bound = actions;
				sync(ctx.theme.getTheme());
				return {
					setSkin: (id) => {
						ctx.theme.setTheme(id);
						writeSavedSkin(id);
					}
				};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "oh-my-theme",
				order: 20,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, ThemeRow));
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
