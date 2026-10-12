import { App, ButtonComponent, Component, MarkdownRenderer, Modal, Notice, Platform, Setting, TFile } from "obsidian";
import type ExportMdNotesPlugin from "./main";
import { ASPECT_PRESETS, AVATAR_SIZES, avatarLayout, buildGeometry, clampLongformWidth, clampPageMargin, clampSizeScale, clampTileDensity, fontSizeOptions, isCustomPageMargin, isCustomSizeScale, isLongform, longformHeightFor, LONGFORM_WIDTH_MAX, LONGFORM_WIDTH_MIN, PAGE_MARGINS, PALETTES, paletteById, TILE_DENSITY_DEFAULT, tileDensityCellFactor, type ExportGeometry, type TypographyRole } from "./presets";
import { parseMarkdown } from "./parser";
import { resolveImages } from "./images";
import { resolveVideoCovers } from "./covers";
import { renderDataviews } from "./render-dataview";
import { LayoutMeasurer } from "./measure";
import { paginate } from "./paginate";
import { exportMixedPages, exportLongformFile } from "./export";
import { pageDocument } from "./render";
import { prepareLongformIframes, renderNoteLongform, type LongformAuthor, type LongformRenderResult, type LongformStyle } from "./md-render";
import { captureLongform } from "./longform-capture";
import type { AspectId, AvatarSize, ExportFormat, ExportOptions, LongformAuthorPosition, LongformScale, Page, PageMargin, SizeScale, StyleId, TextureId, TileDensity, WatermarkPosition } from "./types";
import { THEME_FONT_ID, THEME_FONT_LABEL } from "./fonts";
import { addCoverAuthor, authorTextVisible, limitAuthorSubtitle } from "./cover";
import { chooseComputerFolder, openComputerFolder } from "./desktop";
import { resolveComputerDirectory, resolveVaultDirectory, type ExportDestination, type OutputLocationMode } from "./export-location";

const CUSTOM_TEXTURE_TEMPLATE = `/* Export MD notes 自定义纹理模板 */
/* 可用属性：background-image（图案）、background-size（单元大小）、background-position（偏移）、opacity（透明度） */
/* 颜色可写 currentColor（跟随文字色），或直接写色值如 rgba(0,0,0,0.08) */
/* 未写的属性沿用默认；下面两行可整体替换成你想要的图案 */
background-image: repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 12px);
background-size: 20px 20px;
opacity: 0.08;`;

export class ExportModal extends Modal {
  private options: ExportOptions;
  private pages: Page[] | null = null;
  private previewEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private pageSelection: number[] | null = null;
  private pageSelInput: HTMLInputElement | null = null;
  private previewButton: ButtonComponent | null = null;
  private exportButton: ButtonComponent | null = null;
  private openFolderButton: ButtonComponent | null = null;
  private lastExportDirectory = "";
  private busy = false;
  private previewTimer: number | null = null;
  private longGeom: ExportGeometry | null = null;
  private previewMode: "pages" | "markdown" = "pages";
  private markdownEl: HTMLElement | null = null;
  private markdownComponent: Component | null = null;
  private markdownTab: HTMLElement | null = null;
  private pagesTab: HTMLElement | null = null;
  private longformHost: HTMLElement | null = null;
  private longformViewport: HTMLElement | null = null;
  private longformSizer: HTMLElement | null = null;
  private longformRender: LongformRenderResult | null = null;
  private longformZoom = 1;
  private longformFitScale = 0.2;
  private longformZoomLabel: HTMLElement | null = null;
  private longformZoomBar: HTMLElement | null = null;

  constructor(app: App, private plugin: ExportMdNotesPlugin, private file: TFile) {
    super(app);
    const settings = plugin.settings;
    this.options = {
      account: settings.account, style: "theme", paletteId: "theme", customBg: settings.customBg || "#FAFAF8", fontId: settings.fontId, texture: settings.texture,
      titleScale: settings.titleScale ?? "100", subtitleScale: settings.subtitleScale ?? "100", bodyScale: settings.bodyScale ?? "100",
      horizontalMargin: settings.horizontalMargin, topMargin: settings.topMargin,
      showAvatar: settings.showAvatar, showTitle: settings.showTitle, avatarDataUrl: settings.avatarDataUrl, avatarUrl: settings.avatarUrl, avatarSize: settings.avatarSize,
      authorSubtitle: settings.authorSubtitle, coverImageDataUrl: settings.coverImageDataUrl, coverImageUrl: settings.coverImageUrl,
      showCoverImage: settings.showCoverImage,
      aspectId: settings.aspectId, longformWidth: settings.longformWidth, longformScale: settings.longformScale, exportFormat: settings.exportFormat, longformAuthorPosition: settings.longformAuthorPosition, watermark: { ...settings.watermark, enabled: false, text: "" }
    };
  }

