import type { FontFormat } from "./fonts";

export function fontFormatForFilename(filename: string): FontFormat | null {
  const extension = filename.split(".").at(-1)?.toLowerCase();
  if (extension === "ttf") return "truetype";
  if (extension === "otf") return "opentype";
  if (extension === "woff") return "woff";
  if (extension === "woff2") return "woff2";
  return null;
}
