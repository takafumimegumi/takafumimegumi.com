// Counts each number up from zero when its block is revealed.
import type { RevealDetail } from "@/scripts/reveal";

const DURATION_MS = 900;

function countUp(number: HTMLElement, delay: number) {
  const target = Number(number.dataset.count);
  const suffix = number.textContent.replace(/[0-9\s]/g, "");

  // The width is held, so the text beside the number does not move while it counts.
  number.style.width = `${number.offsetWidth}px`;
  number.textContent = `0${suffix}`;

  setTimeout(() => {
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      number.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
      else number.style.width = "";
    };
    requestAnimationFrame(step);
  }, delay);
}

document.addEventListener("reveal", (event) => {
  const number = (event.target as Element).querySelector<HTMLElement>(
    "[data-count]",
  );
  if (!number) return;
  countUp(number, (event as CustomEvent<RevealDetail>).detail.delay);
});
