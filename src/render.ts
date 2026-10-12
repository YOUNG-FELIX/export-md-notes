import { avatarLayout, buildGeometry, paletteById, scaledSize, tileDensityCellFactor, TYPOGRAPHY, type ExportGeometry } from "./presets";
import { providerLabel } from "./covers";
import type { Block, ExportOptions, Inline, Page } from "./types";
import type { LoadedFont } from "./fonts";

const DEFAULT_THEME_FONT_FAMILY = '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif';

function readThemeFontFamily(): string {
  try {
    const style = getComputedStyle(document.body);
    const family = style.fontFamily;
    if (family && family.trim() && family !== "initial" && family !== "inherit") return family;
  } catch { /* 非浏览器环境降级默认字体 */ }
  return DEFAULT_THEME_FONT_FAMILY;
}

export function getRenderCss(options: ExportOptions, fonts: LoadedFont[], geom: ExportGeometry = buildGeometry(options)): string {
  const palette = paletteById(options.paletteId, options.customBg);
  const author = avatarLayout(options.avatarSize);
  const type = TYPOGRAPHY[options.style];
  const loaded = fonts.find((font) => font.id === options.fontId && font.available);
  const family = options.fontId === "theme"
    ? readThemeFontFamily()
    : (options.style === "handwrite" || options.style === "theme") && loaded
      ? `"${loaded.family}",cursive`
      : DEFAULT_THEME_FONT_FAMILY;
  const texture = options.texture === "theme" ? undefined : options.texture === "auto" ? palette.texture : options.texture;
  const textureImage = texture === "grid"
    ? `linear-gradient(to right,currentColor ${geom.textureStroke}px,transparent ${geom.textureStroke}px),linear-gradient(to bottom,currentColor ${geom.textureStroke}px,transparent ${geom.textureStroke}px)`
    : texture === "dot"
      ? `radial-gradient(circle,currentColor 0 ${geom.textureStroke}px,transparent ${geom.textureStroke}px)`
      : texture === "line"
        ? `linear-gradient(to bottom,transparent 0,transparent ${geom.textureLine - geom.textureStroke}px,currentColor ${geom.textureLine - geom.textureStroke}px)`
        : "none";
  const textureSize = texture === "grid" ? `${geom.textureGrid}px ${geom.textureGrid}px` : texture === "dot" ? `${geom.textureDot}px ${geom.textureDot}px` : texture === "line" ? `${geom.textureLine}px ${geom.textureLine}px` : `${geom.textureLine}px ${geom.textureLine}px`;
  const textureOpacity = texture === "dot" ? ".05" : ".035";
const customTextureDecl = options.texture === "custom" && options.customTexture && options.customTexture.trim() ? `;${options.customTexture.trim().replace(/;+$/, "")}` : "";
  const [, titleWeight, titleLine] = type.title;
  const [, subtitleWeight, subtitleLine] = type.subtitle;
  const [, bodyWeight, bodyLine] = type.body;
  const [, tableWeight, tableLine] = type.table;
  const titleSize = scaledSize(type.title[0], options.titleScale);
  const subtitleSize = scaledSize(type.subtitle[0], options.subtitleScale);
  const subtitle2Size = Math.round(subtitleSize * TYPOGRAPHY.headingLevelScale[2]);
  const subtitle3Size = Math.round(subtitleSize * TYPOGRAPHY.headingLevelScale[3]);
  const subtitle4Size = Math.round(subtitleSize * TYPOGRAPHY.headingLevelScale[4]);
  const subtitle5Size = Math.round(subtitleSize * TYPOGRAPHY.headingLevelScale[5]);
  const subtitle6Size = Math.round(subtitleSize * TYPOGRAPHY.headingLevelScale[6]);
  const bodySize = scaledSize(type.body[0], options.bodyScale);
  const tableSize = scaledSize(type.table[0], options.bodyScale);

  const watermarkSize = Math.round(options.watermark.size * geom.scale);
  const watermarkOpacity = options.watermark.opacity.toFixed(2);
  const watermarkOffset = Math.max(12, Math.round(32 * geom.scale));
  const watermarkBottom = geom.footerBottom + geom.footerSize + watermarkOffset;
  return `${options.style === "handwrite" || options.style === "theme" ? (loaded?.faceCss ?? "") : ""}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:${family};color:${palette.text};background:transparent}
.xhs-card{position:relative;width:${geom.width}px;height:${geom.height}px;overflow:hidden;background:${palette.bg};color:${palette.text}}
.xhs-card::before{content:"";position:absolute;inset:0;background-image:${textureImage};background-size:${textureSize};color:${palette.text};opacity:${textureOpacity};z-index:0;pointer-events:none${customTextureDecl}}
.xhs-cover-image{position:absolute;z-index:1;left:0;top:0;width:${geom.width}px;height:${geom.coverImageHeight}px;display:block;object-fit:cover;object-position:center}
.xhs-content{position:absolute;z-index:1;left:${geom.horizontalMargin}px;top:${geom.topMargin}px;width:${geom.contentWidth}px;height:${geom.contentHeight}px;overflow:hidden;display:flex;flex-direction:column}
.xhs-card-cover .xhs-content{top:${geom.firstTop}px;height:${geom.firstPageContentHeight}px}
.xhs-block{display:flow-root;flex:0 0 auto;width:100%;overflow-wrap:anywhere;word-break:normal;line-break:strict;white-space:normal}
.xhs-author{display:flex;align-items:center;gap:${author.gap}px;margin:0 0 ${author.bottom}px;min-height:${author.avatar}px}.xhs-author-avatar{width:${author.avatar}px;height:${author.avatar}px;flex:0 0 ${author.avatar}px;border-radius:50%;object-fit:cover;object-position:center;border:5px solid ${palette.bg}}.xhs-author-text{align-self:stretch;display:flex;flex-direction:column;justify-content:center;min-width:0}.xhs-card-cover .xhs-author-text{align-self:center;padding:12px 18px;background:${palette.bg};border-radius:14px}.xhs-author-name{font-size:${author.nickname}px;font-weight:${type.bold};line-height:1.25;color:${palette.text};overflow-wrap:anywhere}.xhs-author-subtitle{margin-top:8px;font-size:${Math.max(28, Math.round(author.nickname * .65))}px;font-weight:400;line-height:1.3;color:${palette.text};opacity:.42;overflow-wrap:anywhere}
.xhs-cover-title{font-size:${titleSize}px;font-weight:${titleWeight};line-height:${titleLine};color:${palette.title};margin:0 0 ${geom.titleBottom}px}
.xhs-subtitle{font-size:${subtitleSize}px;font-weight:${subtitleWeight};line-height:${subtitleLine};color:${palette.subtitle};margin:${geom.subtitleTop}px 0 ${geom.subtitleBottom}px}
.xhs-subtitle-2{font-size:${subtitle2Size}px}.xhs-subtitle-3{font-size:${subtitle3Size}px}.xhs-subtitle-4{font-size:${subtitle4Size}px}.xhs-subtitle-5{font-size:${subtitle5Size}px}.xhs-subtitle-6{font-size:${subtitle6Size}px}
.xhs-paragraph{font-size:${bodySize}px;font-weight:${bodyWeight};line-height:${bodyLine};margin:0 0 ${geom.paragraphGap}px}
.xhs-quote,.xhs-code-block{font-size:${bodySize}px;font-weight:${bodyWeight};line-height:${bodyLine};margin:0 0 ${geom.paragraphGap}px;padding:${geom.inlinePadding * 2}px ${geom.inlinePadding * 3}px;border-left:${geom.inlinePadding / 2}px solid ${palette.subtitle};background:${palette.tableZebra};color:${palette.text};white-space:pre-wrap}
.xhs-list{font-size:${bodySize}px;font-weight:${bodyWeight};line-height:${bodyLine};margin:0 0 ${geom.paragraphGap}px;padding-left:${geom.listIndentEm}em}
.xhs-list li{margin:${geom.listItemGap}px 0;padding:0}
.xhs-bold{font-weight:${type.bold}}.xhs-italic{font-style:italic}.xhs-highlight{background:${palette.highlightBg};color:${palette.highlightText ?? "inherit"};border-radius:${geom.radius}px;padding:0 ${geom.inlinePadding}px}
.xhs-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:${palette.highlightBg};border-radius:${geom.radius}px;padding:0 ${geom.inlinePadding}px}
.xhs-math{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-style:italic;color:${palette.subtitle}}
.xhs-md-link{color:${palette.subtitle};text-decoration:underline;text-underline-offset:2px}
.xhs-strike{text-decoration:line-through;opacity:.75}
.xhs-checkbox{display:inline-block;width:${Math.round(bodySize * .8)}px;height:${Math.round(bodySize * .8)}px;margin-right:${geom.inlinePadding * 2}px;border:2px solid ${palette.subtitle};border-radius:${Math.max(4, geom.radius)}px;vertical-align:-2px}
.xhs-checkbox.xhs-checked{background:${palette.subtitle};box-shadow:inset 0 0 0 2px ${palette.bg}}
.xhs-tag{color:${palette.subtitle};background:${palette.highlightBg};border-radius:${geom.radius}px;padding:0 ${geom.inlinePadding}px}
.xhs-table-wrap{margin:${geom.mediaMargin}px 0;width:100%}.xhs-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:${tableSize}px;font-weight:${tableWeight};line-height:${tableLine}}
.xhs-table th,.xhs-table td{padding:${geom.inlinePadding * 2}px ${geom.inlinePadding * 3}px;text-align:left;vertical-align:top;border-bottom:${geom.textureStroke / 4}px solid ${palette.tableBorder};overflow-wrap:anywhere}
.xhs-table th{font-weight:${type.tableHead};background:${palette.tableHeadBg};color:${palette.tableHeadText}}.xhs-table tbody tr:nth-child(even){background:${palette.tableZebra}}
.xhs-image,.xhs-image-pair,.xhs-motion{margin:${geom.mediaMargin}px 0;display:flex;gap:${geom.imageGap}px}.xhs-image img,.xhs-motion img,.xhs-motion video{width:${geom.imageWidth}px;height:${geom.imageHeight}px}.xhs-image-pair img{width:${geom.pairWidth}px;height:${geom.pairHeight}px}
.xhs-video-embed{margin:${geom.mediaMargin}px 0;width:100%}.xhs-video-embed .xhs-embed-cover{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;object-position:center;border-radius:${geom.radius}px}
.xhs-video-embed .xhs-embed-fallback{display:flex;align-items:center;height:${Math.max(44, Math.round(bodySize * 2.2))}px;padding:0 ${geom.inlinePadding * 3}px;border-radius:${geom.radius}px;background:${palette.tableZebra};color:${palette.subtitle};font-size:${bodySize}px;line-height:1;gap:${geom.inlinePadding * 2}px}
.xhs-video-embed .xhs-embed-fallback a{color:inherit;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xhs-image.xhs-contain img{width:${geom.contentWidth}px;height:auto;object-fit:contain}
.xhs-image img,.xhs-image-pair img,.xhs-motion img,.xhs-motion video{display:block;object-fit:cover;object-position:center;border-radius:${geom.radius}px}
.xhs-spacer{height:${geom.spacerHeight}px}
.xhs-continues-next{margin-bottom:0}
.xhs-footer{position:absolute;z-index:1;left:${geom.horizontalMargin}px;right:${geom.horizontalMargin}px;bottom:${geom.footerBottom}px;height:${geom.footerSize}px;font-size:${geom.footerSize}px;font-weight:400;line-height:1;color:${palette.text}}
.xhs-account{position:absolute;left:0;bottom:0;opacity:.45}.xhs-page-number{position:absolute;right:0;bottom:0;opacity:.35}
.xhs-watermark{position:absolute;z-index:2;pointer-events:none;color:${options.watermark.color || palette.text};opacity:${watermarkOpacity};font-size:${watermarkSize}px;font-weight:600;line-height:1.2;white-space:nowrap;max-width:55%;overflow:hidden;text-overflow:ellipsis}
.xhs-watermark-top-left{top:${watermarkOffset}px;left:${watermarkOffset}px}.xhs-watermark-top-right{top:${watermarkOffset}px;right:${watermarkOffset}px}
.xhs-watermark-bottom-left{bottom:${watermarkBottom}px;left:${watermarkOffset}px}.xhs-watermark-bottom-right{bottom:${watermarkBottom}px;right:${watermarkOffset}px}
.xhs-watermark-center{top:50%;left:50%;transform:translate(-50%,-50%)}
.xhs-watermark-tile{position:absolute;inset:-25%;z-index:2;pointer-events:none;display:grid;place-items:center;color:${options.watermark.color || palette.text};opacity:${watermarkOpacity};font-size:${watermarkSize}px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden}
.xhs-watermark-tile-item{transform:rotate(-45deg);max-width:90%}
.xhs-measure{position:absolute;left:-20000px;top:0;width:${geom.contentWidth}px;visibility:hidden;display:flex;flex-direction:column}
`;
}

