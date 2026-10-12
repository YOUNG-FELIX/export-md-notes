import domtoimage from "dom-to-image-more";
import type { ExportFormat } from "./types";

const MAX_CANVAS_EDGE = 16384;
const MAX_CANVAS_AREA = 268000000;

export type CaptureOptions = {
  scale?: number;
  format?: ExportFormat;
};

export async function captureLongform(root: HTMLElement, options: CaptureOptions = {}): Promise<ArrayBuffer> {
  const scale = options.scale ?? 1;
  const format = options.format ?? "png";
  const width = root.clientWidth || root.offsetWidth || 0;
  const height = root.clientHeight || root.offsetHeight || 0;
  if (!width || !height) throw new Error("长图容器没有可渲染尺寸");

  const outWidth = Math.round(width * scale);
  const outHeight = Math.round(height * scale);
  if (outWidth > MAX_CANVAS_EDGE || outHeight > MAX_CANVAS_EDGE || outWidth * outHeight > MAX_CANVAS_AREA) {
    throw new Error(`长图尺寸超出安全上限（${outWidth}×${outHeight}），请调小导出宽度、画质或拆分内容`);
  }

  // 整根渲染：dom-to-image-more 克隆完整元素生成 SVG，不做高度裁剪，内容不会缺块
  const type = format === "jpg" ? "image/jpeg" : "image/png";
  const blob = await domtoimage.toBlob(root, { width, height, scale, quality: 0.92, type }) as Blob;
  if (format === "pdf") return buildPdfFromJpeg(new Uint8Array(await blob.arrayBuffer()), outWidth, outHeight);
  return await blob.arrayBuffer();
}

export async function captureLongformPng(root: HTMLElement, scale = 1): Promise<ArrayBuffer> {
  return captureLongform(root, { scale, format: "png" });
}

// 简易 PDF 生成：将 JPEG 图片嵌入 PDF 1.4 单页（72dpi，1px = 1pt），无第三方依赖
export function buildPdfFromJpeg(jpeg: Uint8Array, width: number, height: number): ArrayBuffer {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  let total = 0;
  const push = (text: string): void => {
    const bytes = encoder.encode(text);
    parts.push(bytes);
    total += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array): void => {
    parts.push(bytes);
    total += bytes.length;
  };

  const xref: number[] = [0];
  let count = 0;
  const addObject = (body: string, stream?: Uint8Array): void => {
    count += 1;
    xref.push(total);
    if (stream) {
      push(`${count} 0 obj\n${body}\nstream\n`);
      pushBytes(stream);
      push(`\nendstream\nendobj\n`);
    } else {
      push(`${count} 0 obj\n${body}\nendobj\n`);
    }
  };

  const contents = `q\n${width} 0 0 ${height} 0 0 cm\n/Im1 Do\nQ\n`;
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>`);
  addObject(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  addObject(`<< /Length ${contents.length} >>\nstream\n${contents}endstream`, undefined);

  const xrefOffset = total;
  const xrefBody = `xref\n0 ${count + 1}\n0000000000 65535 f \n${xref.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}`;
  push(xrefBody);
  push(`trailer\n<< /Size ${count + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const result = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    result.set(part, cursor);
    cursor += part.length;
  }
  return result.buffer as ArrayBuffer;
}

