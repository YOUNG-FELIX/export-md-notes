export function fontWidthsDiffer(fallbackWidths: number[], candidateWidths: number[]): boolean {
  return candidateWidths.some((width, index) => Math.abs(width - (fallbackWidths[index] ?? width)) > 0.01);
}
