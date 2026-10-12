import { App, normalizePath, Platform } from "obsidian";
import { domToPng } from "modern-screenshot";
import { buildGeometry, isLongform, type ExportGeometry } from "./presets";
import { pageDocument } from "./render";
import type { ExportOptions, MotionBlock, Page } from "./types";
import type { LoadedFont } from "./fonts";
import { ensureVaultFolder, writeVaultBinary } from "./vault-utils";
import type { ExportDestination } from "./export-location";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportMacLivePhoto, exportMotionOriginal, importPagesToPhotos, type MotionRect, type PhotosPageResource } from "./motion-export";

export type MixedExportSummary = {
  pngCount: number;
  livePhotoCount: number;
  motionOriginalCount: number;
  photosAlbumName?: string;
};

const EXPORT_META_NAME = ".export-md-notes-meta.json";

type ExportMetaEntry = { fingerprint: string; files: string[]; noteName?: string };
type ExportMeta = { exports: ExportMetaEntry[] };

function escapeRegExp(value: string): string {
  return (value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function noteFileBase(noteName: string): string {
  return (noteName || "").replace(/[\r\n\t]/g, " ").trim() || "未命名笔记";
}

function hashText(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function exportFingerprint(options: ExportOptions): string {
  const key = JSON.stringify({
    account: options.account,
    style: options.style,
    paletteId: options.paletteId,
    customBg: options.customBg,
    fontId: options.fontId,
    texture: options.texture,
    customTexture: options.customTexture,
    titleScale: options.titleScale,
    subtitleScale: options.subtitleScale,
    bodyScale: options.bodyScale,
    horizontalMargin: options.horizontalMargin,
    topMargin: options.topMargin,
    showAvatar: options.showAvatar,
    avatarSize: options.avatarSize,
    avatarDataUrl: options.avatarDataUrl,
    authorSubtitle: options.authorSubtitle,
    showCoverImage: options.showCoverImage,
    coverImageDataUrl: options.coverImageDataUrl,
    showTitle: options.showTitle,
    aspectId: options.aspectId,
    longformWidth: options.longformWidth,
    longformScale: options.longformScale,
    exportFormat: options.exportFormat,
    watermark: options.watermark
  });
  return hashText(key);
}

async function readExportMeta(app: App, destination: ExportDestination): Promise<ExportMeta> {
  if (destination.kind === "vault") {
    try {
      const metaPath = normalizePath(`${destination.directory}/${EXPORT_META_NAME}`);
      if (!await app.vault.adapter.exists(metaPath)) return { exports: [] };
      const parsed = JSON.parse(await app.vault.adapter.read(metaPath)) as ExportMeta;
      return Array.isArray(parsed.exports) ? parsed : { exports: [] };
    } catch { return { exports: [] }; }
  }
  try {
    const parsed = JSON.parse(await readFile(path.join(destination.directory, EXPORT_META_NAME), "utf8")) as ExportMeta;
    return Array.isArray(parsed.exports) ? parsed : { exports: [] };
  } catch { return { exports: [] }; }
}

async function writeExportMeta(app: App, destination: ExportDestination, meta: ExportMeta): Promise<void> {
  const raw = JSON.stringify(meta, null, 2);
  if (destination.kind === "vault") {
    await app.vault.adapter.write(normalizePath(`${destination.directory}/${EXPORT_META_NAME}`), raw);
  } else {
    await writeFile(path.join(destination.directory, EXPORT_META_NAME), raw, "utf8");
  }
}

async function listExportFiles(app: App, destination: ExportDestination): Promise<string[]> {
  try {
    if (destination.kind === "vault") {
      const listing = await app.vault.adapter.list(normalizePath(destination.directory));
      return listing.files.map((item) => item.split("/").pop() ?? item);
    }
    return (await readdir(destination.directory)).filter((item) => /\.(png|jpe?g|pdf)$/i.test(item));
  } catch { return []; }
}

type ExportPlan = { files: string[]; meta: ExportMeta; created: boolean };

async function planExportFilenames(app: App, destination: ExportDestination, count: number, fingerprint: string, digits: number, noteName = "", extension = "png"): Promise<ExportPlan> {
  const meta = await readExportMeta(app, destination);
  const existing = meta.exports.find((entry) => entry.fingerprint === fingerprint);
  if (existing) return { files: existing.files, meta, created: false };
  const base = noteFileBase(noteName);
  const ext = extension.replace(/^\./, "").toLowerCase();
  const fileRe = new RegExp(`^${escapeRegExp(base)}(?:\\((\\d+)\\))?(?:-\\d+)?\\.${escapeRegExp(ext)}$`);
  let maxSeq = -1;
  for (const entry of meta.exports) {
    for (const file of entry.files) {
      const match = fileRe.exec(file);
      if (match) maxSeq = Math.max(maxSeq, match[1] ? Number(match[1]) : 0);
    }
  }
  for (const file of await listExportFiles(app, destination)) {
    const match = fileRe.exec(file);
    if (match) maxSeq = Math.max(maxSeq, match[1] ? Number(match[1]) : 0);
  }
  const seq = maxSeq + 1;
  const suffix = seq > 0 ? `(${seq})` : "";
  const files = count === 1
    ? [`${base}${suffix}.${ext}`]
    : Array.from({ length: count }, (_, index) => `${base}${suffix}-${String(index + 1).padStart(digits, "0")}.${ext}`);
  return { files, meta, created: true };
}

export async function exportPages(
  app: App,
  pages: Page[],
  options: ExportOptions,
  fonts: LoadedFont[],
  destination: ExportDestination,
  onProgress: (current: number, total: number) => void,
  geom?: ExportGeometry,
  noteName = ""
): Promise<void> {
  const dir = destination.kind === "vault" ? normalizePath(destination.directory) : destination.directory;
  if (destination.kind === "vault") await ensureVaultFolder(app, dir);
  else await mkdir(dir, { recursive: true });
  const digits = Math.max(2, String(pages.length).length);
  const fingerprint = exportFingerprint(options);
  const plan = await planExportFilenames(app, destination, pages.length, fingerprint, digits, noteName);
  for (let index = 0; index < pages.length; index++) {
    onProgress(index + 1, pages.length);
    const binary = await renderPagePng(pages[index]!, index, pages.length, options, fonts, geom);
    const filename = plan.files[index]!;
    if (destination.kind === "vault") {
      await writeVaultBinary(app, normalizePath(`${dir}/${filename}`), binary);
    } else {
      await writeFile(path.join(dir, filename), new Uint8Array(binary));
    }
  }
  if (plan.created) {
    plan.meta.exports.push({ fingerprint, files: plan.files, noteName });
    await writeExportMeta(app, destination, plan.meta);
  }
}

export async function exportMixedPages(
  app: App,
  pages: Page[],
  options: ExportOptions,
  fonts: LoadedFont[],
  destination: ExportDestination,
  noteName: string,
  onProgress: (current: number, total: number, kind: "png" | "live-photo" | "motion-original" | "photos-import") => void,
  copyMotionOriginal: boolean,
  geom?: ExportGeometry,
  selection?: number[] | null
): Promise<MixedExportSummary> {
  const dir = destination.kind === "vault" ? normalizePath(destination.directory) : destination.directory;
  if (destination.kind === "vault") await ensureVaultFolder(app, dir);
  else await mkdir(dir, { recursive: true });
  const total = pages.length;
  const selected = selection && selection.length > 0
    ? selection.filter((p) => p >= 1 && p <= total)
    : Array.from({ length: total }, (_, i) => i + 1);
  const digits = Math.max(2, String(total).length);
  const fingerprint = exportFingerprint(options);
  const plan = await planExportFilenames(app, destination, total, fingerprint, digits, noteName);
  const summary: MixedExportSummary = { pngCount: 0, livePhotoCount: 0, motionOriginalCount: 0 };
  const hasLivePhotos = Platform.isMacOS && selected.some((p) => pages[p - 1]!.blocks.some((block) => block.type === "motion"));
  const photosResources: PhotosPageResource[] = [];

  let current = 0;
  for (const pageNo of selected) {
    current++;
    const index = pageNo - 1;
    const page = pages[index]!;
    const prefix = plan.files[index]!.replace(/\.png$/, "");
    const snapshot = await renderPageSnapshot(page, index, total, options, fonts, geom);
    const motion = page.blocks.find((block): block is MotionBlock => block.type === "motion");
    if (motion && Platform.isMacOS) {
      if (!motion.filePath || !snapshot.motionRect) throw new Error(`第 ${pageNo} 页的动态素材不可用`);
      onProgress(current, selected.length, "live-photo");
      const pair = await exportMacLivePhoto(snapshot.png, motion.filePath, destination.fullPath, prefix, snapshot.motionRect);
      photosResources.push({ kind: "live-photo", photoPath: pair.photoPath, videoPath: pair.videoPath });
      summary.livePhotoCount++;
      continue;
    }

    onProgress(current, selected.length, motion && copyMotionOriginal ? "motion-original" : "png");
    const filename = plan.files[index]!;
    if (destination.kind === "vault") {
      await writeVaultBinary(app, normalizePath(`${dir}/${filename}`), snapshot.png);
    } else {
      await writeFile(path.join(dir, filename), new Uint8Array(snapshot.png));
    }
    summary.pngCount++;
    if (hasLivePhotos) photosResources.push({ kind: "photo", path: path.join(destination.fullPath, filename) });
    if (motion && copyMotionOriginal) {
      if (!motion.filePath) throw new Error(`第 ${pageNo} 页的动态素材不可用`);
      await exportMotionOriginal(motion.filePath, destination.fullPath, `${prefix}-motion.${motion.format}`);
      summary.motionOriginalCount++;
    }
  }
  if (plan.created) {
    plan.meta.exports.push({ fingerprint, files: plan.files, noteName });
    await writeExportMeta(app, destination, plan.meta);
  }
  if (hasLivePhotos) {
    const albumName = photosAlbumName(noteName);
    await importPagesToPhotos(photosResources, albumName, (current, total) => onProgress(current, total, "photos-import"));
    summary.photosAlbumName = albumName;
  }
  return summary;
}

export function photosAlbumName(noteName: string, date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
  const cleanName = (noteName || "").replace(/[\r\n\t]/g, " ").trim() || "未命名";
  return `小红书 · ${cleanName} · ${timestamp}`;
}

export async function exportLongformFile(
  app: App,
  destination: ExportDestination,
  noteName: string,
  options: ExportOptions,
  binary: ArrayBuffer,
  extension = "png"
): Promise<string> {
  const dir = destination.kind === "vault" ? normalizePath(destination.directory) : destination.directory;
  if (destination.kind === "vault") await ensureVaultFolder(app, dir);
  else await mkdir(dir, { recursive: true });
  const fingerprint = exportFingerprint(options);
  const plan = await planExportFilenames(app, destination, 1, fingerprint, 1, noteName, extension);
  const filename = plan.files[0]!;
  if (destination.kind === "vault") {
    await writeVaultBinary(app, normalizePath(`${dir}/${filename}`), binary);
  } else {
    await writeFile(path.join(dir, filename), new Uint8Array(binary));
  }
  if (plan.created) {
    plan.meta.exports.push({ fingerprint, files: plan.files, noteName });
    await writeExportMeta(app, destination, plan.meta);
  }
  return filename;
}
export async function renderPagePng(
  page: Page,
  index: number,
  total: number,
  options: ExportOptions,
  fonts: LoadedFont[],
  geom?: ExportGeometry
): Promise<ArrayBuffer> {
  return (await renderPageSnapshot(page, index, total, options, fonts, geom)).png;
}

export async function renderPageSnapshot(
  page: Page,
  index: number,
  total: number,
  options: ExportOptions,
  fonts: LoadedFont[],
  geom?: ExportGeometry
): Promise<{ png: ArrayBuffer; motionRect?: MotionRect }> {
  const geometry = geom ?? (isLongform(options.aspectId) ? buildGeometry(options, 16000) : buildGeometry(options));
  const iframe = await mountPage(pageDocument(options, fonts, page, index, total, geometry), geometry);
  try {
    const doc = iframe.contentDocument!;
    await doc.fonts.ready;
    await Promise.all(Array.from(doc.images).map(async (image) => {
      const src = image.getAttribute("src") || "";
      if (/^https?:\/\//i.test(src)) {
        try {
          const response = await fetch(src, { mode: "cors" });
          if (response.ok) image.src = await blobToDataUrl(await response.blob());
        } catch { /* 外部图片无法转内嵌时保留原 URL，仍可正常渲染 */ }
      }
      if (!image.complete) await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(`图片加载失败：${image.alt}`)); });
      if (typeof image.decode === "function") await image.decode();
    }));
    await Promise.all(Array.from(doc.querySelectorAll("video")).map(prepareVideo));
    const card = doc.querySelector<HTMLElement>(".xhs-card");
    if (!card) throw new Error("找不到待导出的卡片");
    const motion = card.querySelector<HTMLElement>(".xhs-motion");
    let motionRect: MotionRect | undefined;
    if (motion) {
      const cardRect = card.getBoundingClientRect();
      const rect = motion.getBoundingClientRect();
      motionRect = {
        x: Math.round(rect.left - cardRect.left),
        y: Math.round(rect.top - cardRect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    }
    const dataUrl = await domToPng(card, { width: geometry.width, height: geometry.height, scale: 1 });
    return { png: dataUrlToArrayBuffer(dataUrl), motionRect };
  } finally { iframe.remove(); }
}

async function prepareVideo(video: HTMLVideoElement): Promise<void> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener("loadeddata", () => resolve(), { once: true });
      video.addEventListener("error", () => reject(new Error("动态视频加载失败")), { once: true });
    });
  }
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const target = Math.min(Math.max(video.duration / 2, 0), Math.max(0, video.duration - 0.05));
  if (Math.abs(video.currentTime - target) < 0.01) return;
  await new Promise<void>((resolve) => {
    video.addEventListener("seeked", () => resolve(), { once: true });
    video.currentTime = target;
  });
}

async function mountPage(srcdoc: string, geom: ExportGeometry): Promise<HTMLIFrameElement> {
  const iframe = document.body.createEl("iframe");
  iframe.style.cssText = `position:fixed;left:-20000px;top:0;width:${geom.width}px;height:${geom.height}px;border:0;opacity:0;pointer-events:none`;
  const ready = new Promise<void>((resolve) => {
    const loaded = () => {
      if (!iframe.contentDocument?.querySelector(".xhs-card")) return;
      iframe.removeEventListener("load", loaded); resolve();
    };
    iframe.addEventListener("load", loaded);
    iframe.srcdoc = srcdoc;
  });
  await ready;
  return iframe;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
