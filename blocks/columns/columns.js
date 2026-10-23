import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns block.
 * Layout variants keep their authored rows. The recipe variant, authored as
 * Columns (Recipe), builds ingredients, tools, directions, and Bake Mode.
 */

function decorateColumns(block) {
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (block.classList.contains('homepage-hero') && pic) {
        const pictures = [...col.querySelectorAll('picture')];
        if (pictures.length === 2) {
          const [desktop, mobile] = pictures;
          const responsive = document.createElement('picture');
          [...mobile.querySelectorAll('source')].forEach((source) => {
            source.media = `(width < 900px)${source.media ? ` and ${source.media}` : ''}`;
            responsive.append(source);
          });
          const mobileImage = mobile.querySelector('img');
          if (!responsive.children.length && mobileImage) {
            const source = document.createElement('source');
            source.media = '(width < 900px)';
            source.srcset = mobileImage.src;
            responsive.append(source);
          }
          [...desktop.children].forEach((child) => responsive.append(child));
          const img = responsive.querySelector('img') || mobileImage;
          if (img) {
            if (!responsive.contains(img)) responsive.append(img);
            img.loading = 'eager';
            img.setAttribute('fetchpriority', 'high');
          } else {
            // eslint-disable-next-line no-console
            console.error('Homepage hero pictures require a fallback image', block);
          }
          col.replaceChildren(responsive);
        }
        col.classList.add('columns-img-col');
      }
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}

/**
 * Recipe variant of the columns block (class `recipe`, authored as Columns (Recipe)).
 *
 * Content model: 1 row x 2 cells.
 *   Ingredients cell: heading ("Ingredients") + unordered list.
 *   Method cell: heading ("You'll Need") + unordered list of tools, then
 *     heading ("Directions") + ordered list; each step holds its text followed by
 *     an optional step image.
 * Decoration: the method cell is split into heading-led panels; the tools panel becomes
 * a collapsible disclosure with a grid list; each direction step gets a "done" checkbox.
 * The cell holding an ordered list is treated as the method cell, regardless of order.
 * Ingredients: when the /recipes/ingredients sheet has a row whose `pagepath` matches the
 * current page, its non-empty `ingredientN` columns replace the authored ingredient list
 * (cells may hold links and basic inline HTML; the authored list stays as the fallback
 * when there is no row or the fetch fails).
 */

const INGREDIENTS_SHEET = '/recipes/ingredients.json';

const TOOLS_HEADING = /you.?ll\s+need|tools|equipment/i;
const DIRECTIONS_HEADING = /direction|instruction|method|steps/i;
const HEADING = 'h1, h2, h3, h4, h5, h6';
const SUMMARY_ITEM = /(Prep|Bake|Total):\s*([^|]+)/gi;

let blockCount = 0;

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
    // external (e.g. DAM-hosted) step images cannot be re-rendered; keep them below-the-fold lazy
    img.loading = 'lazy';
    img.decoding = 'async';
    return;
  }
  picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [
    { media: '(min-width: 900px)', width: '750' },
    { width: '600' },
  ]));
}

/**
 * Groups the children of a cell into panels, each starting at a heading.
 * Content before the first heading forms its own panel.
 * @param {Element} cell
 * @returns {HTMLElement[]}
 */
function splitPanels(cell) {
  const panels = [];
  let current = null;
  [...cell.children].forEach((el) => {
    if (!current || el.matches(HEADING)) {
      current = document.createElement('div');
      current.className = 'columns-recipe-panel';
      panels.push(current);
    }
    current.append(el);
  });
  return panels;
}

/**
 * Turns the tools panel into an (initially open) disclosure.
 * @param {HTMLElement} panel
 * @returns {HTMLElement}
 */
function buildTools(panel) {
  const heading = panel.querySelector(`:scope > :is(${HEADING})`);
  const details = document.createElement('details');
  details.className = 'columns-recipe-panel columns-recipe-tools';
  details.open = true;
  const summary = document.createElement('summary');
  summary.className = 'columns-recipe-tools-summary';
  summary.append(heading);
  const body = document.createElement('div');
  body.className = 'columns-recipe-tools-body';
  body.append(...panel.childNodes);
  body.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('columns-recipe-tools-list'));
  details.append(summary, body);
  return details;
}

