# dsh-oh-my-theme

[中文](README.zh.md)

Theme plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) web GUI — curated `--dsw-alias-*` skin palettes with a picker right inside **Settings → General**, light/dark aware, persisted per browser.

Built as a third-party Cordis client plugin in the same shape as the shipped `ui-*` packages and the [dsh-skin](https://github.com/KinGao294/dsh-skin) plugin: no build step, no host code, installable straight into a profile.

## Features

- **3 starter skins** — `aurora` (dark indigo), `coffee` (light warm), `matrix` (dark terminal green) — plus the built-in appearance as the default.
- **Picker in Settings → General** — one swatch card per skin, right below the built-in Appearance row.
- **Light/dark aware** — each skin declares its base `colorScheme`, so `html { color-scheme }` and `body[data-ds-dark-theme]` follow the skin, not the OS.
- **Persisted per browser** — the choice lives in `localStorage` (see *How it works*).
- **zh / en bilingual** — the settings row follows the GUI language.
- **Easy to extend** — skins are plain data; add one entry to the `SKINS` catalog and two dictionary keys.

## How it works

A dsh plugin package has two halves:

- **Host half** (`lib/index.js`) — intentionally a no-op loader entry.
- **Browser half** (`lib/client.js`) — the whole feature. DSH's `dsh-client-modules` picks it up through the `dsh.client` declaration in `package.json`, serves the bundle at `/plugins/dsh-oh-my-theme/client.js`, and the vendored cordis Loader executes it through `window.__ModuleLoader__.load`. This is the same contract every shipped `ui-*` package uses.

The browser half does four things on activation:

1. **Registers each skin** with the built-in theme service (`ctx.theme.register(...)`). A skin is an id, a `colorScheme`, and a table of `--dsw-alias-*` token overrides; the ThemePresenter applies them as inline custom properties on `<body>`.
2. **Restores the saved skin** from `localStorage` (`dsh-oh-my-theme:skin`) and switches to it via `ctx.theme.setTheme(id)`.
3. **Mounts the picker row** into the `settings.general.item` slot (id `oh-my-theme`, `order: 20`, right after the built-in Appearance row at `order: 10`), mirroring the theme snapshot into a small store.
4. **Keeps everything in sync** with the `theme/change` event.

### Why localStorage?

The Host settings wire only exposes an allowlisted set of namespaces to browser clients (`dsh-host-apiproxy`'s `WEB_SETTINGS_NAMESPACES`), so a third-party namespace would answer `settings-not-exposed`. The product itself keeps remote browser preferences process-local; `localStorage` matches that boundary for visual preferences while surviving reloads on the same origin.

## Install

The plugin is a standard dsh bundle: install it with the `dsh plugin` command (which forwards to pnpm in the profile directory).

```sh
# from the project root — installs into your web profile and starts the GUI if needed
dsh plugin --profile web add .
# or from anywhere, by path:
dsh plugin --profile web add /path/to/dsh-oh-my-theme
```

Then open the web GUI:

```sh
dsh web
```

## Use

Open **Settings → General** — the **Oh My Theme** row sits below the built-in **Appearance** row. Click a swatch to switch immediately; the choice is remembered next time you open the page. **Default** follows the built-in appearance (`light`/`dark`/`system`).

## Add your own skin

Open `lib/client.js`, find the `SKINS` catalog, and add one entry:

```js
{
  id: "my-skin",                    // unique id; never "system"
  colorScheme: "dark",              // "light" | "dark" — base palette
  tokens: {
    "--dsw-alias-bg-base": "#0b0e1a",
    // ... any subset of the tokens below; omitted tokens keep the base theme
  }
}
```

Then add two dictionary keys (zh + en), e.g. `"theme.my-skin": "我的皮肤"` / `"theme.my-skin": "My Skin"`. Reload the page — the picker card, the registry, and the persisted restore all derive from the `SKINS` array automatically.

### Token reference

The palette tokens you can override (concrete CSS colors, no `var()` indirection — the same set used by the built-in stylesheets):

| Token | Role |
| --- | --- |
| `--dsw-alias-bg-base` | Root background |
| `--dsw-alias-bg-layer-1/2/3` | Surface elevations (cards, inputs, bubbles…) |
| `--dsw-alias-bg-overlay` | Overlay / popover surface |
| `--dsw-alias-border-l1/l2` | Hairline borders |
| `--dsw-alias-label-primary/secondary/tertiary` | Text emphasis levels |
| `--dsw-alias-brand-primary` / `--dsw-alias-brand-text` | Accent color and its foreground |
| `--dsw-alias-button-primary-hover` / `--dsw-alias-button-primary-dimmed` | Primary button states |
| `--dsw-alias-state-business-primary/tertiary` | Business/status accent |
| `--dsw-alias-interactive-bg-hover/active` | Hover/press fills |
| `--dsw-alias-markdown-code-block` / `--dsw-alias-markdown-inline-code` | Code surfaces |
| `--dsw-specific-sidebar-fill` / `--dsw-specific-sidebar-nav-item-active` / `--dsw-specific-sidebar-nav-item-hover` | Sidebar |
| `--dsw-alias-scrollbar-bg-l1/l2` / `--dsw-alias-scrollbar-hover-l1/l2` | Scrollbars |

Tip: keep at least `bg-base`/`bg-layer-1`, `label-primary`/`label-secondary`, `brand-primary`, and one border token consistent for contrast; skins that only override part of the surface stack usually look broken.

## Project structure

```
dsh-oh-my-theme/
├── package.json        # dsh.bundle.patch + dsh.client declarations
├── cordis.patch.yml    # inserts the `oh-my-theme` loader row
├── lib/
│   ├── index.js        # host half (no-op)
│   ├── client.js       # browser half — the whole theme plugin
│   └── types/          # type stubs
├── README.md / README.zh.md
└── LICENSE
```

## Uninstall

```sh
dsh plugin --profile web remove dsh-oh-my-theme
```

## License

[MIT](LICENSE)
