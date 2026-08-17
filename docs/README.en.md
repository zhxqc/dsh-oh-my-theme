# dsh-oh-my-theme

[中文](../README.md)

<p align="center">
  <img alt="npm" src="https://img.shields.io/npm/v/dsh-oh-my-theme?style=flat-square&logo=npm&logoColor=white&label=npm" />
  <img alt="npm downloads" src="https://img.shields.io/npm/dm/dsh-oh-my-theme?style=flat-square&color=cb3837" />
  <img alt="license" src="https://img.shields.io/github/license/zhxqc/dsh-oh-my-theme?style=flat-square" />
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/zhxqc/dsh-oh-my-theme?style=flat-square" />
  <a href="https://awesome-dsh-plugin.com"><img alt="Awesome DSH Plugin" src="https://awesome-dsh-plugin.com/badge.svg" /></a>
</p>

Theme + file workspace plugin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) web GUI:

1. **Skins and typography** — switch palettes and independently adjust conversation, file-tree, and file-preview text sizes under **Settings → General → Oh My Theme**.
2. **@file mentions** — type `@` in the composer to search the current project and insert `@path` references the agent can read precisely.
3. **Right-side file panel** — a Codex-style project tree and file preview that can be shown independently or side by side; Markdown and common source files include syntax highlighting, while unknown text formats fall back to plain text.