  onOpen(): void {
    this.modalEl.addClass("xhs-export-modal");
    this.contentEl.createEl("h2", { text: "导出为图片" });
    const workspace = this.contentEl.createDiv({ cls: "xhs-export-workspace" });
    const sidebar = workspace.createDiv({ cls: "xhs-export-sidebar" });
    const controls = sidebar.createDiv({ cls: "xhs-export-controls" });
    this.renderControls(controls);
    const actions = sidebar.createDiv({ cls: "xhs-export-actions" });
    this.previewButton = new ButtonComponent(actions).setButtonText("刷新预览").onClick(() => void this.preview());
    this.exportButton = new ButtonComponent(actions).setButtonText("导出").setCta().onClick(() => void this.export());
    this.openFolderButton = new ButtonComponent(actions).setButtonText("打开文件夹").onClick(() => void this.openLastExportFolder());
    this.openFolderButton.buttonEl.hidden = true;
    this.statusEl = sidebar.createDiv({ cls: "xhs-export-progress" });
    this.statusText = this.statusEl.createSpan({ text: "正在生成预览…" });
    this.pageSelInput = this.statusEl.createEl("input", { cls: "xhs-page-select", attr: { type: "text", placeholder: "全部", title: "渲染页：单页 8 / 列表 1,2,4 / 范围 1-6 / 混合 1,3-5,8" } });
    this.pageSelInput.addEventListener("blur", () => this.commitPageSelection());
    this.pageSelInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") this.pageSelInput!.blur();
    });
    const previewPanel = workspace.createDiv({ cls: "xhs-preview-panel" });
    const heading = previewPanel.createDiv({ cls: "xhs-preview-heading-row" });
    heading.createDiv({ cls: "xhs-preview-heading", text: "实时预览" });
    const tabs = heading.createDiv({ cls: "xhs-preview-tabs" });
    this.pagesTab = tabs.createDiv({ cls: "xhs-preview-tab xhs-preview-tab-active", text: "排版预览" });
    this.markdownTab = tabs.createDiv({ cls: "xhs-preview-tab", text: "Markdown 渲染" });
    this.pagesTab.addEventListener("click", () => this.switchPreviewMode("pages"));
    this.markdownTab.addEventListener("click", () => this.switchPreviewMode("markdown"));
    this.longformZoomBar = previewPanel.createDiv({ cls: "xhs-longform-zoombar" });
    this.longformZoomBar.style.display = "none";
    this.longformZoomBar.createEl("button", { text: "缩小", cls: "xhs-zoom-btn", attr: { type: "button" } }).addEventListener("click", () => this.zoomLongform(0.8));
    this.longformZoomLabel = this.longformZoomBar.createDiv({ cls: "xhs-zoom-label", text: "100%" });
    this.longformZoomBar.createEl("button", { text: "放大", cls: "xhs-zoom-btn", attr: { type: "button" } }).addEventListener("click", () => this.zoomLongform(1.25));
    this.longformZoomBar.createEl("button", { text: "适应", cls: "xhs-zoom-btn", attr: { type: "button" } }).addEventListener("click", () => this.zoomLongformReset());
    this.longformZoomBar.createEl("button", { text: "原始", cls: "xhs-zoom-btn", attr: { type: "button" } }).addEventListener("click", () => this.zoomLongformOriginal());
    this.previewEl = previewPanel.createDiv({ cls: "xhs-preview-strip" });
    this.markdownEl = previewPanel.createDiv({ cls: "xhs-preview-markdown markdown-rendered" });
    this.markdownEl.style.display = "none";
    this.longformHost = previewPanel.createDiv({ cls: "xhs-longform-host" });
    this.longformHost.style.display = "none";
    this.longformViewport = this.longformHost.createDiv({ cls: "xhs-longform-viewport" });
    this.longformSizer = this.longformViewport.createDiv({ cls: "xhs-longform-sizer" });
    void this.migrateLegacyWatermarkPosition();
    this.schedulePreview(0);
  }

  onClose(): void {
    if (this.previewTimer !== null) window.clearTimeout(this.previewTimer);
    this.markdownComponent?.unload();
    this.markdownComponent = null;
    this.longformRender?.component.unload();
    this.longformRender = null;
  }

  private renderControls(container: HTMLElement): void {
    this.addSection(container, "固定信息");
    new Setting(container).setName("底部昵称").setDesc("选填；固定显示在每一页底部，页码始终显示。")
      .addText((text) => text.setPlaceholder("选填，例如 ying").setValue(this.options.account).onChange((value) => { this.options.account = value.trim(); this.invalidate(); }));
    if (isLongform(this.options.aspectId)) {
      new Setting(container).setName("作者名位置").setDesc("作者名填写后选择：仅长图模式生效，右下角为脚注式小字，左上角为页眉式小字，字号与分片页脚一致，不新增空白节。").addDropdown((dropdown) => dropdown
        .addOption("bottom-right", "右下角（脚注式）").addOption("top", "左上角（页眉式）")
        .setValue(this.options.longformAuthorPosition)
        .onChange((value) => { this.options.longformAuthorPosition = value as LongformAuthorPosition; this.invalidate(); }));
    }
    this.addSection(container, "图片比例");
    new Setting(container).setName("画布比例").setDesc(isLongform(this.options.aspectId) ? "长图模式：按内容自动计算高度，导出为单张长图。" : "选择后预览与导出均按该比例排版。").addDropdown((dropdown) => {
      for (const preset of ASPECT_PRESETS) dropdown.addOption(preset.id, preset.name);
      return dropdown.setValue(this.options.aspectId).onChange((value) => {
        this.options.aspectId = value as AspectId;
        this.longGeom = null; this.pages = null;
        container.empty(); this.renderControls(container); this.invalidate();
      });
    });
    if (isLongform(this.options.aspectId)) {
      new Setting(container).setName("导出宽度").setDesc("长图导出宽度（像素），高度按内容自动计算；预览同步生效。输入完成失焦或回车后生效。").addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = String(LONGFORM_WIDTH_MIN);
        text.inputEl.max = String(LONGFORM_WIDTH_MAX);
        text.inputEl.step = "1";
        text.setValue(String(this.options.longformWidth));
        const commitWidth = (): void => {
          const raw = text.inputEl.value.trim();
          const clamped = raw === "" ? this.options.longformWidth : clampLongformWidth(raw);
          text.setValue(String(clamped));
          this.options.longformWidth = Number(clamped);
          this.plugin.settings.longformWidth = Number(clamped);
          void this.plugin.saveSettings();
          this.invalidate();
        };
        text.inputEl.addEventListener("blur", commitWidth);
        text.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") text.inputEl.blur();
        });
        return text;
      });
      new Setting(container).setName("导出画质").setDesc("导出图片的缩放倍数：1x 标准、2x 高清、3x 超清、4x 极清；仅影响导出文件，不影响预览。").addDropdown((dropdown) => {
        for (const [value, label] of [["1", "标准 1x"], ["2", "高清 2x"], ["3", "超清 3x"], ["4", "极清 4x"]] as const) dropdown.addOption(value, label);
        return dropdown.setValue(this.options.longformScale).onChange(async (value) => {
          this.options.longformScale = value as LongformScale;
          this.plugin.settings.longformScale = this.options.longformScale;
          await this.plugin.saveSettings();
          this.invalidate();
        });
      });
      new Setting(container).setName("导出格式").setDesc("长图导出文件类型：PNG 无损、JPG 体积更小、PDF 为单页文档。").addDropdown((dropdown) => dropdown
        .addOption("png", "PNG").addOption("jpg", "JPG").addOption("pdf", "PDF（单页）")
        .setValue(this.options.exportFormat).onChange(async (value) => {
          this.options.exportFormat = value as ExportFormat;
          this.plugin.settings.exportFormat = this.options.exportFormat;
          await this.plugin.saveSettings();
          this.invalidate();
        }));
    }
    this.addSection(container, "封面内容");
    new Setting(container).setName("显示顶部封面图").setDesc("开启后才显示图片上传选项。").addToggle((toggle) => toggle.setValue(this.options.showCoverImage).onChange((value) => {
      this.options.showCoverImage = value; container.empty(); this.renderControls(container); this.invalidate();
    }));
    if (this.options.showCoverImage) this.renderCoverImageControl(container);
    new Setting(container).setName("显示头像").setDesc(this.options.showCoverImage ? "叠在封面图与底图的分割线上。" : "与昵称一起显示在第一页顶部。").addToggle((toggle) => toggle.setValue(this.options.showAvatar).onChange((value) => {
      this.options.showAvatar = value; container.empty(); this.renderControls(container); this.invalidate();
    }));
    if (this.options.showAvatar) {
      this.renderAvatarControl(container);
      new Setting(container).setName("头像区域大小").setDesc("同时调整头像和周围间距。").addDropdown((dropdown) => {
        for (const option of AVATAR_SIZES) dropdown.addOption(option.id, option.name);
        return dropdown.setValue(this.options.avatarSize).onChange((value) => { this.options.avatarSize = value as AvatarSize; this.invalidate(); });
      });
    }
    if (this.options.showAvatar && !this.options.showCoverImage) {
      new Setting(container).setName("昵称下方文字").setDesc("可填写日期、账号或任意一句话，最多 15 个字；留空时昵称垂直居中。")
        .addText((text) => {
          return text.setPlaceholder("选填，最多 15 个字").setValue(this.options.authorSubtitle).onChange((value) => {
            const limited = limitAuthorSubtitle(value); if (limited !== value) text.setValue(limited);
            this.options.authorSubtitle = limited; this.invalidate();
          });
        });
    }
    new Setting(container).setName("显示标题").setDesc("标题取当前笔记文件名；关闭后直接从正文开始。").addToggle((toggle) => toggle.setValue(this.options.showTitle).onChange((value) => {
      this.options.showTitle = value; this.invalidate();
    }));
    this.addSection(container, "视觉样式");
    new Setting(container).setName("风格").setDesc("系统主题样式：排版与字重以当前 Obsidian 主题为基础。").addDropdown((dropdown) => dropdown.addOption("theme", "系统主题样式").addOption("pingfang", "简约黑体").addOption("handwrite", "手写纹理").setValue(this.options.style).onChange((value) => {
      this.options.style = value as StyleId;
      this.options.paletteId = "theme";
      container.empty(); this.renderControls(container); this.invalidate();
    }));
    new Setting(container).setName("配色").setDesc("系统主题样式：颜色取自当前主题，深色/浅色主题自动适配。").addDropdown((dropdown) => {
      dropdown.addOption("theme", "系统主题样式");
      for (const palette of PALETTES.filter((item) => item.style === this.options.style)) dropdown.addOption(palette.id, palette.name);
      dropdown.addOption("custom", "自定义");
      return dropdown.setValue(this.options.paletteId).onChange((value) => { this.options.paletteId = value; this.plugin.settings.paletteId = value; void this.plugin.saveSettings(); container.empty(); this.renderControls(container); this.invalidate(); });
    });
    if (this.options.paletteId === "custom") {
      new Setting(container).setName("背景色").setDesc("使用原生颜色选择器取色，文字与标题颜色会按背景亮度自动适配。").addColorPicker((picker) => picker
        .setValue(this.options.customBg)
        .onChange((value) => { this.options.customBg = value || "#FAFAF8"; this.plugin.settings.customBg = this.options.customBg; void this.plugin.saveSettings(); this.invalidate(); }));
    }
    new Setting(container).setName("字体").setDesc("选择“跟随主题字体”时使用当前 CSS 主题的正文样式。").addDropdown((dropdown) => {
      dropdown.addOption(THEME_FONT_ID, THEME_FONT_LABEL);
      for (const font of this.plugin.fonts) dropdown.addOption(font.id, font.available ? font.name : font.source === "downloadable" ? `${font.name}（首次使用时下载）` : `${font.name}（未安装）`);
      for (const option of Array.from(dropdown.selectEl.options)) {
        const font = this.plugin.fonts.find((item) => item.id === option.value);
        option.disabled = Boolean(font && !font.available && font.source !== "downloadable");
      }
      return dropdown.setValue(this.options.fontId).onChange((value) => { this.options.fontId = value; this.invalidate(); });
    });
    new Setting(container).setName("纹理").setDisabled(this.options.style !== "handwrite" && this.options.style !== "theme").addDropdown((dropdown) => dropdown
      .addOption("theme", "跟随主题（无纹理）").addOption("auto", "跟随配色推荐").addOption("none", "无纹理").addOption("grid", "格子纸").addOption("dot", "圆点纸").addOption("line", "横线纸").addOption("custom", "自定义 CSS")
      .setValue(this.options.texture).onChange((value) => {
        this.options.texture = value as TextureId;
        container.empty();
        this.renderControls(container);
        this.invalidate();
      }));
    if (this.options.texture === "custom") {
      new Setting(container).setName("自定义纹理 CSS").setDesc("粘贴一段纯 CSS 声明，追加到纹理层样式末尾生效（后者覆盖预设）。CSS 要求：只写声明属性（key: value;），不要 {} 与分号结尾的包裹、不要 <style>、不要 JS 脚本；可用属性 background-image / background-size / background-position / opacity，颜色支持 currentColor 或色值。本项为临时设置，仅本次导出会话生效，关闭面板后不保存。").addExtraButton((button) => button
        .setIcon("copy").setTooltip("复制模板")
        .onClick(() => { navigator.clipboard.writeText(CUSTOM_TEXTURE_TEMPLATE).then(() => new Notice("自定义纹理模板已复制，粘贴后按需修改")).catch(() => new Notice("复制失败，请手动复制下方示例")); }))
        .addTextArea((text) => text
          .setPlaceholder("/* 模板示例（可直接复制按钮内容后替换） */\nbackground-image: repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 12px);\nbackground-size: 20px 20px;\nopacity: 0.08;")
          .setValue(this.options.customTexture)
          .onChange((value) => { this.options.customTexture = value; this.invalidate(); }));
    }
    this.addSection(container, "文字与页面");
    this.addSizeControl(container, "标题字号", "title", this.options.titleScale, (value) => { this.options.titleScale = value; });
    this.addSizeControl(container, "小标题字号", "subtitle", this.options.subtitleScale, (value) => { this.options.subtitleScale = value; });
    this.addSizeControl(container, "正文字号", "body", this.options.bodyScale, (value) => { this.options.bodyScale = value; });
    this.addMarginControl(container, "左右边距", this.options.horizontalMargin, (value) => { this.options.horizontalMargin = value; });
    this.addMarginControl(container, "顶部边距", this.options.topMargin, (value) => { this.options.topMargin = value; });
    this.addSection(container, "水印");
    new Setting(container).setName("显示水印").setDesc("在每张卡片上叠加半透明文字水印，预览与导出均生效。").addToggle((toggle) => toggle.setValue(this.options.watermark.enabled).onChange((value) => {
      this.options.watermark = { ...this.options.watermark, enabled: value }; container.empty(); this.renderControls(container); this.invalidate();
    }));
    if (this.options.watermark.enabled) {
      new Setting(container).setName("水印文字").setDesc("留空时使用底部昵称；昵称也为空则不显示水印。").addText((text) => text
        .setPlaceholder("选填")
        .setValue(this.options.watermark.text)
        .onChange((value) => { this.options.watermark = { ...this.options.watermark, text: value.trim() }; this.invalidate(); }));
      new Setting(container).setName("字号").addDropdown((dropdown) => dropdown
        .addOption("28", "小").addOption("40", "中").addOption("56", "大")
        .setValue(String(this.options.watermark.size))
        .onChange((value) => { this.options.watermark = { ...this.options.watermark, size: Number(value) }; this.invalidate(); }));
      new Setting(container).setName("颜色").setDesc("留空时跟随主题/配色的文字颜色").addColorPicker((picker) => picker
        .setValue(this.options.watermark.color || "#000000")
        .onChange((value) => { this.options.watermark = { ...this.options.watermark, color: value }; this.invalidate(); }));
      new Setting(container).setName("透明度").addSlider((slider) => slider
        .setLimits(1, 30, 1)
        .setValue(Math.round(this.options.watermark.opacity * 100))
        .onChange((value) => { this.options.watermark = { ...this.options.watermark, opacity: value / 100 }; this.invalidate(); }));
      new Setting(container).setName("位置").setDesc("平铺覆盖时水印均匀铺满整张图片，任何裁剪都不会丢失。").addDropdown((dropdown) => dropdown
        .addOption("tile", "平铺覆盖").addOption("top-left", "左上").addOption("top-right", "右上").addOption("bottom-left", "左下").addOption("bottom-right", "右下").addOption("center", "居中")
        .setValue(this.options.watermark.position)
        .onChange((value) => { this.options.watermark = { ...this.options.watermark, position: value as WatermarkPosition }; this.invalidate(); }));
      if (this.options.watermark.position === "tile") {
        const densityValue = this.options.watermark.tileDensity ?? "dense";
        const densityCustom = densityValue === "custom";
        const densitySetting = new Setting(container).setName("平铺密度").setDesc("控制水印铺满的疏密程度，可自行调节。");
        let densityWrap: HTMLDivElement;
        densitySetting.addDropdown((dropdown) => dropdown
          .addOption("sparse", "稀疏").addOption("medium", "适中").addOption("dense", "密集").addOption("custom", "自定义")
          .setValue(densityCustom ? "custom" : densityValue)
          .onChange((value) => {
            if (value === "custom") { densityWrap.show(); return; }
            densityWrap.hide();
            this.options.watermark = { ...this.options.watermark, tileDensity: value as TileDensity };
            this.invalidate();
          }));
        densityWrap = container.createDiv({ cls: "xhs-custom-input" });
        new Setting(densityWrap)
          .setName("平铺密度（自定义）")
          .setDesc("0 - 100 百分比，数值越大越密集，80 即原“密集”档，超出范围自动修正。")
          .addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.min = "0";
            text.inputEl.max = "100";
            text.inputEl.step = "1";
            text.setPlaceholder("0 - 100").setValue(densityCustom ? String(this.options.watermark.tileDensityPercent ?? TILE_DENSITY_DEFAULT) : "");
            const commit = (): void => {
              const raw = text.inputEl.value.trim();
              const clamped = raw === "" ? String(TILE_DENSITY_DEFAULT) : clampTileDensity(raw);
              text.setValue(clamped);
              this.options.watermark = { ...this.options.watermark, tileDensity: "custom", tileDensityPercent: Number(clamped) };
              this.invalidate();
            };
            text.inputEl.addEventListener("blur", commit);
            text.inputEl.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter") text.inputEl.blur();
            });
          });
        if (!densityCustom) densityWrap.hide();
      }
    }
    this.addSection(container, "导出位置");
    new Setting(container).setName("保存到").addDropdown((dropdown) => dropdown
      .addOption("vault", "当前 Obsidian 仓库")
      .addOption("computer", "电脑文件夹")
      .setValue(this.plugin.settings.outputLocationMode)
      .onChange(async (value) => {
        this.plugin.settings.outputLocationMode = value as OutputLocationMode;
        await this.plugin.saveSettings();
        container.empty();
        this.renderControls(container);
      }));
    if (this.plugin.settings.outputLocationMode === "vault") {
      new Setting(container).setName("仓库内目录").setDesc("留空则导出到仓库附件文件夹；填含 {{title}} 的模板时按笔记名建子目录；填完整路径则直接使用该目录，已存在直接写入、不存在会自动新建。重复导出同参数覆盖，不同参数自动新增命名。").addText((text) => text
        .setPlaceholder("留空则导出到仓库附件文件夹")
        .setValue(this.plugin.settings.outputDir)
        .onChange(async (value) => {
          this.plugin.settings.outputDir = value;
          await this.plugin.saveSettings();
        }));
    } else {
      const setting = new Setting(container).setName("电脑文件夹")
        .setDesc("填含 {{title}} 的模板时按笔记名建子目录；填完整路径则直接使用该目录，已存在直接写入、不存在会自动新建。")
        .addText((text) => text
          .setValue(this.plugin.settings.computerOutputDir)
          .setPlaceholder("/绝对/路径/或/含{{title}}模板")
          .onChange(async (value) => {
            this.plugin.settings.computerOutputDir = value;
            await this.plugin.saveSettings();
          }));
      setting.addButton((button) => button.setButtonText("选择文件夹").onClick(async () => {
        await this.selectComputerOutputFolder(container);
      }));
      if (this.plugin.settings.computerOutputDir) {
        setting.addExtraButton((button) => button.setIcon("folder-open").setTooltip("打开文件夹").onClick(async () => {
          try { await openComputerFolder(this.plugin.settings.computerOutputDir); }
          catch (error) { this.reportError(error); }
        }));
      }
    }
    this.addSection(container, "自动导出");
    new Setting(container)
      .setName("动态文件")
      .setDesc(Platform.isMacOS
        ? "实况照片仅支持 macOS。只要笔记中含有动态素材，导出后的全部页面都会按顺序加入“照片”App 的新相簿；动态页为实况照片，静态页为普通图片。所选文件夹仍会保留原件备份。"
        : "插件会读取当前笔记中已经嵌入的动态素材。点击“导出”后保存全部 PNG，并同时导出视频或 GIF 原件。");
  }

  private addSection(container: HTMLElement, title: string): void {
    container.createDiv({ cls: "xhs-control-section", text: title });
  }

  private addSizeControl(container: HTMLElement, name: string, role: TypographyRole, value: SizeScale, update: (value: SizeScale) => void): void {
    const custom = isCustomSizeScale(value);
    const setting = new Setting(container).setName(name);
    setting.addDropdown((dropdown) => {
      for (const option of fontSizeOptions(this.options.style, role)) dropdown.addOption(option.id, option.label);
      dropdown.setValue(custom ? "custom" : value).onChange((next) => {
        if (next === "custom") { customWrap.show(); return; }
        customWrap.hide();
        update(next as SizeScale);
        this.invalidate();
      });
    });
    const customWrap = container.createDiv({ cls: "xhs-custom-input" });
    new Setting(customWrap)
      .setName(`${name}（自定义）`)
      .setDesc("以当前样式基准的百分比，允许 10% - 500%，超出范围自动修正。")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "10";
        text.inputEl.max = "500";
        text.inputEl.step = "1";
        text.setPlaceholder("10 - 500").setValue(custom ? value : "");
        const commit = (): void => {
          const raw = text.inputEl.value.trim();
          const clamped = raw === "" ? value : clampSizeScale(raw);
          text.setValue(clamped);
          update(clamped);
          this.invalidate();
        };
        text.inputEl.addEventListener("blur", commit);
        text.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") text.inputEl.blur();
        });
      });
    if (!custom) customWrap.hide();
  }

  private addMarginControl(container: HTMLElement, name: string, value: PageMargin, update: (value: PageMargin) => void): void {
    const custom = isCustomPageMargin(value);
    const setting = new Setting(container).setName(name);
    setting.addDropdown((dropdown) => {
      for (const option of PAGE_MARGINS) dropdown.addOption(option.id, option.name);
      dropdown.setValue(custom ? "custom" : value).onChange((next) => {
        if (next === "custom") { customWrap.show(); return; }
        customWrap.hide();
        update(next as PageMargin);
        this.invalidate();
      });
    });
    const customWrap = container.createDiv({ cls: "xhs-custom-input" });
    new Setting(customWrap)
      .setName(`${name}（自定义）`)
      .setDesc("以 1080 宽设计稿为基准的像素值，允许 0 - 200，超出范围自动修正。")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.inputEl.max = "200";
        text.inputEl.step = "1";
        text.setPlaceholder("0 - 200").setValue(custom ? value : "");
        const commit = (): void => {
          const raw = text.inputEl.value.trim();
          const clamped = raw === "" ? value : clampPageMargin(raw);
          text.setValue(clamped);
          update(clamped);
          this.invalidate();
        };
        text.inputEl.addEventListener("blur", commit);
        text.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") text.inputEl.blur();
        });
      });
    if (!custom) customWrap.hide();
  }

  private renderAvatarControl(container: HTMLElement): void {
    const setting = new Setting(container).setName("头像图片").setDesc(this.options.showCoverImage ? "只显示头像，不显示旁边的昵称与自定义文字。" : "头像右侧固定显示底部昵称。");
    if (this.options.avatarDataUrl) {
      const preview = setting.controlEl.createEl("img", { cls: "xhs-avatar-preview", attr: { src: this.options.avatarDataUrl, alt: "当前头像" } });
      preview.setAttribute("aria-hidden", "true");
      setting.addExtraButton((button) => button.setIcon("trash-2").setTooltip("删除头像").onClick(async () => {
        await this.plugin.removeAvatar();
        this.options.avatarDataUrl = ""; this.options.showAvatar = false;
        container.empty(); this.renderControls(container); this.invalidate(); new Notice("已删除封面头像");
      }));
    }
    const input = setting.controlEl.createEl("input", { cls: "xhs-avatar-file-input", attr: { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif" } });
    setting.addButton((button) => button.setButtonText(this.options.avatarDataUrl ? "更换" : "上传").onClick(() => input.click()));
    this.plugin.registerDomEvent(input, "change", () => {
      const file = input.files?.[0]; if (!file) return;
      void this.importAvatar(file, container).finally(() => { input.value = ""; });
    });
    new Setting(container).setName("头像 URL").setDesc("填写图片地址后点“应用”，与上方上传二选一；URL 会直接作为图片来源。").addText((text) => text
      .setPlaceholder("https://…")
      .setValue(this.options.avatarUrl || "")
      .onChange((value) => { this.options.avatarUrl = value.trim(); }))
      .addButton((button) => button.setButtonText("应用").onClick(async () => {
        if (!this.options.avatarUrl) { new Notice("请先填写头像 URL"); return; }
        this.options.avatarDataUrl = this.options.avatarUrl;
        container.empty(); this.renderControls(container); this.invalidate(); new Notice("已应用头像 URL");
      }));
  }

  private async importAvatar(file: File, container: HTMLElement): Promise<void> {
    try {
      await this.plugin.importAvatar(file); this.options.avatarDataUrl = this.plugin.settings.avatarDataUrl;
      container.empty(); this.renderControls(container); this.invalidate(); new Notice("头像已保存");
    } catch (error) { new Notice(`头像导入失败：${error instanceof Error ? error.message : String(error)}`, 8000); }
  }

  private renderCoverImageControl(container: HTMLElement): void {
    const setting = new Setting(container).setName("顶部封面图").setDesc(this.options.coverImageDataUrl ? "封面图会铺满第一页上方，可更换或删除。" : "选填；上传后自动裁切为通栏封面图。");
    if (this.options.coverImageDataUrl) {
      setting.controlEl.createEl("img", { cls: "xhs-cover-image-preview", attr: { src: this.options.coverImageDataUrl, alt: "当前封面图" } });
      setting.addExtraButton((button) => button.setIcon("trash-2").setTooltip("删除封面图").onClick(async () => {
        await this.plugin.removeCoverImage(); this.options.coverImageDataUrl = ""; this.options.showCoverImage = false;
        container.empty(); this.renderControls(container); this.invalidate(); new Notice("已删除顶部封面图");
      }));
    }
    const input = setting.controlEl.createEl("input", { cls: "xhs-avatar-file-input", attr: { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif" } });
    setting.addButton((button) => button.setButtonText(this.options.coverImageDataUrl ? "更换" : "上传").onClick(() => input.click()));
    this.plugin.registerDomEvent(input, "change", () => {
      const file = input.files?.[0]; if (!file) return;
      void this.importCoverImage(file, container).finally(() => { input.value = ""; });
    });
    new Setting(container).setName("封面 URL").setDesc("填写图片地址后点“应用”，与上方上传二选一；URL 会直接作为图片来源。").addText((text) => text
      .setPlaceholder("https://…")
      .setValue(this.options.coverImageUrl || "")
      .onChange((value) => { this.options.coverImageUrl = value.trim(); }))
      .addButton((button) => button.setButtonText("应用").onClick(async () => {
        if (!this.options.coverImageUrl) { new Notice("请先填写封面 URL"); return; }
        this.options.coverImageDataUrl = this.options.coverImageUrl;
        container.empty(); this.renderControls(container); this.invalidate(); new Notice("已应用封面 URL");
      }));
  }

  private async importCoverImage(file: File, container: HTMLElement): Promise<void> {
    try {
      await this.plugin.importCoverImage(file); this.options.coverImageDataUrl = this.plugin.settings.coverImageDataUrl;
      container.empty(); this.renderControls(container); this.invalidate(); new Notice("顶部封面图已保存");
    } catch (error) { new Notice(`封面图导入失败：${error instanceof Error ? error.message : String(error)}`, 8000); }
  }

  private invalidate(): void {
    this.pages = null;
    if (this.statusEl) this.statusText.textContent = "正在更新预览…";
    this.schedulePreview();
  }

  private schedulePreview(delay = 300): void {
    if (this.previewTimer !== null) window.clearTimeout(this.previewTimer);
    this.previewTimer = window.setTimeout(() => {
      this.previewTimer = null;
      if (this.busy) { this.schedulePreview(300); return; }
      void this.preview(true);
    }, delay);
  }

  private validate(notify = true): boolean {
    const reject = (message: string): false => {
      if (notify) new Notice(message);
      else if (this.statusEl) this.statusText.textContent = message;
      return false;
    };
    if (Array.from(this.options.authorSubtitle).length > 15) return reject("昵称下方文字不能超过 15 个字");
    const font = this.plugin.fonts.find((item) => item.id === this.options.fontId);
    if ((this.options.style === "handwrite" || this.options.style === "theme") && this.options.fontId !== THEME_FONT_ID && (!font || (!font.available && font.source !== "downloadable"))) {
      return reject("所选手写字体未安装，请换一个字体");
    }
    return true;
  }

  private async buildPages(): Promise<Page[]> {
    const font = this.plugin.fonts.find((item) => item.id === this.options.fontId);
    if ((this.options.style === "handwrite" || this.options.style === "theme") && font?.source === "downloadable" && !font.available) {
      if (this.statusEl) this.statusText.textContent = `正在下载并校验 ${font.name}…`;
      await this.plugin.ensureFontAvailable(font.id);
    }
    const markdown = await this.app.vault.cachedRead(this.file);
    const parsed = parseMarkdown(markdown, this.options.showTitle ? this.file.basename : undefined);
    const covered = addCoverAuthor(parsed, this.options.showAvatar, this.options.account, this.options.authorSubtitle, authorTextVisible(this.options), this.options.avatarDataUrl);
    const resolved = await resolveImages(this.app, covered, this.file.path);
    const withCovers = await resolveVideoCovers(resolved);
    const contentWidth = buildGeometry(this.options).width;
    const blocks = await renderDataviews(this.app, withCovers, this.file.path, contentWidth);
    const measurer = new LayoutMeasurer();
    await measurer.init(this.options, this.plugin.fonts);
    try {
      if (isLongform(this.options.aspectId)) {
        let totalHeight = 0;
        for (const block of blocks) {
          try { totalHeight += measurer.measure(block); } catch (error) { console.error("Export MD notes longform measure 失败", error); }
        }
        const geometry = buildGeometry(this.options, longformHeightFor(this.options, totalHeight));
        this.longGeom = geometry;
        return [{ blocks }];
      }
      this.longGeom = null;
      return paginate(blocks, measurer);
    } finally { measurer.destroy(); }
  }

  private async preview(silent = false): Promise<void> {
    if (!this.validate(!silent) || this.busy) return;
    this.setBusy(true, "正在排版…");
    if (isLongform(this.options.aspectId)) {
      await this.previewLongform();
      return;
    }
    if (this.longformHost) this.longformHost.style.display = "none";
    if (this.longformZoomBar) this.longformZoomBar.style.display = "none";
    if (this.pageSelInput) this.pageSelInput.style.display = "";
    try {
      this.pages = await this.buildPages();
      const total = this.pages.length;
      const selected = this.pageSelection === null
        ? Array.from({ length: total }, (_, i) => i)
        : this.pageSelection.map((p) => p - 1);
      if (this.pageSelInput && !this.pageSelInput.value.trim()) {
        this.pageSelInput.value = `${total}/${total}`;
      }
      const geometry = this.longGeom ?? buildGeometry(this.options);
      const previewScale = Math.min(270 / geometry.width, 0.25);
      this.previewEl!.empty();
      for (let k = 0; k < selected.length; k++) {
        const index = selected[k]!;
        const page = this.pages[index]!;
        const wrapper = this.previewEl!.createDiv({ cls: "xhs-preview-frame" });
        wrapper.style.setProperty("--xhs-frame-ph", `${Math.max(60, Math.round(geometry.height * previewScale))}px`);
        if (page.blocks.some((block) => block.type === "motion")) {
          wrapper.createDiv({ cls: "xhs-motion-badge", text: Platform.isMacOS ? "实况照片" : "动态素材" });
        }
        const frame = wrapper.createEl("iframe");
        frame.style.setProperty("--xhs-frame-w", `${geometry.width}px`);
        frame.style.setProperty("--xhs-frame-h", `${geometry.height}px`);
        frame.style.setProperty("--xhs-frame-scale", String(previewScale));
        frame.srcdoc = pageDocument(this.options, this.plugin.fonts, page, index, total, this.longGeom ?? undefined);
        frame.title = `第 ${index + 1} 页预览`;
      }
      const motionCount = selected.filter((i) => this.pages[i]!.blocks.some((block) => block.type === "motion")).length;
      this.statusText!.textContent = selected.length === total
        ? motionCount === 0
          ? `共 ${total} 页，全部导出为 PNG`
          : Platform.isMacOS
            ? `共 ${total} 页：${motionCount} 张实况照片、${total - motionCount} 张普通图片；全部加入“照片”新相簿`
            : `共 ${total} 页：全部 PNG，另附 ${motionCount} 份动态原件`
        : `共 ${total} 页，已选 ${selected.length} 页导出为 PNG`;
      if (this.pageSelection !== null && selected.length > 0) {
        const minPage = Math.min(...this.pageSelection);
        const domIdx = this.pageSelection.indexOf(minPage);
        requestAnimationFrame(() => {
          const frames = this.previewEl!.querySelectorAll(".xhs-preview-frame");
          frames[domIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        });
      }
    } catch (error) { this.reportError(error); }
    finally { this.setBusy(false); }
  }

  private async previewLongform(): Promise<void> {
    try {
      const showLongform = this.previewMode !== "markdown";
      if (this.previewEl) this.previewEl.style.display = "none";
      if (this.markdownEl) this.markdownEl.style.display = showLongform ? "none" : "";
      if (!this.longformHost || !this.longformViewport || !this.longformSizer) return;
      this.longformHost.style.display = showLongform ? "" : "none";
      this.longformSizer.empty();
      this.longformRender = await renderNoteLongform(this.app, this.file, this.longformSizer, this.options.longformWidth, this.longformAuthor(), this.longformStyle());
      await this.longformRender.ready;
      this.ensureLongformWatermark();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      this.longformViewport.scrollLeft = 0;
      this.longformViewport.scrollTop = 0;
      this.fitLongformPreview();
      this.longformZoom = 1;
      if (this.longformZoomBar) this.longformZoomBar.style.display = showLongform ? "" : "none";
      if (this.pageSelInput) this.pageSelInput.style.display = "none";
      this.statusText!.textContent = "长图预览已就绪：滚轮或拖拽可查看，Ctrl/⌘ + 滚轮或按钮可缩放；导出为单张完整长图";
    } catch (error) { this.reportError(error); }
    finally { this.setBusy(false); }
  }

  // 旧版本默认水印位置是右下角单点，用户期望全屏平铺；已启用水印且从未改过位置时自动迁移为平铺。
  private async migrateLegacyWatermarkPosition(): Promise<void> {
    if (!this.options.watermark.enabled || this.options.watermark.position !== "bottom-right") return;
    const migrated = { ...this.plugin.settings.watermark, position: "tile" as WatermarkPosition };
    this.plugin.settings.watermark = migrated;
    this.options.watermark = migrated;
    await this.plugin.saveSettings();
  }

  private longformAuthor(): LongformAuthor {
    return {
      name: this.options.account,
      subtitle: this.options.authorSubtitle.trim() || undefined,
      avatarUrl: (this.options.avatarDataUrl || this.options.avatarUrl || "").trim() || undefined
    };
  }

  private longformStyle(): LongformStyle {
    const palette = paletteById(this.options.paletteId, this.options.customBg);
    const loaded = this.plugin.fonts.find((font) => font.id === this.options.fontId && font.available);
    let fontFamily: string;
    if (this.options.fontId === THEME_FONT_ID) {
      try {
        const family = getComputedStyle(document.body).fontFamily;
        fontFamily = family && family.trim() && family !== "initial" && family !== "inherit"
          ? family
          : '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
      } catch {
        fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
      }
    } else if ((this.options.style === "handwrite" || this.options.style === "theme") && loaded) {
      fontFamily = `"${loaded.family}",cursive`;
    } else {
      fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';
    }
    const texture = this.options.texture === "auto" ? palette.texture : this.options.texture;
    return {
      palette,
      fontFamily,
      texture: texture === "grid" || texture === "dot" || texture === "line" || texture === "custom" ? texture : undefined,
      customTexture: texture === "custom" ? this.options.customTexture || "" : undefined,
      authorLayout: avatarLayout(this.options.avatarSize),
      authorPosition: this.options.longformAuthorPosition
    };
  }

  // 长图链路不经过 pageDocument，水印需直接叠加在渲染完成的 root 上（预览与导出共用）；
  // 平铺模式按长图宽度动态生成数量，保证不同导出宽度下都能铺满整图。
  private ensureLongformWatermark(): void {
    const root = this.longformRender?.root;
    if (!root) return;
    const watermarkText = this.options.watermark.text.trim() || this.options.account.trim();
    root.querySelector(".xhs-longform-watermark")?.remove();
    if (!this.options.watermark.enabled || !watermarkText) return;
    root.style.position = "relative";
    const palette = paletteById(this.options.paletteId, this.options.customBg);
    const width = root.clientWidth || this.options.longformWidth || 1080;
    const scale = width / 1080;
    const size = Math.max(16, Math.round(this.options.watermark.size * scale));
    const offset = Math.max(12, Math.round(32 * scale));
    const color = this.options.watermark.color || palette.text;
    const opacity = this.options.watermark.opacity.toFixed(2);
    const layer = document.createElement("div");
    layer.className = "xhs-longform-watermark";
    layer.style.cssText = "position:absolute;inset:0;z-index:50;pointer-events:none;";
    if (this.options.watermark.position === "tile") {
      const density = this.options.watermark.tileDensity ?? "dense";
      const cellFactor = tileDensityCellFactor(density, this.options.watermark.tileDensityPercent);
      const cell = Math.max(24, Math.round(size * cellFactor));
      const tileCols = Math.max(2, Math.ceil(((width * 1.5) / cell)));
      const tileRows = Math.max(2, Math.ceil(((root.clientHeight || width * 2) * 1.5) / cell));
      Object.assign(layer.style, {
        position: "absolute",
        inset: "-25%",
        display: "grid",
        gridTemplateColumns: `repeat(${tileCols},${cell}px)`,
        gridTemplateRows: `repeat(${tileRows},${cell}px)`,
        placeItems: "center",
        color,
        opacity,
        fontSize: `${size}px`,
        fontWeight: "600",
        lineHeight: "1.2",
        whiteSpace: "nowrap",
        overflow: "hidden"
      });
      const count = tileCols * tileRows;
      for (let index = 0; index < count; index++) {
        const span = document.createElement("span");
        span.textContent = watermarkText;
        span.style.cssText = "transform:rotate(-45deg);max-width:90%";
        layer.append(span);
      }
    } else {
      layer.textContent = watermarkText;
      Object.assign(layer.style, {
        color,
        opacity,
        fontSize: `${size}px`,
        fontWeight: "600",
        lineHeight: "1.2",
        whiteSpace: "nowrap",
        maxWidth: "55%",
        overflow: "hidden",
        textOverflow: "ellipsis"
      });
      const position = this.options.watermark.position;
      if (position === "center") {
        layer.style.top = "50%"; layer.style.left = "50%"; layer.style.transform = "translate(-50%,-50%)";
      } else if (position === "top-left") { layer.style.top = `${offset}px`; layer.style.left = `${offset}px`; }
      else if (position === "top-right") { layer.style.top = `${offset}px`; layer.style.right = `${offset}px`; }
      else if (position === "bottom-left") { layer.style.bottom = `${offset}px`; layer.style.left = `${offset}px`; }
      else { layer.style.bottom = `${offset}px`; layer.style.right = `${offset}px`; }
    }
    root.append(layer);
  }

  private fitLongformPreview(): void {
    const root = this.longformRender?.root;
    if (!root) return;
    const panelWidth = (this.longformHost?.parentElement?.clientWidth ?? 320) - 24;
    const width = root.clientWidth || this.options.longformWidth || 1080;
    this.longformFitScale = Math.min(panelWidth / width, 1);
    this.applyLongformPreview();
  }

  private applyLongformPreview(): void {
    const root = this.longformRender?.root;
    if (!root || !this.longformSizer) return;
    const scale = this.longformFitScale * this.longformZoom;
    root.style.transform = `scale(${scale})`;
    root.style.transformOrigin = "top left";
    root.style.position = "absolute";
    root.style.top = "0";
    root.style.left = "0";
    const width = root.clientWidth || this.options.longformWidth || 1080;
    const height = root.clientHeight || 0;
    this.longformSizer.style.width = `${Math.round(width * scale)}px`;
    this.longformSizer.style.height = `${Math.round(height * scale)}px`;
    if (this.longformZoomLabel) this.longformZoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  private zoomLongform(factor: number): void {
    this.longformZoom = Math.max(0.1, Math.min(8, this.longformZoom * factor));
    this.applyLongformPreview();
  }

  private zoomLongformReset(): void {
    this.longformZoom = 1;
    this.applyLongformPreview();
  }

  private zoomLongformOriginal(): void {
    const root = this.longformRender?.root;
    if (!root) return;
    this.longformZoom = 1 / this.longformFitScale;
    this.applyLongformPreview();
  }

  private switchPreviewMode(mode: "pages" | "markdown"): void {
    if (this.previewMode === mode) return;
    this.previewMode = mode;
    this.pagesTab?.toggleClass("xhs-preview-tab-active", mode === "pages");
    this.markdownTab?.toggleClass("xhs-preview-tab-active", mode === "markdown");
    if (isLongform(this.options.aspectId)) {
      const showLongform = mode === "pages";
      if (this.longformHost) this.longformHost.style.display = showLongform ? "" : "none";
      if (this.longformZoomBar) this.longformZoomBar.style.display = showLongform ? "" : "none";
      if (this.markdownEl) this.markdownEl.style.display = showLongform ? "none" : "";
      if (this.previewEl) this.previewEl.style.display = "none";
    } else {
      if (this.previewEl) this.previewEl.style.display = mode === "pages" ? "" : "none";
      if (this.markdownEl) this.markdownEl.style.display = mode === "markdown" ? "" : "none";
    }
    if (mode === "markdown") void this.renderMarkdownPreview();
  }

  private async renderMarkdownPreview(): Promise<void> {
    if (!this.markdownEl) return;
    this.markdownComponent?.unload();
    this.markdownComponent = null;
    this.markdownEl.empty();
    const source = await this.app.vault.cachedRead(this.file);
    this.markdownComponent = new Component();
    this.markdownComponent.load();
    try {
      await MarkdownRenderer.render(this.app, source, this.markdownEl, this.file.path, this.markdownComponent);
    } catch (error) {
      console.error("Export MD notes Markdown 预览渲染失败，降级为纯文本", error);
      this.markdownEl.empty();
      this.markdownEl.createEl("pre", { cls: "xhs-markdown-fallback" }).setText(source);
    }
  }

  private async confirmExport(): Promise<boolean> {
    if (isLongform(this.options.aspectId)) {
      return new Promise((resolve) => {
        new ExportConfirmModal(this.app, "将导出 1 张完整长图，确认继续？", resolve).open();
      });
    }
    if (!this.pages) this.pages = await this.buildPages();
    const count = this.pages.length;
    return new Promise((resolve) => {
      new ExportConfirmModal(this.app, `将导出 ${count} 张图片，确认继续？`, resolve).open();
    });
  }

  private async export(): Promise<void> {
    if (!this.validate() || this.busy) return;
    const confirmed = await this.confirmExport();
    if (!confirmed) return;
    this.setBusy(true, "正在准备…");
    if (isLongform(this.options.aspectId)) {
      await this.exportLongform();
      return;
    }
    try {
      if (!this.pages) this.pages = await this.buildPages();
      const destination = await this.resolveExportDestination();
      const summary = await exportMixedPages(this.app, this.pages, this.options, this.plugin.fonts, destination, this.file.basename, (current, total, kind) => {
        if (!this.statusEl) return;
        if (kind === "photos-import") {
          this.statusText.textContent = `正在加入“照片”相簿 ${current}/${total}…`;
          return;
        }
        const label = kind === "live-photo" ? "实况照片" : kind === "motion-original" ? "PNG 与动态原件" : "PNG";
        this.statusText.textContent = `正在导出${label} ${current}/${total}…`;
      }, this.plugin.settings.copyMotionOriginal, this.longGeom ?? undefined, this.pageSelection);
      this.lastExportDirectory = destination.fullPath;
      if (this.openFolderButton) this.openFolderButton.buttonEl.hidden = false;
      const details = Platform.isMacOS
        ? `${summary.livePhotoCount} 张实况照片、${summary.pngCount} 张 PNG`
        : `${summary.pngCount} 张 PNG${summary.motionOriginalCount > 0 ? `、${summary.motionOriginalCount} 份动态原件` : ""}`;
      const photosMessage = summary.photosAlbumName ? `\n已加入“照片”相簿：${summary.photosAlbumName}` : "";
      this.statusText!.textContent = summary.photosAlbumName
        ? `已导出 ${details}；“照片”相簿：${summary.photosAlbumName}；原件：${destination.fullPath}`
        : `已导出 ${details}：${destination.fullPath}`;
      new Notice(`已导出 ${details}${photosMessage}\n原件位置：${destination.fullPath}`, 15000);
    } catch (error) { this.reportError(error); }
    finally { this.setBusy(false); }
  }

  private async exportLongform(): Promise<void> {
    try {
      if (!this.longformRender || !this.longformHost || this.longformHost.childElementCount === 0) {
        this.statusText!.textContent = "正在渲染完整长图…";
        if (!this.longformHost) return;
        this.longformHost.empty();
        this.longformRender = await renderNoteLongform(this.app, this.file, this.longformHost, this.options.longformWidth, this.longformAuthor(), this.longformStyle());
      }
      await this.longformRender.ready;
      this.statusText!.textContent = "正在生成长图…";
      const root = this.longformRender.root;
      this.ensureLongformWatermark();
      const savedTransform = root.style.transform;
      root.style.transform = "";
      const restoreIframes = await prepareLongformIframes(root, this.longformStyle().palette);
      try {
        const binary = await captureLongform(root, { scale: Number(this.options.longformScale), format: this.options.exportFormat });
        const destination = await this.resolveExportDestination();
        const filename = await exportLongformFile(this.app, destination, this.file.basename, this.options, binary, this.options.exportFormat);
        this.lastExportDirectory = destination.fullPath;
        if (this.openFolderButton) this.openFolderButton.buttonEl.hidden = false;
        this.statusText!.textContent = `已导出 ${filename}：${destination.fullPath}`;
        new Notice(`已导出 ${filename}\n原件位置：${destination.fullPath}`, 15000);
      } finally {
        restoreIframes();
        root.style.transform = savedTransform;
      }
    } catch (error) { this.reportError(error); }
    finally { this.setBusy(false); }
  }

  private setBusy(busy: boolean, status?: string): void {
    this.busy = busy; this.previewButton?.setDisabled(busy); this.exportButton?.setDisabled(busy); this.openFolderButton?.setDisabled(busy);
    if (status && this.statusEl) this.statusText.textContent = status;
  }

  private reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    if (this.statusEl) this.statusText.textContent = `失败：${message}`;
    new Notice(`Export MD notes：${message}`, 8000);
    console.error("Export MD notes", error);
  }

  private async selectComputerOutputFolder(container?: HTMLElement): Promise<boolean> {
    try {
      const selected = chooseComputerFolder(this.plugin.settings.computerOutputDir);
      if (!selected) return false;
      this.plugin.settings.computerOutputDir = selected;
      await this.plugin.saveSettings();
      if (container) {
        container.empty();
        this.renderControls(container);
      }
      return true;
    } catch (error) {
      this.reportError(error);
      return false;
    }
  }

  private async resolveExportDestination(): Promise<ExportDestination> {
    if (this.plugin.settings.outputLocationMode === "computer") {
      if (!this.plugin.settings.computerOutputDir && !await this.selectComputerOutputFolder()) {
        throw new Error("尚未选择导出文件夹");
      }
      const directory = resolveComputerDirectory(this.plugin.settings.computerOutputDir, this.file.basename);
      return { kind: "computer", directory, fullPath: directory };
    }
    const attachmentDir = (this.app.vault.getConfig("attachmentFolderPath") as string) || "";
    const directory = resolveVaultDirectory(this.plugin.settings.outputDir, this.file.basename, attachmentDir === "/" ? "" : attachmentDir);
    const adapter = this.app.vault.adapter as { getFullPath?: (path: string) => string };
    let fullPath = directory;
    try {
      if (typeof adapter.getFullPath === "function") fullPath = adapter.getFullPath(directory);
    } catch (error) {
      console.warn("Export MD notes: getFullPath failed, fallback to vault path", error);
    }
    return { kind: "vault", directory, fullPath };
  }

  private async openLastExportFolder(): Promise<void> {
    if (!this.lastExportDirectory) return;
    if (Platform.isMobile) {
      new Notice(`已导出到：${this.lastExportDirectory}\n请在仓库文件浏览器中查看`, 10000);
      return;
    }
    try { await openComputerFolder(this.lastExportDirectory); }
    catch (error) { this.reportError(error); }
  }
}

class ExportConfirmModal extends Modal {
  private result: boolean | null = null;
  constructor(app: App, private message: string, private onResult: (ok: boolean) => void) {
    super(app);
  }
  onOpen(): void {
    this.titleEl.setText("确认导出");
    this.contentEl.createEl("p", { text: this.message });
    const actions = this.contentEl.createDiv({ cls: "xhs-confirm-actions" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.finish(false));
    new ButtonComponent(actions).setButtonText("确认导出").setCta().onClick(() => this.finish(true));
  }
  private finish(ok: boolean): void {
    if (this.result !== null) return;
    this.result = ok;
    this.close();
  }
  onClose(): void {
    this.contentEl.empty();
    if (this.result !== null) this.onResult(this.result);
  }
}
