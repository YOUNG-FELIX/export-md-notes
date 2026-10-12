import type { AspectId, AvatarSize, ExportOptions, PageMargin, SizeScale, StyleId, TextureId } from "./types";

export type Palette = {
  id: string; name: string; style: StyleId;
  bg: string; text: string; title: string; subtitle: string;
  highlightBg: string; highlightText?: string;
  tableHeadBg: string; tableHeadText: string;
  tableZebra: string; tableBorder: string;
  texture?: Exclude<TextureId, "auto" | "none">;
};

export const GEOMETRY = {
  width: 1080, height: 1440, padding: 88, contentWidth: 904,
  contentHeight: 1208, contentBottom: 1296, bottomSafe: 144,
  footerBottom: 40, footerSize: 34,
  paragraphGap: 20, subtitleTop: 32, subtitleBottom: 8,
  listItemGap: 4, listIndentEm: 1.2, titleBottom: 24,
  mediaMargin: 20, imageGap: 20, spacerHeight: 28,
  imageWidth: 904, imageHeight: 508, pairWidth: 442, pairHeight: 248,
  radius: 8, inlinePadding: 6,
  textureGrid: 88, textureDot: 56, textureLine: 104, textureStroke: 4
} as const;

export const COVER_IMAGE_HEIGHT = 608;

export type LayoutGeometry = {
  horizontalMargin: number;
  topMargin: number;
  contentWidth: number;
  contentHeight: number;
  imageWidth: number;
  pairWidth: number;
};

export const layoutGeometry = (options: Pick<ExportOptions, "horizontalMargin" | "topMargin">): LayoutGeometry => {
  const horizontalMargin = Number(options.horizontalMargin);
  const topMargin = Number(options.topMargin);
  const contentWidth = GEOMETRY.width - horizontalMargin * 2;
  return {
    horizontalMargin,
    topMargin,
    contentWidth,
    contentHeight: GEOMETRY.contentBottom - topMargin,
    imageWidth: contentWidth,
    pairWidth: Math.floor((contentWidth - GEOMETRY.imageGap) / 2)
  };
};

export type AspectPreset = { id: AspectId; name: string; width: number; height: number };

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: "xhs-3x4", name: "小红书 3:4", width: 1080, height: 1440 },
  { id: "douyin-9x16", name: "抖音 9:16", width: 1080, height: 1920 },
  { id: "square-1x1", name: "方形 1:1", width: 1080, height: 1080 },
  { id: "common-4x5", name: "通用 4:5", width: 1080, height: 1350 },
  { id: "longform", name: "长图", width: 1080, height: 0 }
];

export const aspectPreset = (id: string): AspectPreset => ASPECT_PRESETS.find((item) => item.id === id) ?? ASPECT_PRESETS[0]!;

export const isLongform = (id: string): boolean => id === "longform";

export type ExportGeometry = {
  width: number;
  height: number;
  scale: number;
  horizontalMargin: number;
  topMargin: number;
  firstTop: number;
  contentWidth: number;
  contentBottom: number;
  contentHeight: number;
  firstPageContentHeight: number;
  bottomSafe: number;
  footerBottom: number;
  footerSize: number;
  paragraphGap: number;
  subtitleTop: number;
  subtitleBottom: number;
  listItemGap: number;
  listIndentEm: number;
  titleBottom: number;
  mediaMargin: number;
  imageGap: number;
  spacerHeight: number;
  imageWidth: number;
  imageHeight: number;
  pairWidth: number;
  pairHeight: number;
  radius: number;
  inlinePadding: number;
  textureGrid: number;
  textureDot: number;
  textureLine: number;
  textureStroke: number;
  coverImageHeight: number;
};

type GeometryOptions = Pick<ExportOptions, "aspectId" | "horizontalMargin" | "topMargin" | "showAvatar" | "avatarDataUrl" | "avatarSize" | "coverImageDataUrl" | "showCoverImage">;

const round = (value: number): number => Math.round(value);

