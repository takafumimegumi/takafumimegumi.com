// Tracks the reading position in a case study: the current chapter and the progress bar.

/** A chapter becomes current once its top passes this point of the screen, where the eye reads. */
const READING_LINE = 0.4;

for (const dialog of document.querySelectorAll<HTMLDialogElement>(
  "dialog[data-case-study]",
)) {
  const chapters = [...dialog.querySelectorAll<HTMLElement>("[data-chapter]")];
  const links = [
    ...dialog.querySelectorAll<HTMLAnchorElement>("[data-chapter-link]"),
  ];
  const current = dialog.querySelector<HTMLElement>("[data-current-chapter]");
  const bar = dialog.querySelector<HTMLElement>("[data-progress]");
  if (chapters.length === 0) continue;

  const track = () => {
    const scrollable = dialog.scrollHeight - dialog.clientHeight;
    const line =
      dialog.getBoundingClientRect().top + dialog.clientHeight * READING_LINE;

    let index = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top <= line) index = i;
    });
    // A short last chapter never reaches the line, so the end of the page selects it.
    if (scrollable > 0 && dialog.scrollTop >= scrollable - 4) {
      index = chapters.length - 1;
    }

    if (current) current.textContent = chapters[index].dataset.chapter ?? "";
    links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (bar) {
      const ratio = scrollable > 0 ? dialog.scrollTop / scrollable : 0;
      bar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    }
  };

  dialog.addEventListener("scroll", track, { passive: true });

  // Scroll inside the dialog, and keep the case study URL free of a fragment.
  for (const link of links) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href")?.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    });
  }
}
