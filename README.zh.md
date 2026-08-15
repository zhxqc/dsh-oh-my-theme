# dsh-oh-my-theme

[English](README.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）网页端定制的「主题 + 文件工作台」插件：

1. **皮肤主题** —— 精选的 `--dsw-alias-*` 配色皮肤，在 **设置 → 常规** 里切换；悬停色卡实时预览，点击确认生效。
2. **@ 引用文件** —— 输入框里输入 `@` 即可搜索当前项目文件，插入 `@路径` 引用，让 AI 精确读取内容，避免盲目搜索消耗上下文。
3. **侧边栏文件树 + Markdown 预览** —— 侧边栏懒加载项目目录树，点击 `.md` 文件直接渲染预览。

按第三方插件的标准形态构建（与内置 `ui-*` 系列、[dsh-at-file](https://github.com/FSMargoo/dsh-at-file) 与 [dsh-skin](https://github.com/KinGao294/dsh-skin) 同构）。无构建步骤：宿主半与浏览器半都是手写文件、原样下发。

## 功能

- **内置 3 套起步皮肤** —— `aurora`（暗色极光紫）、`coffee`（暖色咖啡棕）、`matrix`（暗色终端绿），外加默认跟随内置外观。
- **悬停实时预览** —— 鼠标移到色卡上，整个页面实时套用该皮肤（不落盘）；只有点击才保存选择。
- **@ 引用文件** —— 注册输入框 `@` 触发源，按当前会话工作区搜索、排序，选中后插入 `@相对路径 `；目录项末尾带 `/`，可继续向下钻取。
- **懒加载文件树** —— 侧边栏底部开关打开项目树，目录按需逐层加载，自动跳过 `node_modules` / `.git` / 构建产物目录。
- **Markdown 预览** —— 点击 `.md` 文件，用 DSH 共享的 Markdown 组件渲染（UTF-8 文本、512KB 上限、二进制文件拒绝读取）。
- **中英双语** —— 所有界面跟随 GUI 语言。

## 工作原理

dsh 插件包分两半：

- **宿主半**（`lib/index.js`）—— 名为 `workspaceFiles` 的 Typert 远程服务，三个只读、限定工作区的方法：
  - `search(agent, query, signal)` —— 索引会话工作区（忽略规则 + 5000 文件上限），返回排序后的匹配项给 `@` 选择器；
  - `listDir(agent, relPath, signal)` —— 列出一层目录，目录在前排序（文件树懒加载）；
  - `readText(agent, relPath, signal)` —— 读取 UTF-8 文本（512KB 上限、NUL 字节二进制检测）。

  所有方法都在 `agent.session.header.cwd` 内严格解析路径并拒绝目录穿越；只读、不执行任何东西。typert 清单（`TYPERT_MANIFEST` + `ctx.typert.register`）让浏览器半通过内置 `ui-*` 包同款通道调用这些方法。
- **浏览器半**（`lib/client.js`）—— 全部 UI。dsh 的 `dsh-client-modules` 通过 `package.json` 的 `dsh.client` 声明发现它，把 bundle 以 `/plugins/dsh-oh-my-theme/client.js` 提供，由 vendored cordis Loader 经 `window.__ModuleLoader__.load` 执行。

激活时浏览器半做五件事：

1. **注册每套皮肤**到内置主题服务（`ctx.theme.register(...)`），ThemePresenter 把 token 覆盖以内联自定义属性应用到 `<body>`。
2. **恢复上次皮肤选择**（localStorage 键 `dsh-oh-my-theme:skin`）。
3. **挂载 `workspaceFiles` 远程**（`ctx.remote.$mount(OHMY_REMOTE)` → `ctx.reflect.get("remote.workspaceFiles")`）。
4. **注册 `@` 触发源**到 `inputTriggers` —— 每个会话一次索引（60 秒 TTL），按键时内存内排序。
5. **挂载文件树抽屉** —— `sidebar.footer.action` 的开关按钮 + root 作用域 `shell.overlay` 列表槽里的抽屉（overlay 层是 `pointer-events: none`、子项 auto，抽屉可交互而页面其余部分保持可点）。两个槽共享同一个快照 store，并跟随 `sessions.list` 的当前会话。

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

打开 **设置 → 常规**，「Oh My Theme」行位于内置「外观」行下方。把鼠标移到色卡上可实时预览整个页面的效果（此时不会保存）；点击才确认生效。「默认」恢复跟随内置外观。

### @ 引用文件

在输入框输入 `@` 并继续输入路径片段 —— 弹出菜单列出当前项目的匹配文件和目录。选中即插入 `@路径 `；AI 会精确读取该文件，而不是盲目搜索。目录项末尾带 `/`，输入 `@src/` 可以继续缩小范围。

### 文件树 + Markdown 预览

点击侧边栏底部（左栏最下方）的**文件夹**按钮打开文件树抽屉。目录按需展开；点击 `.md` 文件，预览渲染在树下方。文件树始终跟随当前打开会话的工作区。

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
├── README.md / README.zh.md
└── LICENSE
```

## 开发

```sh
node --test test/host.test.mjs   # 宿主服务测试
node test/client.smoke.mjs      # 客户端 bundle 冒烟测试
```

## 卸载

```sh
dsh plugin --profile web remove dsh-oh-my-theme
```

## 许可证

[MIT](LICENSE)
