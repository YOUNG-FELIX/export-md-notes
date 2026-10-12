# Export MD notes

![GitHub Release](https://img.shields.io/github/v/release/YOUNG-FELIX/export-md-notes?style=flat)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.6.6%2B-7c3aed?logo=obsidian&logoColor=white)
![Downloads](https://img.shields.io/github/downloads/YOUNG-FELIX/export-md-notes/total?style=flat)

> English version: [see below](#english).

把 Obsidian 里的 Markdown 笔记一键导出为**图片**：既能导出按比例自动分页的**多页卡片**（小红书 3:4、抖音 9:16、方形 1:1、通用 4:5），也能导出一张到底的**完整长图**。

它不是某个平台的专用发布器，而是一通用的「**笔记 → 图片**」导出工具：小红书、抖音、公众号配图、手帐卡片、教程长图、读书笔记、资料归档……都可以用同一套排版完成。左边调整参数，右边实时预览，确认后点一次导出即可。

解析、排版、分页与截图全部在本地完成，笔记内容不会上传（详见[隐私](#隐私)）。桌面端与移动端均可用；macOS 上还能把笔记里的动态素材导出为实况照片（Live Photos）。

插件 id：`export-md-notes`

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

## 这是什么

用最简单的话说，它可以：

- 把一篇 Obsidian 笔记导出成多张分页卡片（如 1080×1440 PNG），或一张高度自适应的完整长图
- 根据真实字体与页面空间自动分页，放不下的内容自动进入下一页
- 导出前实时调整画布比例、封面、头像、字体、字号、配色、纹理、水印与边距
- 自动拉取笔记中 B 站 / YouTube / 抖音视频的封面；Dataview 查询结果也能正确渲染
- 在 macOS 上把含 gif / mp4 / mov 的页面制成实况照片并导入系统「照片」

## 适合谁用

- 常写读书笔记、教程、清单、手帐，想顺手发小红书 / 抖音 / 公众号的 Obsidian 用户
- 需要统一封面、头像、作者名、水印与排版风格的内容创作者
- 嫌「截图拼长图」太麻烦、想要一键自动导出的人
- 希望排版与渲染在本地完成、不上传笔记内容的人

## 功能特性

### 两种导出模式

- **分页卡片**：按所选画布比例自动分页，每页带页码，可选择只导出指定页
- **完整长图**：宽度固定（默认 1080，可自定义）、高度按内容自动计算（上限 16000px），一张图到底，无需手动拼接

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
- **封面与作者栏**：可选顶部封面图（上传或填 URL）、头像、底部昵称 / 一句话副标题；作者名可放在左上角（页眉式）或右下角（脚注式）；头像、封面、作者名均为可选项，自由搭配（详见[封面组合逻辑](#封面组合逻辑)）
- **水印**：斜向点阵水印，支持平铺覆盖或固定在左上 / 右上 / 左下 / 右下 / 居中，透明度 1%–30%、颜色、字号、平铺密度（稀疏 / 适中 / 密集 / 自定义）均可调；文字留空时跟随底部昵称，昵称也为空则不显示
- **背景纹理**：跟随主题（无纹理）/ 跟随配色推荐 / 格子纸 / 圆点纸 / 横线纸，也可以粘贴自定义 CSS 实现任意纹理；背景色支持自定义
- **字体自由**：跟随主题字体、简约黑体、本机手写字体、开源手写字体，或在设置中导入自己的字体文件（详见[字体说明](#字体说明)）
- **字号与边距**：标题、小标题、正文字号按百分比调整；左右边距、顶部边距可调
- **导出格式与倍率**：分页卡片支持 PNG / JPG，长图支持 PNG / JPG / PDF（单页文档）；长图支持 1x–4x 画质倍率与自定义宽度

### 内容支持

- 完整支持标题、段落、引用、代码块、有序 / 无序列表、任务勾选、表格、数学公式、标签、链接、行内代码与高亮
- 图片自动下载并转为本地引用，连续两张图片自动组成双栏版式
- **视频封面**：自动拉取哔哩哔哩、YouTube、抖音的视频封面；拉取失败时保留原生播放器，不显示占位符
- **Dataview**：笔记中的 Dataview / DataviewJS 查询结果可在导出中正确渲染（需已启用 Dataview 插件）
- **动态素材**：笔记中嵌入的 gif / mp4 / mov，在 macOS 上可导出为**实况照片（Live Photos）**；其他平台导出 PNG 并另附动态原件（详见[动态素材与实况照片](#动态素材与实况照片)）

---

## 快速开始

1. 打开一篇 Markdown 笔记
2. 通过任一入口打开导出窗口：
   - 命令面板（`Ctrl/Cmd + P`）→ 搜索「**导出当前笔记为长图/图片**」
   - 在文件列表 / 编辑器中右键笔记 →「导出为长图 / 图片」
3. 左侧调整参数，右侧查看实时预览，点击 **导出**

图片默认保存到当前仓库：

```text
xhs-export/笔记文件名/01.png
xhs-export/笔记文件名/02.png
…
```

也可以在面板底部把保存位置切换为**电脑文件夹**（桌面端），通过系统选择器保存到任意位置，插件会建立笔记同名子文件夹；导出完成后显示完整路径，并提供「打开文件夹」按钮。

## 导出面板怎么用

### 1. 画布与格式

- **画布比例**：小红书 3:4 / 抖音 9:16 / 1:1 / 通用 4:5 / 长图，选择后预览与导出都按该比例排版
- **长图设置**（长图模式）：自定义导出宽度（像素）与 1x–4x 倍率；高度按内容自动计算
- **导出格式**：PNG（无损）/ JPG（体积更小）/ PDF（长图为单页文档）

### 2. 固定信息（全部选填）

- **顶部封面图**：上传本地图片或填写封面 URL（二选一），自动裁切为第一页顶部通栏图，可随时更换或删除
- **头像**：上传或填 URL，提供小 / 中 / 大三档，联动调整头像与周围间距；可只显示头像不显示昵称
- **底部昵称**：固定显示在每一页底部；留空则不显示
- **昵称下副标题**：可选填日期、账号或一句话，最多 15 个字
- **作者名位置**：左上角（页眉式）或右下角（脚注式）
- **封面内容模式**：头像 + 正文 / 头像 + 标题 + 正文 / 标题 + 正文

### 3. 视觉样式

- **风格**：系统主题样式（排版字重跟随当前主题）/ 简约黑体 / 手写
- **配色**：跟随当前主题，深色 / 浅色自动适配，也可选择推荐配色或自定义背景色
- **字体**：跟随主题字体、简约黑体、本机 / 开源手写字体或已导入的自定义字体
- **纹理**：无纹理 / 格子纸 / 圆点纸 / 横线纸 / 自定义纹理 CSS（面板提供「复制模板」）
- **文字与页面**：标题、小标题、正文字号（百分比）与左右、顶部边距

### 4. 水印

开关后可设置水印文字（留空用底部昵称）、字号、颜色（留空跟随主题）、透明度、位置（平铺覆盖 / 四角 / 居中）与平铺密度；平铺覆盖时水印均匀铺满整张图片，任何裁剪都不会丢失。

### 5. 预览与导出范围

- 预览区提供「**排版预览**」（成品效果）与「**Markdown 渲染**」（对照原文）两个页签，可随时「刷新预览」
- 分页模式支持按页选择导出，语法：单页 `8` / 列表 `1,2,4` / 范围 `1-6` / 混合 `1,3-5,8`；留空或选「全部」则导出全部页
- 长图模式会提示「将导出 1 张完整长图」，确认后开始

### 6. 导出位置

- **仓库内目录**：支持 `{{title}}` 模板，默认 `xhs-export/{{title}}`；留空时使用仓库附件文件夹
- **电脑文件夹**（桌面端）：通过系统文件夹选择器指定
- 移动端只能导出到当前仓库，导出后按提示在 Obsidian 文件浏览器中查看，再用系统能力保存或分享

## 封面组合逻辑

- **有顶部封面图时**：封面铺满第一页上方；头像可选，启用后叠在封面图与底色的分割线上，只显示头像本身
- **无顶部封面图时**：头像与昵称显示在第一页顶部，昵称下方可加副标题
- **标题**取当前笔记文件名，可独立关闭；关闭后直接从正文开始
- 无论哪种组合，每一页底部始终保留昵称与页码（昵称留空则只显示页码）
- 删除头像或封面图后，对应开关会自动关闭，避免下次导出缺图

## 动态素材与实况照片

直接用 Obsidian 嵌入语法在笔记中加入动态素材即可，无需在面板重复选择：

```markdown
![[演示视频.mp4]]
![[另一段素材.mov]]
![[循环动画.gif]]
```

插件分页后会自动判断：

- **macOS**：只要有页面含动态素材，导出后整套页面会按顺序加入系统「照片」App 的一个新相簿——动态页是实况照片（按下可播放，文字与底色保持不动），静态页是普通照片；所选文件夹同时保留 JPG/MOV 配对等原件备份。转换器已内置，兼容 Apple Silicon 与 Intel，无需安装 Xcode 或 FFmpeg；首次使用时 macOS 可能询问是否允许 Obsidian 控制「照片」
- **Windows / Linux / 移动端**：所有页面导出静态 PNG，动态页另外保存对应的 mp4 / mov / gif 原件，可交给剪辑软件继续处理
- 一张实况照片只对应一段动态素材，插件会保证每个动态页最多放置一个视频或 GIF

## 字体说明

- **跟随主题字体**：直接使用当前 Obsidian CSS 主题的正文样式
- **本机手写字体**：如系统已安装平方洒脱体、平方乔木体、平方三生体等，可直接调用；插件不会复制或重新分发本机字体
- **开源手写字体**：内置小赖字体（Xiaolai）、内海字体（NaikaiFont）、快去写作业 CJK（CEFFontsCJK）三款 OFL 字体；Release 安装包已内置，若删除则在首次选用时从固定地址下载并做 SHA-256 校验，之后缓存本地
- **导入自定义字体**：在「设置 → Export MD notes → 导入自定义字体」中选择 `.ttf` / `.otf` / `.woff` / `.woff2` 文件，字体会保存在当前仓库内，不安装进系统、不上传网络；请自行确认所导入字体的使用授权

## 安装

### Release 手动安装（推荐）

1. 到 [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases) 下载最新的 `export-md-notes-<版本>-install.zip`
2. 解压得到 `export-md-notes` 文件夹，内含 `main.js`、`manifest.json`、`styles.css` 与 `assets/`（内置字体资源）
3. 放入 Vault 的 `.obsidian/plugins/export-md-notes/` 目录
4. 重启 Obsidian 或刷新插件列表，在「第三方插件」中启用 **Export MD notes**

> [!NOTE]
> 安装包约 37MB，是因为内置了开源中文字体（woff2），以保证移动端 / 离线环境下的排版效果。不需要这些字体时可删除 `assets/fonts/` 目录，插件会改用主题字体，或在联网时按需下载。

目前插件尚未提交 Obsidian 官方社区插件市场，暂时只能通过 Release 手动安装。

## 隐私

- Markdown 解析、字体测量、分页、渲染与截图全部在本机 / 当前设备上完成，**不收集分析数据，不上传笔记正文、图片、头像、封面图或自定义字体**
- 仅有两类明确的网络请求：
  1. 笔记嵌入哔哩哔哩 / YouTube / 抖音视频时，向对应平台的公开接口（仅携带视频 ID / URL）请求封面图；拉取失败则不请求、保留原播放器
  2. 首次选用内置开源手写字体且本地没有该字体时，从字体托管地址下载字体文件并校验 SHA-256
- macOS 实况照片转换在临时目录本地运行，只读取笔记中明确嵌入的动态素材，不会执行外部命令或上传素材

## 兼容性

- Obsidian **1.6.6** 或更新版本
- 桌面端：Windows / macOS / Linux
- 移动端：iOS / Android（`isDesktopOnly: false`；受系统限制，导出位置仅当前仓库文件夹）
- 实况照片（Live Photos）：仅支持 macOS；其他平台导出 PNG + 动态原件

## 问题反馈

遇到问题或有功能建议，欢迎到 [GitHub Issues](https://github.com/YOUNG-FELIX/export-md-notes/issues) 提交，反馈时请附上 Obsidian 版本、设备系统与导出面板截图。

## 从源码构建

环境要求：Node v22 + esbuild（0.28.x），无 git 依赖。

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

![GitHub Release](https://img.shields.io/github/v/release/YOUNG-FELIX/export-md-notes?style=flat)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.6.6%2B-7c3aed?logo=obsidian&logoColor=white)
![Downloads](https://img.shields.io/github/downloads/YOUNG-FELIX/export-md-notes/total?style=flat)

Export your Obsidian Markdown notes as **images** in one click — either **paginated cards** sized for popular platforms (Xiaohongshu/RED 3:4, Douyin/TikTok 9:16, square 1:1, universal 4:5) or a single **full-length long image**.

It is **not** a publisher for any single platform — it is a general-purpose **note-to-image** exporter for social cards, tutorial long images, handout-style cards, reading notes, article illustrations and personal archives. Adjust options on the left, watch the live preview on the right, and click once to export.

Parsing, typesetting, pagination and capture all run locally; your notes are never uploaded (see [Privacy](#privacy)). It works on desktop and mobile, and on macOS can export embedded motion content as Live Photos.

Plugin id: `export-md-notes` 

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

## What it does

In plain language, it can:

- Export an Obsidian note as multiple paginated cards (e.g. 1080×1440 PNGs) or as one adaptive-height long image
- Paginate automatically based on real font metrics and page space — overflow flows to the next page
- Tweak canvas size, cover, avatar, fonts, sizes, palette, texture, watermark and margins with a live preview before exporting
- Auto-fetch covers for embedded Bilibili / YouTube / Douyin videos; render Dataview query results correctly
- Turn pages containing gif / mp4 / mov into Live Photos on macOS and import them into the system Photos library

## Who it's for

- Obsidian users who write reading notes, tutorials, checklists or journals and want to post them to RED, Douyin or other platforms
- Creators who need consistent covers, avatars, author names, watermarks and typography
- Anyone tired of manually screenshotting and stitching long images
- Anyone who wants typesetting and rendering to stay local, with no note uploads

## Features

### Two export modes

- **Paginated cards**: automatically split into pages at the chosen aspect ratio, with page numbers and selectable page ranges
- **Long image**: fixed width (1080 by default, customizable), height grows with content (up to 16000px) — one complete image, no manual stitching

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
- **Cover & author bar** (all optional): top cover image (upload or URL), avatar, bottom nickname / tagline; the author name can sit at the top-left (header style) or bottom-right (footnote style). See [Cover combinations](#cover-combinations)
- **Watermark**: diagonal tiled text with 1%–30% opacity, custom color and size, anchored to any corner / center, or tiled across the whole image with sparse / medium / dense / custom density; falls back to your nickname, or hidden when both are empty
- **Background textures**: theme (none) / palette-recommended / grid paper / dot paper / ruled paper, or paste custom CSS; custom background color supported
- **Fonts**: theme fonts, plain sans-serif, local handwriting fonts, bundled open-source fonts, or your own imported font files (see [Fonts](#fonts))
- **Fine control**: title / subtitle / body font sizes (percentage) and horizontal / top margins
- **Formats & scale**: PNG / JPG for cards; PNG / JPG / PDF (single-page document) for long images; 1x–4x scale and custom width for long images

### Content support

- Headings, paragraphs, quotes, code blocks, ordered / bullet lists, tasks, tables, math, tags, links, inline code and highlights
- Images are downloaded and embedded automatically; two consecutive images form a side-by-side layout
- **Video covers**: auto-fetches covers for Bilibili, YouTube and Douyin embeds; if a cover can't be fetched, the native player is kept instead of a placeholder
- **Dataview**: Dataview / DataviewJS query results render correctly in exports (requires the Dataview plugin)
- **Motion content**: embedded gif / mp4 / mov become **Live Photos** on macOS; on other platforms pages export as PNG with the motion originals saved alongside (see [Motion content & Live Photos](#motion-content--live-photos))

## Quick start

1. Open a Markdown note
2. Open the export dialog via either:
   - Command Palette (`Ctrl/Cmd + P`) → "**Export current note as long image / images**"
   - Right-click the note in the file list / editor → "Export as long image / images"
3. Adjust options on the left, check the live preview on the right, and click **Export**

Files are saved into the vault by default:

```text
xhs-export/note-title/01.png
xhs-export/note-title/02.png
…
```

On desktop you can switch the destination to a **computer folder** via the system folder picker; the plugin creates a subfolder named after the note, shows the full path after export, and offers an "Open folder" button.

## The export panel, step by step

### 1. Canvas & format

- **Canvas size**: RED 3:4 / Douyin 9:16 / 1:1 / 4:5 / long image; preview and export re-layout immediately
- **Long-image settings**: custom width (px) and 1x–4x scale; height is computed from content
- **Format**: PNG (lossless) / JPG (smaller) / PDF (single-page document for long images)

### 2. Branding (all optional)

- **Top cover**: upload an image or paste a cover URL (either/or), auto-cropped to a full-width banner on page 1; replace or remove anytime
- **Avatar**: upload or URL, with small / medium / large sizes that also adjust spacing; can show without a nickname
- **Bottom nickname**: pinned to the footer of every page; hide by leaving it empty
- **Tagline** under the nickname: a date, account handle or one short line, up to 15 characters
- **Author position**: top-left (header) or bottom-right (footnote)
- **Cover content modes**: avatar + body / avatar + title + body / title + body

### 3. Visual styles

- **Style**: current theme / plain sans-serif / handwriting
- **Palette**: follows the theme with automatic light/dark adaptation, recommended presets, or custom background color
- **Fonts**: theme font, sans-serif, local / open-source handwriting fonts, or imported fonts
- **Textures**: none / grid / dot / ruled paper, or custom texture CSS (a "copy template" button is provided)
- **Text & page**: title / subtitle / body font sizes (percentage) and horizontal / top margins

### 4. Watermark

Toggle it, then set text (falls back to the nickname), size, color (theme color when empty), opacity, position (tiled / corners / center) and tile density. Tiled watermarks cover the whole image evenly, so no crop can remove them.

### 5. Preview & page range

- The preview has two tabs: **Layout preview** (final look) and **Markdown rendering** (compare with the source); use "Refresh preview" anytime
- Paginated mode accepts a page range: single `8`, list `1,2,4`, range `1-6`, mixed `1,3-5,8`; leave empty or pick "All" for every page
- Long-image mode asks for confirmation, then produces one complete image

### 6. Export location

- **Vault folder**: supports a `{{title}}` template, defaults to `xhs-export/{{title}}`; falls back to the attachment folder when empty
- **Computer folder** (desktop): pick any folder through the system dialog
- On mobile, exports can only be saved inside the current vault; follow the notice to find them in Obsidian's file browser, then save or share with the system UI

## Cover combinations

- **With a top cover**: the cover fills the top of page 1; the optional avatar overlaps the boundary between cover and background, avatar only
- **Without a cover**: the avatar and nickname appear at the top of page 1, with the optional tagline beneath
- The **title** comes from the note's file name and can be switched off independently, letting content start immediately
- Regardless of the combination, every page keeps the nickname and page number in the footer (only the number when the nickname is empty)
- Removing the avatar or cover automatically turns its switch off, preventing missing-image errors on the next export

## Motion content & Live Photos

Embed motion files with standard Obsidian syntax — no extra selection in the panel:

```markdown
![[demo.mp4]]
![[clip.mov]]
![[loop.gif]]
```

After pagination the plugin decides automatically:

- **macOS**: if any page contains motion, the full page set is added, in order, to a new album in the system Photos app — motion pages are Live Photos (press to play; text and background stay still) and static pages are regular photos. The chosen folder also keeps the originals (JPG/MOV pairs etc.). The converter is built in, works on Apple Silicon and Intel, and needs no Xcode or FFmpeg; macOS may ask once whether Obsidian can control Photos
- **Windows / Linux / mobile**: every page exports as a static PNG, and motion pages additionally save the original mp4 / mov / gif for use in editing software
- A Live Photo maps to exactly one motion clip, so the plugin ensures at most one video or GIF per motion page

## Fonts

- **Theme font**: uses the current Obsidian CSS theme's body typography
- **Local handwriting fonts**: if fonts such as PingFang handwriting families are installed on the machine, they can be used directly; the plugin never copies or redistributes system fonts
- **Open-source handwriting fonts**: bundles Xiaolai, NaikaiFont and CEF CJK under the OFL license. They ship inside the Release zip; if removed, they are downloaded on first use from a fixed URL with a SHA-256 check and then cached locally
- **Custom fonts**: under "Settings → Export MD notes → Import custom font", load `.ttf` / `.otf` / `.woff` / `.woff2` files. Fonts stay inside the vault — they are not installed system-wide or uploaded; make sure you have the rights to use them

## Installation

### Manual install from Release (recommended)

1. Download the latest `export-md-notes-<version>-install.zip` from [Releases](https://github.com/YOUNG-FELIX/export-md-notes/releases)
2. Unzip it to get the `export-md-notes` folder containing `main.js`, `manifest.json`, `styles.css` and `assets/` (bundled fonts)
3. Place it under `<vault>/.obsidian/plugins/export-md-notes/`
4. Restart Obsidian (or refresh the plugin list) and enable **Export MD notes** under Community plugins

> [!NOTE]
> The install zip is ~37MB because it bundles open-source Chinese fonts (woff2) for consistent typography on mobile / offline. If you don't need them, delete `assets/fonts/`; the plugin will then use theme fonts or download fonts on demand when online.

The plugin is not yet submitted to the official Obsidian community plugin directory, so Release-based manual installation is currently the only option.

## Privacy

- Markdown parsing, font measurement, pagination, rendering and capture all run locally on your device. **No analytics are collected, and note text, images, avatars, cover images or custom fonts are never uploaded**
- There are only two explicit kinds of network requests:
  1. When a note embeds a Bilibili / YouTube / Douyin video, a request carrying only the video ID / URL is sent to that platform's public endpoint to fetch the cover; if it fails, no further requests are made and the original player is kept
  2. When a bundled open-source font is selected for the first time and is not available locally, it is downloaded from a fixed font URL and verified by SHA-256
- The macOS Live Photo converter runs locally in a temporary directory, reads only the motion files explicitly embedded in the note, runs no external commands and uploads nothing

## Compatibility

- Obsidian **1.6.6** or newer
- Desktop: Windows / macOS / Linux
- Mobile: iOS / Android (`isDesktopOnly: false`; due to system limits, exports can only be saved inside the vault folder)
- Live Photos: macOS only; other platforms export PNG plus the motion originals

## Feedback

For bugs or feature requests, please open a [GitHub Issue](https://github.com/YOUNG-FELIX/export-md-notes/issues) with your Obsidian version, operating system and a screenshot of the export panel.

## Build from source

Requires Node v22 and esbuild 0.28.x; no git dependency:

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
