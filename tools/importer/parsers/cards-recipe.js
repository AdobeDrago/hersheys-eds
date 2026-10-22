/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-recipe. Base: cards (custom local block, blocks/cards-recipe/cards-recipe.js).
 * Source: https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html
 * Block contract: N rows x 2 cells: [recipe image | linked recipe title].
 *   Product pages ("Related Products"): variant cards-recipe (product), body adds the size line.
 *   Optional BV id per card as a "bvid: 990" paragraph in the body cell; when absent the
 *   block reads the `bvid` metadata of the linked recipe page. Ratings and prev/next
 *   controls are block-generated (not authored).
 * Source DOM (.card-container, tiny-slider carousel):
 *   ol.ais-RelatedProducts-list > li.ais-RelatedProducts-item (incl. tns loop clones)
 *     > a.item[href] > .cmp-feature-card__box
 *       .image-container img.card-image / .card-content .copy-container span.h4 (title)
 *       .review-container (BV inline rating; skipped)
 * Iteration is keyed on the li items (block-level wrappers), never on the inner anchors,
 * and de-duplicated by recipe URL so the slider's cloned slides are dropped.
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Same-site recipe URLs become root-relative paths. */
function toPath(href) {
  if (!href) return '';
  try {
    const u = new URL(href, 'https://www.hersheyland.com');
    if (/(^|\.)hersheyland\.com$/i.test(u.hostname)) return `${u.pathname}${u.search}${u.hash}`;
    return u.href;
  } catch (e) {
    return href;
  }
}

/** Reads a Bazaarvoice product id from the card, if the DOM exposes one. */
function findBvId(item) {
  const el = item.querySelector('[data-bv-product-id], [data-bv-productid], [data-product-id]');
  if (!el) return '';
  const v = el.getAttribute('data-bv-product-id') || el.getAttribute('data-bv-productid')
    || el.getAttribute('data-product-id') || '';
  return /^\d+$/.test(v.trim()) ? v.trim() : '';
}

export default function parse(element, { document }) {
  // Card wrappers (block-level li). Fallback: feature-card boxes.
  let items = [...element.querySelectorAll('li.ais-RelatedProducts-item')];
  if (!items.length) items = [...element.querySelectorAll('.cmp-feature-card__box, .cmp-feature-card')];

  const seen = new Set();
  const cells = [];

  items.forEach((item) => {
    const linkEl = item.querySelector('a[href]') || item.closest('a[href]');
    const href = toPath(linkEl ? linkEl.getAttribute('href') : '');
    // title element first: .copy-container also holds the product size line
    const titleEl = item.querySelector('.copy-container .h4, .card-content .h4, h3, h4')
      || item.querySelector('.copy-container');
    const title = clean(titleEl ? titleEl.textContent : '');
    if (!title && !href) return;

    const key = href || title;
    if (seen.has(key)) return; // tiny-slider loop clones
    seen.add(key);

    const img = [...item.querySelectorAll('img')].find((i) => {
      const src = i.getAttribute('src') || '';
      return src && !src.startsWith('data:') && !i.closest('.review-container');
    });
    let imageCell = '';
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || title;
      imageCell = image;
    }

    const body = [];
    const h3 = document.createElement('h3');
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = title || href;
      h3.append(a);
    } else {
      h3.textContent = title;
    }
    body.push(h3);

    // product cards (product pages): description line under the title, e.g. "52 oz bag, 145 pieces"
    const size = clean(item.querySelector('.bag-value')?.textContent);
    if (size) {
      const p = document.createElement('p');
      p.textContent = size;
      body.push(p);
    }

    const bvId = findBvId(item);
    if (bvId) {
      const p = document.createElement('p');
      p.textContent = `bvid: ${bvId}`;
      body.push(p);
    }

    cells.push([imageCell, body]);
  });

  if (!cells.length) {
    // Algolia renders the slider lazily (on scroll). If it never rendered, only the
    // non-authorable prev/next controls remain: drop them rather than leaking them.
    element.remove();
    return;
  }

  // Related Products on product pages use the same source card, in the "product" variant
  const isProduct = !!element.closest('.algolia-recommend')?.querySelector('.product-page');
  const name = isProduct ? 'cards-recipe (product)' : 'cards-recipe';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
