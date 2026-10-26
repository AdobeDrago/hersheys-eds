import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/aem.js';

/**
 * Hero (product) variant, loaded by hero.js for `Hero (product)`.
 *
 * Content model, either:
 *   Field table: one row per field, name | value. Fields: image-front, image-back, Title,
 *     Description, size, button. Rows may be empty or left out.
 *   2-cell layout: 1 row x 2 cells.
 *     Cell 1 (media): one or more product images. Several images become a gallery
 *       with previous/next controls and thumbnails.
 *     Cell 2 (details): h1 product name, "Choose a size:" label, a list of size
 *       links (current size first, unlinked or bold), description, CTA link.
 * Product rating is rendered from the `bvid` page metadata (Bazaarvoice inline rating).
 *
 * Authored values win. Whatever is left empty (images, product name, size list, description)
 * is filled from the product master sheet row whose `path` matches the page, or whose `gtin`
 * matches the `bvid` metadata. Sizes are the sheet products sharing the row's `familyId`.
 * The back image comes from an optional `imageBack` sheet column. An empty button is Shop Now.
 */

const SIZE_LABEL = /choose\s+a\s+size/i;
const WHERE_TO_BUY = '/where-to-buy';
const PRODUCT_MASTER = '/products/product-master.json';
const HEADING = ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6';
const PRICESPIDER_LOADER = 'https://cdn.pricespider.com/1/lib/ps-widget.js';

// field table row names (first cell, as a class name) and the field each one sets
const FIELDS = {
  'image-front': 'imageFront',
  'front-image': 'imageFront',
  image: 'imageFront',
  'image-back': 'imageBack',
  'back-image': 'imageBack',
  title: 'title',
  name: 'title',
  description: 'description',
  size: 'size',
  sizes: 'size',
  button: 'button',
  cta: 'button',
};
// fields that fall back to the product master sheet (an empty button defaults to Shop Now)
const SHEET_FIELDS = ['imageFront', 'imageBack', 'title', 'size', 'description'];

let productsPromise;

/**
 * Loads the rows of the product master sheet (first sheet of a multi-sheet workbook).
 * @returns {Promise<Array<Object>>}
 */
function fetchProducts() {
  productsPromise = productsPromise || fetch(PRODUCT_MASTER)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then(({ data }) => (Array.isArray(data) ? data : data?.data || []))
    .catch(() => []);
  return productsPromise;
}

function normalizePath(path) {
  return (path || '').trim().toLowerCase().replace(/\.html$/, '').replace(/\/+$/, '');
}

/**
 * Finds the sheet row for the current page.
 * @returns {Promise<{ product: Object|undefined, products: Array<Object> }>}
 */
async function findProduct() {
  const products = await fetchProducts();
  const path = normalizePath(window.location.pathname);
  const gtin = (getMetadata('bvid') || getMetadata('bv-id')).trim();
  const product = products.find((p) => normalizePath(p.path) === path)
    || (gtin ? products.find((p) => (p.gtin || '').trim() === gtin) : undefined);
  return { product, products };
}

/**
 * Size label for a sheet row: the title after the product name ("9.3 oz, 6 pack"),
 * else built from weight and count.
 * @param {Object} product
 */
function sizeLabel(product) {
  const { title = '', name = '' } = product;
  if (name && title.startsWith(`${name}, `)) return title.slice(name.length + 2);
  const parts = [];
  if (product.weight) parts.push(`${product.weight} oz`);
  if (product.count) parts.push(`${product.count} ${product.countUnit || ''}`.trim());
  return parts.join(', ') || title;
}

/**
 * The product followed by the active sheet products in its family.
 * @param {Object} product
 * @param {Array<Object>} products
 */
function familyOf(product, products) {
  if (!product.familyId) return [product];
  const others = products.filter((p) => p !== product && p.path
    && p.familyId === product.familyId && p.brandActive !== 'Inactive');
  return [product, ...others];
}

