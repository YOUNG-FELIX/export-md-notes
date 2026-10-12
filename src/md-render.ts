import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import type { Palette } from "./presets";
import { classifyVideoUrl } from "./parser";
import { fetchVideoCover } from "./covers";

export type LongformRenderResult = {
  root: HTMLElement;
  markdownEl: HTMLElement;
  component: Component;
  ready: Promise<void>;
};

export type LongformAuthor = {
  name: string;
  avatarUrl?: string;
  subtitle?: string;
};

export type LongformStyle = {
  palette: Palette;
  fontFamily: string;
  texture?: "grid" | "dot" | "line" | "custom";
  customTexture?: string;
  authorLayout?: { avatar: number; nickname: number; gap: number; bottom: number };
  authorPosition?: "top" | "bottom-right";
};

const DEFAULT_THEME_FONT_FAMILY = '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';

const DEFAULT_PALETTE: Palette = { id: "paper-white", name: "纸白极简", style: "pingfang", bg: "#FAFAF8", text: "#1a1a1a", title: "#000000", subtitle: "#111111", highlightBg: "#FFF3B0", tableHeadBg: "#111111", tableHeadText: "#FFFFFF", tableZebra: "#F5F5F3", tableBorder: "#E8E8E8" };

function buildAuthorHeader(root: HTMLElement, author: LongformAuthor, style: LongformStyle): void {
  const name = author.name.trim();
  if (!name) return;
  const palette = style.palette ?? DEFAULT_PALETTE;
  const width = parseFloat(root.style.width) || 1080;
  const scale = width / 1080;
  // 长图作者栏与分片页脚同级别小字：不占文档流，直接叠加在长图上，避免在内容前新增空白节
  const position = style.authorPosition ?? "bottom-right";
  const layout = style.authorLayout ?? { avatar: 132, nickname: 48, gap: 32, bottom: 60 };
  const nicknameSize = Math.max(24, Math.round(layout.nickname * scale));
  const avatarSize = Math.max(40, Math.round(layout.avatar * scale));
  const gap = Math.max(12, Math.round(layout.gap * scale));
  const offset = Math.max(20, Math.round(layout.bottom * scale));
  const header = root.createDiv();
  header.className = "xhs-longform-author";
  header.style.cssText = `position:absolute;z-index:2;display:flex;align-items:center;gap:${gap}px;padding:${Math.round(14 * scale)}px ${Math.round(20 * scale)}px;` +
    (position === "top"
      ? `top:${offset}px;left:${offset}px;`
      : `bottom:${offset}px;right:${offset}px;background:${palette.bg};border-radius:${Math.round(16 * scale)}px;`);
  const avatarUrl = author.avatarUrl?.trim();
  if (avatarUrl) {
    const avatarEl = header.createEl("img");
    avatarEl.src = avatarUrl;
    avatarEl.style.cssText = `width:${avatarSize}px;height:${avatarSize}px;border-radius:50%;object-fit:cover;flex:none;background:${palette.highlightBg};`;
  }
  const text = header.createDiv();
  text.style.cssText = "display:flex;flex-direction:column;justify-content:center;min-width:0;";
  const nickname = text.createDiv();
  nickname.textContent = name;
  nickname.style.cssText = `font-size:${nicknameSize}px;font-weight:600;line-height:1.25;color:${palette.text};overflow-wrap:anywhere;white-space:nowrap;`;
  const subtitle = author.subtitle?.trim();
  if (subtitle) {
    const sub = text.createDiv();
    sub.textContent = subtitle;
    sub.style.cssText = `margin-top:${Math.round(4 * scale)}px;font-size:${Math.max(18, Math.round(22 * scale))}px;line-height:1.3;color:${palette.text};opacity:.42;overflow-wrap:anywhere;white-space:nowrap;`;
    text.append(sub);
  }
  header.append(text);
  root.append(header);
}

function buildTextureLayer(root: HTMLElement, style: LongformStyle): void {
  const texture = style.texture;
  if (!texture) return;
  const palette = style.palette;
  const stroke = 4;
  const image = texture === "grid"
    ? `linear-gradient(to right,currentColor ${stroke}px,transparent ${stroke}px),linear-gradient(to bottom,currentColor ${stroke}px,transparent ${stroke}px)`
    : texture === "dot"
      ? `radial-gradient(circle,currentColor 0 ${stroke}px,transparent ${stroke}px)`
      : texture === "line"
        ? `linear-gradient(to bottom,transparent 0,transparent ${104 - stroke}px,currentColor ${104 - stroke}px)`
        : "";
  const size = texture === "grid" ? "88px 88px" : texture === "dot" ? "56px 56px" : texture === "line" ? "104px 104px" : "";
  const customDecl = texture === "custom" && style.customTexture && style.customTexture.trim()
    ? `;${style.customTexture.trim().replace(/;+$/, "")}`
    : "";
  const layer = root.createDiv();
  layer.className = "xhs-longform-texture";
  layer.style.cssText = `position:absolute;inset:0;z-index:0;pointer-events:none;background-image:${image};background-size:${size};color:${palette.text};opacity:${texture === "dot" ? ".05" : ".035"};${customDecl}`;
  root.insertBefore(layer, root.firstChild);
}

