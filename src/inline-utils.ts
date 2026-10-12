import type { Block, Inline, ListBlock, TextBlock } from "./types";

export function inlineLength(inlines: Inline[]): number {
  return inlines.reduce((sum, inline) => sum + (inline.type === "text" ? inline.text.length : inlineLength(inline.children)), 0);
}

export function splitInlines(inlines: Inline[], offset: number): [Inline[], Inline[]] {
  const before: Inline[] = [];
  const after: Inline[] = [];
  let remaining = Math.max(0, offset);
  for (const inline of inlines) {
    const length = inline.type === "text" ? inline.text.length : inlineLength(inline.children);
    if (remaining <= 0) { after.push(cloneInline(inline)); continue; }
    if (remaining >= length) { before.push(cloneInline(inline)); remaining -= length; continue; }
    if (inline.type === "text") {
      if (remaining > 0) before.push({ type: "text", text: inline.text.slice(0, remaining) });
      if (remaining < inline.text.length) after.push({ type: "text", text: inline.text.slice(remaining) });
    } else {
      const [left, right] = splitInlines(inline.children, remaining);
      if (left.length) before.push({ type: inline.type, children: left });
      if (right.length) after.push({ type: inline.type, children: right });
    }
    remaining = 0;
  }
  return [before, after];
}

function cloneInline(inline: Inline): Inline {
  return inline.type === "text" ? { ...inline } : { type: inline.type, children: inline.children.map(cloneInline) };
}

export function splitFlowBlock(block: TextBlock | ListBlock, offset: number): [Block | null, Block | null] {
  if (block.type !== "list") {
    const [before, after] = splitInlines(block.inlines, offset);
    return [
      before.length ? { ...block, inlines: before, continuesNext: true } : null,
      after.length ? { ...block, inlines: after, continuedFromPrevious: true } : null
    ];
  }
  const beforeItems: Inline[][] = [];
  const afterItems: Inline[][] = [];
  let remaining = offset;
  for (const item of block.items) {
    const length = inlineLength(item);
    if (remaining <= 0) { afterItems.push(item); continue; }
    if (remaining >= length) { beforeItems.push(item); remaining -= length; continue; }
    const [before, after] = splitInlines(item, remaining);
    if (before.length) beforeItems.push(before);
    if (after.length) afterItems.push(after);
    remaining = 0;
  }
  return [
    beforeItems.length ? { ...block, items: beforeItems, continuesNext: true } : null,
    afterItems.length ? { ...block, items: afterItems, continuedFromPrevious: true } : null
  ];
}
