/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget. Base: widget (existing local block, blocks/widget/widget.js).
 * Source: https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html
 * Block contract: 1 row, 1 cell with a single link to /widgets/{path}/{name}.html; query params
 * become data-* attributes on the block. Here: /widgets/bazaarvoice/reviews.html?productId={bvId}.
 * Source DOM: div.ratings-and-reviews > div#bv-rating-and-review-section (empty; BV injects at runtime).
 * bvId is derived from the page, in priority order:
 *   1. <meta name="bvId"> (head)
 *   2. BV data attributes (data-bv-product-id / data-bv-productid / data-product-id)
 *   3. JSON-LD Product gtin14 / sku
 *   4. ps-sku query param of the "Shop Now" (where-to-buy) link
 */
function findBvId(element, document) {
  const meta = document.querySelector('meta[name="bvId"], meta[name="bvid"], meta[name="bv-id"], meta[property="bvId"]');
  const fromMeta = meta && meta.getAttribute('content');
  if (fromMeta && fromMeta.trim()) return fromMeta.trim();

  const attrs = ['data-bv-product-id', 'data-bv-productid', 'data-product-id'];
  const scope = [element, document];
  for (const root of scope) {
    for (const attr of attrs) {
      const el = root.querySelector(`[${attr}]`);
      const v = el && el.getAttribute(attr);
      if (v && v.trim()) return v.trim();
    }
  }

  const ldScripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  for (const s of ldScripts) {
    try {
      const data = JSON.parse(s.textContent);
      const list = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const item of list) {
        if (item && /product/i.test(item['@type'] || '')) {
          if (item.gtin14) return String(item.gtin14);
          if (item.sku) return String(item.sku).split('-')[0];
        }
      }
    } catch (e) { /* ignore malformed JSON-LD */ }
  }

  const wtb = document.querySelector('a[href*="ps-sku="]');
  if (wtb) {
    const m = wtb.getAttribute('href').match(/[?&]ps-sku=([^&#]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return '';
}

export default function parse(element, { document }) {
  const bvId = findBvId(element, document);
  if (!bvId) {
    // No product id: nothing to render the reviews widget for.
    element.replaceWith(...element.childNodes);
    return;
  }

  const href = `/widgets/bazaarvoice/reviews.html?productId=${encodeURIComponent(bvId)}`;
  const link = document.createElement('a');
  link.href = href;
  link.textContent = href;

  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  element.replaceWith(block);
}
