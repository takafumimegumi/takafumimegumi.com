import { BEACON_PATH_PATTERN } from "@/siteConstants";

const UNKNOWN_PATH = "/unknown/";

/**
 * The path a view is recorded under. A path the route would refuse, which only
 * a mistyped URL has, becomes one fixed path, so the visit is still counted.
 */
export function readPagePath(pathname: string): string {
  return BEACON_PATH_PATTERN.test(pathname) ? pathname : UNKNOWN_PATH;
}
