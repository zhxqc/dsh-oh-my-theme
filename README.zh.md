# dsh-oh-my-theme

[English](README.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）网页端定制的主题/皮肤插件：精选的 `--dsw-alias-*` 配色皮肤，直接在 **设置 → 常规** 里切换，支持明暗色系，按浏览器持久化。

按第三方 Cordis 客户端插件的标准形态构建（与内置 `ui-*` 系列包和 [dsh-skin](https://github.com/KinGao294/dsh-skin) 插件同构）：无构建步骤、无宿主代码，可直接安装进 profile。

## 功能

- **内置 3 套起步皮肤** —— `aurora`（暗色极光紫）、`coffee`（暖色咖啡棕）、`matrix`（暗色终端绿），外加默认跟随内置外观。
- **设置 → 常规 里的选择器** —— 每套皮肤一张色卡，位于内置「外观」行正下方。
- **悬停预览、点击确认** —— 鼠标移到色卡上，整个页面实时套用该皮肤（不落盘）；只有点击才真正保存选择。
- **明暗感知** —— 每套皮肤声明自己的基础 `colorScheme`，`html { color-scheme }` 与 `body[data-ds-dark-theme]` 跟随皮肤而不是操作系统。
- **按浏览器持久化** —— 选择存在 `localStorage`（原因见下）。
- **中英双语** —— 设置行跟随 GUI 语言。
- **极易扩展** —— 皮肤就是纯数据：往 `SKINS` 目录加一条、补两个词典键即可。

## 工作原理

dsh 插件包分两半：

- **宿主半**（`lib/index.js`）—— 刻意留空的加载项。
- **浏览器半**（`lib/client.js`）—— 全部功能所在。dsh 的 `dsh-client-modules` 通过 `package.json` 里的 `dsh.client` 声明发现它，把 bundle 以 `/plugins/dsh-oh-my-theme/client.js` 提供出来，由 vendored cordis Loader 经 `window.__ModuleLoader__.load` 执行——与所有内置 `ui-*` 包完全相同的契约。

浏览器半在激活时做四件事：

1. **注册每套皮肤**到内置主题服务（`ctx.theme.register(...)`）。一套皮肤 = id + `colorScheme` + 一组 `--dsw-alias-*` token 覆盖值；ThemePresenter 会把它以内联自定义属性应用到 `<body>` 上。
2. **恢复上次选择**（localStorage 键 `dsh-oh-my-theme:skin`），用 `ctx.theme.setTheme(id)` 切换。
3. **挂载选择器行**到 `settings.general.item` 插槽（id `oh-my-theme`，`order: 20`，紧跟内置「外观」行的 `order: 10`），把主题快照镜像进一个小 store。
4. **通过 `theme/change` 事件保持同步**。

### 为什么用 localStorage？

Host 的 settings 通道只对浏览器客户端暴露一个白名单命名空间集合（`dsh-host-apiproxy` 的 `WEB_SETTINGS_NAMESPACES`），第三方命名空间会被回答 `settings-not-exposed`。产品自身对远程浏览器的偏好也保持进程内；`localStorage` 在视觉偏好这个边界上与之一致，同时能在同源下跨刷新存活。

## 安装

本插件是标准 dsh bundle，用 `dsh plugin` 命令安装（它会转发给 profile 目录里的 pnpm）：

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

打开 **设置 → 常规**，「Oh My Theme」行位于内置「外观」行下方。把鼠标移到色卡上可实时预览该皮肤在整个页面的效果（此时不会保存）；点击才确认生效，下次打开页面仍会记住。「默认」恢复跟随内置外观（`light` / `dark` / `system`）。

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

再补两个词典键（zh + en），例如 `"theme.my-skin": "我的皮肤"` / `"theme.my-skin": "My Skin"`。刷新页面即可——选择器色卡、注册、持久化恢复全部自动从 `SKINS` 数组派生。

### Token 参考

可覆盖的配色 token（使用具体 CSS 颜色，不要 `var()` 间接引用——与内置样式表同一套）：

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
│   ├── index.js        # 宿主半（空壳）
│   ├── client.js       # 浏览器半 —— 主题插件本体
│   └── types/          # 类型桩
├── README.md / README.zh.md
└── LICENSE
```

## 卸载

```sh
dsh plugin --profile web remove dsh-oh-my-theme
```

## 许可证

[MIT](LICENSE)
