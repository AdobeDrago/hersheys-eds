import { whenActivated } from '../../scripts/scripts.js';
import { hasConsent } from '../../scripts/consent-state.js';

const widgetSrc = '//cdn.pricespider.com/1/lib/ps-widget.js';
// PriceSpider's tracking-id script sets ps-utid cookies; the widget renders without it
const TRACKING_SRC = '//cdn.pricespider.com/1/2366/ps-utid.js';
const FALLBACK_DELAY = 15000;
const WATCH_LIMIT = 60000;

/**
 * PriceSpider renders retailer links into a shadow root. The root and its styles can exist
 * while the widget stays empty (e.g. on a domain PriceSpider doesn't serve), so look for links.
 * @param {Element} target The `.ps-widget` element
 * @returns {boolean}
 */
function isRendered(target) {
  return Boolean(target.shadowRoot && target.shadowRoot.querySelector('a, button'));
}

function buildFallback() {
  const fallback = document.createElement('div');
  fallback.className = 'where-to-buy-fallback';
  const message = document.createElement('p');
  message.textContent = 'Where to Buy couldn\'t be loaded right now. Please refresh the page or try again later.';
  fallback.append(message);
  return fallback;
}

/**
 * Shows the fallback if PriceSpider fails to load or hasn't rendered in time,
 * and removes it once the widget renders.
 * @param {Element} widget
 * @param {Element} target
 * @param {HTMLScriptElement} loader The ps-widget.js script element
 */
function watchFallback(widget, target, loader) {
  const fallback = buildFallback();
  const show = () => {
    if (fallback.isConnected || isRendered(target)) return;
    widget.prepend(fallback);
    // eslint-disable-next-line no-console
    console.warn('where-to-buy widget: PriceSpider did not render (blocked, unreachable or domain not allowed)');
  };
  loader.addEventListener('error', show);
  const started = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - started;
    if (isRendered(target)) {
      fallback.remove();
      clearInterval(timer);
      return;
    }
    if (elapsed >= FALLBACK_DELAY) show();
    if (elapsed >= WATCH_LIMIT) clearInterval(timer);
  }, 1000);
}

function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.append(script);
  return script;
}

/**
 * Loads the tracking-id script once the visitor allows Performance cookies,
 * now or when they consent later (OneTrust usually loads after this widget).
 */
function loadTrackingWithConsent() {
  if (hasConsent()) {
    loadScript(TRACKING_SRC);
    return;
  }
  const onUpdate = ({ detail }) => {
    if (!detail || !detail.consented) return;
    window.removeEventListener('consent.update', onUpdate);
    loadScript(TRACKING_SRC);
  };
  window.addEventListener('consent.update', onUpdate);
}

/**
 * Removes the tracking-id cookies when the visitor withdraws consent.
 * ps-utid.js sets them once, from a `utid` URL parameter, with path=/ and domain=<hostname>.
 */
function clearTrackingOnWithdrawal() {
  window.addEventListener('consent.update', ({ detail }) => {
    if (!detail || detail.consented) return;
    ['ps-utid', 'ps-utparam'].forEach((name) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    });
  });
}

/**
 * Where-to-buy widget. The SKU comes from the `ps-sku` query param (set by Shop Now)
 * and the PriceSpider config id from the authored widget link (`?config=`).
 * Shows a fallback message if PriceSpider doesn't render.
 * @param {Element} widget The widget block element
 */
export default function decorate(widget) {
  const target = widget.querySelector('.ps-widget');
  const sku = new URLSearchParams(window.location.search).get('ps-sku');
  if (sku) target.setAttribute('ps-sku', sku);
  if (widget.dataset.config) target.setAttribute('ps-config', widget.dataset.config);

  // a prerendered (speculatively loaded) page runs no vendor code until it is shown
  whenActivated().then(() => {
    [['preload', 'script'], ['dns-prefetch'], ['preconnect']].forEach(([rel, as]) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = widgetSrc;
      if (as) link.as = as;
      if (rel === 'preconnect') link.crossOrigin = '';
      document.head.append(link);
    });

    watchFallback(widget, target, loadScript(widgetSrc));
    loadTrackingWithConsent();
    clearTrackingOnWithdrawal();
  });
}
