import { requestUrl } from "obsidian";
import type { DownloadableFontDefinition } from "./downloadable-fonts";
import { sha256Hex } from "./hash";

const DB_NAME = "export-md-notes-font-cache";
const STORE_NAME = "fonts";
const DB_VERSION = 1;

type CachedFontRecord = { id: string; sha256: string; bytes: ArrayBuffer };

export class FontAssetCache {
  private objectUrls = new Map<string, string>();

  async get(font: DownloadableFontDefinition): Promise<string | null> {
    const existing = this.objectUrls.get(font.id);
    if (existing) return existing;
    const record = await getRecord(font.id);
    if (!record || record.sha256 !== font.sha256) return null;
    return this.createObjectUrl(font, record.bytes);
  }

  async download(font: DownloadableFontDefinition): Promise<string> {
    const response = await requestUrl({ url: font.url, method: "GET" });
    if (response.status < 200 || response.status >= 300) throw new Error(`字体下载失败（HTTP ${response.status}）`);
    const bytes = response.arrayBuffer;
    const digest = await sha256Hex(bytes);
    if (digest !== font.sha256) throw new Error("字体校验失败，下载内容与发布版本不一致");
    try { await new FontFace(font.family, bytes).load(); }
    catch { throw new Error("下载的字体无法加载"); }
    await putRecord({ id: font.id, sha256: font.sha256, bytes });
    this.revoke(font.id);
    return this.createObjectUrl(font, bytes);
  }

  async clear(): Promise<void> {
    for (const id of [...this.objectUrls.keys()]) this.revoke(id);
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    await transactionDone(transaction);
    db.close();
  }

  dispose(): void {
    for (const id of [...this.objectUrls.keys()]) this.revoke(id);
  }

  private createObjectUrl(font: DownloadableFontDefinition, bytes: ArrayBuffer): string {
    const url = URL.createObjectURL(new Blob([bytes], { type: "font/woff2" }));
    this.objectUrls.set(font.id, url);
    return url;
  }

  private revoke(id: string): void {
    const url = this.objectUrls.get(id);
    if (!url) return;
    URL.revokeObjectURL(url);
    this.objectUrls.delete(id);
  }
}

async function getRecord(id: string): Promise<CachedFontRecord | null> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const raw = await idbRequest<unknown>(transaction.objectStore(STORE_NAME).get(id) as IDBRequest<unknown>);
  await transactionDone(transaction);
  db.close();
  return isCachedFontRecord(raw) ? raw : null;
}

async function putRecord(record: CachedFontRecord): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(record);
  await transactionDone(transaction);
  db.close();
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开字体缓存"));
    request.onblocked = () => reject(new Error("字体缓存正在被其他窗口占用"));
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("字体缓存读取失败"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("字体缓存写入失败"));
    transaction.onabort = () => reject(transaction.error ?? new Error("字体缓存操作已取消"));
  });
}

function isCachedFontRecord(value: unknown): value is CachedFontRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CachedFontRecord>;
  return typeof record.id === "string" && typeof record.sha256 === "string" && record.bytes instanceof ArrayBuffer;
}
