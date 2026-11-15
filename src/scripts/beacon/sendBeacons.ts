// Sends the page-view beacons: a view opened or left, and the events in it (ADR-0008).
// A view is one page load. Its ID lives in memory only, and no referrer is read.

import type { ContactEventName } from "@/components/sections/Contact/ContactForm";
import { computeScrollDepth } from "./functions/computeScrollDepth";
import { readVisitOptions } from "./functions/readVisitOptions";

const ENDPOINT = "/api/beacons";
const MEASURE_KEY = "measure";

type BeaconKind =
  "opened" | "left" | "case_study_read" | "call_booked" | "message_sent";

const FORM_EVENT_KINDS: Record<ContactEventName, BeaconKind> = {
  "contact:booked": "call_booked",
  "contact:sent": "message_sent",
};

/** Counts the time something has been on screen, across several stretches. */
interface Stopwatch {
  start: () => void;
  stop: () => void;
  readSeconds: () => number;
}

/** One case study, read inside its dialog. */
interface Reading {
  dialog: HTMLDialogElement;
  path: string;
  stopwatch: Stopwatch;
  depth: number;
  open: boolean;
}

function buildStopwatch(): Stopwatch {
  let totalMs = 0;
  let startedAt: number | undefined;
  return {
    start() {
      startedAt ??= performance.now();
    },
    stop() {
      if (startedAt === undefined) return;
      totalMs += performance.now() - startedAt;
      startedAt = undefined;
    },
    readSeconds() {
      const runningMs =
        startedAt === undefined ? 0 : performance.now() - startedAt;
      return Math.round((totalMs + runningMs) / 1000);
    },
  };
}

/** Storage can be blocked, as in some private windows. Then the choice is not kept. */
function storeMeasureChoice(choice: "on" | "off") {
  try {
    if (choice === "off") localStorage.setItem(MEASURE_KEY, "off");
    else localStorage.removeItem(MEASURE_KEY);
  } catch {
    // Nothing to do: the visit is measured as usual.
  }
}

function isMeasureOff(): boolean {
  try {
    return localStorage.getItem(MEASURE_KEY) === "off";
  } catch {
    return false;
  }
}

function measureView(source: string) {
  const viewId = crypto.randomUUID();
  // The path of the page that was loaded. Opening a case study changes the URL, not the view.
  const pagePath = location.pathname;
  const pageStopwatch = buildStopwatch();
  let pageDepth = 0;
  let opened = false;
  let sentWhileHidden = false;

  const readings: Reading[] = [
    ...document.querySelectorAll<HTMLDialogElement>("dialog[data-case-study]"),
  ].map((dialog) => ({
    dialog,
    path: `/projects/${dialog.dataset.caseStudy}/`,
    stopwatch: buildStopwatch(),
    depth: 0,
    open: false,
  }));

  function send(
    kind: BeaconKind,
    path: string,
    seconds: number,
    depth: number,
  ) {
    navigator.sendBeacon(
      ENDPOINT,
      JSON.stringify({ kind, path, source, viewId, seconds, depth }),
    );
  }

  function sendReading(reading: Reading) {
    send(
      "case_study_read",
      reading.path,
      reading.stopwatch.readSeconds(),
      reading.depth,
    );
  }

  function updatePageDepth() {
    const depth = computeScrollDepth(
      window.scrollY,
      window.innerHeight,
      document.documentElement.scrollHeight,
    );
    pageDepth = Math.max(pageDepth, depth);
  }

  function updateReadingDepth(reading: Reading) {
    const { scrollTop, clientHeight, scrollHeight } = reading.dialog;
    const depth = computeScrollDepth(scrollTop, clientHeight, scrollHeight);
    reading.depth = Math.max(reading.depth, depth);
  }

  /** Makes a reading match its dialog, which another script opens and closes. */
  function syncReading(reading: Reading) {
    if (reading.dialog.open === reading.open) return;
    reading.open = reading.dialog.open;
    if (reading.open) {
      if (document.visibilityState === "visible") reading.stopwatch.start();
      updateReadingDepth(reading);
    } else {
      reading.stopwatch.stop();
      sendReading(reading);
    }
  }

  function handleVisible() {
    sentWhileHidden = false;
    pageStopwatch.start();
    for (const reading of readings) {
      if (reading.open) reading.stopwatch.start();
    }
    if (opened) return;
    opened = true;
    updatePageDepth();
    send("opened", pagePath, 0, pageDepth);
  }

  /** A hidden page may never come back, so everything counted so far is sent now. */
  function handleHidden() {
    pageStopwatch.stop();
    for (const reading of readings) reading.stopwatch.stop();
    // Closing a tab fires both visibilitychange and pagehide.
    if (!opened || sentWhileHidden) return;
    sentWhileHidden = true;
    send("left", pagePath, pageStopwatch.readSeconds(), pageDepth);
    for (const reading of readings) {
      if (reading.open) sendReading(reading);
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") handleVisible();
    else handleHidden();
  }

  window.addEventListener("scroll", updatePageDepth, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // Some browsers skip visibilitychange when the page is left by navigating.
  window.addEventListener("pagehide", handleHidden);
  for (const [name, kind] of Object.entries(FORM_EVENT_KINDS)) {
    document.addEventListener(name, () => {
      send(kind, pagePath, pageStopwatch.readSeconds(), pageDepth);
    });
  }

  for (const reading of readings) {
    reading.dialog.addEventListener(
      "scroll",
      () => updateReadingDepth(reading),
      { passive: true },
    );
    new MutationObserver(() => syncReading(reading)).observe(reading.dialog, {
      attributeFilter: ["open"],
    });
    syncReading(reading);
  }

  handleVisibilityChange();
}

const options = readVisitOptions(location.href);
if (options.measure) storeMeasureChoice(options.measure);
if (options.cleanedUrl !== undefined) {
  history.replaceState(history.state, "", options.cleanedUrl);
}
if (!isMeasureOff()) measureView(options.source);