const DATAVIEW_SETTLE_MS = 500;
const DATAVIEW_TIMEOUT_MS = 5000;

function copyThemeClasses(target: HTMLElement): void {
  for (const cls of Array.from(document.body.classList)) {
    if (cls === "is-mobile" || cls === "is-phone" || cls === "is-tablet" || cls.startsWith("theme-") || cls.startsWith("is-")) {
      target.addClass(cls);
    }
  }
}

function waitForStable(el: HTMLElement, settleMs: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let timer = 0;
    let lastChange = Date.now();
    const observer = new MutationObserver(() => { lastChange = Date.now(); });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    const loop = (): void => {
      const elapsed = Date.now() - lastChange;
      if (elapsed >= settleMs || Date.now() - start >= timeoutMs) {
        observer.disconnect();
        resolve();
        return;
      }
      timer = window.setTimeout(loop, 120);
    };
    const start = Date.now();
    loop();
  });
}


// 长图截图对跨域 iframe 无法绘制（dom-to-image 序列化失败会留白）。
// 预览阶段保持 iframe 原生渲染；仅在导出截图前调用本函数：能取到封面时临时替换为 16:9 封面图，
// 封面拉不到或非已知视频平台则保留 iframe 原样（不搞占位符），截图完成后调用返回的 restore 还原 iframe。
export async function prepareLongformIframes(container: HTMLElement, palette: Palette): Promise<() => void> {
  const iframes = Array.from(container.querySelectorAll("iframe"));
  const replaced: Array<{ iframe: HTMLElement; wrap: HTMLElement }> = [];
  await Promise.allSettled(iframes.map(async (iframe) => {
    const src = (iframe.getAttribute("src") ?? iframe.getAttribute("data-src") ?? "").trim();
    if (!src) return;
    const block = classifyVideoUrl(src, iframe.getAttribute("title") ?? undefined);
    if (!block) return; // 未知视频平台：保留 iframe 原样
    const cover = await fetchVideoCover(block);
    if (!cover) return; // 封面获取失败：保留 iframe 原样，不强制占位符
    const wrap = document.createElement("div");
    wrap.style.cssText = `position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:${palette.tableZebra ?? "#F0F0F0"};margin:12px 0;`;
    const img = document.createElement("img");
    img.src = cover;
    img.alt = block.title ?? block.url;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    wrap.append(img);
    try { await img.decode(); } catch { /* 忽略解码失败 */ }
    iframe.replaceWith(wrap);
    replaced.push({ iframe, wrap });
  }));
  return () => {
    for (const item of replaced) item.wrap.replaceWith(item.iframe);
  };
}

export async function renderNoteLongform(app: App, file: TFile, host: HTMLElement, width = 1080, author?: LongformAuthor, style?: LongformStyle): Promise<LongformRenderResult> {
  host.empty();
  const root = host.createDiv({ cls: "export-image-root" });
  root.style.width = `${width}px`;
  root.style.position = "relative";
  copyThemeClasses(root);
  const palette = style?.palette;
  if (palette) {
    root.style.background = palette.bg;
    root.style.color = palette.text;
  }
  if (style?.fontFamily) root.style.fontFamily = style.fontFamily;
  const effectiveStyle: LongformStyle = style ?? { palette: DEFAULT_PALETTE, fontFamily: DEFAULT_THEME_FONT_FAMILY };
  buildTextureLayer(root, effectiveStyle);
  buildAuthorHeader(root, author ?? { name: "" }, effectiveStyle);
  const markdownEl = root.createDiv({ cls: "markdown-rendered export-image-markdown" });
  markdownEl.style.cssText = "position:relative;z-index:1;";
  if (palette) markdownEl.style.color = palette.text;
  const source = await app.vault.cachedRead(file);
  const component = new Component();
  component.load();
  try {
    await MarkdownRenderer.render(app, source, markdownEl, file.path, component);
  } catch (error) {
    console.error("Export MD notes 长图渲染失败，降级为纯文本", error);
    markdownEl.empty();
    markdownEl.createEl("pre", { cls: "export-image-fallback", text: source });
  }
  const ready = (async () => {
    try { await document.fonts.ready; } catch { /* 忽略字体等待失败 */ }
    await waitForStable(markdownEl, DATAVIEW_SETTLE_MS, DATAVIEW_TIMEOUT_MS);
    const palette = effectiveStyle.palette;
    const images = Array.from(markdownEl.querySelectorAll("img"));
    await Promise.allSettled(images.map((img) => img.decode().catch(() => undefined)));
  })();
  return { root, markdownEl, component, ready };
}
