const SOURCE_PARAMETER = "from";
const MEASURE_PARAMETER = "measure";
const SOURCE_PATTERN = /^[a-z0-9-]{1,40}$/;

export interface VisitOptions {
  /** The source tag of the link the visit came from, or an empty string. */
  source: string;
  /** Set when the URL asks to turn measurement on or off in this browser. */
  measure?: "on" | "off";
  /** The URL without the two parameters. Undefined when it had neither. */
  cleanedUrl?: string;
}

/**
 * Reads what a page's URL says about measuring the visit (ADR-0008).
 * The parameters are then removed, so a copied URL does not carry them on.
 */
export function readVisitOptions(href: string): VisitOptions {
  const url = new URL(href);
  const source = url.searchParams.get(SOURCE_PARAMETER);
  const measure = url.searchParams.get(MEASURE_PARAMETER);
  if (source === null && measure === null) return { source: "" };

  url.searchParams.delete(SOURCE_PARAMETER);
  url.searchParams.delete(MEASURE_PARAMETER);
  return {
    source: source !== null && SOURCE_PATTERN.test(source) ? source : "",
    measure: measure === "on" || measure === "off" ? measure : undefined,
    cleanedUrl: url.pathname + url.search + url.hash,
  };
}