export function buildGeometry(options: GeometryOptions, height?: number): ExportGeometry {
  const preset = aspectPreset(options.aspectId);
  const width = preset.width;
  const scale = width / GEOMETRY.width;
  const horizontalMargin = round(Number(options.horizontalMargin) * scale);
  const topMargin = round(Number(options.topMargin) * scale);
  const contentWidth = width - horizontalMargin * 2;
  const explicit = height !== undefined && height > 0;
  const bottomSafe = round(GEOMETRY.bottomSafe * scale);
  // 内容底部安全线随实际画布高度缩放：任意比例下内容区都能填满画布并保留 footer 安全区，
  // 不再固定按 3:4 的 contentBottom 计算（1:1 时内容会溢出截断、9:16 时底部大片空白）。
  // 小红书 3:4 下 effectiveHeight - bottomSafe = 1440 - 144 = 1296，与原 GEOMETRY.contentBottom 完全一致。
  const effectiveHeight = explicit ? height : preset.height;
  const contentBottom = Math.max(topMargin + 1, effectiveHeight - bottomSafe);
  const firstPage = firstPageGeometry(options, contentBottom);
  const contentHeight = contentBottom - topMargin;
  return {
    width,
    height: effectiveHeight,
    scale,
    horizontalMargin,
    topMargin,
    firstTop: round(firstPage.top * scale),
    contentWidth,
    contentBottom,
    contentHeight,
    firstPageContentHeight: explicit ? contentHeight : Math.max(0, round((contentBottom - firstPage.top) * scale)),
    bottomSafe,
    footerBottom: round(GEOMETRY.footerBottom * scale),
    footerSize: round(GEOMETRY.footerSize * scale),
    paragraphGap: round(GEOMETRY.paragraphGap * scale),
    subtitleTop: round(GEOMETRY.subtitleTop * scale),
    subtitleBottom: round(GEOMETRY.subtitleBottom * scale),
    listItemGap: round(GEOMETRY.listItemGap * scale),
    listIndentEm: GEOMETRY.listIndentEm,
    titleBottom: round(GEOMETRY.titleBottom * scale),
    mediaMargin: round(GEOMETRY.mediaMargin * scale),
    imageGap: round(GEOMETRY.imageGap * scale),
    spacerHeight: round(GEOMETRY.spacerHeight * scale),
    imageWidth: contentWidth,
    imageHeight: round(GEOMETRY.imageHeight * scale),
    pairWidth: Math.floor((contentWidth - GEOMETRY.imageGap) / 2),
    pairHeight: round(GEOMETRY.pairHeight * scale),
    radius: round(GEOMETRY.radius * scale),
    inlinePadding: round(GEOMETRY.inlinePadding * scale),
    textureGrid: round(GEOMETRY.textureGrid * scale),
    textureDot: round(GEOMETRY.textureDot * scale),
    textureLine: round(GEOMETRY.textureLine * scale),
    textureStroke: round(GEOMETRY.textureStroke * scale),
    coverImageHeight: round(COVER_IMAGE_HEIGHT * scale)
  };
}

export function longformHeightFor(options: GeometryOptions, contentHeight: number): number {
  const geom = buildGeometry(options);
  const height = Math.ceil(geom.topMargin + contentHeight + geom.bottomSafe);
  return Math.min(height, 16000);
}

export const TYPOGRAPHY = {
  theme: { title: [88, 800, 1.3], subtitle: [56, 700, 1.4], body: [46, 300, 1.6], bold: 600, table: [42, 300, 1.4], tableHead: 600 },
  pingfang: { title: [88, 800, 1.3], subtitle: [56, 700, 1.4], body: [46, 300, 1.6], bold: 600, table: [42, 300, 1.4], tableHead: 600 },
  handwrite: { title: [96, 700, 1.35], subtitle: [60, 700, 1.45], body: [52, 400, 1.65], bold: 700, table: [46, 400, 1.45], tableHead: 700 },
  headingLevelScale: { 1: 1, 2: 0.86, 3: 0.75, 4: 0.68, 5: 0.62, 6: 0.56 }
} as const;

