# Export MD notes

> English version: [see below](#english).

把 Obsidian 里的 Markdown 笔记一键导出为**图片**：既能导出按比例自动分页的**多页卡片**（小红书 3:4、抖音 9:16、方形 1:1、通用 4:5），也能导出一张到底的**完整长图**。支持 PNG / JPG / PDF、作者栏、水印、纹理背景、自定义字体与封面，桌面端与移动端均可用；在 macOS 上还能把笔记里的动态素材导出为实况照片（Live Photos）。

它不是某个平台的专用发布器，而是一个通用的「**笔记 → 图片**」导出工具：小红书、抖音、公众号配图、手帐卡片、教程长图、资料归档……都可以用同一套排版完成。

插件 id：`export-md-notes`（原名 xhs-longform）

---

## 效果展示

**分页卡片导出效果**（自动分页、封面、作者栏、页码、纹理背景）

<p>
<img width="22%" alt="导出效果 1" src="https://github.com/user-attachments/assets/06b2a387-be76-4624-a13f-256a0d7a46f4" />
<img width="22%" alt="导出效果 2" src="https://github.com/user-attachments/assets/500ae3d4-2ee8-432e-9f91-2f11f6bc7e82" />
<img width="22%" alt="导出效果 3" src="https://github.com/user-attachments/assets/68bec592-5bc2-4160-915c-c9a1f06c4634" />
<img width="22%" alt="导出效果 4" src="https://github.com/user-attachments/assets/f161098b-5523-49df-9cdb-b03e801993b7" />
</p>

**平板 / 桌面端**：实时预览 + 排版参数面板，水印、纹理、字体、配色所见即所得

<p>
<img width="48%" alt="平板端：水印设置" src="https://github.com/user-attachments/assets/bf8ee822-8d50-4bbf-be55-67c5f5c5543a" />
<img width="48%" alt="平板端：视觉样式" src="https://github.com/user-attachments/assets/83b6ba32-b522-4c3b-a3b3-90220a446d9b" />
</p>

**移动端**：手机上同样可以设置参数、实时预览并导出

<p>
<img width="26%" alt="移动端导出界面" src="https://github.com/user-attachments/assets/a657b45e-6ea2-4079-a95e-6189838be12c" />
</p>

---

## 功能特性

### 两种导出模式

- **分页卡片**：按所选画布比例自动分页，每页带页码，可选择只导出指定页
- **完整长图**：宽度固定、高度按内容自动计算（最高 16000px），一张图到底，无需手动拼接

### 多种画布比例

| 选项 | 尺寸（宽 × 高） | 典型用途 |
| --- | --- | --- |
| 小红书 3:4 | 1080 × 1440 | 小红书图文 |
| 抖音 9:16 | 1080 × 1920 | 抖音 / 竖屏图文 |
| 方形 1:1 | 1080 × 1080 | 朋友圈、Instagram、配图 |
| 通用 4:5 | 1080 × 1350 | 通用竖版配图 |
| 长图 | 1080 × 自适应 | 教程、读书笔记、资料归档 |

### 排版与样式

- **跟随主题**：排版、字重、配色自动跟随当前 Obsidian 主题，深色 / 浅色自动适配，观感与笔记本身统一
- **封面与作者栏**：可选顶部封面图（上传或填 URL）、头像、底部昵称 / 一句话副标题；作者名可放在左上角（页眉式）或右下角（脚注式）；头像、封面、作者名均为可选项，自由搭配
- **水印**：斜向点阵水印，支持平铺覆盖或固定在五个角 / 居中，透明度 1%–30%、颜色、平铺密度均可调；留空时跟随昵称或主题色
- **背景纹理**：格子纸 / 圆点纸 / 横线纸，也可以粘贴自定义 CSS 实现任意纹理
- **字体自由**：跟随主题字体、内置 / 开源手写字体（小赖字体、内海字体、快去写作业 CJK 等），也支持导入自己的字体文件（ttf / otf / woff / woff2）
- **字号与边距**：标题、小标题、正文字号与上下 / 左右边距均可调
- **导出格式与倍率**：分页卡片支持 PNG / JPG，长图支持 PNG / JPG / PDF（单页文档）；支持 1x–4x 画质倍率

### 内容支持

- 完整支持标题、段落、引用、代码块、列表、任务勾选、表格、数学公式、标签、链接、行内代码与高亮
- 图片自动下载并转为本地引用，支持双图并排
- **视频封面**：自动拉取哔哩哔哩、YouTube、抖音的视频封面；拉取失败时保留原生播放器，不显示占位符
- **Dataview**：笔记中的 Dataview / DataviewJS 查询结果可在导出中正确渲染（需已启用 Dataview 插件）
- **动态素材**：笔记中的 gif / mp4 / mov，在 macOS 上可导出为**实况照片（Live Photos）**并导入系统「照片」

### 跨平台

- 桌面端（Windows / macOS / Linux）与移动端（iOS / Android）均可加载使用（`isDesktopOnly: false`）
- 桌面端可选择导出到仓库文件夹或电脑指定文件夹；移动端导出到仓库文件夹后，可在 Obsidian 文件浏览器中查看，再用系统能力保存或分享

---

## 安装

### 方式一：Release 手动安装（推荐移动端 / 离线环境）

1. 到 [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases) 下载最新的 `export-md-notes-<版本>-install.zip`
2. 解压得到 `export-md-notes` 文件夹，内含 `main.js`、`manifest.json`、`styles.css` 与 `assets/`（内置字体资源）
3. 放入 Vault 的 `.obsidian/plugins/export-md-notes/` 目录
4. 重启 Obsidian 或刷新插件列表，在「第三方插件」中启用 **Export MD notes**

> 安装包约 37MB，是因为内置了开源中文字体（woff2）以保证移动端 / 离线环境下的排版效果；如果不需要这些字体，可删除 `assets/fonts/` 目录，插件会改用主题字体或在联网时按需下载。

### 方式二：从源码构建

见下方[「从源码构建」](#从源码构建)。

---

## 使用方法

1. 打开一篇 Markdown 笔记
2. 通过以下任一入口打开导出窗口：
   - 命令面板（`Ctrl/Cmd + P`）→ 搜索「**导出当前笔记为长图/图片**」
   - 编辑器右键菜单 →「导出为长图 / 图片」
3. 在弹窗中调整：
   - **画布比例**：小红书 3:4 / 抖音 9:16 / 1:1 / 4:5 / 长图
   - **视觉样式**：风格、配色、字体、纹理、字号、边距
   - **固定信息**（均为选填）：顶部封面图、头像、底部昵称与副标题、作者名位置
   - **水印**：开关、文字、透明度、颜色、位置与平铺密度
   - **导出格式 / 画质**：PNG / JPG / PDF、1x–4x
   - **导出位置**：仓库内目录（支持 `{{title}}` 模板）或电脑文件夹
4. 「排版预览」实时查看分页效果，也可切到「Markdown 渲染」对照原文
5. 选择导出范围并点击「导出」：
   - 分页模式支持按页选择，语法：单页 `8`、列表 `1,2,4`、范围 `1-6`、混合 `1,3-5,8`
   - 长图模式会提示「将导出 1 张完整长图」，确认后开始
6. 桌面端可点「打开文件夹」定位导出结果；移动端按提示在仓库文件浏览器中查看

---

## 从源码构建

环境要求：Node v22 + esbuild（0.28.x）。

```bash
# 安装依赖
npm install

# 构建（输出到 pkg_1625/main.js）
node build-1625.js
```

将构建出的 `pkg_1625/main.js` 与根目录的 `manifest.json`、`styles.css`、`assets/` 一起放入插件目录即可使用。

## 架构

插件分两条相互独立的链路：

- **分页链路**：`parser.ts`（Markdown 解析）→ `paginate.ts`（分页）→ `render.ts`（单页 DOM 渲染）→ `export.ts`（导出）
- **长图链路**：`md-render.ts`（MarkdownRenderer 渲染）→ `longform-capture.ts`（截图）→ `export.ts`（导出）

统一入口为 `main.ts`（插件入口）与 `modal.ts`（导出弹窗 UI）；预设见 `presets.ts`，字体见 `fonts*.ts`，视频封面见 `covers.ts`，实况照片见 `motion-export.ts`。

## 更新日志

当前版本：**1.6.25**

- 1.6.25：长图预览保留原生 iframe；仅在导出截图前临时替换视频封面，封面拉取失败时保留原生播放器，不再显示占位符
- 1.6.24：iframe 双链路修复（分页链路识别 B 站播放器地址 + 长图封面替换）
- 1.6.21–1.6.23：渲染页输入框布局与宽度优化
- 1.6.20：页码各格式预览 / 定位 / 导出编号
- 1.6.19：字号设置持久化
- 1.6.16：长图宽度输入控件

各版本安装包见 [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases)。

## Credits

Export MD notes 是在以下 MIT 许可开源项目基础上开发 / 改造的派生作品，特此感谢与声明：

- [zhy9495/obsidian-xhs-longform](https://github.com/zhy9495/obsidian-xhs-longform)（MIT）— 分页卡片导出与移动端适配的基础
- [zhouhua/obsidian-export-image](https://github.com/zhouhua/obsidian-export-image)（MIT）— 文章导出为长图 / 图片的参考实现（水印、作者信息、倍率输出等）

打包进 main.js 的第三方库 `dom-to-image-more`（MIT）、`modern-screenshot`（MIT）均保留原许可证声明；内置字体（小赖字体、内海字体、快去写作业 CJK）均遵循各自的 OFL 开源许可，许可证文件随 `assets/fonts/` 分发。

完整版权声明见 [LICENSE](LICENSE)，本项目同样以 MIT 许可开源。

## 说明

- 作者：Marvis / Felix

---
---

# English

# Export MD notes

Export your Obsidian Markdown notes as **images** in one click — either **paginated cards** sized for popular platforms (Xiaohongshu/RED 3:4, Douyin/TikTok 9:16, square 1:1, universal 4:5) or a single **full-length long image**. It supports PNG / JPG / PDF, author bars, watermarks, textured backgrounds, custom fonts and cover images, works on desktop and mobile, and on macOS can export embedded motion content as Live Photos.

It is **not** a publisher for any single platform — it is a general-purpose **note-to-image** exporter for social cards, tutorial long images, handout-style cards, article illustrations and personal archives.

Plugin id: `export-md-notes` (formerly xhs-longform).

## Showcase

**Paginated cards** (auto pagination, cover, author bar, page numbers, paper textures)

<p>
<img width="22%" alt="Export sample 1" src="https://github.com/user-attachments/assets/06b2a387-be76-4624-a13f-256a0d7a46f4" />
<img width="22%" alt="Export sample 2" src="https://github.com/user-attachments/assets/500ae3d4-2ee8-432e-9f91-2f11f6bc7e82" />
<img width="22%" alt="Export sample 3" src="https://github.com/user-attachments/assets/68bec592-5bc2-4160-915c-c9a1f06c4634" />
<img width="22%" alt="Export sample 4" src="https://github.com/user-attachments/assets/f161098b-5523-49df-9cdb-b03e801993b7" />
</p>

**Tablet / desktop**: live preview with a full styling panel — watermark, texture, fonts and palettes are WYSIWYG

<p>
<img width="48%" alt="Tablet: watermark settings" src="https://github.com/user-attachments/assets/bf8ee822-8d50-4bbf-be55-67c5f5c5543a" />
<img width="48%" alt="Tablet: visual styles" src="https://github.com/user-attachments/assets/83b6ba32-b522-4c3b-a3b3-90220a446d9b" />
</p>

**Mobile**: configure, preview and export right from your phone

<p>
<img width="26%" alt="Mobile export screen" src="https://github.com/user-attachments/assets/a657b45e-6ea2-4079-a95e-6189838be12c" />
</p>

## Features

### Two export modes

- **Paginated cards**: automatically split into pages at the chosen aspect ratio, with page numbers and selectable page ranges
- **Long image**: fixed width, height grows with content (up to 16000px) — one complete image, no manual stitching

### Canvas sizes

| Option | Size (W × H) | Typical use |
| --- | --- | --- |
| Xiaohongshu 3:4 | 1080 × 1440 | RED / Xiaohongshu posts |
| Douyin 9:16 | 1080 × 1920 | Douyin / TikTok-style vertical posts |
| Square 1:1 | 1080 × 1080 | social feeds, Instagram, illustrations |
| Universal 4:5 | 1080 × 1350 | general vertical images |
| Long image | 1080 × adaptive | tutorials, reading notes, archives |

### Styling

- **Theme-aware**: layout, font weights and colors follow your current Obsidian theme, with automatic light/dark adaptation
- **Cover & author bar** (all optional): top cover image (upload or URL), avatar, bottom nickname / tagline; the author name can sit at the top-left (header style) or bottom-right (footnote style)
- **Watermark**: diagonal tiled text watermark with 1%–30% opacity, custom color, five anchor positions / centered / full tiling and adjustable tile density; falls back to your nickname or theme color when left empty
- **Background textures**: grid paper / dot paper / ruled paper, or paste custom CSS for any texture you want
- **Fonts**: follow the theme, use built-in open-source handwritten fonts (Xiaolai, Naikai, CEF CJK), or import your own font files (ttf / otf / woff / woff2)
- **Fine control**: title / subtitle / body font sizes and page margins are adjustable
- **Formats & scale**: PNG / JPG for cards; PNG / JPG / PDF (single-page document) for long images; 1x–4x output scale

### Content support

- Headings, paragraphs, quotes, code blocks, lists, tasks, tables, math, tags, links, inline code and highlights
- Images are downloaded and embedded automatically; side-by-side image pairs supported
- **Video covers**: auto-fetches covers for Bilibili, YouTube and Douyin embeds; if a cover can't be fetched, the native player is kept instead of a placeholder
- **Dataview**: Dataview / DataviewJS query results render correctly in exports (requires the Dataview plugin)
- **Motion content**: embedded gif / mp4 / mov can be exported as **Live Photos** on macOS and imported into the system Photos library

### Cross-platform

- Works on desktop (Windows / macOS / Linux) and mobile (iOS / Android) (`isDesktopOnly: false`)
- Desktop can export into the vault or a chosen computer folder; mobile exports into the vault folder, where you can open the files in Obsidian's file browser and save/share them with the system UI

## Installation

1. Download the latest `export-md-notes-<version>-install.zip` from [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases)
2. Unzip it to get the `export-md-notes` folder containing `main.js`, `manifest.json`, `styles.css` and `assets/` (bundled fonts)
3. Place it under `<vault>/.obsidian/plugins/export-md-notes/`
4. Restart Obsidian (or refresh the plugin list) and enable **Export MD notes** under Community plugins

> The install zip is ~37MB because it bundles open-source Chinese fonts (woff2) for consistent typography on mobile / offline. If you don't need them, delete `assets/fonts/`; the plugin will then use theme fonts or download fonts on demand when online.

## Usage

1. Open a Markdown note
2. Open the export dialog via either:
   - Command Palette (`Ctrl/Cmd + P`) → "**Export current note as long image / images**"
   - Editor right-click menu → "Export as long image / images"
3. Adjust in the dialog:
   - **Canvas size**: RED 3:4 / Douyin 9:16 / 1:1 / 4:5 / long image
   - **Visual styles**: style, palette, fonts, texture, font sizes, margins
   - **Branding** (optional): top cover, avatar, bottom nickname / tagline, author position
   - **Watermark**: toggle, text, opacity, color, position and tile density
   - **Format / quality**: PNG / JPG / PDF, 1x–4x
   - **Export location**: a vault folder (supports a `{{title}}` template) or a computer folder
4. Use "Layout preview" for the paginated result, or switch to "Markdown rendering" to compare with the source
5. Pick the page range (paginated mode) and click **Export**:
   - Page syntax: single `8`, list `1,2,4`, range `1-6`, mixed `1,3-5,8`
   - Long-image mode asks for confirmation, then produces one complete image
6. On desktop, use "Open folder" to locate the results; on mobile, follow the notice to find them in the vault file browser

## Build from source

Requires Node v22 and esbuild 0.28.x:

```bash
npm install
node build-1625.js   # outputs pkg_1625/main.js
```

Copy the built `pkg_1625/main.js` together with the root `manifest.json`, `styles.css` and `assets/` into the plugin folder.

## Architecture

Two independent pipelines:

- **Paginated**: `parser.ts` (Markdown parse) → `paginate.ts` (pagination) → `render.ts` (per-page DOM render) → `export.ts`
- **Long image**: `md-render.ts` (MarkdownRenderer) → `longform-capture.ts` (capture) → `export.ts`

Entry points: `main.ts` (plugin) and `modal.ts` (export dialog). Presets live in `presets.ts`, fonts in `fonts*.ts`, video covers in `covers.ts`, Live Photos in `motion-export.ts`.

## Changelog

Current version: **1.6.25**

- 1.6.25: Long-image preview keeps native iframes; video covers are swapped only at capture time, and failed cover fetches keep the original embed instead of a placeholder
- 1.6.24: iframe fixes on both pipelines (Bilibili player URLs in pagination + cover replacement in long images)
- 1.6.21–1.6.23: Render-page input layout and width refinements
- 1.6.20: Page-number preview / positioning / export numbering
- 1.6.19: Persisted font sizes
- 1.6.16: Long-image width control

Release packages: [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases).

## Credits

Export MD notes is a derivative work built on top of these MIT-licensed projects:

- [zhy9495/obsidian-xhs-longform](https://github.com/zhy9495/obsidian-xhs-longform) (MIT) — base for paginated card export and mobile support
- [zhouhua/obsidian-export-image](https://github.com/zhouhua/obsidian-export-image) (MIT) — reference for long-image/article export (watermark, author info, scaled output)

Bundled libraries `dom-to-image-more` (MIT) and `modern-screenshot` (MIT) keep their original license notices; bundled fonts (Xiaolai, Naikai, CEF CJK) are distributed under their OFL licenses, included alongside the fonts in `assets/fonts/`.

See [LICENSE](LICENSE) for the full copyright notice; this project is released under the MIT License.

## Authors

Marvis / Felix