/**
 * Adds a resource hint to <head> once.
 * @param {string} rel
 * @param {string} href
 */
function addResourceHint(rel, href) {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.append(link);
}

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
 * Makes Shop Now near-instant, like hersheyland.com: prefetch the PriceSpider
 * loader and the where-to-buy page now, and prerender it on hover/press.
 * Falls back to a plain prefetch where Speculation Rules aren't supported.
 * @param {string} href
 */
function speculateShopNow(href) {
  addResourceHint('prefetch', PRICESPIDER_LOADER);
  if (!HTMLScriptElement.supports?.('speculationrules')) {
    addResourceHint('prefetch', href);
    return;
  }
  const rules = document.createElement('script');
  rules.type = 'speculationrules';
  rules.nonce = document.querySelector('script[nonce]')?.nonce || '';
  rules.textContent = JSON.stringify({
    prefetch: [{ source: 'list', urls: [href], eagerness: 'immediate' }],
    prerender: [{ source: 'list', urls: [href], eagerness: 'moderate' }],
  });
  document.head.append(rules);
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
  speculateShopNow(url.href);
}

/**
 * Returns true when a paragraph is a single link and nothing else.
 * @param {Element} p
 */
function isLinkParagraph(p) {
  const links = p.querySelectorAll('a[href]');
  return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
}

/**
 * Marks the trailing single-link paragraph as the call to action.
 * @param {Element} cell
 */