export const SIZE_SCALES: SizeScale[] = ["80", "90", "100", "110"];

// 自定义字号：以预设为基准的百分比，允许 10% - 500%；字号偏小不会破坏排版，主要是超大字号有风险，超出自动收敛。
export const SIZE_SCALE_MIN = 10;
export const SIZE_SCALE_MAX = 500;
// 自定义边距：设计稿基准 px（1080 宽），允许 0 - 200，超出自动收敛；0 为无留白，200 仍保证内容区为正宽。
export const PAGE_MARGIN_MIN = 0;
export const PAGE_MARGIN_MAX = 200;

export const CUSTOM_SIZE_ID = "custom";
export const CUSTOM_MARGIN_ID = "custom";
// 平铺密度：0 - 100 百分比，数值越大越密集；0 最疏、100 最密，80 约等于原"密集"档。
export const TILE_DENSITY_MIN = 0;
export const TILE_DENSITY_MAX = 100;
export const TILE_DENSITY_DEFAULT = 80;
// 三档预设对应的单元格边长系数（size 的倍数），保留旧档位行为。
export const TILE_DENSITY_FACTORS: Record<Exclude<TileDensity, "custom">, number> = { sparse: 4.4, medium: 3.5, dense: 2.9 };

export const LONGFORM_WIDTH_MIN = 300;
export const LONGFORM_WIDTH_MAX = 3000;
export const LONGFORM_WIDTH_DEFAULT = 1080;
export const clampLongformWidth = (value: string): string => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return String(LONGFORM_WIDTH_DEFAULT);
  return String(Math.min(LONGFORM_WIDTH_MAX, Math.max(LONGFORM_WIDTH_MIN, n)));
};

export const clampTileDensity = (value: string): string => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return String(TILE_DENSITY_DEFAULT);
  return String(Math.min(TILE_DENSITY_MAX, Math.max(TILE_DENSITY_MIN, n)));
};

// 密度 -> 单元格边长系数：档位走预设常量，custom 按百分比线性映射（80% -> 2.8，接近原 dense 2.9）。
export const tileDensityCellFactor = (density: TileDensity | undefined, percent?: number): number => {
  if (density && density !== "custom") return TILE_DENSITY_FACTORS[density];
  const pct = clampTileDensity(String(percent ?? TILE_DENSITY_DEFAULT));
  const n = Number(pct);
  return 6.0 - 4.0 * (n / 100);
};

export const isCustomSizeScale = (value: string): boolean => !SIZE_SCALES.includes(value as SizeScale);

export const isCustomPageMargin = (value: string): boolean => !PAGE_MARGINS.some((item) => item.id === value);

export const clampSizeScale = (value: string): string => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return SIZE_SCALES[2]!;
  return String(Math.min(SIZE_SCALE_MAX, Math.max(SIZE_SCALE_MIN, n)));
};

export const clampPageMargin = (value: string): string => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return PAGE_MARGINS[2]!.id;
  return String(Math.min(PAGE_MARGIN_MAX, Math.max(PAGE_MARGIN_MIN, n)));
};

// 解析页码选择输入：空 / "12/12"（前后相等）→ null（全部）
// 支持单页 "8"、逗号列表 "1,2,4"、范围 "1-6"、混合 "1,3-5,8"
// 保留输入顺序，自动去重、忽略越界页码；全部非法时回退 null（全部）
export const parsePageSelection = (input: string, total: number): number[] | null => {
  const raw = (input || "").trim();
  if (!raw || total <= 0) return null;
  if (/^\d+\s*\/\s*\d+$/.test(raw)) {
    const parts = raw.split("/");
    if (parseInt(parts[0]!, 10) === parseInt(parts[1]!, 10)) return null;
  }
  const seen = new Set<number>();
  const result: number[] = [];
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = parseInt(range[1]!, 10);
      const end = parseInt(range[2]!, 10);
      if (start <= end) {
        for (let p = start; p <= end; p++) {
          if (p >= 1 && p <= total && !seen.has(p)) { seen.add(p); result.push(p); }
        }
      }
      continue;
    }
    if (/^\d+$/.test(token)) {
      const p = parseInt(token, 10);
      if (p >= 1 && p <= total && !seen.has(p)) { seen.add(p); result.push(p); }
    }
  }
  return result.length === 0 ? null : result;
};

