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
 *
 * `related` variant (`Cards (product, related)`): the rows are fetched from Algolia
 * instead of authored. It asks for the products related to this page's production
 * counterpart on www.hersheyland.com and links the cards to their production pages.
 * Authored rows stay in place if the request fails.
 */

const ALGOLIA = {
  appId: 'DQJUL6CPHC',
  apiKey: 'a6b8675cb5520e40ee6756581786eccd', // search-only key, public on hersheyland.com
  indexName: 'crawler_www.hersheyland.com',
};
const PRODUCTION = 'https://www.hersheyland.com';
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
 * @param {{href?: string, src: string, name: string, sizes: string[]}} product
 * @returns {HTMLLIElement}
 */
function buildCard({
  href, src, name, sizes,
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
  const item = document.createElement('li');
  item.append(card);
  return item;
}

async function fetchRelated() {
  const { pathname } = window.location;
  const objectID = `${PRODUCTION}${pathname.endsWith('.html') ? pathname : `${pathname}.html`}`;
  const resp = await fetch(`https://${ALGOLIA.appId}-dsn.algolia.net/1/indexes/*/recommendations`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA.appId,
      'X-Algolia-API-Key': ALGOLIA.apiKey,
    },
    body: JSON.stringify({
      requests: [{
        indexName: ALGOLIA.indexName,
        model: 'related-products',
        objectID,
        threshold: 0,
        maxRecommendations: MAX_RELATED,
        fallbackParameters: { facetFilters: ['metaTags.templateType:product-detail'] },
      }],
    }),
  });
  if (!resp.ok) throw new Error(`Algolia request failed with HTTP ${resp.status}`);
  const { results } = await resp.json();
  return (results?.[0]?.hits || []).filter((hit) => hit.hero?.image && hit.hero?.h1);
}

async function decorateRelated(block) {
  try {
    const hits = await fetchRelated();
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

    const sizes = [...bodyCell.querySelectorAll('p')]
      .map((p) => p.textContent.trim())
      .filter((text) => text && !BVID_LINE.test(text));
    list.append(buildCard({
      href: title.querySelector('a[href]')?.href,
      src: image.src,
      name: title.textContent.trim(),
      sizes,
    }));
  });
  block.replaceChildren(list);
  if (block.classList.contains('related')) return decorateRelated(block);
  return undefined;
}
