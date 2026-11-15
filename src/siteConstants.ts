export const SITE_NAME = "Takafumi Megumi";
export const SITE_HOSTNAME = "takafumimegumi.com";

export const HOME_TITLE = "Takafumi Megumi | UI/UX × Engineering";
export const HOME_DESCRIPTION =
  "Full-stack product engineer in Vancouver with 6+ years of growing products people use. See my work and get in touch.";
export const HOME_SHARE_IMAGE = {
  path: "/og-home.jpg",
  alt: "Takafumi Megumi, UI/UX × Engineering, standing in a park in Vancouver",
};

export const LINKEDIN_URL = "https://www.linkedin.com/in/takafumi-megumi/";
export const GITHUB_PROFILE_URL = "https://github.com/takafumimegumi";
export const GITHUB_REPO_URL =
  "https://github.com/takafumimegumi/takafumimegumi.com";

// Shown in the Contact section, and where the message form delivers.
export const OWNER_EMAIL = "tmegumi1103@gmail.com";

// The beacon script and the route that receives its beacons must agree on these (ADR-0008).
export const MAX_BEACON_SECONDS = 24 * 60 * 60;
export const BEACON_PATH_PATTERN = /^\/[a-z0-9/-]{0,99}$/;

export const MINUTE_MS = 60 * 1000;
export const DAY_MS = 24 * 60 * MINUTE_MS;