/**
 * Decorates each ordered-list step: text wrapper, step media, and a done checkbox.
 * @param {HTMLOListElement} list
 * @param {number} id unique block index for checkbox ids
 */
function decorateSteps(list, id) {
  list.classList.add('columns-recipe-steps');
  [...list.children].forEach((li, i) => {
    li.classList.add('columns-recipe-step');

    const media = document.createElement('div');
    media.className = 'columns-recipe-step-media';
    li.querySelectorAll('picture').forEach((picture) => {
      const holder = picture.parentElement;
      media.append(picture);
      // drop wrappers left empty by moving the picture out
      if (holder !== li && !holder.children.length && !holder.textContent.trim()) holder.remove();
    });

    const text = document.createElement('div');
    text.className = 'columns-recipe-step-text';
    text.append(...li.childNodes);
    if (!text.textContent.trim() && !text.children.length) {
      // image-only step: keep the media, no checkbox
      if (media.children.length) {
        media.querySelectorAll('picture').forEach(optimize);
        li.append(media);
      } else {
        li.remove();
      }
      return;
    }

    const checkboxId = `columns-recipe-${id}-step-${i + 1}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.className = 'columns-recipe-step-check';
    checkbox.setAttribute('aria-label', `Mark step ${i + 1} as done`);
    checkbox.addEventListener('change', () => li.classList.toggle('is-done', checkbox.checked));

    li.append(checkbox, text);
    if (media.children.length) {
      media.querySelectorAll('picture').forEach(optimize);
      li.append(media);
    }
  });
}

/**
 * Moves an authored Tip paragraph into an accessible disclosure on the last step.
 * @param {HTMLElement} panel
 * @param {HTMLOListElement} list
 */
function decorateTip(panel, list) {
  const tip = [...panel.children]
    .find((child) => child !== list && /^Tip:/i.test(child.textContent.trim()));
  const lastStep = list.lastElementChild;
  if (!tip || !lastStep) return;

  const label = tip.querySelector('strong');
  if (label && /^Tip:?$/i.test(label.textContent.trim())) label.remove();
  const firstText = [...tip.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (firstText) firstText.textContent = firstText.textContent.replace(/^\s*:\s*/, '');

  const details = document.createElement('details');
  details.className = 'columns-recipe-tip';
  const summary = document.createElement('summary');
  summary.textContent = 'Tip';
  const content = document.createElement('div');
  content.className = 'columns-recipe-tip-content';
  content.append(tip);
  details.append(summary, content);
  lastStep.append(details);
}

/**
 * Decorates the method cell (tools + directions).
 * @param {Element} cell
 * @param {number} id
 */
function decorateMethod(cell, id) {
  cell.classList.add('columns-recipe-method');
  const panels = splitPanels(cell).map((panel) => {
    const heading = panel.querySelector(`:scope > :is(${HEADING})`);
    const title = heading ? heading.textContent : '';
    const ol = panel.querySelector(':scope > ol');
    if (heading && !ol && TOOLS_HEADING.test(title)) return buildTools(panel);
    if (ol || DIRECTIONS_HEADING.test(title)) {
      panel.classList.add('columns-recipe-directions');
      if (ol) {
        decorateSteps(ol, id);
        decorateTip(panel, ol);
      }
    }
    return panel;
  });
  cell.replaceChildren(...panels);
}

/**
 * Strips query, hash, extension and trailing slash so paths compare equal.
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  return (path || '').split(/[?#]/)[0].replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
}

/**
 * Loads the ingredient lines for the current page from the ingredients sheet.
 * @returns {Promise<string[]>} empty when the page has no row or the sheet is unavailable
 */
async function fetchIngredients() {
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}${INGREDIENTS_SHEET}?limit=1000`);
    if (!resp.ok) return [];
    const { data = [] } = await resp.json();
    const current = normalizePath(window.location.pathname);
    const row = data.find((r) => normalizePath(r.pagepath) === current);
    if (!row) return [];
    return Object.keys(row)
      .filter((key) => /^ingredient\d+$/i.test(key))
      .sort((a, b) => parseInt(a.slice(10), 10) - parseInt(b.slice(10), 10))
      .map((key) => String(row[key]).trim())
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Parses a sheet cell as HTML, keeping only links and basic inline formatting.
 * Anything else (scripts, handlers, unsafe URL schemes) is dropped; text is kept.
 * @param {string} html
 * @returns {DocumentFragment}
 */
function parseIngredient(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const allowed = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'SUP', 'SUB', 'BR']);
  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        clean(child);
        if (!allowed.has(child.tagName)) {
          if (/^(SCRIPT|STYLE)$/.test(child.tagName)) child.remove();
          else child.replaceWith(...child.childNodes);
          return;
        }
        const href = child.getAttribute('href');
        [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
        if (child.tagName === 'A' && href && /^(https?:|\/|#|mailto:)/i.test(href.trim())) {
          child.setAttribute('href', href.trim());
        }
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };
  clean(doc.body);
  const fragment = document.createDocumentFragment();
  fragment.append(...doc.body.childNodes);
  return fragment;
}

/**
 * Replaces the ingredient list in the cell with the sheet lines.
 * @param {Element} cell
 * @param {string[]} items
 */
function renderIngredients(cell, items) {
  const list = document.createElement('ul');
  items.forEach((text) => {
    const li = document.createElement('li');
    li.append(parseIngredient(text));
    list.append(li);
  });
  if (!cell.querySelector(HEADING)) {
    const heading = document.createElement('h2');
    heading.textContent = 'Ingredients';
    cell.prepend(heading);
  }
  cell.querySelectorAll(':scope > ul, :scope > ol').forEach((old) => old.remove());
  cell.append(list);
}

/**
 * Decorates the ingredients cell.
 * @param {Element} cell
 */
function decorateIngredients(cell) {
  cell.classList.add('columns-recipe-ingredients');
  cell.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
    list.classList.add('columns-recipe-ingredient-list');
    [...list.children].forEach((item) => {
      const firstText = [...item.childNodes]
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const amount = firstText?.textContent.match(
        /^(\s*(?:\d+\s+)?(?:\d+\/\d+|\d+)(?:\s+(?:cups?|tbsp|tsp))?)\s+/i,
      );
      if (!amount) return;

      firstText.textContent = firstText.textContent.slice(amount[0].length);
      const quantity = document.createElement('span');
      quantity.className = 'columns-recipe-ingredient-amount';
      quantity.textContent = amount[1].trim();
      const name = document.createElement('span');
      name.className = 'columns-recipe-ingredient-name';
      name.append(...item.childNodes);
      item.append(quantity, name);
    });
  });
  cell.querySelectorAll('picture').forEach(optimize);
}

