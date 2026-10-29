import fetchRelated, { PRODUCTION } from '../../scripts/algolia-recommend.js';
import { absoluteUrl } from '../../scripts/recipes-search.js';

/**
 * Cards (recipes) variant, loaded by cards.js for an empty `Cards (slider, related, recipes)`:
 * "You Might Also Enjoy..." on recipe pages.
 *
 * Authored rows take precedence and are decorated by cards.js like any slider card. Only when
 * no card is authored are the cards fetched from Algolia: the recipes related to this page's
 * production counterpart on www.hersheyland.com, linking to their production pages. Each card
 * gets a Bazaarvoice inline rating when the record has a `bvID`.
 *
 * The block should sit in its own section with the heading and "View All Recipes" button:
 * when nothing can be shown, that section is hidden rather than leaving a heading without cards.
 */

// hersheyland.com shows 3 per page and loops clones of them; 6 distinct recipes give the
// desktop slider a second page without duplicate links
const MAX_RELATED = 6;

/**
 * @param {object} hit Algolia record
 * @returns {HTMLLIElement|null}
 */
function buildCard(hit) {
  const href = absoluteUrl(hit.url?.href || hit.url?.path, PRODUCTION);
  const src = absoluteUrl(hit.hero?.image || hit.hero?.images?.fullsize?.[0], PRODUCTION);
  const title = (hit.hero?.h1 || hit.title || '').trim();
  if (!href || !src || !title) return null;

  const image = document.createElement('div');
  image.className = 'cards-card-image';
  const imageLink = document.createElement('a');
  imageLink.href = href;
  imageLink.setAttribute('aria-label', title);
  const img = document.createElement('img');
  img.src = src;
  img.alt = ''; // the link is labelled by the title
  img.loading = 'lazy';
  img.decoding = 'async';
  imageLink.append(img);
  image.append(imageLink);

  const body = document.createElement('div');
  body.className = 'cards-card-body';
  const heading = document.createElement('h3');
  const link = document.createElement('a');
  link.href = href;
  link.textContent = title;
  heading.append(link);
  body.append(heading);
  const bvID = hit.metaTags?.bvID;
  if (bvID) {
    const rating = document.createElement('div');
    rating.className = 'cards-recipes-rating';
    rating.dataset.bvShow = 'inline_rating';
    rating.dataset.bvProductId = bvID;
    body.append(rating);
  }

  const item = document.createElement('li');
  item.append(image, body);
  return item;
}

/**
 * @param {Element} block
 * @returns {Promise<HTMLLIElement[]>} the cards; empty when none could be loaded
 */
export default async function decorateRecipes(block) {
  let cards = [];
  try {
    const hits = await fetchRelated({ templateType: 'recipe-detail', max: MAX_RELATED });
    cards = hits.map(buildCard).filter(Boolean);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Related recipes failed to load', error);
  }
  if (!cards.length) {
    const section = block.closest('.section');
    if (section) section.hidden = true;
    return cards;
  }
  // delayed.js loads Bazaarvoice for ratings already on the page; these came later
  if (window.hlx?.delayedLoaded && cards.some((card) => card.querySelector('[data-bv-show]'))) {
    import('../../scripts/bazaarvoice.js').then(({ default: loadBazaarvoice }) => loadBazaarvoice());
  }
  return cards;
}
