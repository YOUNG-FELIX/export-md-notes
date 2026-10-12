import type { Block, VideoEmbedBlock } from "./types";

// 视频封面探测链：官方接口 / oEmbed → 封面 URL → 尝试转 dataURL（避免渲染期跨域问题）。
// 拿不到封面返回 null，调用方渲染紧凑窄条占位（不占大片空白）。

export async function fetchVideoCover(block: VideoEmbedBlock): Promise<string | null> {
  let coverUrl: string | null = null;
  switch (block.provider) {
    case "bilibili": {
      try {
        const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(block.videoId)}`, { mode: "cors" });
        if (resp.ok) {
          const json = (await resp.json()) as { data?: { pic?: string } };
          coverUrl = json?.data?.pic ?? null;
        }
      } catch { coverUrl = null; }
      break;
    }
    case "youtube": {
      try {
        const resp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(block.url)}&format=json`, { mode: "cors" });
        if (resp.ok) {
          const json = (await resp.json()) as { thumbnail_url?: string };
          coverUrl = json?.thumbnail_url ?? null;
        }
      } catch { coverUrl = null; }
      break;
    }
    case "douyin": {
      try {
        const resp = await fetch(`https://www.douyin.com/oembed?url=${encodeURIComponent(block.url)}`, { mode: "cors" });
        if (resp.ok) {
          const json = (await resp.json()) as { thumbnail_url?: string };
          coverUrl = json?.thumbnail_url ?? null;
        }
      } catch { coverUrl = null; }
      break;
    }
  }
  if (!coverUrl) return null;
  try {
    const resp = await fetch(coverUrl, { mode: "cors" });
    if (!resp.ok) return coverUrl;
    return await blobToDataUrl(await resp.blob());
  } catch {
    // 转 dataURL 失败时保留原 URL，由渲染层（renderPageSnapshot）再尝试转内嵌。
    return coverUrl;
  }
}

export async function resolveVideoCovers(blocks: Block[]): Promise<Block[]> {
  return Promise.all(blocks.map(async (block): Promise<Block> => {
    if (block.type !== "video-embed") return block;
    try {
      const cover = await fetchVideoCover(block);
      return cover ? { ...block, coverDataUrl: cover } : block;
    } catch { return block; }
  }));
}

export function providerLabel(provider: VideoEmbedBlock["provider"]): string {
  return provider === "bilibili" ? "哔哩哔哩" : provider === "youtube" ? "YouTube" : provider === "douyin" ? "抖音" : provider;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
