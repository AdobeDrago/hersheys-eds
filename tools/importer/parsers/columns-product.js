/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-product. Base: columns.
 * Source: https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html
 * Block contract (blocks/columns-product): 1 row x 2 cells.
 *   Cell 1: product images (main gallery images, once each).
 *   Cell 2: h1, "Choose a size:" paragraph, list of sizes (current size first, bold, unlinked),
 *           description paragraph, "Shop Now" link paragraph.
 * Source DOM (.product-grid):
 *   div.details.hidden-desktop (mobile duplicate of h1 + rating) - skipped
 *   div.image-carousel > .product-image .hershey-slider__slide > img.main-img (main gallery)
 *                      > .product-thumbs (thumbnail duplicates) - skipped
 *   div.details:not(.hidden-desktop) > .details-content > h1, .sizes a, .product-details p, a.buy-now
 * Scene7 images are emitted as plain <img>; the DM transformer converts them afterwards.
 */
export default function parse(element, { document }) {
  // ---- Cell 1: images (main slider only; dedupe by src to drop tiny-slider clones) ----
  let imgs = [...element.querySelectorAll('.product-image .hershey-slider__slide img, .product-image img.main-img')];
  if (!imgs.length) imgs = [...element.querySelectorAll('.image-carousel img.main-img, .image-carousel .product-image img')];
  if (!imgs.length) {
    // fallback: any image outside thumbnails / ratings
    imgs = [...element.querySelectorAll('.image-carousel img, img')]
      .filter((img) => !img.closest('.product-thumbs, .rating, [class*="bv_"]'));
  }
  const seenSrc = new Set();
  const mediaCell = [];
  imgs.forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src || seenSrc.has(src.split('?')[0])) return;
    seenSrc.add(src.split('?')[0]);
    const out = document.createElement('img');
    out.src = src;
    out.alt = img.getAttribute('alt') || '';
    mediaCell.push(out);
  });

  // ---- Cell 2: details (desktop details panel; falls back to any details panel) ----
  const details = element.querySelector('.details:not(.hidden-desktop) .details-content')
    || element.querySelector('.details:not(.hidden-desktop)')
    || element.querySelector('.details-content')
    || element;

  const detailsCell = [];

  // Heading: single h1 (source duplicates it for mobile/desktop)
  const srcH1 = details.querySelector('h1') || element.querySelector('h1, h2');
  if (srcH1) {
    const h1 = document.createElement('h1');
    const clone = srcH1.cloneNode(true);
    clone.querySelectorAll('.eyebrow').forEach((e) => { if (!e.textContent.trim()) e.remove(); });
    h1.innerHTML = clone.innerHTML.replace(/\s+/g, ' ').trim();
    detailsCell.push(h1);
  }

  // Sizes
  const sizeLinks = [...details.querySelectorAll('.sizes a')];
  if (sizeLinks.length) {
    const label = document.createElement('p');
    label.textContent = 'Choose a size:';
    detailsCell.push(label);

    const ul = document.createElement('ul');
    const current = sizeLinks.filter((a) => a.classList.contains('default-size') || !a.getAttribute('href'));
    const others = sizeLinks.filter((a) => !current.includes(a));
    [...current, ...others].forEach((a) => {
      const text = a.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const li = document.createElement('li');
      if (current.includes(a)) {
        const strong = document.createElement('strong');
        strong.textContent = text;
        li.append(strong);
      } else {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = text;
        li.append(link);
      }
      ul.append(li);
    });
    detailsCell.push(ul);
  }

  // Description
  const descNodes = [...details.querySelectorAll('.product-details p')];
  if (!descNodes.length) {
    const d = details.querySelector('.product-details');
    if (d && d.textContent.trim()) descNodes.push(d);
  }
  descNodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const p = document.createElement('p');
    p.innerHTML = node.innerHTML.trim();
    detailsCell.push(p);
  });

  // CTA
  const cta = details.querySelector('a.buy-now') || element.querySelector('a.buy-now, a[href*="where-to-buy"]');
  if (cta) {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = cta.getAttribute('href');
    link.textContent = cta.textContent.replace(/\s+/g, ' ').trim() || 'Shop Now';
    p.append(link);
    detailsCell.push(p);
  }

  if (!mediaCell.length && !detailsCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[mediaCell.length ? mediaCell : '', detailsCell.length ? detailsCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-product', cells });
  element.replaceWith(block);
}