export const PAGE_MARGINS: Array<{ id: PageMargin; name: string }> = [
  { id: "64", name: "紧凑（64 px）" },
  { id: "76", name: "偏小（76 px）" },
  { id: "88", name: "标准（88 px）" },
  { id: "100", name: "偏大（100 px）" },
  { id: "112", name: "宽松（112 px）" },
  { id: "custom", name: "自定义" }
];

export const AVATAR_SIZES: Array<{ id: AvatarSize; name: string }> = [
  { id: "small", name: "小" },
  { id: "medium", name: "中" },
  { id: "large", name: "大" }
];

export const avatarLayout = (size: AvatarSize): { avatar: number; nickname: number; gap: number; bottom: number } => {
  if (size === "small") return { avatar: 108, nickname: 42, gap: 28, bottom: 48 };
  if (size === "large") return { avatar: 156, nickname: 56, gap: 38, bottom: 72 };
  return { avatar: 132, nickname: 48, gap: 32, bottom: 60 };
};

export const firstPageGeometry = (options: Pick<ExportOptions, "topMargin" | "showAvatar" | "avatarDataUrl" | "avatarSize" | "coverImageDataUrl" | "showCoverImage">, contentBottom: number): { top: number; height: number } => {
  if (!options.showCoverImage || !options.coverImageDataUrl) {
    const top = Number(options.topMargin);
    return { top, height: contentBottom - top };
  }
  const hasAvatar = options.showAvatar && Boolean(options.avatarDataUrl);
  const top = hasAvatar ? COVER_IMAGE_HEIGHT - avatarLayout(options.avatarSize).avatar / 2 : COVER_IMAGE_HEIGHT + 56;
  return { top, height: contentBottom - top };
};

export const scaledSize = (base: number, scale: SizeScale): number => Math.round(base * Number(scale) / 100);

export type TypographyRole = "title" | "subtitle" | "body";

export const fontSizeOptions = (style: StyleId, role: TypographyRole): Array<{ id: SizeScale; label: string }> => {
  const base = TYPOGRAPHY[style][role][0];
  return [
    ...SIZE_SCALES.map((id) => ({ id, label: `${scaledSize(base, id)} px` })),
    { id: CUSTOM_SIZE_ID, label: "自定义…" }
  ];
};

