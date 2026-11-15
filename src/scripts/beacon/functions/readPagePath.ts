import { BEACON_PATH_PATTERN } from "@/siteConstants";

const UNKNOWN_PATH = "/unknown/";

/** A path the route would refuse, which only a mistyped URL has, is still counted, under one fixed path. */
export function readPagePath(pathname: string): string {
  return BEACON_PATH_PATTERN.test(pathname) ? pathname : UNKNOWN_PATH;
}
