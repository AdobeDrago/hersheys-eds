import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

/**
 * Recipe variant of the hero block (class `recipe`, authored as Hero (Recipe)).
 *
 * Content model: 1 column x 2 rows (row order is not enforced).
 *   Image row: the hero image.
 *   Text row: category link paragraph (rendered as a pill), h1 recipe title,
 *     "Skill Level: ..." paragraph, optional further paragraphs.
 * Generated, not authored:
 *   - star rating from the `bvid` page metadata (Bazaarvoice inline rating; bv.js is
 *     loaded by loadDelayed() in scripts/scripts.js when a [data-bv-show] exists)
 *   - share bar (Facebook, Pinterest, Email, Print, Copy URL) built from the page URL
 */

const SKILL_LEVEL = /skill\s*level/i;

/**
 * Re-renders a picture as an optimized picture when the image is served from this origin.
 * @param {HTMLPictureElement} picture
 * @returns {HTMLPictureElement}
 */
function optimize(picture) {
  const img = picture.querySelector('img');
  if (!img || !img.src) return picture;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin) return picture;
  return createOptimizedPicture(img.src, img.alt, true, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '750' },
  ]);
}

/**
 * Returns true when the element holds exactly one link and no other text.
 * @param {Element} el
 */
function isLinkOnly(el) {
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Builds the Bazaarvoice inline rating container from the `bvid` page metadata.
 * @returns {HTMLElement|null}
 */
function buildRating() {
  const productId = getMetadata('bvid') || getMetadata('bv-id');
  if (!productId) return null;
  const rating = document.createElement('div');
  rating.className = 'hero-recipe-rating';
  // rating_summary (stars + "5.0 out of 5" + review count), as on the source recipe page
  rating.dataset.bvShow = 'rating_summary';
  rating.dataset.bvProductId = productId;
  return rating;
}

/**
 * Builds a share item (link or button) with an accessible label.
 * @param {string} type
 * @param {string} label
 * @param {string} [href]
 * @returns {HTMLLIElement}
 */
function shareItem(type, label, href) {
  const li = document.createElement('li');
  li.className = `hero-recipe-share-item hero-recipe-share-${type}`;
  const control = document.createElement(href ? 'a' : 'button');
  if (href) {
    control.href = href;
    if (!href.startsWith('mailto:')) {
      control.target = '_blank';
      control.rel = 'noopener noreferrer';
    }
  } else {
    control.type = 'button';
  }
  const opensNewWindow = href && !href.startsWith('mailto:');
  control.setAttribute('aria-label', opensNewWindow ? `${label} (opens in a new window)` : label);
  const text = document.createElement('span');
  text.className = 'hero-recipe-share-label';
  text.textContent = label;
  control.append(text);
  li.append(control);
  return li;
}

/**
 * Builds the share bar for the current page.
 * @param {string} title
 * @param {string} imageUrl
 * @returns {HTMLElement}
 */
function buildShareBar(title, imageUrl) {
  const pageUrl = window.location.href.split('#')[0];
  const url = encodeURIComponent(pageUrl);
  const text = encodeURIComponent(title || document.title);

  const nav = document.createElement('nav');
  nav.className = 'hero-recipe-share';
  nav.setAttribute('aria-label', 'Share this recipe');
  const ul = document.createElement('ul');

  ul.append(
    shareItem('facebook', 'Share on Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`),
    shareItem('pinterest', 'Pin on Pinterest', `https://www.pinterest.com/pin/create/button/?url=${url}&description=${text}${imageUrl ? `&media=${encodeURIComponent(imageUrl)}` : ''}`),
    shareItem('email', 'Share by email', `mailto:?subject=${text}&body=${url}`),
  );

  const print = shareItem('print', 'Print recipe');
  print.querySelector('button').addEventListener('click', () => window.print());

  const copy = shareItem('copy', 'Copy link');
  const copyButton = copy.querySelector('button');
  // polite live region so the "copied" confirmation is announced to screen readers
  const status = document.createElement('span');
  status.className = 'hero-recipe-share-status';
  status.setAttribute('role', 'status');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      copy.classList.add('is-copied');
      copyButton.querySelector('.hero-recipe-share-label').textContent = 'Link copied';
      status.textContent = 'Link copied to clipboard';
      setTimeout(() => {
        copy.classList.remove('is-copied');
        copyButton.querySelector('.hero-recipe-share-label').textContent = 'Copy link';
        status.textContent = '';
      }, 2000);
    } catch {
      // clipboard not available (insecure context or permission denied): nothing to do
    }
  });

  ul.append(print, copy);
  nav.append(ul, status);
  return nav;
}

