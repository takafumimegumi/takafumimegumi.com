// Fails if commits contain a blocklisted string or a value from .dev.vars.
// Usage: node scripts/check-blocklist.mjs [git revision range]. No range means all history.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BLOCKLIST_PATH = "private/blocklist.txt";
const SECRETS_PATH = ".dev.vars";

// Shorter values, such as "development", would match ordinary text.
const MIN_SECRET_LENGTH = 12;

const COMMIT_MARKER = "\0commit ";

if (!existsSync(BLOCKLIST_PATH)) {
  console.error(
    `check-blocklist: ${BLOCKLIST_PATH} is missing. Nothing was checked.`,
  );
  process.exit(1);
}

const matchers = [...blocklistMatchers(), ...secretMatchers()];
const range = process.argv.slice(2);

// The patch output covers commit messages, file names, and changed lines.
const log = execFileSync(
  "git",
  [
    "log",
    "-p",
    "--no-color",
    "--no-ext-diff",
    // %x00 makes git print the NUL byte that starts COMMIT_MARKER.
    "--format=%x00commit %h%n%B",
    ...(range.length ? range : ["--all"]),
  ],
  { encoding: "utf8", maxBuffer: 1024 ** 3 },
);

const findings = new Set();
let commit = "";
for (const line of log.split("\n")) {
  if (line.startsWith(COMMIT_MARKER)) {
    commit = line.slice(COMMIT_MARKER.length);
    continue;
  }
  for (const { label, test } of matchers) {
    if (test(line)) findings.add(`${commit}: ${label}`);
  }
}

if (findings.size > 0) {
  console.error("check-blocklist: found strings that must not be pushed.");
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

function blocklistMatchers() {
  return readFileSync(BLOCKLIST_PATH, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((term) => {
      const pattern = wholeWordPattern(term);
      return {
        label: `blocklisted string "${term}"`,
        test: (line) => pattern.test(line),
      };
    });
}

// Matches the term only as a whole word, so "art" does not match "party".
function wholeWordPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = /^[a-z0-9]/i.test(term) ? "(?<![a-z0-9])" : "";
  const after = /[a-z0-9]$/i.test(term) ? "(?![a-z0-9])" : "";
  return new RegExp(`${before}${escaped}${after}`, "i");
}

function secretMatchers() {
  if (!existsSync(SECRETS_PATH)) return [];
  return (
    readFileSync(SECRETS_PATH, "utf8")
      .split("\n")
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, name, raw]) => ({
        name,
        value: raw.replace(/^(["'])(.*)\1$/, "$2"),
      }))
      .filter(({ value }) => value.length >= MIN_SECRET_LENGTH)
      // The label names the variable only. The value is never printed.
      .map(({ name, value }) => ({
        label: `value of ${name} from ${SECRETS_PATH}`,
        test: (line) => line.includes(value),
      }))
  );
}
