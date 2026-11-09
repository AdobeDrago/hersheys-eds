import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';

let sliderId = 0;

// variants only brand pages author; their styles live in cards-brand.css
const BRAND_VARIANTS = ['brands', 'spotlight', 'stories', 'tiles', 'shop', 'grid', 'content'];

function isBrandPage() {
  return document.body.classList.contains('hershey-brand');
}

function decorateSlider(block, list) {
  sliderId += 1;
  list.id = `cards-slider-${sliderId}`;
  list.tabIndex = 0;
  // a `single` slider moves one card (and its gap) per click, as the Newest Treats do on hersheyland.com
  const single = block.classList.contains('single');
  const cardStep = () => list.firstElementChild.offsetWidth
    + (parseFloat(getComputedStyle(list).columnGap) || 0);
  const controls = document.createElement('div');
  controls.className = 'cards-slider-controls';
  const buttons = [-1, 1].map((direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = direction < 0 ? '\u2190' : '\u2192';
    button.setAttribute('aria-label', direction < 0 ? 'Previous cards' : 'Next cards');
    button.setAttribute('aria-controls', list.id);
    button.addEventListener('click', () => {
      list.scrollBy({
        left: direction * (single ? cardStep() : list.clientWidth),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
    controls.append(button);
    return button;
  });
  const dots = document.createElement('div');
  dots.className = 'cards-slider-dots';
  // related, callout and dots sliders, and the product, stories, content and brands sliders on
  // brand pages, show one page indicator per page of cards
  const paged = ['related', 'callout', 'dots'].some((name) => block.classList.contains(name))
    || (isBrandPage() && ['product', 'stories', 'content', 'brands'].some((name) => block.classList.contains(name)));
  // the brands slider pages by the cards that fit whole in the track, as on hersheyland.com
  const byCard = block.classList.contains('brands');
  // a page is the visible track width plus one gap; the track padding is not scrollable content
  const measure = () => {
    const style = getComputedStyle(list);
    const inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap) || 0;
    let step = list.clientWidth - inset + gap;
    const card = byCard && list.firstElementChild ? list.firstElementChild.offsetWidth + gap : 0;
    if (card) step = Math.max(1, Math.floor(step / card)) * card;
    return { inset, gap, step };
  };
  const update = () => {
    buttons[0].disabled = list.scrollLeft <= 1;
    buttons[1].disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
    // nothing to scroll: every card is visible, so the arrows and page indicator are not needed
    const fits = list.scrollWidth <= list.clientWidth + 1;
    controls.hidden = fits;
    dots.hidden = fits;
    if (!paged) return;
    // one kiss-shaped indicator per page of cards
    const { inset, gap, step } = measure();
    const pages = Math.max(1, Math.ceil((list.scrollWidth - inset + gap) / step - 0.01));
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
    const current = atEnd ? pages - 1 : Math.min(pages - 1, Math.round(list.scrollLeft / step));
    if (dots.children.length !== pages) {
      dots.replaceChildren(...Array.from({ length: pages }, (_, page) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cards-slider-dot';
        dot.setAttribute('aria-label', `Go to page ${page + 1}`);
        dot.setAttribute('aria-controls', list.id);
        dot.addEventListener('click', () => list.scrollTo({
          left: page * measure().step,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        }));
        return dot;
      }));
    }
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  };
  list.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(list);
  block.append(controls);
  if (paged) block.append(dots);
  update();
}

export default async function decorate(block) {
  // `Cards (brand, slider)` is the brand page product slider: same markup and styles as
  // `Cards (product, slider)`, so it is handled as the product variant
  if (block.classList.contains('brand') && block.classList.contains('slider')) {
    block.classList.add('product');
  }
  // `Cards (callout)` scrolls below 992px and lays out as a row of three from there
  const callout = block.classList.contains('callout');
  if (callout) block.classList.add('slider');
  if (block.classList.contains('product')) {
    // the product variant has its own markup, so it loads its own script and styles
    // `Cards (product, slider)` on brand pages: the product cards scroll like the other sliders
    const slider = block.classList.contains('slider') && isBrandPage();
    const [{ default: decorateProduct }] = await Promise.all([
      import('./cards-product.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-product.css`),
      slider ? loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-brand-slider.css`) : null,
    ]);
    await decorateProduct(block);
    const list = block.querySelector(':scope > ul');
    if (slider && list) decorateSlider(block, list);
    return;
  }
  if (block.classList.contains('quotes')) {
    // the quotes variant has its own markup, so it loads its own script and styles
    const [{ default: decorateQuotes }] = await Promise.all([
      import('./cards-quotes.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-quotes.css`),
    ]);
    decorateQuotes(block);
    return;
  }
  if (block.classList.contains('steps')) {
    // the steps variant has its own markup, so it loads its own script and styles
    const [{ default: decorateSteps }] = await Promise.all([
      import('./cards-steps.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-steps.css`),
    ]);
    decorateSteps(block);
    return;
  }
  if (block.classList.contains('wheel')) {
    // the wheel variant has its own markup, so it loads its own script and styles
    const [{ default: decorateWheel }] = await Promise.all([
      import('./cards-wheel.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-wheel.css`),
    ]);
    decorateWheel(block);
    return;
  }
  // brand page variants carry their own styles
  const brandStyles = BRAND_VARIANTS.some((variant) => block.classList.contains(variant))
    ? loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-brand.css`)
    : null;
  const calloutStyles = callout ? loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-callout.css`) : null;
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  const linkedImages = ['slider', 'welcome-cards', 'social', 'spotlight', 'grid'].some((variant) => block.classList.contains(variant));
  if (linkedImages) {
    ul.querySelectorAll('li').forEach((card) => {
      const picture = card.querySelector('.cards-card-image picture');
      const link = card.querySelector('.cards-card-body a[href]');
      if (picture && link && !picture.closest('a')) {
        const label = link.getAttribute('aria-label') || link.textContent.trim()
          || picture.querySelector('img')?.alt;
        if (!label) return;
        const imageLink = document.createElement('a');
        imageLink.href = link.href;
        imageLink.setAttribute('aria-label', label);
        picture.replaceWith(imageLink);
        imageLink.append(picture);
      }
    });
  }
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  // a grid tag reading "Popular" gets a star instead of the clock, as on hersheyland.com
  if (block.classList.contains('grid')) {
    ul.querySelectorAll('.cards-card-body p').forEach((tag) => {
      if (tag.nextElementSibling?.tagName === 'H3' && /^popular$/i.test(tag.textContent.trim())) {
        tag.classList.add('cards-card-tag-popular');
      }
    });
  }
  // recipes: authored cards win; Algolia only fills a block without any
  if (block.classList.contains('recipes')) {
    // the recipes styles cover authored cards too; Algolia only fills a block without any
    const authored = [...ul.children].some((li) => li.textContent.trim() || li.querySelector('img'));
    const [module] = await Promise.all([
      authored ? null : import('./cards-recipes.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards-recipes.css`),
    ]);
    if (module) ul.replaceChildren(...await module.default(block));
  }
  block.replaceChildren(ul);
  if (block.classList.contains('slider')) decorateSlider(block, ul);
  await Promise.all([brandStyles, calloutStyles]);
}