/**
 * Creates one label/value item for the recipe summary.
 * @param {string} label
 * @param {string} value
 * @returns {HTMLDivElement}
 */
function buildSummaryItem(label, value) {
  const item = document.createElement('div');
  item.className = `columns-recipe-summary-item columns-recipe-summary-${label.toLowerCase()}`;
  const term = document.createElement('dt');
  term.textContent = `${label}:`;
  const description = document.createElement('dd');
  description.textContent = value;
  item.append(term, description);
  return item;
}

/**
 * Requests or releases the screen wake lock used by Bake Mode.
 * @param {HTMLInputElement} control
 * @param {HTMLElement} status
 * @param {{ sentinel: WakeLockSentinel|null }} state
 */
async function updateWakeLock(control, status, state) {
  if (!control.checked) {
    if (state.sentinel) await state.sentinel.release();
    state.sentinel = null;
    status.textContent = 'Bake Mode is off.';
    return;
  }

  try {
    state.sentinel = await navigator.wakeLock.request('screen');
    status.textContent = 'Bake Mode is on.';
    state.sentinel.addEventListener('release', () => {
      state.sentinel = null;
      if (document.visibilityState === 'visible' && control.checked) {
        control.checked = false;
        status.textContent = 'Bake Mode was turned off.';
      }
    });
  } catch (e) {
    control.checked = false;
    status.textContent = 'Bake Mode is not available on this device.';
  }
}

/**
 * Builds the progressively enhanced Bake Mode control.
 * @param {number} id
 * @returns {HTMLDivElement}
 */
