import { App, TFile, normalizePath } from "obsidian";
import { DOWNLOADABLE_HANDWRITING_FONTS, type DownloadableFontDefinition } from "./downloadable-fonts";
import type { FontAssetCache } from "./font-cache";
import { fontWidthsDiffer } from "./font-detection";

export type FontSource = "system" | "downloadable" | "custom";
export type FontDefinition = {
  id: string;
  name: string;
  family: string;
  source: FontSource;
  format: FontFormat;
};
export type FontFormat = "truetype" | "opentype" | "woff" | "woff2";
export type LoadedFont = FontDefinition & { available: boolean; faceCss: string };
export type CustomFontConfig = {
  id: string;
  name: string;
  path: string;
  format: FontFormat;
};

export const DEFAULT_HANDWRITING_FONT_ID = "sat-to";
export const THEME_FONT_ID = "theme";
export const THEME_FONT_LABEL = "跟随主题字体";
export const CUSTOM_FONT_DIR = ".export-md-notes/fonts";

export async function loadHandwritingFonts(app: App, customFonts: CustomFontConfig[], cache: FontAssetCache): Promise<LoadedFont[]> {
  const system = await Promise.all(SYSTEM_HANDWRITING_FONTS.map(loadSystemFont));
  const downloadable = await Promise.all(DOWNLOADABLE_HANDWRITING_FONTS.map((font) => loadCachedFont(font, cache)));
  const custom = await Promise.all(customFonts.map(async (font): Promise<LoadedFont> => {
    const family = `XhsCustom${font.id.replace(/[^a-zA-Z0-9]/g, "")}`;
    const file = app.vault.getAbstractFileByPath(normalizePath(font.path));
    if (!(file instanceof TFile)) return { ...font, family, source: "custom", available: false, faceCss: "" };
    const bytes = new Uint8Array(await app.vault.readBinary(file));
    const dataUrl = `data:${mimeFor(font.format)};base64,${bytesToBase64(bytes)}`;
    return { ...font, family, source: "custom", available: true, faceCss: fontFaceCss(family, dataUrl, font.format) };
  }));
  return [...system, ...downloadable, ...custom];
}

export function fallbackHandwritingFontId(fonts: LoadedFont[]): string {
  return fonts.find((font) => font.id === DEFAULT_HANDWRITING_FONT_ID && font.available)?.id
    ?? fonts.find((font) => font.available)?.id
    ?? fonts.find((font) => font.source === "downloadable")?.id
    ?? DEFAULT_HANDWRITING_FONT_ID;
}

const SYSTEM_HANDWRITING_FONTS: Array<FontDefinition & { localNames: string[] }> = [
  { id: "sat-to", name: "平方洒脱体（本机）", family: "XhsPingFangSaTuo", source: "system", format: "truetype", localNames: ["平方洒脱体", "PingFangSaTuoTi"] },
  { id: "qiao-mu", name: "平方乔木体（本机）", family: "XhsPingFangQiaoMu", source: "system", format: "truetype", localNames: ["平方乔木体 Regular", "pingfangqiaomu", "平方乔木体", "PING FANG QIAO MU"] },
  { id: "san-sheng", name: "平方三生体（本机）", family: "XhsPingFangSanSheng", source: "system", format: "truetype", localNames: ["平方三生体", "PingFangSanShengTi"] },
  { id: "shi-guang", name: "平方时光体（本机）", family: "XhsPingFangShiGuang", source: "system", format: "truetype", localNames: ["平方时光体", "PingFangShiGuangTi"] },
  { id: "shang-shang-qian", name: "平方上上谦体（本机）", family: "XhsPingFangShangShangQian", source: "system", format: "truetype", localNames: ["平方上上谦体 Regular", "pingfangshangshangqian", "平方上上谦体", "PING FANG SHAGN SHANG QIAN"] },
  { id: "qing-chun", name: "平方青春体（本机）", family: "XhsPingFangQingChun", source: "system", format: "truetype", localNames: ["平方青春体 Regular", "-Regular", "平方青春体", "PING FANG QING CHUN"] },
  { id: "pingfang-sc", name: "苹方 PingFang SC（本机）", family: "XhsPingFangSC", source: "system", format: "truetype", localNames: ["PingFang SC", "苹方-简", "苹方 简"] }
];

async function loadCachedFont(font: DownloadableFontDefinition, cache: FontAssetCache): Promise<LoadedFont> {
  try { return loadedDownloadableFont(font, await cache.get(font)); }
  catch { return loadedDownloadableFont(font, null); }
}

export function loadedDownloadableFont(font: DownloadableFontDefinition, url: string | null): LoadedFont {
  const { url: _url, sha256: _sha256, ...definition } = font;
  return { ...definition, available: Boolean(url), faceCss: url ? fontFaceCss(font.family, url, font.format) : "" };
}

async function loadSystemFont(font: FontDefinition & { localNames: string[] }): Promise<LoadedFont> {
  const family = font.localNames.find(systemFontAvailable);
  return family
    ? { ...font, family, available: true, faceCss: "" }
    : { ...font, available: false, faceCss: "" };
}

const FONT_TEST_TEXT = "mmmmmmmmmmWW@#苹方简体字体测试0123456789";
const FONT_TEST_FALLBACKS = ["monospace", "serif", "sans-serif"] as const;

function systemFontAvailable(family: string): boolean {
  const canvas = document.body.createEl("canvas");
  canvas.remove();
  const context = canvas.getContext("2d");
  if (!context) return false;
  const measure = (stack: string): number => {
    context.font = `72px ${stack}`;
    return context.measureText(FONT_TEST_TEXT).width;
  };
  const fallbackWidths = FONT_TEST_FALLBACKS.map((fallback) => measure(fallback));
  const candidateWidths = FONT_TEST_FALLBACKS.map((fallback) => measure(`"${family.replaceAll('"', '\\"')}",${fallback}`));
  return fontWidthsDiffer(fallbackWidths, candidateWidths);
}

function fontFaceCss(family: string, url: string, format: FontFormat): string {
  return `@font-face{font-family:"${family}";src:url("${url}") format("${format}");font-style:normal;font-display:block;}`;
}

function mimeFor(format: FontFormat): string {
  if (format === "woff2") return "font/woff2";
  if (format === "woff") return "font/woff";
  if (format === "opentype") return "font/otf";
  return "font/ttf";
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return btoa(binary);
}
