/**
 * How far down a scrolling area has been seen, from 0 to 100.
 * An area that fits on the screen without scrolling has been seen in full.
 */
export function computeScrollDepth(
  scrollTop: number,
  visibleHeight: number,
  contentHeight: number,
): number {
  if (contentHeight <= visibleHeight) return 100;
  const depth = Math.round(((scrollTop + visibleHeight) / contentHeight) * 100);
  return Math.min(Math.max(depth, 0), 100);
}
