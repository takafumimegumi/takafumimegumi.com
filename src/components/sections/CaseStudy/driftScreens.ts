// Drifts a row of screens to the left in a loop, while it is on screen.
// It stops while the pointer, a finger, or keyboard focus is on it, and the
// button pauses it for good (WCAG 2.2.2).

const SPEED_PX_PER_MS = 0.06;
/** After a swipe, the row waits this long before it moves again. */
const TOUCH_RESUME_MS = 2500;

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

for (const wrap of document.querySelectorAll<HTMLElement>("[data-strip]")) {
  const track = wrap.querySelector<HTMLElement>("[data-strip-track]");
  const toggle = wrap.querySelector<HTMLElement>("[data-strip-toggle]");
  if (!track || !toggle) continue;

  // By hand: fade only the edge where more screens wait.
  const updateEdges = () => {
    if ("auto" in wrap.dataset) return;
    const max = track.scrollWidth - track.clientWidth;
    track.style.setProperty(
      "--fade-left",
      track.scrollLeft > 4 ? "48px" : "0px",
    );
    track.style.setProperty(
      "--fade-right",
      track.scrollLeft < max - 4 ? "64px" : "0px",
    );
  };
  track.addEventListener("scroll", updateEdges, { passive: true });
  updateEdges();

  // With reduced motion the row stays still and is scrolled by hand.
  if (reducedMotion) continue;

  // A second, hidden copy of the screens makes the loop seamless.
  const screens = [...track.children] as HTMLElement[];
  for (const screen of screens) {
    const copy = screen.cloneNode(true) as HTMLElement;
    copy.setAttribute("aria-hidden", "true");
    copy.inert = true;
    copy.querySelector("img")?.setAttribute("alt", "");
    track.append(copy);
  }
  wrap.dataset.auto = "";

  const held = { hover: false, touch: false, focus: false };
  let paused = false;
  let visible = false;
  let position = 0;
  let lastTime = 0;
  let frame = 0;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;

  // One loop is the distance from a screen to its copy. Half the scroll width is off by the padding and a gap.
  const firstCopy = track.children[screens.length] as HTMLElement;
  const loopWidth = () => firstCopy.offsetLeft - screens[0].offsetLeft;

  const tick = (time: number) => {
    const loop = loopWidth();
    const moving = !paused && !held.hover && !held.touch && !held.focus;
    if (moving && lastTime) {
      position += (time - lastTime) * SPEED_PX_PER_MS;
    } else {
      // Follow the visitor's own scrolling, so the drift resumes from there.
      position = track.scrollLeft;
    }
    if (position >= loop) position -= loop;
    if (moving || track.scrollLeft >= loop) track.scrollLeft = position;
    lastTime = time;
    frame = requestAnimationFrame(tick);
  };

  track.addEventListener("mouseenter", () => (held.hover = true));
  track.addEventListener("mouseleave", () => (held.hover = false));
  track.addEventListener("focusin", () => (held.focus = true));
  track.addEventListener("focusout", () => (held.focus = false));
  track.addEventListener(
    "touchstart",
    () => {
      clearTimeout(touchTimer);
      held.touch = true;
    },
    { passive: true },
  );
  // touchcancel too: the system can take a gesture over, and no touchend follows.
  for (const type of ["touchend", "touchcancel"]) {
    track.addEventListener(type, () => {
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => (held.touch = false), TOUCH_RESUME_MS);
    });
  }

  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute(
      "aria-label",
      paused ? "Play the moving screens" : "Pause the moving screens",
    );
  });

  // A closed dialog is never on screen, so this also stops with the case study.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting === visible) return;
    visible = entry.isIntersecting;
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (visible) frame = requestAnimationFrame(tick);
  }).observe(track);
}