function decorateCta(cell) {
  const cta = [...cell.querySelectorAll(':scope > p')].filter(isLinkParagraph).pop();
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

/**
 * Splits a row into its media cell and its details cell.
 * @param {Element} row
 */
function splitCells(row) {
  const cells = [...row.children];
  cells.forEach(pictureLinks);
  const media = cells.find(isMediaCell);
  const details = cells.find((cell) => cell !== media && cell.textContent.trim());
  return { cells, media, details };
}

/**
 * Returns true when a details paragraph is a description: not the size label or list,
 * not a link-only paragraph (CTA) and not an image.
 */
function hasDescription(cell, label, list) {
  return [...cell.querySelectorAll(':scope > p')].some((p) => p !== label && p !== list
    && p.textContent.trim() && !isLinkParagraph(p) && !p.querySelector('picture, img'));
}

/**
 * Lists the fields the author left empty.
 * @param {Element|undefined} media
 * @param {Element|undefined} details
 * @returns {Set<string>}
 */
function findGaps(media, details) {
  const gaps = new Set();
  if (!media) gaps.add('image');
  if (!details) return new Set([...gaps, 'name', 'sizes', 'description']);
  if (![...details.querySelectorAll(HEADING)].some((h) => h.textContent.trim())) gaps.add('name');
  const { label, list } = findSizes(details);
  if (!list) gaps.add('sizes');
  if (!hasDescription(details, label, list)) gaps.add('description');
  return gaps;
}

/**
 * Renders a sheet image URL as a picture, through the Dynamic Media renderer when available.
 * @param {string} src
 * @param {string} alt
 */
function buildPicture(src, alt) {
  // eslint-disable-next-line no-underscore-dangle
  const dmPicture = window.__dmRender__?.(src, alt);
  if (dmPicture) return dmPicture;
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  picture.append(img);
  return picture;
}

/**
 * Size list for a sheet row: the current size (bold) followed by links to its family.
 * @param {Object} product
 * @param {Array<Object>} products
 */
function buildSizeList(product, products) {
  const ul = document.createElement('ul');
  familyOf(product, products).forEach((member, i) => {
    const li = document.createElement('li');
    const item = document.createElement(i === 0 ? 'strong' : 'a');
    if (i > 0) item.href = member.path;
    item.textContent = sizeLabel(member);
    li.append(item);
    ul.append(li);
  });
  return ul;
}

function sizeLabelParagraph() {
  const label = document.createElement('p');
  label.textContent = 'Choose a size:';
  return label;
}

/**
 * Adds the sheet values for the empty details fields, in content model order.
 * @param {Element} cell
 * @param {Set<string>} gaps
 * @param {Object} product
 * @param {Array<Object>} products
 */
function fillDetails(cell, gaps, product, products) {
  const cta = [...cell.querySelectorAll(':scope > p')].filter(isLinkParagraph).pop();
  const afterHeading = (el) => {
    const heading = cell.querySelector(HEADING);
    if (heading) heading.after(el);
    else cell.prepend(el);
  };

  if (gaps.has('name') && product.name) {
    const h1 = document.createElement('h1');
    h1.textContent = product.name;
    cell.prepend(h1);
  }

  if (gaps.has('sizes')) {
    let { label } = findSizes(cell);
    if (!label) {
      label = sizeLabelParagraph();
      afterHeading(label);
    }
    label.after(buildSizeList(product, products));
  }

  if (gaps.has('description') && product.description) {
    const p = document.createElement('p');
    p.textContent = product.description;
    if (cta) cta.before(p);
    else cell.append(p);
  }
}

/**
 * Fills the fields the author left empty with the product master sheet values.
 * @param {Element} row
 * @param {Set<string>} gaps
 * @param {Object} product
 * @param {Array<Object>} products
 */
function fillFromSheet(row, gaps, product, products) {
  let { media, details } = splitCells(row);

  const isEmpty = (cell) => !cell.textContent.trim() && !cell.querySelector('picture, img');
  const spareCell = () => [...row.children]
    .find((cell) => cell !== media && cell !== details && isEmpty(cell));

  if (gaps.has('image') && product.image) {
    const alt = product.imageAlt || product.title || product.name || '';
    media = spareCell();
    if (!media) {
      media = document.createElement('div');
      row.prepend(media);
    }
    media.replaceChildren(buildPicture(product.image.trim(), alt));
  }

  if (!details) {
    details = spareCell();
    if (!details) {
      details = document.createElement('div');
      row.append(details);
    }
    details.replaceChildren();
  }
  fillDetails(details, gaps, product, products);
}

/**
 * Reads the field table: one row per field, the name in the first cell and the value in the
 * second. Returns null when the block uses the 2-cell layout instead.
 * @param {Element} block
 * @returns {Object<string, Element>|null} the authored (non-empty) value cell of each field
 */
function readFields(block) {
  let isFieldTable = false;
  const fields = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const field = FIELDS[toClassName(keyCell?.textContent || '')];
    if (!field) return;
    isFieldTable = true;
    if (valueCell && (valueCell.textContent.trim() || valueCell.querySelector('picture, img'))) {
      fields[field] = valueCell;
    }
  });
  return isFieldTable ? fields : null;
}

/**
 * Authored image: a picture, an img, or an image URL (as a link or as text).
 * @param {Element} cell
 * @param {string} alt fallback alt text
 */
