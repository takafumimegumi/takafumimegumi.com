import type { RefObject } from "preact";
import { useEffect } from "preact/hooks";

// Cloudflare's test key always passes and works on localhost. The other is this site's key. Both are public.
const SITE_KEY = import.meta.env.DEV
  ? "1x00000000000000000000AA"
  : "0x4AAAAAAGBSCwL53PpLnp5I";
const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** The form the token is for. The server refuses a token made for the other form (ADR-0006). */
export type TokenAction = "booking" | "message";

/** Runs the bot check and returns its token, or undefined when the check did not pass. */
export type RequestToken = () => Promise<string | undefined>;

interface TurnstileApi {
  render: (container: HTMLElement, options: object) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoad: Promise<void> | undefined;

interface Props {
  /** Where the check draws itself. It stays empty unless the visitor has to do something. */
  boxRef: RefObject<HTMLDivElement | null>;
}

/** The place for the bot check. It loads the script early, so pressing the button does not wait for it. */
export function Turnstile({ boxRef }: Props) {
  useEffect(() => {
    void loadScript().catch(() => undefined);
  }, []);

  // No box of its own: an empty one would take a row in the form's grid.
  return <div ref={boxRef} style={{ display: "contents" }} />;
}

/**
 * Runs the check in the box. A token works once and for 5 minutes,
 * so each submission asks for a new one instead of keeping one around.
 */
export async function requestToken(
  box: HTMLElement,
  action: TokenAction,
): Promise<string | undefined> {
  try {
    await loadScript();
  } catch {
    return undefined;
  }
  const turnstile = window.turnstile;
  if (!turnstile) return undefined;

  return new Promise((resolve) => {
    let widgetId: string | undefined;
    let isFinished = false;

    // Called by whichever comes first. The widget is removed once its id is known.
    const finish = (token: string | undefined) => {
      if (isFinished) return;
      isFinished = true;
      if (widgetId !== undefined) turnstile.remove(widgetId);
      resolve(token);
    };

    try {
      widgetId = turnstile.render(box, {
        sitekey: SITE_KEY,
        action,
        appearance: "interaction-only",
        // The token goes into the request body, not into a hidden input.
        "response-field": false,
        retry: "never",
        callback: (token: string) => finish(token),
        "error-callback": () => finish(undefined),
        "unsupported-callback": () => finish(undefined),
        // The visitor left a challenge unsolved. Ending here gives the form back.
        "timeout-callback": () => finish(undefined),
      });
    } catch {
      finish(undefined);
      return;
    }
    // A callback that ran inside render finished before the id was known.
    if (isFinished) turnstile.remove(widgetId);
  });
}

function loadScript(): Promise<void> {
  scriptLoad ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Forgotten, so the next submission tries to load it again.
      scriptLoad = undefined;
      script.remove();
      reject(new Error("The bot check did not load."));
    };
    document.head.append(script);
  });
  return scriptLoad;
}
