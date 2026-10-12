# Export MD notes

Obsidian 插件：把 Markdown 笔记一键导出为**小红书风格长图**或**分页卡片**。桌面端与移动端均支持；macOS 可导出 Live Photos。

插件 id：`export-md-notes`（原名 xhs-longform）

## 功能特性

- **长图导出**：单张完整长图，支持作者栏、水印、纹理背景、主题色、自定义字体
- **分页卡片导出**：按卡片尺寸自动分页，支持页码选择导出（png/jpg/pdf 等格式）
- **视频封面**：自动拉取 B 站、YouTube、抖音视频封面（拉不到时保留原生播放器）
- **Dataview 渲染**：笔记中的 Dataview 查询可在导出中正确渲染
- **Live Photos**（macOS）：嵌入媒体可导出为实况照片
- **移动端适配**：导出位置可选用系统分享 / 相册等移动端方案

## 安装

1. 下载对应版本的 `export-md-notes-<版本>.zip`
2. 解压得到 `main.js`、`manifest.json`、`styles.css`
3. 放入 Obsidian 仓库的 `.obsidian/plugins/export-md-notes/` 目录
4. 重启 Obsidian 或刷新插件列表，在设置中启用 Export MD notes

## 从源码构建

环境要求：Node v22 + esbuild（0.28.x），无 git 依赖。

```bash
# 安装依赖
npm install

# 构建（输出到 pkg_1625/main.js）
node build-1625.js
```

构建产物为 `pkg_1625/main.js`，配合根目录 `manifest.json`、`styles.css` 即可打包安装。

## 架构

插件分两条独立链路，参数不互传：

- **分片链路**：`parser.ts`（Markdown 解析）→ `paginate.ts`（分页）→ `render.ts`（单页 DOM 渲染）→ `export.ts`（导出）
- **长图链路**：`md-render.ts`（MarkdownRenderer 渲染）→ `longform-capture.ts`（截图）→ `export.ts`（导出）

统一入口：`main.ts`（插件入口）、`modal.ts`（导出弹窗 UI）。样式与预设见 `presets.ts`，字体体系见 `fonts*.ts`，封面拉取见 `covers.ts`，Live Photos 见 `motion-export.ts`。

## 版本

当前版本：**1.6.25**

- 1.6.25：长图预览保留原生 iframe；导出截图前才临时替换视频封面，封面拉不到保留原样
- 1.6.24：iframe 双链路修复（分片识别 B 站播放器地址 + 长图封面替换）
- 1.6.21~1.6.23：渲染页输入框布局与宽度优化
- 1.6.20：页码各格式预览 / 定位 / 导出编号
- 1.6.19：字号持久化
- 1.6.16：长图宽度输入控件

## Credits

Export MD notes 是在以下 MIT 许可开源项目基础上开发/改造的派生作品，特此声明：

- [zhy9495/obsidian-xhs-longform](https://github.com/zhy9495/obsidian-xhs-longform)（MIT）— XHS Longform Exporter，分页卡片导出与移动端适配的基础
- [zhouhua/obsidian-export-image](https://github.com/zhouhua/obsidian-export-image)（MIT）— 文章导出为长图/图片的参考实现（水印、作者信息、倍率输出等思路）

本项目同样以 MIT 许可开源，完整版权声明见 [LICENSE](LICENSE)。

打包进 main.js 的第三方库：`dom-to-image-more`（MIT）、`modern-screenshot`（MIT），均保留原许可证声明。

## 说明

- 作者：Marvis / Felix
- 交付规范：每次改动升版本号并打包可安装 zip，不交付裸源码
