import type { Block, ExportOptions } from "./types";

export const limitAuthorSubtitle = (value: string): string => Array.from(value.trim()).slice(0, 15).join("");
export const authorTextVisible = (options: Pick<ExportOptions, "showAvatar" | "showCoverImage">): boolean =>
  options.showAvatar && !options.showCoverImage;

export function addCoverAuthor(blocks: Block[], showAvatar: boolean, nickname: string, subtitle: string, showText: boolean, avatarDataUrl: string): Block[] {
  if (!showAvatar || !avatarDataUrl) return blocks;
  return [{ type: "author", nickname, subtitle, showText, avatarDataUrl }, ...blocks];
}
