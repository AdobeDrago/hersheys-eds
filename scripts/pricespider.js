import { getMetadata, loadScript } from './aem.js';

/* PriceSpider (Wayvia) where-to-buy */
export const PRICESPIDER_CDN = 'https://cdn.pricespider.com/1';
export const PRICESPIDER_LOADER = `${PRICESPIDER_CDN}/lib/ps-widget.js`;

const WHERE_TO_BUY = '/where-to-buy';
const WHERE_TO_BUY_PATH = /\/where-to-buy(?:\.html)?\/?$/i;

/* account settings, as rendered into <head> on hersheyland.com product pages */
const SETTINGS = {
  'ps-key': '2366-5f71878b223bcc002525bac4',
  'ps-country': 'US',
  'ps-language': 'en',
  'ps-library': 'omni,widget,wtb4',
  'ps-token': '128fec6d7f8b49a1816e216e7a40afb8',
};

/**
 * Adds a resource hint to <head> once.
 * @param {string} rel e.g. preconnect, preload, prefetch, prerender
 * @param {string} href
 * @param {string} [as] destination for preload
 */
function addResourceHint(rel, href, as) {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  document.head.append(link);
}

/** Where-to-buy page: connect to PriceSpider and fetch its loader early. */
export function warmUp() {
  addResourceHint('preconnect', new URL(PRICESPIDER_CDN).origin);
  addResourceHint('preload', PRICESPIDER_LOADER, 'script');
}

/**
 * Product pages: Shop Now goes to /where-to-buy?ps-sku=<GTIN>, the loader is
 * prefetched, the where-to-buy page prerendered and PriceSpider loaded.
 * Falls back to the page's `bvid` metadata when the link has no ps-sku.
 * @param {Element} main
 */
export default function decorateShopNow(main) {
  let target = '';
  main.querySelectorAll('a[href]').forEach((link) => {
    const url = new URL(link.href, window.location.href);
    if (!WHERE_TO_BUY_PATH.test(url.pathname)) return;
    const sku = url.searchParams.get('ps-sku') || getMetadata('bvid');
    if (!sku) return;
    link.href = `${WHERE_TO_BUY}?ps-sku=${encodeURIComponent(sku)}`;
    if (!target) target = link.getAttribute('href');
  });
  if (!target) return;

  addResourceHint('prefetch', PRICESPIDER_LOADER);
  addResourceHint('prerender', target);
  Object.entries(SETTINGS).forEach(([name, content]) => {
    if (getMetadata(name)) return;
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
  });
  loadScript(PRICESPIDER_LOADER, { async: '' });
}