function renderInlineText(inlines: Inline[]): string {
  let out = "";
  for (const inline of inlines) {
    if (inline.type === "text" || inline.type === "math" || inline.type === "tag") out += inline.text;
    else if ("children" in inline) out += renderInlineText(inline.children);
  }
  return out;
}

export function renderInline(doc: Document, inlines: Inline[], depth = 0): DocumentFragment {
  const fragment = doc.createDocumentFragment();
  if (depth > 32) {
    for (const inline of inlines) {
      if ("text" in inline && typeof (inline as { text?: unknown }).text === "string") fragment.append(doc.createTextNode((inline as { text: string }).text));
      else if ("children" in inline) fragment.append(doc.createTextNode(renderInlineText(inline.children)));
    }
    return fragment;
  }
  for (const inline of inlines) {
    if (inline.type === "text") { fragment.append(doc.createTextNode(inline.text)); continue; }
    if (inline.type === "checkbox") {
      const span = doc.createElement("span");
      span.className = `xhs-checkbox${inline.checked ? " xhs-checked" : ""}`;
      span.setAttribute("aria-label", inline.checked ? "已完成" : "未完成");
      fragment.append(span);
      continue;
    }
    if (inline.type === "tag") {
      const span = doc.createElement("span");
      span.className = "xhs-tag";
      span.textContent = `#${inline.text}`;
      fragment.append(span);
      continue;
    }
    if (inline.type === "math") {
      const span = doc.createElement("span");
      span.className = "xhs-math";
      span.textContent = inline.text;
      fragment.append(span);
      continue;
    }
    const el = inline.type === "link" ? doc.createElement("a") : doc.createElement("span");
    el.className = `xhs-${inline.type === "link" ? "md-link" : inline.type}`;
    if (inline.type === "link") el.setAttribute("href", escapeHtml(inline.href));
    el.append(renderInline(doc, inline.children, depth + 1));
    fragment.append(el);
  }
  return fragment;
}

