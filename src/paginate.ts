import type { Block, ListBlock, Page, TableBlock, TextBlock } from "./types";
import { LayoutMeasurer } from "./measure";

const isFlow = (block: Block): block is TextBlock | ListBlock =>
  block.type === "paragraph" || block.type === "quote" || block.type === "code-block" || block.type === "cover-title" || block.type === "list";

export function paginate(blocks: Block[], measurer: LayoutMeasurer): Page[] {
  const queue = [...blocks];
  const pages: Page[] = [];
  let current: Block[] = [];
  let used = 0;

  const flush = () => {
    if (current.length) pages.push({ blocks: current });
    current = []; used = 0;
  };

  const measureSafe = (block: Block, fallback: number): number => {
    try { return measurer.measure(block); } catch (error) { console.error("Export MD notes measure 失败，使用估算高度", error); return fallback; }
  };

  while (queue.length) {
    const block = queue.shift()!;
    if (block.type === "spacer" && current.length === 0) continue;
    if (block.type === "motion" && current.some((item) => item.type === "motion")) {
      flush();
    }

    const pageCapacity = pages.length === 0 ? measurer.firstPageContentHeight : measurer.contentHeight;
    const height = measureSafe(block, pageCapacity);
    const remaining = pageCapacity - used;

    if (block.type === "subtitle") {
      const next = queue.find((item) => item.type !== "spacer");
      const keepWithNext = next ? measureSafe(next, pageCapacity) : 0;
      if (current.length && height + keepWithNext > remaining) { flush(); queue.unshift(block); continue; }
    }

    if (height <= remaining + 0.01) { current.push(block); used += height; continue; }

    if (block.type === "table" && height > pageCapacity) {
      const [before, after] = splitTable(block, remaining, pageCapacity, measurer);
      if (before) { current.push(before); used += measureSafe(before, pageCapacity); }
      if (after) queue.unshift(after);
      flush();
      continue;
    }

    if (isFlow(block)) {
      let before: TextBlock | ListBlock | null = null;
      let after: TextBlock | ListBlock | null = null;
      try {
        [before, after] = measurer.splitToHeight(block, remaining);
      } catch (error) {
        console.error("Export MD notes splitToHeight 失败，整块放入当前页", error);
        before = block;
        after = null;
      }
      if (before) { current.push(before); used += measureSafe(before, pageCapacity); }
      if (after) queue.unshift(after);
      if (!before && current.length === 0) {
        // A pathological single line taller than the canvas must still make progress.
        current.push(block);
      }
      flush();
      continue;
    }

    if (current.length) { flush(); queue.unshift(block); continue; }
    current.push(block); flush();
  }
  flush();
  return pages.length ? pages : [{ blocks: [] }];
}

function splitTable(table: TableBlock, available: number, pageCapacity: number, measurer: LayoutMeasurer): [TableBlock | null, TableBlock | null] {
  let accepted = 0;
  for (let count = 1; count <= table.rows.length; count++) {
    const candidate: TableBlock = { ...table, rows: table.rows.slice(0, count) };
    let candidateHeight: number;
    try { candidateHeight = measurer.measure(candidate); } catch { accepted = count; break; }
    if (candidateHeight <= available + 0.01) accepted = count;
    else break;
  }
  if (accepted === 0) {
    // An individual row can theoretically exceed a full page. Row-level splitting
    // is the promised granularity, so keep the row intact and guarantee progress.
    if (available >= pageCapacity - 0.01 && table.rows.length) {
      return [{ ...table, rows: table.rows.slice(0, 1) }, table.rows.length > 1 ? { ...table, rows: table.rows.slice(1) } : null];
    }
    return [null, table];
  }
  const before: TableBlock = { ...table, rows: table.rows.slice(0, accepted) };
  const remaining = table.rows.slice(accepted);
  return [before, remaining.length ? { ...table, rows: remaining } : null];
}
