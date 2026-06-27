// ── Scroll motion engine ─────────────────────────────────────────────────────
// One place for every scroll-driven effect on the site: in-view reveals (with
// directional / scale / clip / blur variants), depth parallax, a scroll-progress
// value, and on-view count-ups. Everything is rAF-batched, transform-only, and
// bails completely when the user prefers reduced motion.

import { useEffect, useRef, type RefObject } from "react";
import { useScroll, useSpring, type MotionValue } from "framer-motion";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Cleanup = () => void;
const noop: Cleanup = () => {};

// ── Reveals ──────────────────────────────────────────────────────────────────
// Tags eligible elements with `.sr .sr-<kind>` and flips them to `.sr-in` as they
// approach the viewport. Covers two sources:
//   • automatic — direct children of `section.aeg-section` (legacy behaviour), and
//   • explicit  — anything carrying a `data-reveal="up|left|right|scale|clip|blur"`.
const AUTO_SELECTOR =
  ":scope > .eyebrow, :scope > h2, :scope > p, :scope > .card, :scope > .panel-dark, " +
  ":scope > [class*='grid'], :scope > [class*='flows'], :scope > [class*='cmp'], :scope > .policy-grid";

const REVEAL_KINDS = new Set(["up", "left", "right", "scale", "clip", "blur"]);

export function initReveal(root: ParentNode = document): Cleanup {
  if (prefersReducedMotion()) return noop;

  const targets: HTMLElement[] = [];
  const add = (el: HTMLElement, kind: string, i: number) => {
    if (el.classList.contains("reveal") || el.classList.contains("sr")) return; // hero / already tagged
    const k = REVEAL_KINDS.has(kind) ? kind : "up";
    el.classList.add("sr", `sr-${k}`);
    if (!el.style.getPropertyValue("--sr-i")) el.style.setProperty("--sr-i", String(Math.min(i, 6)));
    targets.push(el);
  };

  // Explicit opt-ins first so they keep their authored stagger.
  root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => {
    const delay = el.dataset.revealDelay;
    if (delay) el.style.setProperty("--sr-i", delay);
    add(el, el.dataset.reveal || "up", i);
  });

  // Then the automatic per-section children.
  root.querySelectorAll<HTMLElement>("section.aeg-section").forEach((sec) => {
    sec.querySelectorAll<HTMLElement>(AUTO_SELECTOR).forEach((el, i) => add(el, el.dataset.reveal || "up", i));
  });

  if (!targets.length) return noop;
  const reveal = (el: Element) => el.classList.add("sr-in");

  // Anything already on (or just below) the first screen settles immediately —
  // the initial paint is never a wall of blank space.
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    targets.forEach((el) => { if (el.getBoundingClientRect().top < vh * 1.05) reveal(el); });
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach(reveal);
    return noop;
  }
  // Positive bottom margin => fire ~16% before the element scrolls in.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }),
    { threshold: 0, rootMargin: "0px 0px 16% 0px" }
  );
  targets.forEach((t) => io.observe(t));

  // Crash guard: never leave content stuck invisible.
  const failsafe = window.setTimeout(() => targets.forEach(reveal), 5000);
  return () => { io.disconnect(); clearTimeout(failsafe); };
}

// ── Parallax ─────────────────────────────────────────────────────────────────
// Each `[data-parallax]` element drifts on a single shared scroll loop. The value
// is written to the `--p` custom property (px) which the `.parallax` CSS consumes,
// so layout never thrashes — only a compositor transform changes.
//   data-parallax="0.18"        → speed (fraction of distance from viewport centre)
//   data-parallax-axis="x"      → translate on X instead of Y (default Y)
//   data-parallax-max="160"     → clamp travel in px (default 220)
export function initParallax(root: ParentNode = document): Cleanup {
  if (prefersReducedMotion()) return noop;

  const els = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
  if (!els.length) return noop;

  const items = els.map((el) => {
    el.classList.add("parallax");
    return {
      el,
      speed: parseFloat(el.dataset.parallax || "0.15") || 0.15,
      axis: el.dataset.parallaxAxis === "x" ? "x" : "y",
      max: parseFloat(el.dataset.parallaxMax || "220") || 220,
    };
  });

  let ticking = false;
  const apply = () => {
    ticking = false;
    const mid = window.innerHeight / 2;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const centre = r.top + r.height / 2;
      let p = (mid - centre) * it.speed;
      if (p > it.max) p = it.max; else if (p < -it.max) p = -it.max;
      it.el.style.setProperty("--p", `${p.toFixed(1)}px`);
      if (it.axis === "x") it.el.style.setProperty("--px", `${p.toFixed(1)}px`);
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };

  apply();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

// ── Scroll progress ──────────────────────────────────────────────────────────
// Spring-smoothed 0→1 of total page scroll, for the top progress bar (scaleX).
export function useScrollProgress(): MotionValue<number> {
  const { scrollYProgress } = useScroll();
  return useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
}

// ── Count-up ─────────────────────────────────────────────────────────────────
// Counts 0 → target once the element scrolls into view (once). Reduced motion
// snaps straight to the final value.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(
  target: number,
  opts: { duration?: number; format?: (n: number) => string } = {}
): RefObject<HTMLElement | null> {
  const { duration = 1500, format = (n) => Math.round(n).toLocaleString() } = opts;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { el.textContent = format(target); return; }
    
    // Set initial value
    el.textContent = format(0);

    let raf = 0;
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        el.textContent = format(target * easeOutCubic(t));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); } }),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);

  return ref;
}

// ── Dashboard in-view sequence ───────────────────────────────────────────────
// Admin surfaces get no parallax — just a staggered entrance as each block scrolls
// into the `.ad-scroll` pane. Existing `.ad-rise` mount animation is swapped for a
// scroll-gated `.ad-seq` so cards cascade in instead of all firing on mount.
export function initInViewSeq(scrollRoot: ParentNode | null): Cleanup {
  if (!scrollRoot || prefersReducedMotion()) return noop;

  const blocks = Array.from(
    scrollRoot.querySelectorAll<HTMLElement>(".ad-rise, .ad-grid > *")
  );
  if (!blocks.length) return noop;

  const indexInParent = new Map<Element, number>();
  blocks.forEach((el) => {
    el.classList.remove("ad-rise");
    el.classList.add("ad-seq");
    const parent = el.parentElement!;
    const i = indexInParent.get(parent) ?? 0;
    indexInParent.set(parent, i + 1);
    el.style.setProperty("--sr-i", String(Math.min(i, 8)));
  });

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
    { threshold: 0, rootMargin: "0px 0px 8% 0px" }
  );
  blocks.forEach((b) => io.observe(b));
  const failsafe = window.setTimeout(() => blocks.forEach((b) => b.classList.add("is-in")), 4000);
  return () => { io.disconnect(); clearTimeout(failsafe); };
}
