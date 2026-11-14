// Opens each case study over the home page and keeps the URL in step with it (ADR-0001).

import { isPlainClick } from "@/scripts/plainClick";

const FADE_MS = 300;

const dialogs = [
  ...document.querySelectorAll<HTMLDialogElement>("dialog[data-case-study]"),
];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const closeTimers = new WeakMap<
  HTMLDialogElement,
  ReturnType<typeof setTimeout>
>();

function pathOf(dialog: HTMLDialogElement): string {
  return `/projects/${dialog.dataset.caseStudy}/`;
}

function dialogForLocation(): HTMLDialogElement | undefined {
  const path = location.pathname.replace(/\/?$/, "/");
  return dialogs.find((dialog) => pathOf(dialog) === path);
}

function openerOf(dialog: HTMLDialogElement): HTMLElement | null {
  return document.querySelector(
    `[data-open-case-study="${dialog.dataset.caseStudy}"]`,
  );
}

function show(dialog: HTMLDialogElement, animate: boolean) {
  // Asked to open again while fading out, for example back and then forward: stay open.
  if (dialog.open && "fading" in dialog.dataset) {
    clearTimeout(closeTimers.get(dialog));
    delete dialog.dataset.fading;
    return;
  }
  if (dialog.open) return;
  if (animate) dialog.dataset.fading = "";
  dialog.showModal();
  dialog.scrollTop = 0;
  document.title = dialog.dataset.pageTitle ?? document.title;
  if (animate) {
    // Reading a layout value applies the faded state first, so the fade has a start.
    void dialog.offsetWidth;
    delete dialog.dataset.fading;
  }
}

function hide(dialog: HTMLDialogElement) {
  if (!dialog.open || "fading" in dialog.dataset) return;
  dialog.dataset.fading = "";
  closeTimers.set(
    dialog,
    setTimeout(() => dialog.close(), reducedMotion.matches ? 0 : FADE_MS),
  );
}

/** Makes the open dialog match the URL. Runs after back and forward. */
function syncWithLocation() {
  const current = dialogForLocation();
  for (const dialog of dialogs) {
    if (dialog === current) show(dialog, true);
    else hide(dialog);
  }
}

/** Moves the URL off the case study. Going back also restores the scroll position. */
function leaveCaseStudyUrl() {
  if (history.state?.openedFromHome) history.back();
  else history.replaceState(null, "", "/");
}

function requestClose(dialog: HTMLDialogElement) {
  leaveCaseStudyUrl();
  // After history.back(), the popstate handler hides it.
  if (!history.state?.openedFromHome) hide(dialog);
}

for (const dialog of dialogs) {
  // The server renders the dialog open on its own URL. Reopen it as a modal.
  if (dialog.open) {
    dialog.close();
    show(dialog, false);
  }

  dialog.addEventListener("cancel", (event) => {
    // When the browser will not wait, the close handler below updates the URL.
    if (!event.cancelable) return;
    event.preventDefault();
    requestClose(dialog);
  });

  dialog.addEventListener("click", (event) => {
    if (!(event.target as Element).closest("[data-close]")) return;
    if (!isPlainClick(event)) return;
    event.preventDefault();
    requestClose(dialog);
  });

  dialog.addEventListener("close", () => {
    // The close event of the reopening above arrives after the dialog is open again.
    if (dialog.open) return;
    delete dialog.dataset.fading;
    document.title = dialog.dataset.homeTitle ?? document.title;
    // A browser may close on Escape without letting the cancel handler stop it.
    if (dialogForLocation() === dialog) leaveCaseStudyUrl();
    // After a direct visit there is no earlier focus for the browser to restore.
    const focused = document.activeElement;
    if (!focused || focused === document.body || dialog.contains(focused)) {
      openerOf(dialog)?.focus({ preventScroll: true });
    }
  });
}

document.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>(
    "a[data-open-case-study]",
  );
  if (!link) return;
  if (!isPlainClick(event)) return;
  const dialog = dialogs.find(
    (d) => d.dataset.caseStudy === link.dataset.openCaseStudy,
  );
  if (!dialog) return;
  event.preventDefault();
  history.pushState({ openedFromHome: true }, "", pathOf(dialog));
  show(dialog, true);
});

window.addEventListener("popstate", syncWithLocation);
