import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type ExportMdNotesPlugin from "./main";
import type { AspectId, AvatarSize, ExportFormat, LongformScale, PageMargin, SizeScale, StyleId, TextureId, WatermarkOptions } from "./types";
import { ASPECT_PRESETS, AVATAR_SIZES, clampLongformWidth, clampPageMargin, clampSizeScale, fontSizeOptions, isCustomPageMargin, isCustomSizeScale, isLongform, LONGFORM_WIDTH_MAX, LONGFORM_WIDTH_MIN, PAGE_MARGINS, PALETTES, type TypographyRole } from "./presets";
import { THEME_FONT_ID, THEME_FONT_LABEL, type CustomFontConfig } from "./fonts";
import { limitAuthorSubtitle } from "./cover";
import { chooseComputerFolder, openComputerFolder } from "./desktop";
import type { OutputLocationMode } from "./export-location";

export type XhsLongformSettings = {
  account: string;
  style: StyleId;
  paletteId: string;
  customBg: string;
  fontId: string;
  texture: TextureId;
  titleScale: SizeScale;
  subtitleScale: SizeScale;
  bodyScale: SizeScale;
  horizontalMargin: PageMargin;
  topMargin: PageMargin;
  showAvatar: boolean;
  showTitle: boolean;
  avatarDataUrl: string;
  avatarUrl: string;
  avatarSize: AvatarSize;
  authorSubtitle: string;
  coverImageDataUrl: string;
  coverImageUrl: string;
  showCoverImage: boolean;
  aspectId: AspectId;
  longformWidth: number;
  longformScale: LongformScale;
  exportFormat: ExportFormat;
  longformAuthorPosition: LongformAuthorPosition;
  watermark: WatermarkOptions;
  customFonts: CustomFontConfig[];
  outputLocationMode: OutputLocationMode;
  outputDir: string;
  computerOutputDir: string;
};

export const DEFAULT_SETTINGS: XhsLongformSettings = {
  account: "", style: "theme", paletteId: "theme", customBg: "#FAFAF8", fontId: THEME_FONT_ID, texture: "theme",
  titleScale: "100", subtitleScale: "100", bodyScale: "100", horizontalMargin: "88", topMargin: "88",
  showAvatar: false, showTitle: true, avatarDataUrl: "", avatarUrl: "", avatarSize: "medium", authorSubtitle: "",
  coverImageDataUrl: "", coverImageUrl: "", showCoverImage: false,
  aspectId: "longform", longformWidth: 1080, longformScale: "1", exportFormat: "png", longformAuthorPosition: "bottom-right", watermark: { enabled: false, text: "", size: 40, opacity: 0.12, color: "", position: "tile", tileDensity: "dense" }, customFonts: [],
  outputLocationMode: "vault", outputDir: "", computerOutputDir: "", copyMotionOriginal: false
};

