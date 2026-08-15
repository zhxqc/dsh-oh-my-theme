# dsh-oh-my-theme

[中文](README.zh.md)

Theme + file workspace plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) web GUI:

1. **Skins** — curated `--dsw-alias-*` palettes with a picker inside **Settings → General**; hover a swatch to preview it live, click to commit.
2. **@file mentions** — type `@` in the composer to search the current project and insert `@path` references the agent can read precisely.
3. **Sidebar file tree + Markdown preview** — a lazy-loading project tree in the sidebar with rendered previews for `.md` files.

Built as a third-party plugin in the same shape as the shipped `ui-*` packages and the [dsh-at-file](https://github.com/FSMargoo/dsh-at-file) / [dsh-skin](https://github.com/KinGao294/dsh-skin) plugins. No build step: both halves are hand-written files served verbatim.

## Features

- **3 starter skins** — `aurora` (dark indigo), `coffee` (light warm), `matrix` (dark terminal green) — plus the built-in appearance as the default.
- **Live hover preview** — moving the pointer over a swatch paints the whole page with that skin (nothing persisted); only a click saves the choice.
- **@file mentions** — a composer trigger source (`trigger: "@"`) that searches the session's workspace, ranks results, and inserts `@relative/path ` on pick. Directory picks append `/` so you can drill into folders.
- **Lazy-loading file tree** — a toggle in the sidebar footer opens a project tree; directories load one level at a time, `node_modules`/`.git`/build dirs are skipped.
- **Markdown preview** — clicking a `.md` file renders it in the drawer via the shared Markdown component (UTF-8 text, 512 KB cap, binary files rejected).
- **zh / en bilingual** — all surfaces follow the GUI language.

## How it works

A dsh plugin package has two halves:

- **Host half** (`lib/index.js`) — a Typert Remote Service named `workspaceFiles` with three read-only, workspace-scoped methods:
  - `search(agent, query, signal)` — indexes the session's workspace (ignore rules + 5000-file cap) and returns ranked matches for the `@` picker;
  - `listDir(agent, relPath, signal)` — lists one directory level, sorted dirs-first (lazy file tree);
  - `readText(agent, relPath, signal)` — reads a UTF-8 text file (512 KB cap, NUL-byte binary detection).

  Every method resolves paths strictly inside `agent.session.header.cwd` and rejects traversal. Nothing writes or executes. The typert manifest (`TYPERT_MANIFEST` + `ctx.typert.register`) is what lets the browser half call these methods over the same wire the shipped `ui-*` packages use.
- **Browser half** (`lib/client.js`) — the whole UI. DSH's `dsh-client-modules` picks it up through the `dsh.client` declaration in `package.json`, serves the bundle at `/plugins/dsh-oh-my-theme/client.js`, and the vendored cordis Loader executes it through `window.__ModuleLoader__.load`.

On activation the browser half:

1. **Registers each skin** with the built-in theme service (`ctx.theme.register(...)`); the ThemePresenter applies token overrides as inline custom properties on `<body>`.
2. **Restores the saved skin** from `localStorage` (`dsh-oh-my-theme:skin`).
3. **Mounts the `workspaceFiles` remote** (`ctx.remote.$mount(OHMY_REMOTE)` → `ctx.reflect.get("remote.workspaceFiles")`).
4. **Registers the `@` trigger source** with `inputTriggers` — one index fetch per session (60 s TTL), ranked in-memory per keystroke.
5. **Mounts the file tree drawer** — a toggle in `sidebar.footer.action` plus the drawer in the root-scoped `shell.overlay` list slot (the overlay layer is `pointer-events: none` with auto children, so the drawer interacts while the rest of the page stays clickable). The drawer shares one snapshot store across both slots and follows the current session from `sessions.list`.

### Why localStorage?

The Host settings wire only exposes an allowlisted set of namespaces to browser clients (`dsh-host-apiproxy`'s `WEB_SETTINGS_NAMESPACES`), so a third-party namespace would answer `settings-not-exposed`. `localStorage` matches that boundary for visual preferences while surviving reloads on the same origin.

## Install

The plugin is a standard dsh bundle: install it with the `dsh plugin` command (which forwards to pnpm in the profile directory).

```sh
# from the project root — installs into your web profile
dsh plugin --profile web add .
# or from anywhere, by path:
dsh plugin --profile web add /path/to/dsh-oh-my-theme
```

Then open the web GUI:

```sh
dsh web
```

## Use

### Skins

Open **Settings → General** — the **Oh My Theme** row sits below the built-in **Appearance** row. Hover a swatch to preview that skin live across the whole page (nothing is saved yet); click to commit. **Default** follows the built-in appearance.

### @file mentions

In the composer, type `@` and start typing a path fragment — a menu lists matching files and directories of the current project. Pick one to insert `@path ` into the draft; the agent reads the file precisely instead of searching blindly. Directory results append `/` so `@src/` keeps narrowing.

### File tree + Markdown preview

Click the **folder** button in the sidebar footer (bottom of the left rail) to open the file tree drawer. Directories expand lazily; click a `.md` file to render its preview below the tree. The tree always follows the currently open session's workspace.

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
│   ├── index.js        # host half — workspaceFiles Typert remote
│   ├── client.js       # browser half — skins, @-mentions, file tree
│   └── types/          # type stubs
├── test/host.test.mjs  # host service unit tests (node --test)
├── README.md / README.zh.md
└── LICENSE
```

## Development

```sh
node --test test/host.test.mjs   # host service tests
node test/client.smoke.mjs      # client bundle smoke test
```

## Uninstall

```sh
dsh plugin --profile web remove dsh-oh-my-theme
```

## License

[MIT](LICENSE)
