import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

/**
 * Hero (product) variant, loaded by hero.js for `Hero (product)`.
 *
 * Content model: 1 row x 2 cells.
 *   Cell 1 (media): one or more product images. Several images become a gallery
 *     with previous/next controls and thumbnails.
 *   Cell 2 (details): h1 product name, "Choose a size:" label, a list of size
 *     links (current size first, unlinked or bold), description, CTA link.
 * Product rating is rendered from the `bvid` page metadata (Bazaarvoice inline rating).
 */

const SIZE_LABEL = /choose\s+a\s+size/i;
const WHERE_TO_BUY = '/where-to-buy';

/**
 * Re-renders a picture as an optimized picture when the image is served from this origin.
 * @param {HTMLPictureElement} picture
 * @param {boolean} eager
 * @param {Array} breakpoints
 * @returns {HTMLPictureElement}
 */
function optimize(picture, eager, breakpoints) {
  const img = picture.querySelector('img');
  if (!img || !img.src) return picture;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin) return picture;
  return createOptimizedPicture(img.src, img.alt, eager, breakpoints);
}

/**
 * Scene7 product shots are transparent cut-outs shown on the maroon band. Keeps renditions
 * transparent and unpadded: drops a fixed `hei` when a `wid` is set (Scene7 would letterbox
 * the image onto a white canvas) and swaps opaque formats for their alpha variants.
 * @param {string} url
 * @returns {string}
 */
function alphaRendition(url) {
  if (!url || !url.includes('/is/image/')) return url;
  const [base, query = ''] = url.split('?');
  let params = query.split('&').filter((p) => p);
  const hasWid = params.some((p) => p.startsWith('wid='));
  if (hasWid) params = params.filter((p) => !p.startsWith('hei='));
  params = params.map((p) => {
    if (p === 'fmt=webp') return 'fmt=webp-alpha';
    if (p === 'fmt=jpg' || p === 'fmt=jpeg') return 'fmt=png-alpha';
    return p;
  });
  return params.length ? `${base}?${params.join('&')}` : base;
}

/**
 * Applies alphaRendition to every source and the img of a picture.
 * @param {HTMLPictureElement} picture
 */
function useAlphaRenditions(picture) {
  picture.querySelectorAll('source').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    const next = alphaRendition(srcset);
    if (next === srcset) return;
    source.setAttribute('srcset', next);
    if (source.type === 'image/jpeg' && next.includes('fmt=png-alpha')) source.type = 'image/png';
  });
  const img = picture.querySelector('img');
  if (img && img.getAttribute('src')) img.setAttribute('src', alphaRendition(img.getAttribute('src')));
}

