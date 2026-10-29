import { createOptimizedPicture, getMetadata, toClassName } from '../../scripts/aem.js';

/**
 * Hero (product) variant, loaded by hero.js for `Hero (product)`.
 *
 * Content model: a field table, one row per field, name | value. Fields: label, image-front,
 * image-back, Title, Description, size, button. Rows may be empty or left out; other rows
 * are ignored. The images become a gallery (previous/next controls and thumbnails when
 * there are two).
 * The label is a pill above the title: the authored text, else from the sheet's `Occasion`
 * (Limited Edition -> Limited Edition; Halloween, Easter, Holiday, Valentine's -> Seasonal;
 * any other occasion -> no label).
 * Product rating is rendered from the `bvid` page metadata (Bazaarvoice inline rating).
 *
 * Authored values win. Whatever is left empty (images, product name, size list, description)
 * is filled from the product master sheet: only the tab named by the `brand` metadata is
 * loaded (/products/product-master.json?sheet=<brand>), and the row whose `14-Digit UPCs`
 * matches the `bvid` metadata is used. Sizes are the products in that tab sharing the row's
 * `familyId` whose Notes say `migrated` (their pages exist on this site).
 * The back image comes from an optional `imageBack` sheet column. An empty button is Shop Now.
 */

const SIZE_LABEL = /choose\s+a\s+size/i;
const WHERE_TO_BUY = '/where-to-buy';
const PRODUCT_MASTER = '/products/product-master.json';

