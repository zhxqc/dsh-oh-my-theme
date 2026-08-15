# dsh-oh-my-theme

[English](README.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）网页端定制的「主题 + 文件工作台」插件：

1. **皮肤与文字显示** —— 在 **设置 → 通用设置 → Oh My Theme** 中切换配色，并分别调整对话流、文件树和文件预览字号。
2. **@ 引用文件** —— 输入框里输入 `@` 即可搜索当前项目文件，插入 `@路径` 引用，让 AI 精确读取内容，避免盲目搜索消耗上下文。
3. **右侧文件面板** —— Codex 风格的项目文件树与文件预览，可独立显示或分栏显示；Markdown 支持语法高亮，其他文本文件以纯文本展示。

按第三方插件的标准形态构建（与内置 `ui-*` 系列、[dsh-at-file](https://github.com/FSMargoo/dsh-at-file) 与 [dsh-skin](https://github.com/KinGao294/dsh-skin) 同构）。无构建步骤：宿主半与浏览器半都是手写文件、原样下发。

## 功能

- **内置 3 套起步皮肤** —— `aurora`（暗色极光紫）、`coffee`（暖色咖啡棕）、`matrix`（暗色终端绿），外加默认跟随内置外观。
- **悬停实时预览** —— 鼠标移到色卡上，整个页面实时套用该皮肤（不落盘）；只有点击才保存选择。
- **全局文字显示** —— 在主题设置中分别配置对话流、文件树、文件预览字号，并选择文件预览字体；修改后立即生效并保存在当前浏览器。
- **@ 引用文件** —— 注册输入框 `@` 触发源，按当前会话工作区搜索、排序，选中文件后插入 `@相对路径 ` 并在右侧打开预览；目录项末尾带 `/`，可继续向下钻取。
- **懒加载文件树** —— Session log 左侧的工作区按钮打开项目树，文件树与 `@` 菜单共用 VSCode Material Icon Theme 图标；目录按需逐层加载，自动跳过 `node_modules` / `.git` / 构建产物目录。
- **独立视图** —— 可切换“仅项目文件 / 文件与预览分栏 / 仅文件预览”。`.md` 使用 dsh 基于 Shiki 的 Markdown 渲染器，支持语法高亮和复制按钮；其他 UTF-8 文本以纯文本展示（512KB 上限、二进制拒绝读取）。
- **中英双语** —— 所有界面跟随 GUI 语言。

## 工作原理

dsh 插件包分两半：

- **宿主半**（`lib/index.js`）—— 名为 `workspaceFiles` 的 Typert 远程服务，三个只读、限定工作区的方法：
  - `search(agent, query, signal)` —— 索引会话工作区（忽略规则 + 5000 文件上限），返回排序后的匹配项给 `@` 选择器；
  - `listDir(agent, relPath, signal)` —— 列出一层目录，目录在前排序（文件树懒加载）；
  - `readText(agent, relPath, signal)` —— 读取 UTF-8 文本（512KB 上限、NUL 字节二进制检测）。

  所有方法都在 `agent.session.header.cwd` 内严格解析路径并拒绝目录穿越；只读、不执行任何东西。typert 清单（`TYPERT_MANIFEST` + `ctx.typert.register`）让浏览器半通过内置 `ui-*` 包同款通道调用这些方法。
- **浏览器半**（`lib/client.js`）—— 全部 UI。dsh 的 `dsh-client-modules` 通过 `package.json` 的 `dsh.client` 声明发现它，把 bundle 以 `/plugins/dsh-oh-my-theme/client.js` 提供，由 vendored cordis Loader 经 `window.__ModuleLoader__.load` 执行。

激活时浏览器半做六件事：

1. **注册每套皮肤**到内置主题服务（`ctx.theme.register(...)`），ThemePresenter 把 token 覆盖以内联自定义属性应用到 `<body>`。
2. **恢复上次皮肤选择**（localStorage 键 `dsh-oh-my-theme:skin`）。
3. **恢复文字显示设置** —— 从 localStorage 读取对话流、文件树、文件预览字号和预览字体，通过页面级 CSS 变量立即应用。
4. **挂载 `workspaceFiles` 远程**（`ctx.remote.$mount(OHMY_REMOTE)` → `ctx.reflect.get("remote.workspaceFiles")`）。
5. **注册 `@` 触发源**到 `inputTriggers` —— 每个会话一次索引（60 秒 TTL），按键时内存内排序。
6. **挂载右侧文件面板** —— 入口位于 Session log 左侧；已有对话使用可拖到 860px 的 `details` 右栏，空白新会话自动改用固定右侧面板。面板仅在打开时临时占用对应展示位，关闭后归还内置详情；两种形态共享同一个快照 store，跟随 `sessions.list` 的当前会话，并把远程就绪状态发布到界面。

### 为什么用 localStorage？

Host 的 settings 通道只对浏览器客户端暴露白名单命名空间（`dsh-host-apiproxy` 的 `WEB_SETTINGS_NAMESPACES`），第三方命名空间会被回答 `settings-not-exposed`。`localStorage` 在视觉偏好边界上与之一致，同时能在同源下跨刷新存活。

## 安装

本插件是标准 dsh bundle，用 `dsh plugin` 命令安装（转发给 profile 目录里的 pnpm）：

```sh
# 在项目根目录 —— 装进你的 web profile
dsh plugin --profile web add .
# 或任意位置按路径安装：
dsh plugin --profile web add /path/to/dsh-oh-my-theme
```

然后启动网页端：

```sh
dsh web
```

## 使用

### 皮肤

打开 **设置 → 通用设置**，「Oh My Theme」行位于内置「外观」行下方。把鼠标移到色卡上可实时预览整个页面的效果（此时不会保存）；点击才确认生效。同一区域还可分别设置对话流、文件树、文件预览字号以及预览字体，修改后立即生效并保存在当前浏览器中。「默认」恢复跟随内置外观。

### @ 引用文件

在输入框输入 `@` 并继续输入路径片段 —— 弹出菜单列出当前项目的匹配文件和目录。选中文件会插入 `@路径 ` 并在右侧自动打开预览；AI 会精确读取该文件，而不是盲目搜索。目录项末尾带 `/`，输入 `@src/` 可以继续缩小范围，但不会打开预览。

### 文件树 + Markdown 预览

点击 Session log 左侧的**右栏**按钮打开 Codex 风格面板。面板标题栏可切换“仅项目文件 / 分栏 / 仅文件预览”；文字大小统一在 **设置 → 通用设置 → Oh My Theme** 中配置。`.md` 使用 dsh 共享的 Shiki Markdown 渲染器，围栏代码支持语法高亮和中文复制按钮；其他文本文件以纯文本展示。面板始终跟随当前打开会话的工作区。

## 添加你自己的皮肤

打开 `lib/client.js`，在 `SKINS` 目录里加一条：

```js
{
  id: "my-skin",                    // 唯一 id；永远不要用 "system"
  colorScheme: "dark",              // "light" | "dark" —— 基础色系
  tokens: {
    "--dsw-alias-bg-base": "#0b0e1a",
    // ... 下表任意子集；未覆盖的 token 保持基础主题不变
  }
}
```

再补两个词典键（zh + en），例如 `"theme.my-skin": "我的皮肤"` / `"theme.my-skin": "My Skin"`。刷新页面即可 —— 选择器色卡、注册、持久化恢复全部自动从 `SKINS` 数组派生。

### Token 参考

可覆盖的配色 token（使用具体 CSS 颜色，不要 `var()` 间接引用 —— 与内置样式表同一套）：

| Token | 作用 |
| --- | --- |
| `--dsw-alias-bg-base` | 根背景 |
| `--dsw-alias-bg-layer-1/2/3` | 表面层级（卡片、输入框、气泡…） |
| `--dsw-alias-bg-overlay` | 浮层 / 弹层表面 |
| `--dsw-alias-border-l1/l2` | 细分隔线 |
| `--dsw-alias-label-primary/secondary/tertiary` | 文字强调层级 |
| `--dsw-alias-brand-primary` / `--dsw-alias-brand-text` | 品牌色及其前景色 |
| `--dsw-alias-button-primary-hover` / `--dsw-alias-button-primary-dimmed` | 主按钮状态 |
| `--dsw-alias-state-business-primary/tertiary` | 业务/状态强调色 |
| `--dsw-alias-interactive-bg-hover/active` | 悬停/按下填充 |
| `--dsw-alias-markdown-code-block` / `--dsw-alias-markdown-inline-code` | 代码表面 |
| `--dsw-specific-sidebar-fill` / `--dsw-specific-sidebar-nav-item-active` / `--dsw-specific-sidebar-nav-item-hover` | 侧边栏 |
| `--dsw-alias-scrollbar-bg-l1/l2` / `--dsw-alias-scrollbar-hover-l1/l2` | 滚动条 |

建议：至少保证 `bg-base`/`bg-layer-1`、`label-primary`/`label-secondary`、`brand-primary` 和一个边框 token 的对比度一致；只覆盖表面栈的一小部分通常看起来是坏的。

## 项目结构

```
dsh-oh-my-theme/
├── package.json        # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml    # 插入 `oh-my-theme` 加载行
├── lib/
│   ├── index.js        # 宿主半 —— workspaceFiles Typert 远程服务
│   ├── client.js       # 浏览器半 —— 皮肤、@ 引用、文件树
│   └── types/          # 类型桩
├── test/host.test.mjs  # 宿主服务单元测试（node --test）
├── test/client.smoke.mjs # 浏览器 bundle 冒烟测试
├── THIRD_PARTY_NOTICES.md # Material Icon Theme 等第三方资源声明
├── README.md / README.zh.md
└── LICENSE
```

## 开发

```sh
node --test test/host.test.mjs   # 宿主服务测试
node test/client.smoke.mjs      # 客户端 bundle 冒烟测试
```

## TODO

- [ ] **Git 只读集成（优先）**
  - 在右侧工作台增加“更改”和“提交”视图；
  - “更改”按已暂存、未暂存、未跟踪分组，文件支持状态标识和 Diff 预览；
  - “提交”分页展示提交摘要、作者和时间，点击后查看文件列表与提交 Diff；
  - 宿主半只开放固定的只读 Git 方法，校验工作区、路径、提交哈希，并限制执行时间和输出大小；
  - Diff 优先复用 dsh 内置 `DiffBlock`，避免给当前无构建步骤的浏览器 bundle 引入重型组件库。
- [ ] **Git 写操作（二期评估）** —— 暂存、取消暂存、提交、分支切换和冲突处理需要额外的确认、权限与恢复设计，不纳入首期。

## 卸载

```sh
dsh plugin --profile web remove dsh-oh-my-theme
```

## 许可证

[MIT](LICENSE)
