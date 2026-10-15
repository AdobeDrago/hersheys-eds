import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards (Recipe) block: horizontally scrolling slider of related recipe tiles.
 *
 * Content model: N rows x 2 cells: [recipe image | linked recipe title].
 *   The title may be a paragraph or heading containing the recipe link.
 *   Optional: a Bazaarvoice id as an extra cell/paragraph ("990" or "bvid: 990"),
 *   or as a `bvid` query parameter on the recipe link.
 * Rating: a Bazaarvoice inline rating per card. When no id is authored, the id is read
 * from the `bvid` metadata of the linked (same-origin) recipe page once the block nears
 * the viewport. bv.js is loaded through /scripts/bazaarvoice.js.
 */

const BV_ID = /^\s*(?:bv\s*-?\s*id\s*[:=]?\s*)?(\d+)\s*$/i;

/**
 * Re-renders a picture as an optimized picture when the image is served from this origin.
 * @param {HTMLPictureElement} picture
 */
function optimize(picture) {
  const img = picture.querySelector('img');
  if (!img || !img.src) return;
  if (!img.hasAttribute('alt')) img.alt = '';
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin) {
    // external (e.g. DAM-hosted) images cannot be re-rendered; keep them lazy
    img.loading = 'lazy';
    img.decoding = 'async';
    return;
  }
  picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
}

/**
 * Returns true when a cell contains only pictures (and empty wrappers).
 * @param {Element} cell
 */
function isImageCell(cell) {
  if (!cell.querySelector('picture')) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return clone.textContent.trim() === '';
}

/**
 * Reads the `bvid` meta tag of a same-origin page.
 * @param {string} href
 * @returns {Promise<string>}
 */
async function fetchBvId(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return '';
    const resp = await fetch(url.pathname);
    if (!resp.ok) return '';
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const meta = doc.querySelector('meta[name="bvid"], meta[name="bv-id"]');
    return meta ? meta.content.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Adds the Bazaarvoice inline rating container to a card.
 * @param {HTMLElement} rating placeholder element
 * @param {string} productId
 */
function setRating(rating, productId) {
  rating.dataset.bvShow = 'inline_rating';
  rating.dataset.bvProductId = productId;
}

/**
 * Resolves ratings for every card, then loads Bazaarvoice.
 * @param {Array<{ rating: HTMLElement, id: string, href: string }>} cards
 */
async function resolveRatings(cards) {
  const resolved = await Promise.all(cards.map(async (card) => {
    const id = card.id || (card.href ? await fetchBvId(card.href) : '');
    if (id) setRating(card.rating, id);
    else card.rating.remove();
    return id;
  }));
  if (resolved.some(Boolean)) {
    const { default: loadBazaarvoice } = await import('../../scripts/bazaarvoice.js');
    loadBazaarvoice();
  }
}

/**
 * Adds previous/next controls that scroll the track by one card.
 * @param {HTMLElement} block
 * @param {HTMLUListElement} track
 */
function buildControls(block, track) {
  const makeButton = (dir, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cards-recipe-nav cards-recipe-${dir}`;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-controls', track.id);
    btn.addEventListener('click', () => {
      const card = track.querySelector('.cards-recipe-card');
      const step = card ? card.getBoundingClientRect().width : track.clientWidth;
      track.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
    });
    return btn;
  };
  const prev = makeButton('prev', 'Previous recipes');
  const next = makeButton('next', 'Next recipes');

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    block.classList.toggle('cards-recipe-scrollable', max > 1);
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
  };
  track.addEventListener('scroll', update, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(update).observe(track);
  else window.addEventListener('resize', update);
  requestAnimationFrame(update);

  block.append(prev, next);
}

/**
 * Finds the section heading authored right before the block (e.g. "You Might Also Enjoy...").
 * @param {HTMLElement} block
 * @returns {HTMLElement|null}
 */
function findLeadHeading(block) {
  const wrapper = block.parentElement;
  const prev = wrapper && wrapper.previousElementSibling;
  if (!prev) return null;
  if (prev.matches('h1, h2, h3, h4, h5, h6')) return prev;
  const headings = prev.querySelectorAll('h1, h2, h3, h4, h5, h6');
  return headings.length ? headings[headings.length - 1] : null;
}

let blockCount = 0;

export default function decorate(block) {
  blockCount += 1;
  const track = document.createElement('ul');
  track.className = 'cards-recipe-track';
  track.id = `cards-recipe-track-${blockCount}`;
  const lead = findLeadHeading(block);
  if (lead && lead.id) track.setAttribute('aria-labelledby', lead.id);
  else track.setAttribute('aria-label', lead ? lead.textContent.trim() : 'Recipes');
  const ratings = [];

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-recipe-card';
    let id = '';

    [...row.children].forEach((cell) => {
      const text = cell.textContent.trim();
      if (!cell.children.length && !text) return; // empty cell
      if (!cell.querySelector('picture') && BV_ID.test(text)) {
        [, id] = text.match(BV_ID);
        return; // authored Bazaarvoice id: data, not display
      }
      if (isImageCell(cell)) {
        cell.className = 'cards-recipe-card-image';
      } else {
        cell.className = 'cards-recipe-card-body';
        cell.querySelectorAll(':scope > p').forEach((p) => {
          const m = p.textContent.match(BV_ID);
          if (m && !p.querySelector('a, picture')) {
            [, id] = m;
            p.remove();
          }
        });
      }
      li.append(cell);
    });
    if (!li.children.length) return;

    const link = li.querySelector('.cards-recipe-card-body a[href]') || li.querySelector('a[href]');
    if (link) {
      link.classList.add('cards-recipe-card-link');
      const image = li.querySelector('.cards-recipe-card-image');
      // make the image clickable too, without a second tab stop
      if (image && !image.querySelector('a')) {
        const imageLink = document.createElement('a');
        imageLink.href = link.href;
        imageLink.tabIndex = -1;
        imageLink.setAttribute('aria-hidden', 'true');
        imageLink.append(...image.childNodes);
        image.append(imageLink);
      }
      if (!id) {
        try {
          id = new URL(link.href, window.location.href).searchParams.get('bvid') || '';
        } catch {
          id = '';
        }
      }
    }

    let body = li.querySelector('.cards-recipe-card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'cards-recipe-card-body';
      li.append(body);
    }
    const rating = document.createElement('div');
    rating.className = 'cards-recipe-rating';
    body.append(rating);
    ratings.push({ rating, id, href: link ? link.href : '' });

    track.append(li);
  });

  track.querySelectorAll('picture').forEach(optimize);
  block.replaceChildren(track);
  buildControls(block, track);

  if (!ratings.length) return;
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        resolveRatings(ratings);
      }
    }, { rootMargin: '300px' });
    observer.observe(block);
  } else {
    resolveRatings(ratings);
  }
}
