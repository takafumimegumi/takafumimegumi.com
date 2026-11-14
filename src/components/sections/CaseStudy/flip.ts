// Shows a stack of images one at a time, going up the list and back, while it is on screen.

const INTERVAL_MS = 1300;

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!reducedMotion) {
  for (const stack of document.querySelectorAll<HTMLElement>("[data-flip]")) {
    const frames = [
      ...stack.querySelectorAll<HTMLElement>("[data-flip-frame]"),
    ];
    if (frames.length < 2) continue;

    let index = 0;
    let direction = 1;
    let timer: ReturnType<typeof setInterval> | undefined;

    const step = () => {
      if (index + direction < 0 || index + direction >= frames.length) {
        direction = -direction;
      }
      delete frames[index].dataset.on;
      index += direction;
      frames[index].dataset.on = "";
    };

    // A closed dialog is never on screen, so this also stops with the case study.
    new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (entry.isIntersecting) timer = setInterval(step, INTERVAL_MS);
    }).observe(stack);
  }
}