export const PALETTES: Palette[] = [
  { id: "paper-white", name: "纸白极简", style: "pingfang", bg: "#FAFAF8", text: "#1a1a1a", title: "#000000", subtitle: "#111111", highlightBg: "#FFF3B0", tableHeadBg: "#111111", tableHeadText: "#FFFFFF", tableZebra: "#F5F5F3", tableBorder: "#E8E8E8" },
  { id: "warm-apricot", name: "暖杏", style: "pingfang", bg: "#FDF6EE", text: "#3D2B1F", title: "#2D1B0E", subtitle: "#6B4D33", highlightBg: "#F5DFB8", tableHeadBg: "#3D2B1F", tableHeadText: "#FDF6EE", tableZebra: "#F8EDE0", tableBorder: "#E8D5C0" },
  { id: "green-field", name: "青野", style: "pingfang", bg: "#F4F7F0", text: "#2D3A25", title: "#1B2815", subtitle: "#3D5533", highlightBg: "#D4E8B8", tableHeadBg: "#2D3A25", tableHeadText: "#F4F7F0", tableZebra: "#EBF0E6", tableBorder: "#D0DDCA" },
  { id: "ink-black", name: "墨黑", style: "pingfang", bg: "#141414", text: "#D8D3CC", title: "#F0EBE5", subtitle: "#C9A855", highlightBg: "rgba(201,168,85,0.25)", highlightText: "#E8D9A0", tableHeadBg: "#2A2A2A", tableHeadText: "#C9A855", tableZebra: "#1A1A1A", tableBorder: "#2A2A2A" },
  { id: "cool-black", name: "冷淡黑", style: "handwrite", bg: "#F5F4F2", text: "#1A1A1A", title: "#000000", subtitle: "#333333", highlightBg: "#E0DFDC", tableHeadBg: "#1A1A1A", tableHeadText: "#F5F4F2", tableZebra: "#EEEDEB", tableBorder: "#DDDCDA", texture: "dot" },
  { id: "milk-tea", name: "奶茶", style: "handwrite", bg: "#F5EDE0", text: "#3D2B1F", title: "#2D1B0E", subtitle: "#7A5C3E", highlightBg: "#E8D5B0", tableHeadBg: "#3D2B1F", tableHeadText: "#F5EDE0", tableZebra: "#F0E4D3", tableBorder: "#DDD0BF", texture: "grid" },
  { id: "matcha", name: "抹茶", style: "handwrite", bg: "#E8EFD8", text: "#2D3A1F", title: "#1A2B0E", subtitle: "#4A6B35", highlightBg: "#C8DDA8", tableHeadBg: "#2D3A1F", tableHeadText: "#E8EFD8", tableZebra: "#DDE7C9", tableBorder: "#C8D8B8", texture: "dot" },
  { id: "peach", name: "蜜桃粉", style: "handwrite", bg: "#FBE8E0", text: "#3A1F1F", title: "#2B0E0E", subtitle: "#9A5548", highlightBg: "#F0CAB8", tableHeadBg: "#3A1F1F", tableHeadText: "#FBE8E0", tableZebra: "#F6DCD2", tableBorder: "#E8CFC5", texture: "grid" },
  { id: "lavender", name: "薰衣草", style: "handwrite", bg: "#EDE7F3", text: "#2D1F3A", title: "#1A0E2B", subtitle: "#6B4D8A", highlightBg: "#D5C8E8", tableHeadBg: "#2D1F3A", tableHeadText: "#EDE7F3", tableZebra: "#E4DBED", tableBorder: "#C8BDD8", texture: "line" }
];

const hexLuminance = (hex: string): number => {
  const h = (hex || "").replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// 系统主题样式：以当前 Obsidian 主题的 CSS 变量为基础生成调色板，深色/浅色主题自动适配。
const readThemeVariable = (name: string, fallback: string): string => {
  try {
    if (typeof document === "undefined") return fallback;
    const value = getComputedStyle(document.body).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
};

export const themePalette = (): Palette => {
  const fallback = PALETTES[0]!;
  return {
    id: "theme",
    name: "系统主题样式",
    style: "pingfang",
    bg: readThemeVariable("--background-primary", fallback.bg),
    text: readThemeVariable("--text-normal", fallback.text),
    title: readThemeVariable("--text-title", readThemeVariable("--text-normal", fallback.title)),
    subtitle: readThemeVariable("--text-muted", readThemeVariable("--text-normal", fallback.subtitle)),
    highlightBg: readThemeVariable("--text-highlight-bg", fallback.highlightBg),
    tableHeadBg: readThemeVariable("--background-secondary", fallback.tableHeadBg),
    tableHeadText: readThemeVariable("--text-on-accent", fallback.tableHeadText),
    tableZebra: readThemeVariable("--background-secondary", fallback.tableZebra),
    tableBorder: readThemeVariable("--background-modifier-border", fallback.tableBorder)
  };
};

export const paletteById = (id: string, customBg?: string): Palette => {
  if (id === "theme") return themePalette();
  if (id === "custom") {
    const raw = (customBg || "").trim();
    const bg = /^#?[0-9a-fA-F]{6}$/.test(raw) ? (raw.startsWith("#") ? raw : `#${raw}`) : PALETTES[0]!.bg;
    const dark = hexLuminance(bg) <= 0.45;
    const base = dark ? PALETTES[3]! : PALETTES[0]!;
    return { ...base, id: "custom", name: "自定义", bg };
  }
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
};