function decorateRecipe(block) {
  const pictures = [...block.querySelectorAll('picture')];
  const picture = pictures[0];

  // collect every authored text element (from any row/cell), in order, skipping image-only wrappers
  const textEls = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.children].forEach((el) => {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('picture').forEach((p) => p.remove());
        if (clone.textContent.trim()) {
          el.querySelectorAll('picture').forEach((p) => p.remove());
          textEls.push(el);
        }
      });
      // cells authored as bare text (no wrapping element)
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        textEls.push(p);
      }
    });
  });

  const content = document.createElement('div');
  content.className = 'hero-recipe-content';

  const heading = textEls.find((el) => el.matches('h1, h2, h3'));
  const headingIndex = textEls.indexOf(heading);

  // category pill: the link-only paragraph before the heading (or the first one if no heading)
  const category = textEls.find((el, i) => el.matches('p')
    && isLinkOnly(el) && (headingIndex < 0 || i < headingIndex));
  if (category) category.classList.add('hero-recipe-category');

  const skill = textEls.find((el) => el !== heading && SKILL_LEVEL.test(el.textContent));

  const meta = document.createElement('div');
  meta.className = 'hero-recipe-meta';
  const rating = buildRating();
  if (rating) meta.append(rating);
  if (skill) {
    skill.classList.add('hero-recipe-skill');
    // split "Skill Level: Beginner" into label + value so they can be styled separately
    const text = skill.textContent.trim();
    const colon = text.indexOf(':');
    if (colon > 0 && !skill.querySelector('a') && text.slice(colon + 1).trim()) {
      const label = document.createElement('span');
      label.className = 'hero-recipe-skill-label';
      label.textContent = text.slice(0, colon + 1);
      const value = document.createElement('span');
      value.className = 'hero-recipe-skill-value';
      value.textContent = text.slice(colon + 1).trim();
      skill.replaceChildren(label, ' ', value);
    }
    meta.append(skill);
  }

  if (heading) heading.classList.add('hero-recipe-title');

  const descriptionEls = textEls.filter((el) => el !== skill && el !== heading && el !== category);

  textEls.forEach((el) => {
    if (el === skill || descriptionEls.includes(el)) return;
    content.append(el);
    if (el === heading && meta.children.length) content.append(meta);
  });
  if (!heading && meta.children.length) content.append(meta);

  let imageUrl = '';
  let media = null;
  if (picture) {
    const img = picture.querySelector('img');
    imageUrl = img ? new URL(img.getAttribute('src'), window.location.href).href : '';
    media = document.createElement('div');
    media.className = 'hero-recipe-media';
    const optimized = optimize(picture);
    // the hero image is the above-the-fold LCP candidate
    const optimizedImg = optimized.querySelector('img');
    if (optimizedImg) {
      if (!optimizedImg.hasAttribute('alt')) optimizedImg.alt = '';
      optimizedImg.loading = 'eager';
      optimizedImg.fetchPriority = 'high';
    }
    media.append(optimized);
  }

  content.append(buildShareBar(heading ? heading.textContent.trim() : '', imageUrl));

  let description = null;
  if (descriptionEls.length) {
    description = document.createElement('div');
    description.className = 'hero-recipe-description';
    description.append(...descriptionEls);
  }

  block.replaceChildren(content);
  if (media) block.append(media);
  if (description) block.append(description);
}

/**
 * Decorates a hero. Default heroes stay as authored content.
 * The recipe variant rebuilds the overview.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  if (!block.classList.contains('recipe')) return;
  decorateRecipe(block);
}
