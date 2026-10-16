import { getMetadata, loadScript } from '../../scripts/aem.js';

const PS_SCRIPT = 'https://cdn.pricespider.com/1/lib/ps-widget.js';
const DEFAULT_CONFIG = '5d76722c77199200254ed1de';
const FALLBACK_DELAY = 8000;
const WATCH_LIMIT = 60000;

/* account-level settings ps-widget.js reads from <head>; page metadata wins */
const PS_META = {
  'ps-key': '2366-5f71878b223bcc002525bac4',
  'ps-country': 'US',
  'ps-language': 'en',
};

function ensureMeta() {
  Object.entries(PS_META).forEach(([name, content]) => {
    if (document.head.querySelector(`meta[name="${name}"]`)) return;
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
  });
}

/**
 * PriceSpider renders into a shadow root on the mount element.
 * @param {Element} mount
 * @returns {boolean}
 */
function isRendered(mount) {
  return Boolean((mount.shadowRoot && mount.shadowRoot.childElementCount)
    || mount.childElementCount);
}

function buildFallback() {
  const fallback = document.createElement('div');
  fallback.className = 'where-to-buy-fallback';
  const heading = document.createElement('h2');
  heading.textContent = 'Where to Buy';
  const message = document.createElement('p');
  message.textContent = 'The store locator couldn\'t be loaded right now. Please refresh the page or try again later.';
  fallback.append(heading, message);
  return fallback;
}

/**
 * PriceSpider (Wayvia) Where to Buy store locator.
 * Builds the `.ps-widget` mount and loads ps-widget.js, which renders into it.
 * The product comes from the page URL (`?ps-sku=`, set by Shop Now links).
 * @param {Element} widget The widget element (data-config from the authored link)
 */
export default async function decorate(widget) {
  const config = widget.dataset.config || getMetadata('ps-config') || DEFAULT_CONFIG;
  const sku = new URLSearchParams(window.location.search).get('ps-sku') || '';

  const mount = document.createElement('div');
  mount.className = 'ps-widget';
  mount.setAttribute('ps-config', config);
  mount.setAttribute('ps-sku', sku);
  widget.replaceChildren(mount);

  ensureMeta();
  const fallback = buildFallback();
  try {
    await loadScript(PS_SCRIPT);
    // already loaded (e.g. second widget on the page): rescan for new mounts
    if (window.PriceSpider && typeof window.PriceSpider.rebind === 'function') {
      window.PriceSpider.rebind();
    }
  } catch {
    widget.append(fallback);
    // eslint-disable-next-line no-console
    console.warn('where-to-buy widget: PriceSpider script did not load (blocked or unreachable)');
    return;
  }

  const started = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - started;
    if (isRendered(mount)) {
      fallback.remove();
      clearInterval(timer);
      return;
    }
    if (elapsed >= FALLBACK_DELAY && !fallback.isConnected) {
      widget.append(fallback);
      // eslint-disable-next-line no-console
      console.warn('where-to-buy widget: PriceSpider loaded but did not render (check config id / domain allowlist)');
    }
    if (elapsed >= WATCH_LIMIT) clearInterval(timer);
  }, 1000);
}
