// Prints what the page-view beacons recorded (ADR-0008).
// Usage: npm run report -- [days] [hostname]. The defaults are 7 days and the live site.
// A beacon can be read a minute or more after it is written, not at once.

// Must match SITE_HOSTNAME in src/siteConstants.ts.
const SITE_HOSTNAME = "takafumimegumi.com";
// Vancouver stays on UTC-7 all year since March 2026.
const VANCOUVER_UTC_OFFSET_MS = -7 * 60 * 60 * 1000;
const ROW_LIMIT = 10_000;
const EVENT_LABELS = { call_booked: "booked", message_sent: "message" };

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.ANALYTICS_READ_TOKEN;
const days = Number(process.argv[2] ?? 7);
const hostname = process.argv[3] ?? SITE_HOSTNAME;

if (!accountId || !token) {
  fail("Set CLOUDFLARE_ACCOUNT_ID and ANALYTICS_READ_TOKEN in .env.analytics.");
}
// Both values go into the query text, so only these shapes are let through.
if (!Number.isInteger(days) || days < 1 || !/^[a-z0-9.-]+$/.test(hostname)) {
  fail("Usage: npm run report -- [days] [hostname]");
}

const rows = await readRows();
const views = groupIntoViews(rows);

console.log(`${hostname}, last ${days} days: ${rows.length} beacons`);
if (rows.length === ROW_LIMIT) {
  console.warn(
    `Only the first ${ROW_LIMIT} beacons were read. Ask for fewer days.`,
  );
}
if (rows.some((row) => Number(row.sampleInterval) !== 1)) {
  console.warn("Some beacons were sampled, so the counts below are too low.");
}

// A sudden rise here is the sign of beacons that no page sent.
print("Beacons a day", countByDayAndKind(rows));
print("Views, newest first", views.toReversed().map(describeView));
print(
  "By page",
  summarizeBy(views, (view) => view.path, summarizeReading),
);
print(
  "By source",
  summarizeBy(views, (view) => view.source, summarizeEvents),
);
print(
  "Case studies",
  summarizeBy(
    views.flatMap((view) => [...view.caseStudies.values()]),
    (reading) => reading.path,
    summarizeReading,
  ),
);

async function readRows() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // The columns are in the order that src/server/clients/cloudflareAnalyticsEngine.ts writes them.
      body: `
        SELECT
          timestamp,
          blob1 AS kind,
          blob2 AS path,
          blob3 AS source,
          blob4 AS viewId,
          double1 AS seconds,
          double2 AS depth,
          _sample_interval AS sampleInterval
        FROM beacons
        WHERE index1 = '${hostname}' AND timestamp > NOW() - INTERVAL '${days}' DAY
        ORDER BY timestamp
        LIMIT ${ROW_LIMIT}
        FORMAT JSON`,
    },
  );
  if (!response.ok) {
    fail(`The SQL API answered ${response.status}: ${await response.text()}`);
  }
  const { data } = await response.json();
  return data;
}

/** A view can be left several times, so it keeps its longest time. */
function groupIntoViews(rows) {
  const views = new Map();
  for (const row of rows) {
    const view = views.get(row.viewId) ?? {
      at: row.timestamp,
      path: row.path,
      source: row.source,
      seconds: 0,
      depth: 0,
      events: new Set(),
      caseStudies: new Map(),
    };
    views.set(row.viewId, view);

    if (row.kind === "case_study_read") {
      const reading = view.caseStudies.get(row.path) ?? {
        path: row.path,
        seconds: 0,
        depth: 0,
      };
      view.caseStudies.set(row.path, keepLargest(reading, row));
    } else {
      keepLargest(view, row);
      if (row.kind in EVENT_LABELS) view.events.add(EVENT_LABELS[row.kind]);
    }
  }
  return [...views.values()];
}

function keepLargest(target, row) {
  target.seconds = Math.max(target.seconds, Number(row.seconds));
  target.depth = Math.max(target.depth, Number(row.depth));
  return target;
}

function countByDayAndKind(rows) {
  const counts = new Map();
  for (const row of rows) {
    const day = formatVancouverTime(row.timestamp).slice(0, 10);
    const count = counts.get(day) ?? { day };
    count[row.kind] = (count[row.kind] ?? 0) + 1;
    counts.set(day, count);
  }
  return [...counts.values()];
}

function describeView(view) {
  const readings = [...view.caseStudies.values()].map(
    ({ path, seconds, depth }) => `read ${path} ${seconds}s ${depth}%`,
  );
  return {
    "opened (Vancouver)": formatVancouverTime(view.at),
    page: view.path,
    source: view.source,
    seconds: view.seconds,
    "depth %": view.depth,
    events: [...view.events, ...readings].join(", "),
  };
}

function summarizeBy(items, readKey, summarize) {
  const groups = Map.groupBy(items, readKey);
  return [...groups]
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([key, group]) => ({ "": key || "(none)", ...summarize(group) }));
}

function summarizeReading(items) {
  return {
    count: items.length,
    "median seconds": findMedian(items.map((item) => item.seconds)),
    "median depth %": findMedian(items.map((item) => item.depth)),
  };
}

function summarizeEvents(views) {
  const countEvent = (label) =>
    views.filter((view) => view.events.has(label)).length;
  return {
    views: views.length,
    booked: countEvent(EVENT_LABELS.call_booked),
    messages: countEvent(EVENT_LABELS.message_sent),
  };
}

function findMedian(numbers) {
  const sorted = numbers.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** Turns the API's UTC time, "2026-11-15 20:48:25", into Vancouver time. */
function formatVancouverTime(timestamp) {
  const utc = new Date(`${timestamp.replace(" ", "T")}Z`);
  const vancouver = new Date(utc.getTime() + VANCOUVER_UTC_OFFSET_MS);
  return vancouver.toISOString().slice(0, 16).replace("T", " ");
}

function print(title, table) {
  console.log(`\n${title}`);
  if (table.length === 0) console.log("  (nothing)");
  else console.table(table);
}

function fail(message) {
  console.error(`report-views: ${message}`);
  process.exit(1);
}
