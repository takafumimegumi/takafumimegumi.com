// Grows a green line down each timeline with the scroll. When the line reaches a
// role's dot, the dot lights up and the card slides in from the line.

/** The line's tip sits this far down the screen, where the eye already is. */
const TIP_RATIO = 0.7;
/** The line starts below the company name. */
const LINE_TOP_PX = 24;
/** From the top of a role to the center of its dot. */
const DOT_CENTER_PX = 31;
const PULSE_MS = 700;
/** The card follows the dot, so the eye goes line, dot, card. */
const CARD_DELAY_MS = 150;

const section = document.querySelector<HTMLElement>("[data-timeline]");
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (section && !reducedMotion) {
  const tracks = [
    ...section.querySelectorAll<HTMLElement>("[data-timeline-track]"),
  ];
  const roles = [
    ...section.querySelectorAll<HTMLElement>("[data-timeline-role]"),
  ];
  let firstDraw = true;
  let frameRequested = false;

  const draw = () => {
    frameRequested = false;
    const tip = window.innerHeight * TIP_RATIO;

    for (const track of tracks) {
      const rect = track.getBoundingClientRect();
      const top = rect.top + LINE_TOP_PX;
      const progress = (tip - top) / (rect.bottom - top);
      track.style.setProperty(
        "--progress",
        Math.min(1, Math.max(0, progress)).toFixed(4),
      );
    }

    for (const role of roles) {
      const reached = role.getBoundingClientRect().top + DOT_CENTER_PX <= tip;
      const wasLit = "lit" in role.dataset;
      role.toggleAttribute("data-lit", reached);
      if (!reached) continue;

      // Roles already passed at load appear without the pulse or the delay.
      if (!wasLit && !firstDraw) {
        role.dataset.pulse = "";
        setTimeout(() => delete role.dataset.pulse, PULSE_MS);
      }
      // A shown card stays shown when the page scrolls back up.
      if (!("shown" in role.dataset)) {
        if (firstDraw) role.dataset.shown = "";
        else setTimeout(() => (role.dataset.shown = ""), CARD_DELAY_MS);
      }
    }
    firstDraw = false;
  };

  const requestDraw = () => {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(draw);
  };

  // The cards are hidden only from here on, so the page reads fine without this script.
  section.dataset.timelineReady = "";
  window.addEventListener("scroll", requestDraw, { passive: true });
  window.addEventListener("resize", requestDraw);
  draw();
}