export function renderBlock(doc: Document, block: Block): HTMLElement {
  if (block.type === "author") {
    const row = doc.createElement("div"); row.className = "xhs-block xhs-author";
    const avatar = doc.createElement("img"); avatar.className = "xhs-author-avatar"; avatar.src = block.avatarDataUrl; avatar.alt = "头像";
    row.append(avatar);
    if (block.showText) {
      const text = doc.createElement("div"); text.className = "xhs-author-text";
      const nickname = doc.createElement("span"); nickname.className = "xhs-author-name"; nickname.textContent = block.nickname; text.append(nickname);
      if (block.subtitle) { const subtitle = doc.createElement("span"); subtitle.className = "xhs-author-subtitle"; subtitle.textContent = block.subtitle; text.append(subtitle); }
      row.append(text);
    }
    return row;
  }
  if (block.type === "image" || block.type === "image-pair") {
    const div = doc.createElement("div"); div.className = `xhs-block xhs-${block.type}`;
    const images = block.type === "image" ? [block] : block.images;
    for (const image of images) { const img = doc.createElement("img"); img.src = image.dataUri ?? ""; img.alt = image.alt; if (image.contain) div.classList.add("xhs-contain"); div.append(img); }
    return div;
  }
  if (block.type === "motion") {
    const div = doc.createElement("div");
    div.className = "xhs-block xhs-motion";
    div.dataset.motionId = block.id;
    if (block.format === "gif") {
      const image = doc.createElement("img");
      image.src = block.resourceUrl ?? "";
      image.alt = block.alt;
      div.append(image);
    } else {
      const video = doc.createElement("video");
      video.src = block.resourceUrl ?? "";
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.setAttribute("aria-label", block.alt || "动态视频");
      div.append(video);
    }
    return div;
  }
  if (block.type === "video-embed") {
    const div = doc.createElement("div");
    div.className = "xhs-block xhs-video-embed";
    if (block.coverDataUrl) {
      const img = doc.createElement("img");
      img.className = "xhs-embed-cover";
      img.src = block.coverDataUrl;
      img.alt = block.title ?? block.url;
      div.append(img);
    } else {
      const fallback = doc.createElement("div");
      fallback.className = "xhs-embed-fallback";
      const link = doc.createElement("a");
      link.href = block.url;
      link.textContent = `▶ ${providerLabel(block.provider)}`;
      fallback.append(link);
      div.append(fallback);
    }
    return div;
  }
  if (block.type === "spacer") { const div = doc.createElement("div"); div.className = "xhs-block xhs-spacer"; return div; }
  if (block.type === "dataview") {
    const div = doc.createElement("div"); div.className = "xhs-block xhs-code-block";
    div.append(renderInline(doc, [{ type: "text", text: `\`\`\`${block.language}\n${block.query}\n\`\`\`` }]));
    return div;
  }
  if (block.type === "table") {
    const wrap = doc.createElement("div"); wrap.className = "xhs-block xhs-table-wrap";
    const table = doc.createElement("table"); table.className = "xhs-table";
    const thead = table.createTHead(); const hr = thead.insertRow();
    for (const cell of block.header) { const th = doc.createElement("th"); th.append(renderInline(doc, cell)); hr.append(th); }
    const tbody = table.createTBody();
    for (const row of block.rows) { const tr = tbody.insertRow(); for (const cell of row) { const td = tr.insertCell(); td.append(renderInline(doc, cell)); } }
    wrap.append(table); return wrap;
  }
  if (block.type === "list") {
    const list = doc.createElement(block.ordered ? "ol" : "ul"); list.className = `xhs-block xhs-list${block.continuesNext ? " xhs-continues-next" : ""}`;
    for (const item of block.items) { const li = doc.createElement("li"); li.append(renderInline(doc, item)); list.append(li); }
    return list;
  }
  const tag = block.type === "cover-title" ? "h1" : block.type === "subtitle" ? `h${(block.headingLevel ?? 1) + 1}` : "div";
  const levelClass = block.type === "subtitle" ? ` xhs-subtitle-${block.headingLevel ?? 1}` : "";
  const el = doc.createElement(tag); el.className = `xhs-block xhs-${block.type}${levelClass}${block.continuesNext ? " xhs-continues-next" : ""}`; el.append(renderInline(doc, block.inlines)); return el;
}

