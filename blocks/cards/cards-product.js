const IMAGE_LINK = /\/is\/image\/|\.(?:png|jpe?g|webp|avif|gif)(?:[?#]|$)/i;
const BVID_LINE = /^bvid\s*:/i;

/**
 * Cards (product) variant, loaded by cards.js for `Cards (product)`.
 *
 * Content model: one row per product, 2 cells.
 *   Cell 1: product image (picture, or a link to an image, e.g. Scene7).
 *   Cell 2: h3 product name linking to the product page, then a size paragraph.
 *   A `bvid: <gtin>` paragraph is tolerated (rating data) and not shown.
 * The whole card links to the product page.
 */

/**
 * @param {Element} cell
 * @returns {{src: string, alt: string}|null}
 */
function imageFrom(cell) {
  const img = cell.querySelector('img');
  if (img) return { src: img.currentSrc || img.src, alt: img.alt };
  const link = [...cell.querySelectorAll('a[href]')].find((a) => IMAGE_LINK.test(a.href));
  return link ? { src: link.href, alt: link.textContent.trim() } : null;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [mediaCell, bodyCell] = [...row.children];
    const title = bodyCell?.querySelector('h1, h2, h3, h4, h5, h6');
    const image = mediaCell && imageFrom(mediaCell);
    if (!title || !image) return;

    const card = document.createElement('a');
    card.className = 'cards-product-card';
    const href = title.querySelector('a[href]')?.href;
    if (href) card.href = href;

    const media = document.createElement('div');
    media.className = 'cards-product-image';
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = ''; // the product name below labels the link
    img.loading = 'lazy';
    media.append(img);

    const body = document.createElement('div');
    body.className = 'cards-product-body';
    const name = document.createElement('h3');
    name.textContent = title.textContent.trim();
    body.append(name);
    [...bodyCell.querySelectorAll('p')].forEach((p) => {
      const text = p.textContent.trim();
      if (!text || BVID_LINE.test(text)) return;
      const size = document.createElement('p');
      size.className = 'cards-product-size';
      size.textContent = text;
      body.append(size);
    });

    card.append(media, body);
    const item = document.createElement('li');
    item.append(card);
    list.append(item);
  });
  block.replaceChildren(list);
}
