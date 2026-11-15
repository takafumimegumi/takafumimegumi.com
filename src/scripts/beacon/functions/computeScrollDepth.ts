export function computeScrollDepth(
  scrollTop: number,
  visibleHeight: number,
  contentHeight: number,
): number {
  // An area that fits on the screen has been seen in full.
  if (contentHeight <= visibleHeight) return 100;
  const depth = Math.round(((scrollTop + visibleHeight) / contentHeight) * 100);
  return Math.min(Math.max(depth, 0), 100);
}
