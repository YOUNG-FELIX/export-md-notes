import { buildGeometry, type ExportGeometry } from "./presets";
import type { Block, ExportOptions, ListBlock, TextBlock } from "./types";
import type { LoadedFont } from "./fonts";
import { getRenderCss, renderBlock } from "./render";
import { splitFlowBlock } from "./inline-utils";

export class LayoutMeasurer {
  private iframe: HTMLIFrameElement | null = null;
  private doc: Document | null = null;
  private container: HTMLElement | null = null;
  contentHeight: number = 0;
  firstPageContentHeight: number = 0;

  async init(options: ExportOptions, fonts: LoadedFont[], geom: ExportGeometry = buildGeometry(options)): Promise<void> {
    this.destroy();
    this.contentHeight = geom.contentHeight;
    this.firstPageContentHeight = geom.firstPageContentHeight;
    const iframe = document.body.createEl("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;left:-20000px;top:0;width:${geom.width}px;height:${geom.height > 0 ? geom.height : 16000}px;border:0;opacity:0;pointer-events:none`;
    const ready = new Promise<void>((resolve) => {
      const loaded = () => {
        if (!iframe.contentDocument?.querySelector(".xhs-measure")) return;
        iframe.removeEventListener("load", loaded); resolve();
      };
      iframe.addEventListener("load", loaded);
      iframe.srcdoc = `<!doctype html><html><head><style>${getRenderCss(options, fonts, geom)}</style></head><body><div class="xhs-measure"></div></body></html>`;
    });
    await ready;
    this.iframe = iframe;
    this.doc = iframe.contentDocument;
    this.container = this.doc?.querySelector(".xhs-measure") ?? null;
    if (!this.doc || !this.container) throw new Error("无法初始化排版测量 iframe");
    if (options.style === "handwrite" || options.style === "theme") {
      const selected = fonts.find((font) => font.id === options.fontId && font.available);
      if (selected) await this.doc.fonts.load(`52px "${selected.family}"`, "字体加载测试");
    }
    await this.doc.fonts.ready;
  }

  measure(block: Block): number {
    const element = this.mount(block);
    const style = this.requireDoc().defaultView!.getComputedStyle(element);
    const height = element.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    element.remove();
    return height;
  }

  minimumHeight(block: Block): number {
    if (block.type === "spacer") return 0;
    if (block.type === "image" || block.type === "image-pair" || block.type === "motion" || block.type === "table" || block.type === "author") return this.measure(block);
    const element = this.mount(block);
    const root = element.getBoundingClientRect();
    const rects = this.characterRects(element);
    const style = this.requireDoc().defaultView!.getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop);
    const firstBottom = rects.length ? Math.min(...rects.map((item) => item.rect.bottom)) - root.top : root.height;
    element.remove();
    return marginTop + firstBottom;
  }

  splitToHeight(block: TextBlock | ListBlock, available: number): [Block | null, Block | null] {
    const element = this.mount(block);
    const root = element.getBoundingClientRect();
    const style = this.requireDoc().defaultView!.getComputedStyle(element);
    const marginBottom = parseFloat(style.marginBottom);
    const total = root.height + parseFloat(style.marginTop) + marginBottom;
    const rects = this.characterRects(element);
    const lastBottom = rects.length ? Math.max(...rects.map((item) => item.rect.bottom)) - root.top : root.height;
    // A paragraph split by a page has no paragraph gap at the artificial cut.
    const trailing = total - lastBottom - marginBottom;
    let offset = 0;
    for (const item of rects) {
      if (item.rect.bottom - root.top + trailing <= available + 0.01) offset = Math.max(offset, item.offset);
    }
    element.remove();
    return splitFlowBlock(block, offset);
  }

  private characterRects(element: HTMLElement): Array<{ offset: number; rect: DOMRect }> {
    const doc = this.requireDoc();
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const result: Array<{ offset: number; rect: DOMRect }> = [];
    let globalOffset = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      for (let i = 0; i < text.length; i++) {
        const range = doc.createRange();
        range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = Array.from(range.getClientRects()).at(-1);
        if (rect && rect.height > 0) result.push({ offset: globalOffset + i + 1, rect });
      }
      globalOffset += text.length;
    }
    return result;
  }

  private mount(block: Block): HTMLElement {
    const doc = this.requireDoc();
    const element = renderBlock(doc, block);
    this.container!.append(element);
    return element;
  }

  private requireDoc(): Document {
    if (!this.doc) throw new Error("排版测量器尚未初始化");
    return this.doc;
  }

  destroy(): void { this.iframe?.remove(); this.iframe = null; this.doc = null; this.container = null; }
}
