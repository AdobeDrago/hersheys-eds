import { loadCSS } from './aem.js';

/*
 * Scroll animations: a section with an `animate-*` Section Metadata style animates its parts in,
 * once, as they scroll into view, as hersheyland.com does (measured on /brands/reeses/oreo-cup).
 * The effects are in styles/scroll-animations.css:
 * - `rise`: fades in while rising its own height (animate.css fadeInUp on hersheyland.com)
 * - `fade` and `fade-up` (rises 100px): AOS fade and fade-up on hersheyland.com
 * `parts` maps selectors to each one's duration (ms). A part starts once its top is `offset` px
 * into the viewport, measured where it will end up; `offset` grows by `offsetStep` for each next
 * part of the section, and `delay` (ms) staggers them the same way. `from` is the opacity a part
 * waits at.
 */
const STYLES = {
  // each photo, heading, the copy right under a heading and button rises in as it comes into view
  // (the call-outs); other paragraphs, e.g. fine print, stay put
  'animate-rise': {
    effect: 'rise',
    parts: {
      'picture img': 1000,
      ':is(h1, h2, h3, h4)': 500,
      ':is(h1, h2, h3, h4) + p:not(.button-wrapper)': 800,
      'a.button': 800,
    },
  },
  // the images fade in one after another
  'animate-fade': {
    effect: 'fade', parts: { 'picture img': 400 }, delay: 100, offset: 200, offsetStep: 50,
  },
  // the images wait dimmed and brighten one after another (the statement lines)
  'animate-brighten': {
    effect: 'fade', parts: { 'picture img': 400 }, from: 0.25, delay: 100, offset: 200, offsetStep: 50,
  },
  // the images rise 100px into place one after another (the stacked cups)
  'animate-fade-up': {
    effect: 'fade-up', parts: { 'picture img': 400 }, delay: 100, offset: 550,
  },
};

/** Selector for the sections this module animates. */
export const ANIMATED_SECTIONS = Object.keys(STYLES).map((style) => `.section.${style}`).join(', ');

/**
 * How far a hidden part sits below where it ends up.
 * @param {Element} part The part
 * @param {string} effect The part's effect
 * @returns {number} The drop in px
 */
function drop(part, effect) {
  if (effect === 'rise') return part.offsetHeight;
  return effect === 'fade-up' ? 100 : 0;
}

/**
 * Hides each part of the animated sections until it scrolls into view, then plays its effect once.
 * @param {Element} main The main element, with its sections loaded
 */
export default async function scrollAnimations(main) {
  const sections = [...main.querySelectorAll(ANIMATED_SECTIONS)];
  if (!sections.length || !('IntersectionObserver' in window)
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // the parts are hidden only once the styles that show them again are in
  await loadCSS(`${window.hlx.codeBasePath}/styles/scroll-animations.css`);
  sections.forEach((section) => {
    const rule = STYLES[Object.keys(STYLES).find((style) => section.classList.contains(style))];
    const parts = Object.entries(rule.parts)
      .flatMap(([selector, duration]) => [...section.querySelectorAll(selector)]
        .map((part) => [part, duration]));
    parts.forEach(([part, duration], index) => {
      // measured before the part is moved down
      const margin = drop(part, rule.effect) - (rule.offset || 0) - (rule.offsetStep || 0) * index;
      part.classList.add('scroll-animate', `scroll-animate-${rule.effect}`);
      part.style.setProperty('--scroll-animate-duration', `${duration}ms`);
      part.style.setProperty('--scroll-animate-delay', `${(rule.delay || 0) * index}ms`);
      if (rule.from) part.style.setProperty('--scroll-animate-from', rule.from);
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        part.classList.add('scroll-animate-shown');
      }, { rootMargin: `0px 0px ${margin}px 0px` });
      observer.observe(part);
    });
  });
}