function fieldPicture(cell, alt) {
  const picture = cell.querySelector('picture');
  if (picture) return picture;
  const img = cell.querySelector('img');
  if (img) {
    const wrapper = document.createElement('picture');
    wrapper.append(img);
    return wrapper;
  }
  const link = cell.querySelector('a[href]');
  const url = (link ? link.href : cell.textContent).trim();
  if (!/^https?:\/\//i.test(url)) return null;
  const linkText = link?.textContent.trim();
  return buildPicture(url, linkText && linkText !== url ? linkText : alt);
}

/**
 * Authored sizes: a list is used as is; links become a list; plain text is the current size.
 * @param {Element} cell
 */
function fieldSizes(cell) {
  const list = cell.querySelector('ul, ol');
  if (list) return list;
  const ul = document.createElement('ul');
  const links = [...cell.querySelectorAll('a[href]')];
  const items = links.length ? links : [Object.assign(document.createElement('strong'), {
    textContent: cell.textContent.trim(),
  })];
  items.forEach((item) => {
    const li = document.createElement('li');
    li.append(item);
    ul.append(li);
  });
  return ul;
}

/**
 * Authored rich text: paragraphs and lists are kept; bare text is wrapped in a paragraph.
 * @param {Element} cell
 */
function fieldBlocks(cell) {
  if (cell.querySelector(':scope > p, :scope > ul, :scope > ol')) return [...cell.children];
  const p = document.createElement('p');
  p.append(...cell.childNodes);
  return [p];
}

/**
 * Authored button: its link, or its text pointing to Where to Buy. Defaults to Shop Now.
 * @param {Element|undefined} cell
 */
function fieldButton(cell) {
  const p = document.createElement('p');
  let link = cell?.querySelector('a[href]');
  if (!link) {
    link = document.createElement('a');
    link.href = WHERE_TO_BUY;
    link.textContent = cell?.textContent.trim() || 'Shop Now';
  }
  p.append(link);
  return p;
}

/**
 * Rebuilds a field table as the 2-cell layout. Authored fields win; empty or missing fields
 * come from the product master sheet row, when there is one.
 * @param {Element} block
 * @param {Object<string, Element>} fields
 * @param {Object} [product]
 * @param {Array<Object>} [products]
 */
function buildFromFields(block, fields, product, products) {
  const sheet = product || {};
  const alt = sheet.imageAlt || sheet.title || sheet.name || '';

  const media = document.createElement('div');
  const front = fields.imageFront ? fieldPicture(fields.imageFront, alt)
    : sheet.image && buildPicture(sheet.image.trim(), alt);
  const back = fields.imageBack ? fieldPicture(fields.imageBack, alt)
    : sheet.imageBack && buildPicture(sheet.imageBack.trim(), sheet.imageBackAlt || alt);
  media.append(...[front, back].filter(Boolean));

  const details = document.createElement('div');
  const name = fields.title ? fields.title.textContent.trim() : sheet.name || sheet.title;
  if (name) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    details.append(h1);
  }
  const sizes = fields.size ? fieldSizes(fields.size)
    : product && buildSizeList(product, products);
  if (sizes) details.append(sizeLabelParagraph(), sizes);
  if (fields.description) {
    details.append(...fieldBlocks(fields.description));
  } else if (sheet.description) {
    const p = document.createElement('p');
    p.textContent = sheet.description;
    details.append(p);
  }
  details.append(fieldButton(fields.button));

  const row = document.createElement('div');
  row.append(media, details);
  block.replaceChildren(row);
}

function decorateRows(block) {
  [...block.children].forEach((row) => {
    row.classList.add('hero-product-row');
    const { cells, media, details } = splitCells(row);
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

/**
 * Decorates synchronously when the author supplied everything, so the block is complete
 * when hero.js marks it loaded. Only a block with empty fields waits for the product sheet,
 * and then returns a promise.
 * @param {Element} block
 * @returns {Promise<void>|undefined}
 */
export default function decorate(block) {
  const fields = readFields(block);
  let lookup;
  if (fields) {
    if (SHEET_FIELDS.some((field) => !fields[field])) {
      lookup = findProduct().then(({ product, products }) => {
        buildFromFields(block, fields, product, products);
      });
    } else {
      buildFromFields(block, fields);
    }
  } else {
    if (!block.children.length) block.append(document.createElement('div'));
    // one product per page: the first row is the product overview
    const row = block.firstElementChild;
    const { media, details } = splitCells(row);
    const gaps = findGaps(media, details);
    if (gaps.size) {
      lookup = findProduct().then(({ product, products }) => {
        if (product) fillFromSheet(row, gaps, product, products);
      });
    }
  }
  if (!lookup) {
    decorateRows(block);
    return undefined;
  }
  return lookup.then(() => decorateRows(block));
}
