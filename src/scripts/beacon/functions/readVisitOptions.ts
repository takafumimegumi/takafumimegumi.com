const SOURCE_PARAMETER = "from";
const MEASURE_PARAMETER = "measure";
const SOURCE_PATTERN = /^[a-z0-9-]{1,40}$/;

export interface VisitOptions {
  source: string;
  measure?: "on" | "off";
  cleanedUrl?: string;
}

/** The parameters are removed from the URL, so a copied link does not carry them on (ADR-0008). */
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
