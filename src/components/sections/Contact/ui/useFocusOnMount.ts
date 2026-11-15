import type { RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";

/**
 * Returns a ref for the element that takes the focus when a screen appears.
 * Only for a screen that appears after the visitor did something: on page load it would pull the page down.
 */
export function useFocusOnMount<
  Element extends HTMLElement,
>(): RefObject<Element | null> {
  const element = useRef<Element>(null);

  useEffect(() => {
    element.current?.focus();
  }, []);

  return element;
}