const IMAGE_LINK = /\/is\/image\/|\.(?:png|jpe?g|webp|avif|gif)(?:[?#]|$)/i;

/**
 * Document Authoring delivers external product shots (Scene7) as links. Turns every
 * image link into a picture so the gallery can use it.
 * @param {Element} cell
 */
function pictureLinks(cell) {
  cell.querySelectorAll('a[href]').forEach((a) => {
    if (!IMAGE_LINK.test(a.href)) return;
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = a.href;
    img.alt = a.textContent.trim();
    img.loading = 'lazy';
    picture.append(img);
    a.replaceWith(picture);
  });
}

/**
 * Returns true when a cell contains only pictures (and empty wrappers).
 * @param {Element} cell
 */
function isMediaCell(cell) {
  if (!cell.querySelector('picture')) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return clone.textContent.trim() === '';
}

/**
 * Builds the product image gallery from the pictures in the media cell.
 * @param {Element} cell
 */
function buildGallery(cell) {
  const pictures = [...cell.querySelectorAll('picture')];
  const gallery = document.createElement('div');
  gallery.className = 'hero-product-gallery';

  const stage = document.createElement('div');
  stage.className = 'hero-product-stage';
  const slides = pictures.map((picture, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-product-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${pictures.length}`);
    const optimized = optimize(picture, i === 0, [{ media: '(min-width: 900px)', width: '1000' }, { width: '750' }]);
    useAlphaRenditions(optimized);
    // the first slide is the visible, above-the-fold product image (LCP candidate);
    // pictures from other origins (e.g. Scene7) bypass createOptimizedPicture and arrive lazy
    const img = i === 0 && optimized.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    }
    slide.append(optimized);
    stage.append(slide);
    return slide;
  });
  gallery.append(stage);

  if (pictures.length > 1) {
    gallery.classList.add('hero-product-gallery-multi');
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-roledescription', 'carousel');
    gallery.setAttribute('aria-label', 'Product images');

    const thumbs = document.createElement('div');
    thumbs.className = 'hero-product-thumbs';

    const thumbButtons = slides.map((slide, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hero-product-thumb';
      btn.setAttribute('aria-label', `Show image ${i + 1}`);
      const img = slide.querySelector('img');
      if (img) {
        const thumbImg = document.createElement('img');
        thumbImg.src = img.currentSrc || img.src;
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        btn.append(thumbImg);
      }
      thumbs.append(btn);
      return btn;
    });

    let current = 0;
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('active', active);
        slide.setAttribute('aria-hidden', !active);
      });
      thumbButtons.forEach((btn, i) => {
        if (i === current) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
    };

    const makeNav = (dir, label) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `hero-product-nav hero-product-${dir}`;
      btn.setAttribute('aria-label', label);
      btn.addEventListener('click', () => show(current + (dir === 'next' ? 1 : -1)));
      return btn;
    };

    thumbButtons.forEach((btn, i) => btn.addEventListener('click', () => show(i)));
    stage.append(makeNav('prev', 'Previous image'), makeNav('next', 'Next image'));
    gallery.append(thumbs);
    show(0);
  } else if (slides[0]) {
    slides[0].classList.add('active');
  }

  cell.replaceChildren(gallery);
  cell.classList.add('hero-product-media');
}

/**
 * Finds the size list: the list (or link-only paragraph) following the "Choose a size" label,
 * falling back to the first list in the cell.
 * @param {Element} cell
 * @returns {{ label: Element|null, list: Element|null }}
 */
function findSizes(cell) {
  const label = [...cell.children].find((el) => SIZE_LABEL.test(el.textContent)
    && el.textContent.trim().length < 40);
  let list = null;
  if (label) {
    let next = label.nextElementSibling;
    while (next && !list) {
      if (next.matches('ul, ol') || (next.matches('p') && next.querySelectorAll('a').length > 1)) {
        list = next;
      } else if (next.matches('h1, h2, h3, h4, h5, h6')) {
        break;
      }
      next = next.nextElementSibling;
    }
  }
  if (!list) list = cell.querySelector(':scope > ul, :scope > ol');
  return { label, list };
}

/**
 * Normalizes the size list into a nav of size links and marks the current size.
 * @param {Element} list
 */
function decorateSizes(list) {
  const nav = document.createElement('nav');
  nav.className = 'hero-product-sizes';
  nav.setAttribute('aria-label', 'Choose a size');
  const ul = document.createElement('ul');

  const entries = list.matches('ul, ol')
    ? [...list.children].map((li) => ({ node: li, link: li.querySelector('a[href]') }))
    : [...list.querySelectorAll('a[href]')].map((a) => ({ node: a, link: a }));

  let currentIndex = entries.findIndex(({ node, link }) => !link || node.querySelector('strong, b')
    || (link && new URL(link.href, window.location.href).pathname === window.location.pathname));
  if (currentIndex < 0) currentIndex = 0;

  entries.forEach(({ node, link }, i) => {
    const text = node.textContent.trim();
    if (!text) return;
    const li = document.createElement('li');
    let item;
    if (link && i !== currentIndex) {
      item = document.createElement('a');
      item.href = link.getAttribute('href');
    } else {
      item = document.createElement('span');
      item.setAttribute('aria-current', 'true');
    }
    item.className = 'hero-product-size';
    item.textContent = text;
    li.append(item);
    ul.append(li);
  });

  nav.append(ul);
  list.replaceWith(nav);
}

/**
 * Adds a Bazaarvoice inline rating placeholder after the heading when `bvid` metadata exists.
 * @param {Element} cell
 */
function addRating(cell) {
  const productId = getMetadata('bvid') || getMetadata('bv-id');
  if (!productId) return;
  const rating = document.createElement('div');
  rating.className = 'hero-product-rating';
  rating.dataset.bvShow = 'inline_rating';
  rating.dataset.bvProductId = productId;
  const heading = cell.querySelector('h1, h2, h3');
  if (heading) heading.after(rating);
  else cell.prepend(rating);
}

/**
 * Document Authoring drops the `ps-sku` query. Send Shop Now to this site's
 * where-to-buy page with the Bazaarvoice product id from page metadata.
 * @param {HTMLAnchorElement} link
 */
function pointShopNow(link) {
  const href = link.getAttribute('href') || '';
  let pathname = href;
  try {
    pathname = new URL(href, window.location.href).pathname;
  } catch { /* keep the raw href */ }
  if (!/\/where-to-buy(?:\.html)?\/?$/i.test(pathname)) return;
  const productId = getMetadata('bvid') || getMetadata('bv-id');
  if (!productId) return;
  const url = new URL(WHERE_TO_BUY, window.location.origin);
  url.searchParams.set('ps-sku', productId);
  link.href = url.href;
}

/**
 * Marks the trailing single-link paragraph as the call to action.
 * @param {Element} cell
 */
function decorateCta(cell) {
  const candidates = [...cell.querySelectorAll(':scope > p')].filter((p) => {
    const links = p.querySelectorAll('a[href]');
    return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
  });
  const cta = candidates.pop();
  if (!cta) return;
  cta.classList.add('hero-product-cta');
  const link = cta.querySelector('a');
  pointShopNow(link);
  if (!link.classList.contains('button')) link.classList.add('button');
}

function decorateDetails(cell) {
  cell.classList.add('hero-product-details');
  const { label, list } = findSizes(cell);
  if (label) label.classList.add('hero-product-size-label');
  if (list) decorateSizes(list);
  decorateCta(cell);
  addRating(cell);
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  rows.forEach((row) => {
    row.classList.add('hero-product-row');
    const cells = [...row.children];
    cells.forEach(pictureLinks);
    const media = cells.find(isMediaCell);
    const details = cells.find((cell) => cell !== media && cell.textContent.trim());
    if (media) buildGallery(media);
    if (details) decorateDetails(details);
    // drop empty cells so the layout does not reserve space for them
    cells.forEach((cell) => {
      if (cell !== media && cell !== details && !cell.children.length && !cell.textContent.trim()) {
        cell.remove();
      }
    });
  });
}
