import { App, TFile, normalizePath } from "obsidian";

export async function ensureVaultFolder(app: App, path: string): Promise<void> {
  let current = "";
  for (const part of normalizePath(path).split("/").filter(Boolean)) {
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
  }
}

export async function writeVaultBinary(app: App, path: string, data: ArrayBuffer): Promise<void> {
  const normalized = normalizePath(path);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFile) await app.vault.modifyBinary(existing, data);
  else await app.vault.createBinary(normalized, data);
}
