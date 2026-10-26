import { getMetadata } from '../../scripts/aem.js';
import { whenActivated } from '../../scripts/scripts.js';

const FALLBACK_DELAY = 8000;
const FALLBACK_CEILING = 15000;
const WATCH_LIMIT = 60000;
const SECTIONS = ['reviews', 'questions'];

/**
 * Returns the `[data-bv-show]` container for a section, creating it if missing.
 * @param {Element} widget
 * @param {string} show Bazaarvoice component name
 * @returns {Element}
 */
function ensureSection(widget, show) {
  let section = widget.querySelector(`[data-bv-show="${show}"]`);
  if (!section) {
    section = document.createElement('div');
    section.className = `reviews-section reviews-${show}`;
    section.dataset.bvShow = show;
    widget.append(section);
  }
  return section;
}

/**
 * Bazaarvoice renders into a shadow root (reviews) or light DOM (questions).
 * @param {Element} section
 * @returns {boolean}
 */
function isRendered(section) {
  return Boolean((section.shadowRoot && section.shadowRoot.childElementCount)
    || section.childElementCount);
}

function buildFallback() {
  const fallback = document.createElement('div');
  fallback.className = 'reviews-fallback';
  const heading = document.createElement('h2');
  heading.textContent = 'Ratings & Reviews';
  const message = document.createElement('p');
  message.textContent = 'Ratings, reviews and questions couldn\'t be loaded right now. Please refresh the page or try again later.';
  fallback.append(heading, message);
  return fallback;
}

/**
 * Shows the fallback if Bazaarvoice hasn't rendered in time, and removes it once it does.
 * @param {Element} widget
 * @param {Element[]} sections
 * @param {Element} fallback
 */
function watchFallback(widget, sections, fallback) {
  const started = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - started;
    if (sections.some(isRendered)) {
      fallback.remove();
      clearInterval(timer);
      return;
    }
    // bv.js loads in the delayed phase: time it from its request, with a ceiling
    // in case the delayed chain never runs
    const requestedAt = window.hlx && window.hlx.bvRequestedAt;
    const timedOut = requestedAt
      ? Date.now() - requestedAt >= FALLBACK_DELAY
      : elapsed >= FALLBACK_CEILING;
    if (timedOut && !fallback.isConnected) {
      widget.prepend(fallback);
      // eslint-disable-next-line no-console
      console.warn(window.BV
        ? 'reviews widget: Bazaarvoice loaded but did not render reviews (check product id / domain allowlist)'
        : 'reviews widget: Bazaarvoice script did not load (blocked or unreachable)');
    }
    if (elapsed >= WATCH_LIMIT) clearInterval(timer);
  }, 1000);
}

/**
 * Bazaarvoice ratings & reviews and Q&A.
 * Prepares the `[data-bv-show]` containers; bv.js itself is loaded from
 * scripts/delayed.js (see scripts/bazaarvoice.js).
 * Shows an always-visible fallback if Bazaarvoice doesn't render.
 * @param {Element} widget The widget element (data-product-id from the authored link)
 */
export default function decorate(widget) {
  const fallback = buildFallback();
  const productId = widget.dataset.productId || getMetadata('bvid');
  if (!productId) {
    widget.replaceChildren(fallback);
    // eslint-disable-next-line no-console
    console.warn('reviews widget: no Bazaarvoice product id');
    return;
  }

  const sections = SECTIONS.map((show) => ensureSection(widget, show));
  sections.forEach((section) => {
    section.dataset.bvProductId = productId;
  });

  // time from activation: a prerendered page doesn't request bv.js until it is shown
  whenActivated().then(() => watchFallback(widget, sections, fallback));
}
