import type { Block, ImageBlock, Inline, MotionBlock, VideoEmbedBlock } from "./types";

const imageWiki = /^!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/;
const imageMarkdown = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const tableSeparator = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/;

// 识别整行视频外链（iframe 标签 / markdown 链接 / 裸 URL），命中已知视频平台才返回 video-embed。
export function detectVideoEmbed(line: string): VideoEmbedBlock | null {
  const trimmed = line.trim();
  const iframeMatch = trimmed.match(/^<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/iframe>$/i);
  const markdownMatch = trimmed.match(/^\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/i);
  const bareMatch = /^https?:\/\/\S+$/.test(trimmed) ? [trimmed, trimmed] : null;
  const source = iframeMatch ? iframeMatch[1]! : markdownMatch ? markdownMatch[2]! : bareMatch ? bareMatch[1]! : null;
  if (!source) return null;
  return classifyVideoUrl(source, markdownMatch?.[1]?.trim());
}

export function classifyVideoUrl(url: string, title?: string): VideoEmbedBlock | null {
  const clean = (url || "").replace(/^<|>$/g, "").trim();
  const bilibili = clean.match(/(?:bilibili\.com|b23\.tv)\/video\/(BV[\w]+)/i);
  if (bilibili) return { type: "video-embed", provider: "bilibili", videoId: bilibili[1]!, url: clean, title };
  const biliAv = clean.match(/bilibili\.com\/video\/av(\d+)/i);
  if (biliAv) return { type: "video-embed", provider: "bilibili", videoId: `av${biliAv[1]!}`, url: clean, title };
  // 嵌入播放器地址：player.bilibili.com/player.html?bvid=...（iframe 常见形式）
  const biliPlayer = clean.match(/player\.bilibili\.com\/player\.html\?[^#\s]*\bbvid=(BV[\w]+)/i);
  if (biliPlayer) return { type: "video-embed", provider: "bilibili", videoId: biliPlayer[1]!, url: clean, title };
  const biliPlayerAv = clean.match(/player\.bilibili\.com\/player\.html\?[^#\s]*\baid=(\d+)/i);
  if (biliPlayerAv) return { type: "video-embed", provider: "bilibili", videoId: `av${biliPlayerAv[1]!}`, url: clean, title };
  const youtube = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{6,})/i);
  if (youtube) return { type: "video-embed", provider: "youtube", videoId: youtube[1]!, url: clean, title };
  const douyin = clean.match(/douyin\.com\/video\/(\d+)/i);
  if (douyin) return { type: "video-embed", provider: "douyin", videoId: douyin[1]!, url: clean, title };
  return null;
}

export function parseInline(source: string, depth = 0): Inline[] {
  if (depth > 32) return [{ type: "text", text: source }];
  const out: Inline[] = [];
  let text = "";
  const flush = () => { if (text) { out.push({ type: "text", text }); text = ""; } };

  for (let i = 0; i < source.length;) {
    const rest = source.slice(i);
    if (rest.startsWith("%%")) {
      const end = source.indexOf("%%", i + 2);
      if (end >= 0) { i = end + 2; continue; }
    }
    const link = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (link) { flush(); out.push({ type: "link", href: link[2]!.trim(), children: parseInline(link[1]!, depth + 1) }); i += link[0].length; continue; }

    const wiki = rest.match(/^\[\[([^\[\]]+)\]\]/);
    if (wiki) {
      flush();
      const raw = wiki[1]!;
      const parts = raw.split("|");
      const label = (parts.length > 1 ? parts[parts.length - 1]! : parts[0]!.split("#")[0]!).trim();
      out.push({ type: "link", href: "#", children: [{ type: "text", text: label }] });
      i += wiki[0].length;
      continue;
    }

    const tag = rest.match(/^#([\p{L}\p{N}_\-/]+)/u);
    if (tag && (i === 0 || /\s/.test(source[i - 1]!))) {
      flush();
      out.push({ type: "tag", text: tag[1]! });
      i += tag[0].length;
      continue;
    }

    const forms: Array<[string, "bold" | "highlight" | "code" | "italic" | "strike" | "math"]> = [
      ["~~", "strike"], ["**", "bold"], ["==", "highlight"], ["`", "code"], ["*", "italic"], ["$", "math"]
    ];
    let matched = false;
    for (const [mark, type] of forms) {
      if (!rest.startsWith(mark)) continue;
      if (type === "math" && rest[1] === "$") continue;
      const end = source.indexOf(mark, i + mark.length);
      if (end < 0 || end === i + mark.length) continue;
      flush();
      const inner = source.slice(i + mark.length, end);
      if (type === "math") {
        const content = inner.trim();
        if (!content || /\s/.test(content)) continue;
        out.push({ type: "math", text: content });
      } else {
        out.push({ type, children: type === "code" ? [{ type: "text", text: inner }] : parseInline(inner, depth + 1) });
      }
      i = end + mark.length;
      matched = true;
      break;
    }
    if (!matched) { text += source[i]; i++; }
  }
  flush();
  return mergeText(out);
}

function mergeText(inlines: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const inline of inlines) {
    const last = out.at(-1);
    if (inline.type === "text" && last?.type === "text") last.text += inline.text;
    else out.push(inline);
  }
  return out;
}

function splitTableRow(line: string): Inline[][] {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|")) value = value.slice(0, -1);
  return value.split(/(?<!\\)\|/).map((cell) => parseInline(cell.trim().replace(/\\\|/g, "|")));
}

type ParsedAttachment =
  | Omit<ImageBlock, "type"> & { type: "image" }
  | Omit<MotionBlock, "type" | "id"> & { type: "motion" };

function parseAttachment(line: string): ParsedAttachment | null {
  const wiki = line.trim().match(imageWiki);
  if (wiki) return attachmentFor(wiki[1]!.trim(), (wiki[2] ?? wiki[1])!.trim());
  const markdown = line.trim().match(imageMarkdown);
  if (markdown) return attachmentFor(markdown[2]!.trim().replace(/^<|>$/g, ""), markdown[1]!.trim());
  return null;
}

function attachmentFor(link: string, alt: string): ParsedAttachment {
  const clean = link.split("#")[0]!.split("?")[0]!;
  const extension = clean.split(".").at(-1)?.toLowerCase();
  if (extension === "gif" || extension === "mp4" || extension === "mov") {
    return { type: "motion", link, alt, format: extension };
  }
  return { type: "image", link, alt };
}

export function parseMarkdown(markdown: string, documentTitle?: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const raw: Block[] = [];
  let motionIndex = 0;

  for (let i = 0; i < lines.length;) {
    const line = lines[i]!;
    if (!line.trim()) {
      while (i < lines.length && !lines[i]!.trim()) i++;
      raw.push({ type: "spacer" });
      continue;
    }
    if (i === 0 && line.trim() === "---") {
      let j = i + 1;
      while (j < lines.length && lines[j]!.trim() !== "---") j++;
      i = Math.min(j + 1, lines.length);
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) { i++; continue; }

    if (/^\s*```/.test(line)) {
      const fence = line.trim().match(/^```([\w-]*)/);
      const language = (fence?.[1] ?? "").trim().toLowerCase();
      const content: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]!)) content.push(lines[i++]!);
      if (i < lines.length) i++;
      if (language === "dataview" || language === "dataviewjs") {
        raw.push({ type: "dataview", language, query: content.join("\n").trim() });
        continue;
      }
      raw.push({ type: "code-block", inlines: language === "math" || language === "latex" ? [{ type: "math", text: content.join("\n").trim() }] : [{ type: "text", text: content.join("\n") }] });
      continue;
    }

    if (/^\s*\$\$/.test(line)) {
      const inlineMatch = line.trim().match(/^\$\$([\s\S]+)\$\$$/);
      if (inlineMatch) {
        raw.push({ type: "code-block", inlines: [{ type: "math", text: inlineMatch[1]!.trim() }] });
        i++;
        continue;
      }
      const content: string[] = [];
      i++;
      while (i < lines.length && !/^\s*\$\$/.test(lines[i]!)) content.push(lines[i++]!);
      if (i < lines.length) i++;
      raw.push({ type: "code-block", inlines: [{ type: "math", text: content.join("\n").trim() }] });
      continue;
    }

    const attachment = parseAttachment(line);
    if (attachment) {
      raw.push(attachment.type === "motion"
        ? { ...attachment, id: `motion-${++motionIndex}` }
        : attachment);
      i++; continue;
    }

    const videoEmbed = detectVideoEmbed(line);
    if (videoEmbed) { raw.push(videoEmbed); i++; continue; }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      raw.push({ type: "subtitle", headingLevel: heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6, inlines: parseInline(heading[2]!.trim()) });
      i++; continue;
    }

    if (line.includes("|") && i + 1 < lines.length && tableSeparator.test(lines[i + 1]!)) {
      const header = splitTableRow(line);
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i]!.includes("|") && lines[i]!.trim()) rows.push(splitTableRow(lines[i++]!));
      raw.push({ type: "table", header, rows });
      continue;
    }

    const listMatch = line.match(/^\s{0,4}([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]!);
      const items: Inline[][] = [];
      while (i < lines.length) {
        const item = lines[i]!.match(/^\s{0,8}([-*]|\d+\.)\s+(.*)$/);
        if (!item || /\d+\./.test(item[1]!) !== ordered) break;
        const content = item[2]!;
        const task = content.match(/^\[([ xX])\]\s+(.*)$/);
        if (task) items.push([{ type: "checkbox", checked: task[1]!.toLowerCase() === "x" }, ...parseInline(task[2]!)]);
        else items.push(parseInline(content));
        i++;
      }
      raw.push({ type: "list", ordered, items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!)) parts.push(lines[i++]!.replace(/^>\s?/, ""));
      let joined = parts.join(" ").trim();
      joined = joined.replace(/^\[![^\]]*\]\s*/, "");
      if (joined) raw.push({ type: "quote", inlines: parseInline(joined) });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i]!.trim() && !startsBlock(lines, i)) paragraph.push(lines[i++]!.trim());
    raw.push({ type: "paragraph", inlines: parseInline(paragraph.join(" ")) });
  }
  const blocks = pairImages(raw).filter((block, index, all) => block.type !== "spacer" || (index > 0 && index < all.length - 1));
  return documentTitle?.trim()
    ? [{ type: "cover-title", inlines: parseInline(documentTitle.trim()) }, ...blocks]
    : blocks;
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index]!;
  return /^#{1,6}\s+|^\s*```|^\s*\$\$|^\s*---+\s*$|^>\s?|^\s{0,4}(?:[-*]|\d+\.)\s+/.test(line)
    || Boolean(parseAttachment(line))
    || Boolean(detectVideoEmbed(line))
    || (line.includes("|") && index + 1 < lines.length && tableSeparator.test(lines[index + 1]!));
}

function pairImages(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length;) {
    if (blocks[i]?.type !== "image") { out.push(blocks[i++]!); continue; }
    const images: ImageBlock[] = [];
    while (i < blocks.length) {
      if (blocks[i]?.type === "image") { images.push(blocks[i] as ImageBlock); i++; continue; }
      if (blocks[i]?.type === "spacer" && blocks[i + 1]?.type === "image") { i++; continue; }
      break;
    }
    for (let j = 0; j < images.length; j += 2) {
      if (images[j + 1]) out.push({ type: "image-pair", images: [images[j]!, images[j + 1]!] });
      else out.push(images[j]!);
    }
  }
  return out;
}
