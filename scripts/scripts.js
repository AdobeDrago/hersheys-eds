import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  getMetadata,
  toClassName,
} from './aem.js';
import loadHersheyTheme from './hershey-theme.js';
import { BRAND_THEMES } from './brand-themes.js';

/**
 * Resolves once the page is shown to the user. A speculatively prerendered
 * page waits for activation so third-party scripts never run unseen.
 * @returns {Promise<void>}
 */
export function whenActivated() {
  if (!document.prerendering) return Promise.resolve();
  return new Promise((resolve) => {
    document.addEventListener('prerenderingchange', () => resolve(), { once: true });
  });
}

/**
 * Runs a callback the first time an element scrolls into view, so blocks
 * call third-party APIs only once they're visible (never before first paint).
 * A hidden element never intersects, so the callback never runs.
 * @param {Element} el
 * @param {Function} callback
 */
export function whenVisible(el, callback) {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    callback();
  });
  io.observe(el);
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

function preloadLink(attributes) {
  const link = document.createElement('link');
  Object.entries(attributes).forEach(([name, value]) => link.setAttribute(name, value));
  document.head.append(link);
}

/**
 * Product pages: starts what the product hero waits for alongside the theme and block code, at
 * the URLs hero-product.js requests them with, so it reuses these responses.
 * - its own script and styles (hero.js loads them only after itself)
 * - the product master sheet tab its fields come from, when the block leaves fields empty
 * - its first image (the LCP image), the page's own product image (`image` metadata), unless the
 *   block authors one, in the gallery's renditions (1000px wide from 900px, else 750px)
 * @param {Element} doc The container element
 */
function preloadProductHero(doc) {
  const block = doc.querySelector('main .hero.product');
  if (!block) return;
  // the product hero's code, which hero.js would only import once it has loaded itself
  const base = window.hlx.codeBasePath;
  preloadLink({ rel: 'modulepreload', href: `${base}/blocks/hero/hero-product.js` });
  // the hero's authored fields (field name aliases as in hero-product.js)
  const ALIASES = {
    'image-front': 'imageFront', 'front-image': 'imageFront', image: 'imageFront', 'image-back': 'imageBack', 'back-image': 'imageBack', title: 'title', name: 'title', description: 'description', size: 'size', sizes: 'size',
  };
  const authored = new Set();
  [...block.children].forEach((row) => {
    const [key, value] = row.children;
    const field = ALIASES[toClassName(key?.textContent || '')];
    if (field && (value?.textContent.trim() || value?.querySelector('picture, img'))) authored.add(field);
  });
  let image = '';
  try {
    image = new URL(getMetadata('og:image'), window.location.href).pathname;
  } catch {
    // no page image
  }
  const pageImage = !authored.has('imageFront') && image.includes('/media_');
  // the hero reads the sheet only for fields the block leaves out (the page image stands in for
  // the front image)
  const needsSheet = ['imageFront', 'imageBack', 'title', 'size', 'description']
    .some((field) => !authored.has(field) && !(field === 'imageFront' && pageImage));
  const sheet = getMetadata('brand').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
  if (needsSheet && sheet) {
    preloadLink({
      rel: 'preload', as: 'fetch', crossorigin: 'anonymous', href: `/products/product-master.json?sheet=${sheet}`,
    });
  }
  if (!pageImage) return;
  [['(min-width: 900px)', 1000], ['(max-width: 899px)', 750]].forEach(([media, width]) => {
    preloadLink({
      rel: 'preload', as: 'image', type: 'image/webp', fetchpriority: 'high', media, href: `${image}?width=${width}&format=webply&optimize=medium`,
    });
  });
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // product pages author `theme: hershey-primary`; flag them so the Hershey tokens load
  if (window.location.pathname.startsWith('/products/')) document.body.classList.add('hershey-product');
  // listing pages (activities, all-recipes) share the product pages' brand tokens and fonts;
  // activity detail pages author `template: hershey-recipe` and keep the recipe layout
  if (/^\/(about|activities|all-recipes|products|stories)(\/|$)/.test(window.location.pathname)
    && !document.body.classList.contains('hershey-recipe')) document.body.classList.add('hershey-product');
  // story pages share the product pages' brand tokens and fonts
  if (window.location.pathname.startsWith('/stories/')) document.body.classList.add('hershey-product', 'hershey-story');
  // product pages: the product hero's sheet and image are requested now, in parallel with the
  // theme and block code, instead of after hero-product.js has loaded
  preloadProductHero(doc);
  let themeReady = Promise.resolve();
  if (document.body.classList.contains('hershey-home')
    || document.body.classList.contains('hershey-product')
    || document.body.classList.contains('hershey-recipe')) {
    // brand themes (e.g. `theme: reese-primary`) override the product hero and card tokens
    const brandTheme = BRAND_THEMES.find(({ value }) => document.body.classList.contains(value));
    const base = window.hlx.codeBasePath;
    const isBrandPage = brandTheme?.file === 'brands';
    if (isBrandPage) document.body.classList.add('hershey-brand');
    // the theme stylesheets load together (brand pages also load their section styles); the
    // page is revealed once they are in, while the blocks above the fold load in parallel
    themeReady = Promise.all([
      loadHersheyTheme(),
      isBrandPage ? loadCSS(`${base}/styles/hershey-brand.css`) : null,
      brandTheme ? loadCSS(`${base}/design/themes/${brandTheme.file || brandTheme.value}.css`) : null,
    ]);
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    // the hero is the LCP element but is often not the first section (the breadcrumb is), so
    // load the sections up to it together; each is revealed only once the ones above it are,
    // so the hero can never appear above a section that is still loading
    const sections = [...main.querySelectorAll(':scope > .section')];
    const hero = main.querySelector('.hero')?.closest('.section');
    let above = Promise.resolve();
    const loaded = Promise.all(sections.slice(0, sections.indexOf(hero) + 1 || 1).map((section) => {
      const waitFor = above;
      above = loadSection(section, async (done) => {
        await waitFor;
        if (done === sections[0] || done === hero) await waitForFirstImage(done);
      });
      return above;
    }));
    await themeReady;
    document.body.classList.add('appear');
    await loaded;
  } else {
    await themeReady;
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  // pages can opt out of the site header with `header: off` in page metadata
  if (getMetadata('header').toLowerCase() !== 'off') {
    loadHeader(doc.querySelector('body > header'));
  }

  const main = doc.querySelector('main');
  await loadSections(main);

  // the homepage's feature bands fade up as they scroll into view
  if (doc.body.classList.contains('homepage')) {
    import('./scroll-reveal.js').then(({ default: revealOnScroll }) => revealOnScroll(main));
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Product pages: warm up PriceSpider and the where-to-buy page behind Shop Now.
 */
function warmUpShopNow() {
  const shopNow = window.location.pathname.startsWith('/products/')
    && document.querySelector('a[href*="/where-to-buy"]');
  if (!shopNow) return;
  [
    ['prefetch', '//cdn.pricespider.com/1/lib/ps-widget.js'],
    ['prerender', shopNow.getAttribute('href')],
  ].forEach(([rel, href]) => {
    const hint = document.createElement('link');
    hint.rel = rel;
    hint.href = href;
    document.head.append(hint);
  });
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // third-party tags and consent load after first paint (not while prerendered)
  whenActivated().then(() => {
    warmUpShopNow();
    window.setTimeout(() => import('./delayed.js'), 3000);
  });
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
