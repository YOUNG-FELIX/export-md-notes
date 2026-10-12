import path from "node:path";

export type OutputLocationMode = "vault" | "computer";

export type ExportDestination =
  | { kind: "vault"; directory: string; fullPath: string }
  | { kind: "computer"; directory: string; fullPath: string };

export function sanitizeExportTitle(title: string): string {
  const invalid = new Set(Array.from('\\/:*?"<>|'));
  const sanitized = Array.from(title)
    .map((character) => character.charCodeAt(0) < 32 || invalid.has(character) ? "-" : character)
    .join("")
    .replace(/[. ]+$/g, "")
    .trim();
  return sanitized || "未命名笔记";
}

export function resolveVaultDirectory(template: string, title: string, attachmentDir = ""): string {
  const raw = ((template || "").trim() || (attachmentDir || "").trim() || "xhs-export/{{title}}").replaceAll("\\", "/");
  const rendered = raw.includes("{{title}}") ? raw.replaceAll("{{title}}", sanitizeExportTitle(title)) : raw;
  const parts = rendered.split("/").filter((part) => part && part !== ".");
  if (!parts.length || parts.some((part) => part === "..")) {
    throw new Error("仓库内导出目录无效，请选择仓库中的子文件夹");
  }
  return parts.join("/");
}

export function resolveComputerDirectory(root: string, title: string): string {
  const raw = (root || "").trim();
  if (!raw || !path.isAbsolute(raw)) throw new Error("请先填写电脑上的导出文件夹绝对路径");
  const rendered = raw.includes("{{title}}") ? raw.replaceAll("{{title}}", sanitizeExportTitle(title)) : raw;
  return path.normalize(rendered);
}
