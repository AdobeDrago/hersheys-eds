import fetchRelated from '../../scripts/algolia-recommend.js';

const IMAGE_LINK = /\/is\/image\/|\.(?:png|jpe?g|webp|avif|gif)(?:[?#]|$)/i;
const BVID_LINE = /^bvid\s*:/i;

/**
 * Cards (product) variant, loaded by cards.js for `Cards (product)`.
 *
 * Content model: one row per product, 2 cells.
 *   Cell 1: product image (picture, or a link to an image, e.g. Scene7).
 *   Cell 2: h3 product name linking to the product page, then a size paragraph. A paragraph
 *   before the name is a badge over the photo (e.g. `Seasonal` or `Limited Edition`, which get
 *   their icon; any other text shows without one).
 *   A `bvid: <gtin>` paragraph is tolerated (rating data) and not shown.
 * The whole card links to the product page.
 *
 * `related` variant (`Cards (product, related)`): authored rows take precedence. Only when
 * no card is authored (no row with both an image and a heading) are the rows fetched from
 * Algolia: the products related to this page's production counterpart on
 * www.hersheyland.com, linking to their production pages.
 */

const MAX_RELATED = 4;

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

/**
 * The badge over a product photo, e.g. "Seasonal" with a snowflake as on /kisses.
 * @param {string} text
 * @returns {HTMLParagraphElement}
 */
function buildTag(text) {
  const tag = document.createElement('p');
  tag.className = 'cards-product-tag';
  if (/seasonal/i.test(text)) tag.classList.add('cards-product-tag-seasonal');
  if (/limited\s*edition/i.test(text)) tag.classList.add('cards-product-tag-limited-edition');
  const icon = document.createElement('span');
  icon.className = 'cards-product-tag-icon';
  icon.setAttribute('aria-hidden', 'true');
  tag.append(icon, text);
  return tag;
}

/**
 * @param {{href?: string, src: string, name: string, sizes: string[], tag?: string}} product
 * @returns {HTMLLIElement}
 */
function buildCard({
  href, src, name, sizes, tag,
}) {
  const card = document.createElement('a');
  card.className = 'cards-product-card';
  if (href) card.href = href;

  const media = document.createElement('div');
  media.className = 'cards-product-image';
  const img = document.createElement('img');
  img.src = src;
  img.alt = ''; // the product name below labels the link
  img.loading = 'lazy';
  media.append(img);

  const body = document.createElement('div');
  body.className = 'cards-product-body';
  const heading = document.createElement('h3');
  heading.textContent = name;
  body.append(heading);
  sizes.forEach((text) => {
    const size = document.createElement('p');
    size.className = 'cards-product-size';
    size.textContent = text;
    body.append(size);
  });

  card.append(media, body);
  if (tag) card.append(buildTag(tag));
  const item = document.createElement('li');
  item.append(card);
  return item;
}

async function decorateRelated(block) {
  try {
    const hits = (await fetchRelated({ templateType: 'product-detail', max: MAX_RELATED }))
      .filter((hit) => hit.hero?.image && hit.hero?.h1);
    if (!hits.length) return;
    const list = document.createElement('ul');
    hits.forEach((hit) => list.append(buildCard({
      href: hit.url.href,
      src: hit.hero.image,
      name: hit.hero.h1,
      sizes: hit.hero.portion ? [hit.hero.portion] : [],
    })));
    block.replaceChildren(list);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Related products failed to load', error);
  }
}

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [mediaCell, bodyCell] = [...row.children];
    const title = bodyCell?.querySelector('h1, h2, h3, h4, h5, h6');
    const image = mediaCell && imageFrom(mediaCell);
    if (!title || !image) return;

    const paragraphs = [...bodyCell.querySelectorAll('p')];
    // a paragraph before the name is the badge; the ones after are sizes
    // eslint-disable-next-line no-bitwise
    const before = (p) => title.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING;
    const sizes = paragraphs.filter((p) => !before(p))
      .map((p) => p.textContent.trim())
      .filter((text) => text && !BVID_LINE.test(text));
    const tag = paragraphs
      .find((p) => before(p) && !BVID_LINE.test(p.textContent.trim()))?.textContent.trim();
    list.append(buildCard({
      href: title.querySelector('a[href]')?.href,
      src: image.src,
      name: title.textContent.trim(),
      sizes,
      tag,
    }));
  });
  block.replaceChildren(list);
  // related: authored cards win; Algolia only fills a block without any
  if (block.classList.contains('related') && !list.children.length) return decorateRelated(block);
  return undefined;
}