export function pageDocument(options: ExportOptions, fonts: LoadedFont[], page: Page, index: number, total: number, geom?: ExportGeometry): string {
  const geometry = geom ?? buildGeometry(options);
  const css = getRenderCss(options, fonts, geometry);
  const doc = document.implementation.createHTMLDocument("");
  const content = doc.createElement("div"); content.className = "xhs-content";
  for (const block of page.blocks) content.append(renderBlock(doc, block));
  const accountValue = options.account.trim();
  const account = escapeHtml(accountValue.startsWith("@") ? accountValue : `@${accountValue}`);
  const accountHtml = accountValue ? `<span class="xhs-account">${account}</span>` : "";
  const cover = index === 0 && options.showCoverImage && options.coverImageDataUrl;
  const coverImage = cover ? `<img class="xhs-cover-image" src="${escapeHtml(options.coverImageDataUrl)}" alt="封面图">` : "";
  const watermarkText = options.watermark.text.trim() || accountValue;
  const tileDensity = options.watermark.tileDensity ?? "dense";
  const watermarkSize = Math.round(options.watermark.size * geometry.scale);
  const cellFactor = tileDensityCellFactor(tileDensity, options.watermark.tileDensityPercent);
  const cell = Math.max(24, Math.round(watermarkSize * cellFactor));
  const tileCols = Math.max(2, Math.ceil(((geometry.width || 1080) * 1.5) / cell));
  const tileRows = Math.max(2, Math.ceil(((geometry.height || 1440) * 1.5) / cell));
  const tileCount = tileCols * tileRows;
  const watermark = options.watermark.enabled && watermarkText
    ? options.watermark.position === "tile"
      ? `<div class="xhs-watermark-tile" style="grid-template-columns:repeat(${tileCols},${cell}px);grid-template-rows:repeat(${tileRows},${cell}px)">${`<span class="xhs-watermark-tile-item">${escapeHtml(watermarkText)}</span>`.repeat(tileCount)}</div>`
      : `<div class="xhs-watermark xhs-watermark-${options.watermark.position}">${escapeHtml(watermarkText)}</div>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="xhs-card${cover ? " xhs-card-cover" : ""}">${coverImage}${content.outerHTML}${watermark}<div class="xhs-footer">${accountHtml}<span class="xhs-page-number">${index + 1}/${total}</span></div></div></body></html>`;
}

function escapeHtml(value: string): string {
  return (value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
