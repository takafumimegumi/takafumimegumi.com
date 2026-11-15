import type { RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";

/** Only for a screen that appears after the visitor did something. On page load, taking the focus would pull the page down. */
export function useFocusOnMount<
  Element extends HTMLElement,
>(): RefObject<Element | null> {
  const element = useRef<Element>(null);

  useEffect(() => {
    element.current?.focus();
  }, []);

  return element;
}