// field table row names (first cell, as a class name) and the field each one sets
const FIELDS = {
  label: 'label',
  badge: 'label',
  tag: 'label',
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
const SHEET_FIELDS = ['label', 'imageFront', 'imageBack', 'title', 'size', 'description'];
// sheet `Occasion` values (lowercase, letters only) that show the Seasonal label
const SEASONAL_OCCASIONS = ['halloween', 'easter', 'holiday', 'valentines'];

let productsPromise;

/**
 * Site path of a sheet URL value (full hersheyland.com URL or site path), without the old
 * AEM content root or `.html` (pages are served without it).
 * @param {string} value
 */
function urlPath(value) {
  if (!value) return '';
  let path = value;
  try {
    path = new URL(value, window.location.origin).pathname;
  } catch {
    // not a URL: use as is
  }
  return path.replace(/^\/content\/hersheyland\/en-us\/home(?=\/)/, '').replace(/\.html$/, '');
}

/**
 * Sheet tab for the page's brand, from the `brand` page metadata
 * (cadbury, or HERSHEY'S -> hersheys, ROLO® -> rolo).
 * @returns {string}
 */
function brandSheetName() {
  return getMetadata('brand').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

/**
 * Reads a sheet row as a product. Short column names (path, name, title, ...) are used
 * as is; the Hershey product master columns (Product Page URL, productName, Image URL, ...)
 * are mapped onto them. `gtin` is always the `14-Digit UPCs` column, padded to the 14 digits
 * of `bvid`.
 * @param {Object} row
 * @returns {Object}
 */
function toProduct(row) {
  const upc = String(row['14-Digit UPCs'] || '').trim();
  return {
    ...row,
    path: row.path || urlPath(row['Product Page URL']),
    gtin: /^\d+$/.test(upc) ? upc.padStart(14, '0') : upc,
    name: row.name || row['Short Product Title'] || '',
    title: row.title || row.productName || '',
    image: row.image || row['Image URL'] || '',
    description: row.description || row['On Page Description/product Details'] || '',
    familyId: row.familyId || row['Product Family ID (lowercase and underscores for BV)'] || '',
    notes: row.notes || row.Notes || '',
    occasion: row.occasion || row.Occasion || '',
    weight: row.weight || row['Weight (oz)'] || '',
    count: row.count || row.Count || '',
    countUnit: row.countUnit || row['Count Unit'] || '',
  };
}

/**
 * Loads only the page brand's tab of the product master sheet. Without a `brand` there is
 * nothing to load.
 * @returns {Promise<Array<Object>>}
 */
function fetchProducts() {
  const sheet = brandSheetName();
  if (!sheet) return Promise.resolve([]);
  productsPromise = productsPromise || fetch(`${PRODUCT_MASTER}?sheet=${sheet}`)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then(({ data }) => (Array.isArray(data) ? data : data?.data || []))
    .then((rows) => rows.map(toProduct))
    .catch(() => []);
  return productsPromise;
}

/**
 * Finds the sheet row whose `14-Digit UPCs` (padded to 14 digits) matches the `bvid` GTIN.
 * @returns {Promise<{ product: Object|undefined, products: Array<Object> }>}
 */
async function findProduct() {
  const products = await fetchProducts();
  const gtin = (getMetadata('bvid') || getMetadata('bv-id')).trim();
  const product = gtin ? products.find((p) => (p.gtin || '').trim() === gtin) : undefined;
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
 * The product followed by the sheet products in its family that are migrated, so every
 * size links to a page on this site.
 * @param {Object} product
 * @param {Array<Object>} products
 */
function familyOf(product, products) {
  if (!product.familyId) return [product];
  const others = products.filter((p) => p !== product && p.path
    && p.familyId === product.familyId && String(p.notes).trim().toLowerCase() === 'migrated');
  return [product, ...others];
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
 * Reads the field table: one row per field, the name in the first cell and the value in the
 * second. Rows that are not fields are ignored, so a block without any field row is filled
 * entirely from the sheet.
 * @param {Element} block
 * @returns {Object<string, Element>} the authored (non-empty) value cell of each field
 */
function readFields(block) {
  const fields = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const field = FIELDS[toClassName(keyCell?.textContent || '')];
    if (!field) return;
    if (valueCell && (valueCell.textContent.trim() || valueCell.querySelector('picture, img'))) {
      fields[field] = valueCell;
    }
  });
  return fields;
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
 * Label for a sheet row from its `Occasion`: Limited Edition, Seasonal for the seasonal
 * occasions, nothing for Everyday and any other occasion.
 * @param {Object} product
 * @returns {string}
 */
function sheetLabel(product) {
  const occasion = String(product.occasion || '').toLowerCase().replace(/[^a-z]/g, '');
  if (occasion === 'limitededition') return 'Limited Edition';
  return SEASONAL_OCCASIONS.includes(occasion) ? 'Seasonal' : '';
}

/**
 * Label pill shown above the title. Seasonal and Limited Edition get their icon; any other
 * authored text is shown without one.
 * @param {string} text
 */
function buildLabel(text) {
  const label = document.createElement('div');
  label.className = 'hero-product-label';
  let type = '';
  if (/limited\s*edition/i.test(text)) type = 'limited-edition';
  else if (/seasonal/i.test(text)) type = 'seasonal';
  if (type) {
    label.classList.add(`hero-product-label-${type}`);
    const icon = document.createElement('span');
    icon.className = 'hero-product-label-icon';
    icon.setAttribute('aria-hidden', 'true');
    label.append(icon);
  }
  label.append(text);
  return label;
}

/**
 * Builds the product overview (media | details) from the field table. Authored fields win;
 * empty or missing fields come from the product master sheet. The sheet is only requested when
 * something is missing.
 * @param {Element} block
 * @param {Object<string, Element>} fields
 * @returns {Promise<{ row: Element, media: Element, details: Element }>}
 */
async function buildFromFields(block, fields) {
  const needsSheet = SHEET_FIELDS.some((field) => !fields[field]);
  const { product, products } = needsSheet ? await findProduct() : {};
  const sheet = product || {};
  const alt = sheet.imageAlt || sheet.title || sheet.name || '';

  const media = document.createElement('div');
  const front = fields.imageFront ? fieldPicture(fields.imageFront, alt)
    : sheet.image && buildPicture(sheet.image.trim(), alt);
  const back = fields.imageBack ? fieldPicture(fields.imageBack, alt)
    : sheet.imageBack && buildPicture(sheet.imageBack.trim(), sheet.imageBackAlt || alt);
  media.append(...[front, back].filter(Boolean));

  const details = document.createElement('div');
  const label = fields.label ? fields.label.textContent.trim() : sheetLabel(sheet);
  if (label) details.append(buildLabel(label));
  const name = fields.title ? fields.title.textContent.trim() : sheet.name || sheet.title;
  if (name) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    details.append(h1);
  }
  const sizes = fields.size ? fieldSizes(fields.size)
    : product && buildSizeList(product, products);
  // "Choose a size:" only when there is a choice; a single size is shown on its own, as on live
  if (sizes && sizes.querySelectorAll('li').length > 1) details.append(sizeLabelParagraph());
  if (sizes) details.append(sizes);
  if (fields.description) {
    details.append(...fieldBlocks(fields.description));
  } else if (sheet.description) {
    const p = document.createElement('p');
    p.textContent = sheet.description;
    details.append(p);
  }
  details.append(fieldButton(fields.button));

  const row = document.createElement('div');
  row.className = 'hero-product-row';
  row.append(media, details);
  block.replaceChildren(row);
  return { row, media, details };
}

export default async function decorate(block) {
  const { media, details } = await buildFromFields(block, readFields(block));
  // no image: drop the media cell so the layout does not reserve space for it
  if (media.querySelector('picture')) buildGallery(media);
  else media.remove();
  decorateDetails(details);
}
