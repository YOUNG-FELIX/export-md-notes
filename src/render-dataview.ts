import { App, Component, MarkdownRenderer } from "obsidian";
import { domToPng } from "modern-screenshot";
import type { Block, DataviewBlock } from "./types";

function dataviewEnabled(app: App): boolean {
  const plugins = (app as unknown as { plugins?: { enabledPlugins?: Set<string>; plugins?: Record<string, unknown> } }).plugins;
  if (!plugins) return false;
  return Boolean(plugins.enabledPlugins?.has?.("dataview")) || Boolean(plugins.plugins?.["dataview"]);
}

/**
 * 将 parseMarkdown 识别出的 dataview / dataviewjs 代码块离屏渲染并截图，以图片形式嵌入卡片。
 * 渲染前必须 component.load()（Dataview 的 postprocessor 依赖已 load 的组件树，否则会无限递归栈溢出），
 * 渲染失败或未安装 Dataview 时降级为普通代码块文本。
 */
export async function renderDataviews(app: App, blocks: Block[], sourcePath: string, contentWidth: number): Promise<Block[]> {
  if (!dataviewEnabled(app)) {
    return blocks.map((block) => (block.type === "dataview" ? dataviewFallback(block) : block));
  }
  const rendered = await Promise.all(blocks.map(async (block) => {
    if (block.type !== "dataview") return block;
    try {
      const dataUri = await renderDataviewFragment(app, block.language, block.query, sourcePath, contentWidth);
      if (!dataUri) return dataviewFallback(block);
      return { type: "image", link: "", alt: block.query.slice(0, 80), dataUri, contain: true } as const;
    } catch (error) {
      console.error("Export MD notes dataview 渲染失败，降级为代码块", error);
      return dataviewFallback(block);
    }
  }));
  return rendered;
}

function dataviewFallback(block: DataviewBlock): Block {
  return { type: "code-block", inlines: [{ type: "text", text: `\`\`\`${block.language}\n${block.query}\n\`\`\`` }] };
}

async function renderDataviewFragment(app: App, language: "dataview" | "dataviewjs", query: string, sourcePath: string, contentWidth: number): Promise<string | null> {
  const host = document.body.createDiv({ cls: "xhs-dataview-render-host" });
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${contentWidth}px;opacity:0;pointer-events:none;z-index:-1;background:#ffffff;`;
  const component = new Component();
  try {
    component.load();
    const fence = `\`\`\`${language}\n${query}\n\`\`\``;
    await MarkdownRenderer.render(app, fence, host, sourcePath, component);
    await document.fonts.ready;
    const images = Array.from(host.querySelectorAll("img"));
    await Promise.all(images.map(async (img) => {
      try {
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          });
        }
      } catch {
        /* 图片等待失败不阻塞截图 */
      }
    }));
    const png = await domToPng(host, {
      backgroundColor: "#ffffff",
      width: Math.max(host.scrollWidth, contentWidth),
      height: Math.max(host.scrollHeight, 1),
      scale: Math.min(1, contentWidth / Math.max(host.scrollWidth, 1)),
    });
    return png;
  } finally {
    component.unload();
    host.remove();
  }
}
