// Fades blocks up as they scroll into view. The styles are in base.css.
// After a block is shown, it gets a "reveal" event with the delay it was given.

const STAGGER_MS = 80;

export interface RevealDetail {
  delay: number;
}

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!reducedMotion) {
  const blocks = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];

  // Anything already on screen at load stays still.
  for (const block of blocks) {
    if (block.getBoundingClientRect().top < window.innerHeight) {
      block.dataset.reveal = "shown";
    }
  }
  document.documentElement.dataset.revealReady = "";

  const observer = new IntersectionObserver(
    (entries) => {
      // Blocks that enter together follow page order, a little apart.
      entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .sort((a, b) => blocks.indexOf(a) - blocks.indexOf(b))
        .forEach((block, index) => {
          const delay = index * STAGGER_MS;
          block.style.transitionDelay = `${delay}ms`;
          block.dataset.reveal = "shown";
          observer.unobserve(block);
          block.dispatchEvent(
            new CustomEvent<RevealDetail>("reveal", {
              detail: { delay },
              bubbles: true,
            }),
          );
        });
    },
    // A block starts once its top is 15% above the bottom of the screen.
    { rootMargin: "0px 0px -15% 0px" },
  );

  for (const block of blocks) {
    if (block.dataset.reveal !== "shown") observer.observe(block);
  }
}
