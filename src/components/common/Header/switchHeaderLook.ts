// Switches the header to its light look a little before the hero has scrolled up behind it.
const EARLY_PX = 120;

const header = document.querySelector<HTMLElement>("[data-header]");
const hero = document.querySelector<HTMLElement>("[data-hero]");

if (header && hero) {
  const update = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.toggleAttribute(
      "data-scrolled",
      heroBottom <= header.offsetHeight + EARLY_PX,
    );
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}
