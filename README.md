# dsh-oh-my-theme

[English](docs/README.en.md)

<p align="center">
  <img alt="npm" src="https://img.shields.io/npm/v/dsh-oh-my-theme?style=flat-square&logo=npm&logoColor=white&label=npm" />
  <img alt="npm downloads" src="https://img.shields.io/npm/dm/dsh-oh-my-theme?style=flat-square&color=cb3837" />
  <img alt="license" src="https://img.shields.io/github/license/zhxqc/dsh-oh-my-theme?style=flat-square" />
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/zhxqc/dsh-oh-my-theme?style=flat-square" />
</p>

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）网页端定制的「主题 + 文件工作台」插件：

1. **皮肤与文字显示** —— 在 **设置 → 通用设置 → Oh My Theme** 中切换配色，并分别调整对话流、文件树和文件预览字号。
2. **@ 引用文件** —— 输入框里输入 `@` 即可搜索当前项目文件，插入 `@路径` 引用，让 AI 精确读取内容，避免盲目搜索消耗上下文。
3. **右侧文件面板** —— Codex 风格的项目文件树与文件预览，可独立显示或分栏显示；Markdown 与常见代码文件支持语法高亮，未知文本格式回退为纯文本。

按第三方插件的标准形态构建（与内置 `ui-*` 系列、[dsh-at-file](https://github.com/FSMargoo/dsh-at-file) 与 [dsh-skin](https://github.com/KinGao294/dsh-skin) 同构）。无构建步骤：宿主半与浏览器半都是手写文件、原样下发。

## 功能

### 🎨 主题与文字显示

> 在 **设置 → 通用设置 → Oh My Theme** 中切换配色，并分别调整对话流、文件树和文件预览的字号与字体。

- **内置 3 套起步皮肤** —— `aurora`（暗色极光紫）、`coffee`（暖色咖啡棕）、`matrix`（暗色终端绿），外加默认跟随内置外观。
- **悬停实时预览** —— 鼠标移到色卡上，整个页面实时套用该皮肤（不落盘）；只有点击才保存选择。
- **全局文字显示** —— 对话流、文件树、文件预览字号可分别配置，预览字体可自定义；修改后立即生效并保存在当前浏览器。

<img src="docs/assets/setting.png" alt="主题与文字显示" width="720" />

### ✨ @ 引用文件

> 在输入框输入 `@` 搜索当前项目文件，插入 `@路径` 引用，让 AI 精确读取内容，避免盲目搜索消耗上下文。

- 按当前会话工作区搜索、排序；选中文件后插入 `@相对路径 `，并自动在右侧打开预览。
- 目录项末尾带 `/`，输入 `@src/` 可继续向下钻取。

<img src="docs/assets/at.png" alt="@ 引用文件" width="720" />

### 📁 右侧文件面板（Codex 风格）

> 点击 Session log 左侧的工作区按钮打开。可切换「仅项目文件 / 文件与预览分栏 / 仅文件预览」，Markdown 与常见代码文件支持语法高亮。

- **懒加载文件树** —— 目录按需逐层加载，自动跳过 `node_modules` / `.git` / 构建产物目录；文件树与 `@` 菜单共用 VSCode Material Icon Theme 图标。
- **独立视图** —— 面板标题栏可切换「仅项目文件 / 分栏 / 仅文件预览」三种布局。
- **Markdown 与代码预览** —— `.md` 使用 dsh 的 Markdown 渲染器；JS/TS/TSX、JSON、HTML/CSS、Vue、Python、Go、Rust、Java、Shell、YAML、SQL、Dockerfile 等常见代码文件复用 Shiki 高亮和复制按钮；未知 UTF-8 文本回退为纯文本（512KB 上限、二进制拒绝读取）。

| 工作区入口 | 文件面板 | Markdown 预览 |
| --- | --- | --- |
| <img src="docs/assets/slider-icon.png" alt="工作区入口" /> | <img src="docs/assets/file-sys.png" alt="文件面板" /> | <img src="docs/assets/md-preview.png" alt="Markdown 预览" /> |

> **数据存放位置**：皮肤、字号、字体等偏好保存在当前浏览器的 `localStorage` 中，不会影响会话数据。


## 安装

本插件是标准 dsh bundle。发布到 npm 后，使用包名安装到 `web` profile：

```sh
dsh plugin --profile web add dsh-oh-my-theme
```

本地开发或尚未发布时，也可以按项目路径安装：
```sh
# 在项目根目录安装
dsh plugin --profile web add .
# 或在任意位置按绝对路径安装
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

### 文件树 + 文件预览

点击 Session log 左侧的**右栏**按钮打开 Codex 风格面板。面板标题栏可切换“仅项目文件 / 分栏 / 仅文件预览”，整个面板可拖拽调整宽度，最大 1200px；文字大小统一在 **设置 → 通用设置 → Oh My Theme** 中配置。`.md` 使用 dsh 共享的 Markdown 渲染器，常见代码文件根据文件名和扩展名映射到 Shiki 语言并显示高亮与中文复制按钮；未知文本格式回退为纯文本。面板始终跟随当前打开会话的工作区。

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

---

### Star 历史

<p align="center">
  <img alt="Star History" src="https://api.star-history.com/svg?repos=zhxqc/dsh-oh-my-theme&type=Date" width="640" />
</p>