function buildBakeMode(id) {
  const bakeMode = document.createElement('div');
  bakeMode.className = 'columns-recipe-bake-mode';

  const copy = document.createElement('div');
  copy.className = 'columns-recipe-bake-copy';
  const heading = document.createElement('p');
  heading.className = 'columns-recipe-bake-heading';
  heading.textContent = 'Bake Mode:';
  const description = document.createElement('p');
  description.textContent = 'Prevent your screen from going dark while you bake.';
  copy.append(heading, description);

  const label = document.createElement('label');
  label.className = 'columns-recipe-bake-switch';
  label.setAttribute('for', `columns-recipe-${id}-bake-mode`);
  const control = document.createElement('input');
  control.id = `columns-recipe-${id}-bake-mode`;
  control.type = 'checkbox';
  control.role = 'switch';
  control.setAttribute('aria-label', 'Bake Mode');
  const slider = document.createElement('span');
  slider.className = 'columns-recipe-bake-slider';
  label.append(control, slider);

  const status = document.createElement('span');
  status.className = 'columns-recipe-bake-status';
  status.setAttribute('aria-live', 'polite');

  if (!('wakeLock' in navigator)) {
    control.disabled = true;
    status.textContent = 'Bake Mode is not supported by this browser.';
  } else {
    const state = { sentinel: null };
    control.addEventListener('change', () => updateWakeLock(control, status, state));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && control.checked && !state.sentinel) {
        updateWakeLock(control, status, state);
      }
    });
  }

  bakeMode.append(copy, label, status);
  return bakeMode;
}

/**
 * Converts the authored heading and summary paragraphs above the block into the
 * production recipe summary layout and adds Bake Mode.
 * @param {HTMLElement} block
 * @param {number} id
 */
function decorateSummary(block, id) {
  const section = block.closest('.section');
  section?.classList.add('columns-recipe-section');
  const summary = section?.querySelector(':scope > .default-content-wrapper');
  if (!summary || summary.classList.contains('columns-recipe-summary')) return;

  const heading = summary.querySelector(':scope > h1, :scope > h2');
  if (!heading) return;

  summary.classList.add('columns-recipe-summary');
  heading.classList.add('columns-recipe-summary-heading');
  const main = document.createElement('div');
  main.className = 'columns-recipe-summary-main';
  main.append(heading);

  const paragraphs = [...summary.querySelectorAll(':scope > p')];
  const yields = paragraphs.find((paragraph) => /^Yields:/i.test(paragraph.textContent.trim()));
  if (yields) {
    const list = document.createElement('dl');
    list.className = 'columns-recipe-yield';
    list.append(buildSummaryItem('Yields', yields.textContent.replace(/^Yields:\s*/i, '')));
    main.append(list);
    yields.remove();
  }

  const times = document.createElement('dl');
  times.className = 'columns-recipe-times';
  paragraphs.forEach((paragraph) => {
    [...paragraph.textContent.matchAll(SUMMARY_ITEM)].forEach(([, label, value]) => {
      times.append(buildSummaryItem(label, value.trim()));
    });
    if (paragraph !== yields && paragraph.textContent.match(SUMMARY_ITEM)) paragraph.remove();
  });
  if (times.children.length) main.append(times);
  main.append(...summary.children);
  summary.replaceChildren(main, buildBakeMode(id));
}

async function decorateRecipe(block) {
  blockCount += 1;
  const id = blockCount;

  decorateSummary(block, id);
  const sheetItems = await fetchIngredients();

  [...block.children].forEach((row) => {
    row.classList.add('columns-recipe-row');
    const cells = [...row.children];

    // drop empty cells so the layout does not reserve space for them
    cells.filter((cell) => !cell.children.length && !cell.textContent.trim())
      .forEach((cell) => cell.remove());
    const filled = [...row.children];

    let method = filled.find((cell) => cell.querySelector(':scope > ol'));
    if (!method && filled.length > 1) [, method] = filled;
    const ingredients = filled.find((cell) => cell !== method);

    if (ingredients) {
      if (sheetItems.length) renderIngredients(ingredients, sheetItems);
      decorateIngredients(ingredients);
    }
    if (method) decorateMethod(method, id);
    row.classList.toggle('columns-recipe-single', filled.length < 2);
  });
}

/**
 * Decorates columns. Layout variants stay as authored content.
 * The recipe variant rebuilds ingredients and directions.
 * @param {Element} block The columns block element
 */
export default async function decorate(block) {
  if (!block.classList.contains('recipe')) {
    decorateColumns(block);
    return;
  }
  await decorateRecipe(block);
}
