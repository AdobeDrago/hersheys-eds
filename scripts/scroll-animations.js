import { loadCSS } from './aem.js';

/*
 * Scroll animations: a section with an `animate-*` Section Metadata style animates its parts in,
 * once, as they scroll into view, as hersheyland.com does (measured on /brands/reeses/oreo-cup).
 * The effects are in styles/scroll-animations.css:
 * - `rise`: fades in while rising its own height (animate.css fadeInUp on hersheyland.com)
 * - `fade` and `fade-up` (rises 100px): AOS fade and fade-up on hersheyland.com
 * - `come-in`: the whole content of the section (not its band) fades in together over 1s as the
 *   section comes into view, once (the `come-in` keyframes on hersheyland.com's brand sliders and
 *   recipe lists)
 * Presets, one style each, are the call-outs on /hersheys as they are tuned on hersheyland.com
 * (the parts hide again once they scroll back below the viewport, so they animate in each time
 * they come up into view):
 * - `animate-callout`: photo, heading, copy and button rise in
 * - `animate-callout-article`: as `animate-callout` with a 500ms photo and a 3000ms text link
 *   (the article-style call-out, "Discover the Hershey Legacy")
 * - `animate-callout-secondary`: as `animate-callout` with a 1000ms text link
 * - `animate-callout-text`: as `animate-callout` without the photo (it stays put), the SOUR STRIPS
 *   recipe call-outs
 * - `animate-callout-button`: only the button rises in (the CADBURY "Grab Your Bag" call-out)
 * Extra Section Metadata styles can still tune a section: `animate-photo-<ms>` sets the photos'
 * duration, `animate-secondary-<ms>` the text links', and `animate-replay` makes the parts
 * animate in each time they come up into view (otherwise they animate once).
 * `parts` maps selectors to each one's duration (ms). A part starts once its top is `offset` px
 * into the viewport, measured where it will end up; `offset` grows by `offsetStep` for each next
 * part of the section, and `delay` (ms) staggers them the same way. `from` is the opacity a part
 * waits at.
 */
const CALLOUT = {
  effect: 'rise',
  parts: {
    'picture img': 1000,
    ':is(h1, h2, h3, h4)': 500,
    ':is(h1, h2, h3, h4) + p:not(.button-wrapper)': 800,
    'a.button': 800,
  },
  replay: true,
  // a part starts once the whole of it is in view (its bottom edge reaches the viewport's), as the
  // call-outs on hersheyland.com/hersheys do, so the rise is seen
  fullyInView: true,
};

// the same without the photo
const { 'picture img': photo, ...TEXT_PARTS } = CALLOUT.parts;

const STYLES = {
  'animate-callout': CALLOUT,
  'animate-callout-text': { ...CALLOUT, parts: TEXT_PARTS },
  'animate-callout-button': { ...CALLOUT, parts: { 'a.button': CALLOUT.parts['a.button'] } },
  'animate-callout-article': {
    ...CALLOUT, durations: { 'picture img': 500, 'a.button.secondary': 3000 },
  },
  'animate-callout-secondary': { ...CALLOUT, durations: { 'a.button.secondary': 1000 } },
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
  // the section's content fades in as one, over 1s (the brand sliders and recipes on /hersheys)
  'animate-come-in': { effect: 'fade', group: true, parts: { ':scope > *': 1000 } },
  // the images rise 100px into place one after another (the stacked cups)
  'animate-fade-up': {
    effect: 'fade-up', parts: { 'picture img': 400 }, delay: 100, offset: 550,
  },
};

// styles that change one kind of part's duration: [style pattern, the parts' selector]
const DURATIONS = [
  [/^animate-photo-(\d+)$/, 'picture img'],
  [/^animate-secondary-(\d+)$/, 'a.button.secondary'],
];

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
 * Hides each part of the animated sections until it scrolls into view, then plays its effect (once,
 * or each time it comes back into view with `animate-replay`).
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
    const replay = rule.replay || section.classList.contains('animate-replay');
    const timed = { ...rule.parts, ...rule.durations };
    DURATIONS.forEach(([pattern, selector]) => {
      const match = [...section.classList].map((name) => name.match(pattern)).find(Boolean);
      if (match) timed[selector] = Number(match[1]);
    });
    // a part that several selectors match keeps the last one's duration
    const parts = new Map();
    Object.entries(timed).forEach(([selector, duration]) => {
      section.querySelectorAll(selector).forEach((part) => parts.set(part, duration));
    });
    if (rule.group) {
      // the parts start together, when the first one that has a box (a heading wrapper that lays
      // out through its parent has none) comes into view
      const items = [...parts.keys()];
      items.forEach((part) => {
        part.classList.add('scroll-animate', `scroll-animate-${rule.effect}`);
        part.style.setProperty('--scroll-animate-duration', `${parts.get(part)}ms`);
      });
      const observer = new IntersectionObserver((entries) => {
        if (!entries[entries.length - 1].isIntersecting) return;
        items.forEach((part) => part.classList.add('scroll-animate-shown'));
        observer.disconnect();
      });
      observer.observe(items.find((part) => part.getClientRects().length) || items[0]);
      return;
    }
    [...parts].forEach(([part, duration], index) => {
      // measured before the part is moved down
      const margin = rule.fullyInView
        ? 0 : drop(part, rule.effect) - (rule.offset || 0) - (rule.offsetStep || 0) * index;
      part.classList.add('scroll-animate', `scroll-animate-${rule.effect}`);
      part.style.setProperty('--scroll-animate-duration', `${duration}ms`);
      part.style.setProperty('--scroll-animate-delay', `${(rule.delay || 0) * index}ms`);
      if (rule.from) part.style.setProperty('--scroll-animate-from', rule.from);
      const observer = new IntersectionObserver((entries) => {
        if (!entries[entries.length - 1].isIntersecting) return;
        part.classList.add('scroll-animate-shown');
        if (!replay) observer.disconnect();
      }, { rootMargin: `0px 0px ${margin}px 0px` });
      observer.observe(part);
      if (!replay) return;
      // as on hersheyland.com, a part is hidden again as soon as its top is back below the viewport
      new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry.isIntersecting && entry.boundingClientRect.top >= window.innerHeight) {
          part.classList.remove('scroll-animate-shown');
        }
      }).observe(part);
    });
  });
}