export class XhsLongformSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ExportMdNotesPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; containerEl.empty();
    new Setting(containerEl).setName("封面与作者").setHeading();
    this.renderCoverSettings(containerEl);
    new Setting(containerEl).setName("图片比例").setDesc(isLongform(this.plugin.settings.aspectId) ? "长图模式：按内容自动计算高度，导出为单张长图。" : "预览与导出均按该比例排版。").addDropdown((dropdown) => {
      for (const preset of ASPECT_PRESETS) dropdown.addOption(preset.id, preset.name);
      return dropdown.setValue(this.plugin.settings.aspectId).onChange(async (value) => { this.plugin.settings.aspectId = value as AspectId; await this.plugin.saveSettings(); });
    });
    new Setting(containerEl).setName("长图导出宽度").setDesc("仅长图模式生效：导出图片的宽度（像素），高度按内容自动计算。输入完成失焦或回车后生效。").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = String(LONGFORM_WIDTH_MIN);
      text.inputEl.max = String(LONGFORM_WIDTH_MAX);
      text.inputEl.step = "1";
      text.setValue(String(this.plugin.settings.longformWidth));
      const commitWidth = (): void => {
        const raw = text.inputEl.value.trim();
        const clamped = raw === "" ? this.plugin.settings.longformWidth : clampLongformWidth(raw);
        text.setValue(String(clamped));
        this.plugin.settings.longformWidth = Number(clamped);
        void this.plugin.saveSettings();
      };
      text.inputEl.addEventListener("blur", commitWidth);
      text.inputEl.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") text.inputEl.blur();
      });
      return text;
    });
    new Setting(containerEl).setName("长图导出画质").setDesc("仅长图模式生效：1x 为标准画质，2x/3x/4x 按倍数放大导出（更清晰，文件更大）。").addDropdown((dropdown) => dropdown
      .addOption("1", "1x 标准").addOption("2", "2x 高清").addOption("3", "3x 超清").addOption("4", "4x 极限")
      .setValue(this.plugin.settings.longformScale)
      .onChange(async (value) => { this.plugin.settings.longformScale = value as LongformScale; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("长图导出格式").setDesc("仅长图模式生效：导出文件的格式。").addDropdown((dropdown) => dropdown
      .addOption("png", "PNG").addOption("jpg", "JPG").addOption("pdf", "PDF")
      .setValue(this.plugin.settings.exportFormat)
      .onChange(async (value) => { this.plugin.settings.exportFormat = value as ExportFormat; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("视觉样式").setHeading();
    new Setting(containerEl).setName("风格").setDesc("系统主题样式：排版与字重以当前 Obsidian 主题为基础。").addDropdown((dropdown) => dropdown.addOption("theme", "系统主题样式").addOption("pingfang", "简约黑体").addOption("handwrite", "手写纹理").setValue(this.plugin.settings.style).onChange(async (value) => {
      this.plugin.settings.style = value as StyleId;
      this.plugin.settings.paletteId = "theme";
      await this.plugin.saveSettings(); this.display();
    }));
    new Setting(containerEl).setName("配色").setDesc("系统主题样式：颜色取自当前主题，深色/浅色主题自动适配。").addDropdown((dropdown) => {
      dropdown.addOption("theme", "系统主题样式");
      for (const palette of PALETTES.filter((item) => item.style === this.plugin.settings.style)) dropdown.addOption(palette.id, palette.name);
      dropdown.addOption("custom", "自定义");
      return dropdown.setValue(this.plugin.settings.paletteId).onChange(async (value) => { this.plugin.settings.paletteId = value; await this.plugin.saveSettings(); this.display(); });
    });
    if (this.plugin.settings.paletteId === "custom") {
      new Setting(containerEl).setName("背景色").setDesc("文字与标题颜色会按背景亮度自动适配。").addColorPicker((picker) => picker
        .setValue(this.plugin.settings.customBg || "#FAFAF8")
        .onChange(async (value) => { this.plugin.settings.customBg = value || "#FAFAF8"; await this.plugin.saveSettings(); this.display(); }));
    }
    new Setting(containerEl).setName("字体").setDesc("跟随主题字体：导出时读取当前 Obsidian 主题的正文字体；也可以选择手写字体或导入的字体文件。").addDropdown((dropdown) => {
      dropdown.addOption(THEME_FONT_ID, THEME_FONT_LABEL);
      for (const font of this.plugin.fonts) dropdown.addOption(font.id, this.fontLabel(font));
      for (const option of Array.from(dropdown.selectEl.options)) {
        const font = this.plugin.fonts.find((item) => item.id === option.value);
        option.disabled = Boolean(font && !font.available && font.source !== "downloadable");
      }
      return dropdown.setValue(this.plugin.settings.fontId).onChange(async (value) => { this.plugin.settings.fontId = value; await this.plugin.saveSettings(); });
    });
    new Setting(containerEl).setName("下载字体缓存").setDesc("开源字体只缓存在当前电脑的应用数据中，不写入 vault，也不会通过 Obsidian Sync 同步。").addButton((button) => button.setButtonText("清除缓存").onClick(async () => {
      try { await this.plugin.clearDownloadedFonts(); new Notice("已清除下载字体缓存"); this.display(); }
      catch (error) { new Notice(`清除失败：${error instanceof Error ? error.message : String(error)}`); }
    }));
    this.renderCustomFontSettings(containerEl);
    new Setting(containerEl).setName("纹理").setDisabled(this.plugin.settings.style !== "handwrite" && this.plugin.settings.style !== "theme").addDropdown((dropdown) => dropdown
      .addOption("theme", "跟随主题（无纹理）").addOption("auto", "跟随配色推荐").addOption("none", "无纹理").addOption("grid", "格子纸").addOption("dot", "圆点纸").addOption("line", "横线纸")
      .setValue(this.plugin.settings.texture).onChange(async (value) => { this.plugin.settings.texture = value as TextureId; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("文字与页面").setHeading();
    this.addSizeSetting(containerEl, "标题字号", "文件名标题的实际导出字号。", "title", this.plugin.settings.titleScale, async (value) => { this.plugin.settings.titleScale = value; await this.plugin.saveSettings(); });
    this.addSizeSetting(containerEl, "小标题字号", "正文中 # 标题的实际导出字号；## 与 ### 会依次缩小。", "subtitle", this.plugin.settings.subtitleScale, async (value) => { this.plugin.settings.subtitleScale = value; await this.plugin.saveSettings(); });
    this.addSizeSetting(containerEl, "正文字号", "正文的实际导出字号，同时影响列表、引用和表格。", "body", this.plugin.settings.bodyScale, async (value) => { this.plugin.settings.bodyScale = value; await this.plugin.saveSettings(); });
    this.addMarginSetting(containerEl, "左右边距", "缩小后每行可以容纳更多文字。", this.plugin.settings.horizontalMargin, async (value) => { this.plugin.settings.horizontalMargin = value; await this.plugin.saveSettings(); });
    this.addMarginSetting(containerEl, "顶部边距", "缩小后每页可以容纳更多内容。", this.plugin.settings.topMargin, async (value) => { this.plugin.settings.topMargin = value; await this.plugin.saveSettings(); });
    new Setting(containerEl).setName("导出").setHeading();
    new Setting(containerEl).setName("动态页复制原件").setDesc("动态素材（GIF/视频）页面导出时，同时把原件复制到导出目录；关闭则只导出静态 PNG。macOS 实况照片不受此开关影响。").addToggle((toggle) => toggle
      .setValue(this.plugin.settings.copyMotionOriginal)
      .onChange(async (value) => { this.plugin.settings.copyMotionOriginal = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("保存位置").setDesc("可以保存到当前 Obsidian 仓库，也可以选择电脑上的任意文件夹。").addDropdown((dropdown) => dropdown
      .addOption("vault", "当前 Obsidian 仓库")
      .addOption("computer", "电脑文件夹")
      .setValue(this.plugin.settings.outputLocationMode)
      .onChange(async (value) => {
        this.plugin.settings.outputLocationMode = value as OutputLocationMode;
        await this.plugin.saveSettings();
        this.display();
      }));
    if (this.plugin.settings.outputLocationMode === "vault") {
      new Setting(containerEl).setName("仓库内目录").setDesc("留空则导出到仓库附件文件夹；填含 {{title}} 的模板时按笔记名建子目录；填完整路径则直接使用该目录，已存在直接写入、不存在会自动新建。重复导出同参数覆盖，不同参数自动新增命名。").addText((text) => text
        .setPlaceholder("留空则导出到仓库附件文件夹")
        .setValue(this.plugin.settings.outputDir)
        .onChange(async (value) => {
          this.plugin.settings.outputDir = value;
          await this.plugin.saveSettings();
        }));
    } else {
      const setting = new Setting(containerEl).setName("电脑文件夹")
        .setDesc("填含 {{title}} 的模板时按笔记名建子目录；填完整路径则直接使用该目录，已存在直接写入、不存在会自动新建。重复导出同参数覆盖，不同参数自动新增命名。")
        .addText((text) => text
          .setValue(this.plugin.settings.computerOutputDir)
          .setPlaceholder("/绝对/路径/或/含{{title}}模板")
          .onChange(async (value) => {
            this.plugin.settings.computerOutputDir = value;
            await this.plugin.saveSettings();
            this.display();
          }));
      setting.addButton((button) => button.setButtonText("选择文件夹").setCta().onClick(async () => {
        const selected = chooseComputerFolder(this.plugin.settings.computerOutputDir);
        if (!selected) return;
        this.plugin.settings.computerOutputDir = selected;
        await this.plugin.saveSettings();
        this.display();
      }));
      if (this.plugin.settings.computerOutputDir) {
        setting.addExtraButton((button) => button.setIcon("folder-open").setTooltip("打开文件夹").onClick(async () => {
          try { await openComputerFolder(this.plugin.settings.computerOutputDir); }
          catch (error) { new Notice(`无法打开文件夹：${error instanceof Error ? error.message : String(error)}`); }
        }));
      }
    }
  }

  private fontLabel(font: ExportMdNotesPlugin["fonts"][number]): string {
    if (font.available) return font.name;
    return font.source === "downloadable" ? `${font.name}（首次使用时下载）` : `${font.name}（未安装）`;
  }

  private addSizeSetting(container: HTMLElement, name: string, description: string, role: TypographyRole, value: SizeScale, onChange: (value: SizeScale) => Promise<void>): void {
    const custom = isCustomSizeScale(value);
    const setting = new Setting(container).setName(name).setDesc(description);
    setting.addDropdown((dropdown) => {
      for (const option of fontSizeOptions(this.plugin.settings.style, role)) dropdown.addOption(option.id, option.label);
      dropdown.setValue(custom ? "custom" : value).onChange((next) => {
        if (next === "custom") { customWrap.show(); return; }
        customWrap.hide();
        void onChange(next as SizeScale);
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
          void onChange(clamped);
        };
        text.inputEl.addEventListener("blur", commit);
        text.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") text.inputEl.blur();
        });
      });
    if (!custom) customWrap.hide();
  }

  private addMarginSetting(container: HTMLElement, name: string, description: string, value: PageMargin, onChange: (value: PageMargin) => Promise<void>): void {
    const custom = isCustomPageMargin(value);
    const setting = new Setting(container).setName(name).setDesc(description);
    setting.addDropdown((dropdown) => {
      for (const option of PAGE_MARGINS) dropdown.addOption(option.id, option.name);
      dropdown.setValue(custom ? "custom" : value).onChange((next) => {
        if (next === "custom") { customWrap.show(); return; }
        customWrap.hide();
        void onChange(next as PageMargin);
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
          void onChange(clamped);
        };
        text.inputEl.addEventListener("blur", commit);
        text.inputEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") text.inputEl.blur();
        });
      });
    if (!custom) customWrap.hide();
  }

  private renderCoverSettings(container: HTMLElement): void {
    new Setting(container).setName("底部昵称").setDesc("选填；固定显示在每一页底部，页码始终显示。")
      .addText((text) => text.setPlaceholder("选填，例如 ying").setValue(this.plugin.settings.account).onChange(async (value) => { this.plugin.settings.account = value.trim(); await this.plugin.saveSettings(); }));
    new Setting(container).setName("长图作者栏位置").setDesc("作者名填写后选择：仅长图模式生效，右下角为脚注式小字，左上角为页眉式小字，字号与分片页脚一致，不新增空白节。").addDropdown((dropdown) => dropdown
      .addOption("bottom-right", "右下角（脚注式）").addOption("top", "左上角（页眉式）")
      .setValue(this.plugin.settings.longformAuthorPosition)
      .onChange(async (value) => { this.plugin.settings.longformAuthorPosition = value as XhsLongformSettings["longformAuthorPosition"]; await this.plugin.saveSettings(); }));
    new Setting(container).setName("显示顶部封面图").setDesc("开启后才显示封面图上传选项。").addToggle((toggle) => toggle.setValue(this.plugin.settings.showCoverImage).onChange(async (value) => {
      this.plugin.settings.showCoverImage = value; await this.plugin.saveSettings(); this.display();
    }));
    if (this.plugin.settings.showCoverImage) this.renderCoverImageSetting(container);
    new Setting(container).setName("显示头像").setDesc(this.plugin.settings.showCoverImage ? "头像叠在封面图与底图的分割线上。" : "头像与昵称显示在第一页顶部，内页不重复。").addToggle((toggle) => toggle.setValue(this.plugin.settings.showAvatar).onChange(async (value) => {
      this.plugin.settings.showAvatar = value; await this.plugin.saveSettings(); this.display();
    }));
    if (this.plugin.settings.showAvatar) {
      this.renderAvatarSetting(container);
      new Setting(container).setName("头像区域大小").setDesc("同时调整头像和周围间距；默认使用中档。").addDropdown((dropdown) => {
        for (const option of AVATAR_SIZES) dropdown.addOption(option.id, option.name);
        return dropdown.setValue(this.plugin.settings.avatarSize).onChange(async (value) => { this.plugin.settings.avatarSize = value as AvatarSize; await this.plugin.saveSettings(); });
      });
    }
    if (this.plugin.settings.showAvatar && !this.plugin.settings.showCoverImage) {
      new Setting(container).setName("昵称下方文字").setDesc("可填写日期、账号或任意一句话，最多 15 个字；留空时昵称垂直居中。")
        .addText((text) => {
          return text.setPlaceholder("选填，最多 15 个字").setValue(this.plugin.settings.authorSubtitle).onChange(async (value) => {
            const limited = limitAuthorSubtitle(value); if (limited !== value) text.setValue(limited);
            this.plugin.settings.authorSubtitle = limited; await this.plugin.saveSettings();
          });
        });
    }
    new Setting(container).setName("显示标题").setDesc("标题取当前笔记的文件名，关闭后直接从正文开始。").addToggle((toggle) => toggle.setValue(this.plugin.settings.showTitle).onChange(async (value) => {
      this.plugin.settings.showTitle = value; await this.plugin.saveSettings();
    }));
  }

  private renderAvatarSetting(container: HTMLElement): void {
    const setting = new Setting(container).setName("封面头像").setDesc(this.plugin.settings.avatarDataUrl ? "已保存到当前插件设置中；导出时可以更换或删除。" : "上传后自动居中裁切为正方形，仅用于封面。");
    if (this.plugin.settings.avatarDataUrl) {
      const preview = setting.controlEl.createEl("img", { cls: "xhs-avatar-preview", attr: { src: this.plugin.settings.avatarDataUrl, alt: "当前头像" } });
      preview.setAttribute("aria-hidden", "true");
      setting.addExtraButton((button) => button.setIcon("trash-2").setTooltip("删除头像").onClick(async () => {
        await this.plugin.removeAvatar(); new Notice("已删除封面头像"); this.display();
      }));
    }
    const input = setting.controlEl.createEl("input", { cls: "xhs-avatar-file-input", attr: { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif" } });
    setting.addButton((button) => button.setButtonText(this.plugin.settings.avatarDataUrl ? "更换" : "上传").onClick(() => input.click()));
    this.plugin.registerDomEvent(input, "change", () => {
      const file = input.files?.[0]; if (!file) return;
      void this.importAvatar(file).finally(() => { input.value = ""; });
    });
  }

  private renderCoverImageSetting(container: HTMLElement): void {
    const setting = new Setting(container).setName("顶部封面图").setDesc(this.plugin.settings.coverImageDataUrl ? "封面图会铺满第一页上方，可更换或删除。" : "选填；上传后自动裁切为通栏封面图。");
    if (this.plugin.settings.coverImageDataUrl) {
      setting.controlEl.createEl("img", { cls: "xhs-cover-image-preview", attr: { src: this.plugin.settings.coverImageDataUrl, alt: "当前封面图" } });
      setting.addExtraButton((button) => button.setIcon("trash-2").setTooltip("删除封面图").onClick(async () => {
        await this.plugin.removeCoverImage(); new Notice("已删除顶部封面图"); this.display();
      }));
    }
    const input = setting.controlEl.createEl("input", { cls: "xhs-avatar-file-input", attr: { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif" } });
    setting.addButton((button) => button.setButtonText(this.plugin.settings.coverImageDataUrl ? "更换" : "上传").onClick(() => input.click()));
    this.plugin.registerDomEvent(input, "change", () => {
      const file = input.files?.[0]; if (!file) return;
      void this.importCoverImage(file).finally(() => { input.value = ""; });
    });
  }

  private async importCoverImage(file: File): Promise<void> {
    try { await this.plugin.importCoverImage(file); new Notice("顶部封面图已保存"); this.display(); }
    catch (error) { new Notice(`封面图导入失败：${error instanceof Error ? error.message : String(error)}`, 8000); }
  }

  private async importAvatar(file: File): Promise<void> {
    try { await this.plugin.importAvatar(file); new Notice("头像已保存"); this.display(); }
    catch (error) { new Notice(`头像导入失败：${error instanceof Error ? error.message : String(error)}`, 8000); }
  }

  private renderCustomFontSettings(container: HTMLElement): void {
    const importSetting = new Setting(container)
      .setName("导入自定义字体")
      .setDesc("支持 ttf、otf、woff、woff2；字体只保存到当前 vault 的 .export-md-notes/fonts，不会上传或安装到操作系统。最大 30 mb。");
    const input = importSetting.controlEl.createEl("input", {
      cls: "xhs-font-file-input",
      attr: { type: "file", accept: ".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" }
    });
    this.plugin.registerDomEvent(input, "change", () => {
      const file = input.files?.[0];
      if (!file) return;
      void this.importFont(file).finally(() => { input.value = ""; });
    });

    if (!this.plugin.settings.customFonts.length) return;
    new Setting(container).setName("已导入字体").setHeading();
    for (const font of this.plugin.settings.customFonts) {
      new Setting(container)
        .setName(font.name)
        .setDesc(font.path)
        .addExtraButton((button) => button.setIcon("trash-2").setTooltip("移除字体").onClick(async () => {
          try {
            await this.plugin.removeCustomFont(font.id);
            new Notice(`已移除字体：${font.name}`);
            this.display();
          } catch (error) { new Notice(`移除失败：${error instanceof Error ? error.message : String(error)}`); }
        }));
    }
  }

  private async importFont(file: File): Promise<void> {
    try {
      await this.plugin.importCustomFont(file);
      new Notice(`已导入字体：${file.name}`);
      this.display();
    } catch (error) { new Notice(`导入失败：${error instanceof Error ? error.message : String(error)}`, 8000); }
  }
}