Built as a third-party plugin in the same shape as the shipped `ui-*` packages and the [dsh-at-file](https://github.com/FSMargoo/dsh-at-file) / [dsh-skin](https://github.com/KinGao294/dsh-skin) plugins. No build step: both halves are hand-written files served verbatim.

## Features

### 🎨 Skins & typography

> Switch palettes and independently tune conversation, file-tree, and file-preview text under **Settings → General → Oh My Theme**.

- **3 starter skins** — `aurora` (dark indigo), `coffee` (light warm), `matrix` (dark terminal green) — plus the built-in appearance as the default.
- **Live hover preview** — moving the pointer over a swatch paints the whole page with that skin (nothing persisted); only a click saves the choice.
- **Global text display** — conversation, file-tree, and file-preview sizes plus the preview font are configured separately; changes apply immediately and persist in the current browser.

### ✨ @file mentions

> Type `@` in the composer to search the current project and insert `@path` references the agent can read precisely — no blind searching.

- Searches and ranks the current session's workspace; picking a file inserts `@relative/path `, while clicking the reference text in the composer opens its preview in the right panel.
- Directory picks append `/` so `@src/` keeps narrowing.

### 📁 Right-side file panel (Codex-style)

> A workspace button left of Session log opens the panel. Switch between project-tree-only, split tree + preview, and preview-only layouts; Markdown and common source files get syntax highlighting.

- **Lazy-loading file tree** — directories load one level at a time, skipping `node_modules` / `.git` / build dirs; the tree and `@` menu share VSCode Material Icon Theme icons.
- **Quick Open** — click the search button or press `Ctrl/Cmd + P` to filter by file name/path and open a result; it reuses the workspace index already used by `@` mentions.
- **Multi-file preview tabs** — opening several files keeps independent preview tabs that can be switched or closed; tabs are session-scoped and file contents load on demand.
- **Hidden dependency filtering** — dotfiles and dependency/build trees such as `node_modules`, `.pnpm`, `.git`, and `dist` stay out of both the tree and the `@` menu.
- **Independent views** — the panel header toggles project-tree-only / split / preview-only.
- **Markdown and code preview** — `.md` files use dsh's Markdown renderer; common JS/TS/TSX, JSON, HTML/CSS, Vue, Python, Go, Rust, Java, shell, YAML, SQL, and Dockerfile sources reuse Shiki highlighting and copy controls. Unknown UTF-8 text formats fall back to plain text (512 KB cap, binary files rejected).

> **Where data lives**: skin, size, and font preferences are stored in the current browser's `localStorage`; session data is untouched.

### Git history (read-only)

> The same right-side workspace now switches between **Files / Git**; Git then offers **Changes / Commits** and reads the current workspace's Git state without performing write operations.

- **Changes view** — groups staged, unstaged, and untracked files with status codes. Selecting a file previews the working-tree or staged diff through dsh's existing `DiffBlock`; untracked files get a generated diff too.
- **Commits view** — paginates commits touching the current workspace with short hash, subject, author, and timestamp. Selecting a commit shows its changed files and commit diff, with optional file-level drill-down.
- **Host safety** — only fixed read-only `git status` / `diff` / `log` / `show` commands are exposed; paths stay inside the session workspace, commit hashes are validated, and commands have timeout/output limits.

<p align="center">
  <img src="assets/git-changes.png" alt="Git changes and working-tree diff" width="49%" />
  <img src="assets/git-timeline.png" alt="Git commit timeline and commit diff" width="49%" />
</p>

### DeepSeek live balance

> The live balance appears below the composer statistics line; click the amount for details. This feature intentionally shows balance only; it does not estimate request cost.

- The Host resolves `DEEPSEEK_API_KEY` through DSH's credentials service and calls the official `/user/balance` endpoint.
- The browser receives only CNY/USD totals, granted balance, topped-up balance, and the fetch time; the API key never crosses into the client or logs.
- The balance loads after the host remote mounts, supports manual refresh, and reports missing credentials or an outdated host without exposing provider response details.
- There is no background polling by default; a refresh makes one lightweight HTTPS request on demand.

## How it works

A dsh plugin package has two halves:

- **Host half** (`lib/index.js`) — a Typert Remote Service named `workspaceFiles` with nine read-only methods:
  - `balance(signal)` — fetches a sanitized real-time balance from the official DeepSeek account API; the key is resolved host-side through DSH credentials;
  - `search(agent, query, signal)` — indexes the session's workspace (ignore rules + 5000-file cap) and returns ranked matches for the `@` picker;
  - `listDir(agent, relPath, signal)` — lists one directory level, sorted dirs-first (lazy file tree);
  - `readText(agent, relPath, signal)` — reads a UTF-8 text file (512 KB cap, NUL-byte binary detection).
  - `gitStatus(agent, signal)` — returns branch metadata and staged/unstaged/untracked status rows.
  - `gitDiff(agent, relPath, mode, signal)` — returns a bounded working-tree or staged diff for one path.
  - `gitLog(agent, skip, limit, signal)` / `gitShow(agent, hash, signal)` — paginate commits and inspect their changed files.
  - `gitCommitDiff(agent, hash, relPath, signal)` — returns a bounded full-commit or file-level diff.

  Every method resolves paths strictly inside `agent.session.header.cwd` and rejects traversal. Nothing writes or executes. The typert manifest (`TYPERT_MANIFEST` + `ctx.typert.register`) is what lets the browser half call these methods over the same wire the shipped `ui-*` packages use.
- **Browser half** (`lib/client.js`) — the whole UI. DSH's `dsh-client-modules` picks it up through the `dsh.client` declaration in `package.json`, serves the bundle at `/plugins/dsh-oh-my-theme/client.js`, and the vendored cordis Loader executes it through `window.__ModuleLoader__.load`.

On activation the browser half:

1. **Registers each skin** with the built-in theme service (`ctx.theme.register(...)`); the ThemePresenter applies token overrides as inline custom properties on `<body>`.
2. **Restores the saved skin** from `localStorage` (`dsh-oh-my-theme:skin`).
3. **Restores typography preferences** from localStorage and immediately applies conversation, file-tree, and file-preview sizes plus the preview font through page-level CSS variables.
4. **Mounts the `workspaceFiles` remote** (`ctx.remote.$mount(OHMY_REMOTE)` → `ctx.reflect.get("remote.workspaceFiles")`).
5. **Registers the `@` trigger source** with `inputTriggers` — one index fetch per session (60 s TTL), ranked in-memory per keystroke.
6. **Mounts the right-side file/Git workspace** — the launcher sits left of Session log. Existing conversations use a resizable `details` column and blank sessions use a right-edge overlay; both presentations share the persisted width setting and expand up to 1200px while preserving a minimum conversation width. Files and Git (with Changes / Commits subviews) share one snapshot store, follow the current session from `sessions.list`, and publish remote errors visibly.

### Why localStorage?

The Host settings wire only exposes an allowlisted set of namespaces to browser clients (`dsh-host-apiproxy`'s `WEB_SETTINGS_NAMESPACES`), so a third-party namespace would answer `settings-not-exposed`. `localStorage` matches that boundary for visual preferences while surviving reloads on the same origin.

## Install

The plugin is a standard dsh bundle. Once published to npm, install it into the `web` profile by package name:

```sh
dsh plugin --profile web add dsh-oh-my-theme
```

For local development or before the first npm release, install it by project path:

```sh
# from the project root
dsh plugin --profile web add .
# or from anywhere, by absolute path
dsh plugin --profile web add /path/to/dsh-oh-my-theme
```

Then open the web GUI:

```sh
dsh web
```

## Use

### Skins

Open **Settings → General** — the **Oh My Theme** row sits below the built-in **Appearance** row. Hover a swatch to preview that skin live across the whole page (nothing is saved yet); click to commit. The same row controls conversation, file-tree, and file-preview text sizes plus the preview font. Changes apply immediately and persist in the current browser. **Default** follows the built-in appearance.

### @file mentions

In the composer, type `@` and start typing a path fragment — a menu lists matching files and directories of the current project. Pick a file to insert `@path ` into the draft; click the reference text in the composer to open its preview on the right. The agent reads the file precisely instead of searching blindly. Directory results append `/`, so `@src/` keeps narrowing without opening a preview.

### File tree + file preview

Click the **right-panel** button left of Session log to open the Codex-style panel. Its header switches between project-tree-only, split, and preview-only views, and the whole panel can be resized up to 1200px. Typography is configured globally under **Settings → General → Oh My Theme**. `.md` uses dsh's shared Markdown renderer; recognized source files are mapped from their filename or extension to a Shiki language and render with highlighting and localized copy buttons. Unknown text formats remain plain text. Click the search icon or press `Ctrl/Cmd + P` to Quick Open a file; multiple opened files appear as preview tabs, and closing the active tab selects its neighbor.

### Git changes + commits

Open the right-side workspace and switch to **Git**, then choose **Changes** or **Commits**. The file tree, split-view, and preview controls stay available in the same toolbar; at narrow panel widths the toolbar automatically collapses to icon buttons with hover labels so controls do not wrap. Both Git views start list-only and expand the right-side diff detail after a file or commit is selected, avoiding an empty split pane on narrow panels. The Changes view's **Working tree / Staged index** buttons select the diff source. Commits are loaded from all local and remote refs and shown as a timeline with branch labels. When Git is unavailable or the directory is not a repository, the panel shows the host error while the file tree and preview remain usable.

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
├── test/client.smoke.mjs # browser bundle smoke test
├── THIRD_PARTY_NOTICES.md # notices for Material Icon Theme and other third-party assets
├── README.md
├── docs/README.en.md
├── docs/assets/            # README feature screenshots
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

[MIT](../LICENSE)

---

### Star History

<a href="https://www.star-history.com/?repos=zhxqc%2Fdsh-oh-my-theme&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=zhxqc/dsh-oh-my-theme&type=date&theme=dark&legend=top-left&sealed_token=F3i_HkPdFPQMO_nQlRTo5p60cmXPETrqUQDJwgahekcqGarY3-O21nmQVRoH5XsWrJbFWZHLqR03pf_yZYVwjvW5ViZwpcnyVN0mbVii6NKEwGfuIM5q2gXBkiX_ZR35Z0C4S8lSDFf3os8fM8esW51NNFTrr7hl4DFb0m5M3lVAawC_t31MGWe5qkzN" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=zhxqc/dsh-oh-my-theme&type=date&legend=top-left&sealed_token=F3i_HkPdFPQMO_nQlRTo5p60cmXPETrqUQDJwgahekcqGarY3-O21nmQVRoH5XsWrJbFWZHLqR03pf_yZYVwjvW5ViZwpcnyVN0mbVii6NKEwGfuIM5q2gXBkiX_ZR35Z0C4S8lSDFf3os8fM8esW51NNFTrr7hl4DFb0m5M3lVAawC_t31MGWe5qkzN" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=zhxqc/dsh-oh-my-theme&type=date&legend=top-left&sealed_token=F3i_HkPdFPQMO_nQlRTo5p60cmXPETrqUQDJwgahekcqGarY3-O21nmQVRoH5XsWrJbFWZHLqR03pf_yZYVwjvW5ViZwpcnyVN0mbVii6NKEwGfuIM5q2gXBkiX_ZR35Z0C4S8lSDFf3os8fM8esW51NNFTrr7hl4DFb0m5M3lVAawC_t31MGWe5qkzN" />
 </picture>
</a>
