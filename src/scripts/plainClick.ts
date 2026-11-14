/**
 * True for a click the page may handle itself.
 * A click with a modifier key opens a new tab or window, so it is left to the browser.
 */
export function isPlainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
