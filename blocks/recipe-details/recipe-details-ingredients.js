import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Ingredients variant of the recipe-details block (class `ingredients`, authored as
 * Recipe Details (Ingredients)), loaded by recipe-details.js.
 *
 * Content model: 1 row x 2 cells.
 *   Ingredients cell: heading ("Ingredients") + unordered list.
 *   Method cell: heading ("You'll Need") + unordered list of tools, then
 *     heading ("Directions") + ordered list; each step holds its text followed by
 *     an optional step image.
 * Decoration: the method cell is split into heading-led panels; the tools panel becomes
 * a collapsible disclosure with a grid list; each direction step gets a "done" checkbox.
 * The cell holding an ordered list is treated as the method cell, regardless of order.
 * Ingredients: authored ingredients (a list or paragraphs) always win and are the only values
 * shown. Only when the ingredients cell holds nothing but a heading (or is missing) is the
 * /recipes/ingredients sheet fetched; the row whose
 * `pagepath` matches the current page supplies its non-empty `ingredientN` columns
 * (cells may hold links and basic inline HTML).
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
      current.className = 'recipe-details-ingredients-panel';
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
  details.className = 'recipe-details-ingredients-panel recipe-details-ingredients-tools';
  details.open = true;
  const summary = document.createElement('summary');
  summary.className = 'recipe-details-ingredients-tools-summary';
  summary.append(heading);
  const body = document.createElement('div');
  body.className = 'recipe-details-ingredients-tools-body';
  body.append(...panel.childNodes);
  body.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('recipe-details-ingredients-tools-list'));
  details.append(summary, body);
  return details;
}

/**
 * Decorates each ordered-list step: text wrapper, step media, and a done checkbox.
 * @param {HTMLOListElement} list
 * @param {number} id unique block index for checkbox ids
 */
function decorateSteps(list, id) {
  list.classList.add('recipe-details-ingredients-steps');
  [...list.children].forEach((li, i) => {
    li.classList.add('recipe-details-ingredients-step');

    const media = document.createElement('div');
    media.className = 'recipe-details-ingredients-step-media';
    li.querySelectorAll('picture').forEach((picture) => {
      const holder = picture.parentElement;
      media.append(picture);
      // drop wrappers left empty by moving the picture out
      if (holder !== li && !holder.children.length && !holder.textContent.trim()) holder.remove();
    });

    const text = document.createElement('div');
    text.className = 'recipe-details-ingredients-step-text';
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

    const checkboxId = `recipe-details-ingredients-${id}-step-${i + 1}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.className = 'recipe-details-ingredients-step-check';
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
  details.className = 'recipe-details-ingredients-tip';
  const summary = document.createElement('summary');
  summary.textContent = 'Tip';
  const content = document.createElement('div');
  content.className = 'recipe-details-ingredients-tip-content';
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
  cell.classList.add('recipe-details-ingredients-method');
  const panels = splitPanels(cell).map((panel) => {
    const heading = panel.querySelector(`:scope > :is(${HEADING})`);
    const title = heading ? heading.textContent : '';
    const ol = panel.querySelector(':scope > ol');
    if (heading && !ol && TOOLS_HEADING.test(title)) return buildTools(panel);
    if (ol || DIRECTIONS_HEADING.test(title)) {
      panel.classList.add('recipe-details-ingredients-directions');
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
 * Authored ingredient lines: everything in the cell except headings.
 * @param {Element} [cell]
 * @returns {Element[]}
 */
function authoredIngredients(cell) {
  if (!cell) return [];
  return [...cell.children].filter((el) => !el.matches(HEADING)
    && (el.textContent.trim() || el.querySelector('picture')));
}

/**
 * Turns ingredient paragraphs into list items so they share the list styling.
 * @param {Element} cell
 */
function listParagraphs(cell) {
  const paragraphs = [...cell.querySelectorAll(':scope > p')].filter((p) => p.textContent.trim());
  if (!paragraphs.length || cell.querySelector(':scope > ul, :scope > ol')) return;
  const list = document.createElement('ul');
  paragraphs.forEach((p) => {
    const li = document.createElement('li');
    li.append(...p.childNodes);
    list.append(li);
    p.remove();
  });
  cell.append(list);
}

/**
 * Decorates the ingredients cell.
 * @param {Element} cell
 */
function decorateIngredients(cell) {
  cell.classList.add('recipe-details-ingredients-ingredients');
  listParagraphs(cell);
  cell.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
    list.classList.add('recipe-details-ingredients-ingredient-list');
    [...list.children].forEach((item) => {
      const firstText = [...item.childNodes]
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const amount = firstText?.textContent.match(
        /^(\s*(?:\d+\s+)?(?:\d+\/\d+|\d+)(?:\s+(?:cups?|tbsp|tsp))?)\s+/i,
      );
      if (!amount) return;

      firstText.textContent = firstText.textContent.slice(amount[0].length);
      const quantity = document.createElement('span');
      quantity.className = 'recipe-details-ingredients-ingredient-amount';
      quantity.textContent = amount[1].trim();
      const name = document.createElement('span');
      name.className = 'recipe-details-ingredients-ingredient-name';
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
  item.className = `recipe-details-ingredients-summary-item recipe-details-ingredients-summary-${label.toLowerCase()}`;
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
  bakeMode.className = 'recipe-details-ingredients-bake-mode';

  const copy = document.createElement('div');
  copy.className = 'recipe-details-ingredients-bake-copy';
  const heading = document.createElement('p');
  heading.className = 'recipe-details-ingredients-bake-heading';
  heading.textContent = 'Bake Mode:';
  const description = document.createElement('p');
  description.textContent = 'Prevent your screen from going dark while you bake.';
  copy.append(heading, description);

  const label = document.createElement('label');
  label.className = 'recipe-details-ingredients-bake-switch';
  label.setAttribute('for', `recipe-details-ingredients-${id}-bake-mode`);
  const control = document.createElement('input');
  control.id = `recipe-details-ingredients-${id}-bake-mode`;
  control.type = 'checkbox';
  control.role = 'switch';
  control.setAttribute('aria-label', 'Bake Mode');
  const slider = document.createElement('span');
  slider.className = 'recipe-details-ingredients-bake-slider';
  label.append(control, slider);

  const status = document.createElement('span');
  status.className = 'recipe-details-ingredients-bake-status';
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
  section?.classList.add('recipe-details-ingredients-section');
  const summary = section?.querySelector(':scope > .default-content-wrapper');
  if (!summary || summary.classList.contains('recipe-details-ingredients-summary')) return;

  const heading = summary.querySelector(':scope > h1, :scope > h2');
  if (!heading) return;

  summary.classList.add('recipe-details-ingredients-summary');
  heading.classList.add('recipe-details-ingredients-summary-heading');
  const main = document.createElement('div');
  main.className = 'recipe-details-ingredients-summary-main';
  main.append(heading);

  const paragraphs = [...summary.querySelectorAll(':scope > p')];
  const yields = paragraphs.find((paragraph) => /^Yields:/i.test(paragraph.textContent.trim()));
  if (yields) {
    const list = document.createElement('dl');
    list.className = 'recipe-details-ingredients-yield';
    list.append(buildSummaryItem('Yields', yields.textContent.replace(/^Yields:\s*/i, '')));
    main.append(list);
    yields.remove();
  }

  const times = document.createElement('dl');
  times.className = 'recipe-details-ingredients-times';
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

export default async function decorate(block) {
  blockCount += 1;
  const id = blockCount;

  decorateSummary(block, id);

  await Promise.all([...block.children].map(async (row) => {
    row.classList.add('recipe-details-ingredients-row');

    // drop empty cells so the layout does not reserve space for them
    [...row.children]
      .filter((cell) => !cell.children.length && !cell.textContent.trim())
      .forEach((cell) => cell.remove());
    const filled = [...row.children];

    let method = filled.find((cell) => cell.querySelector(':scope > ol'));
    if (!method && filled.length > 1) [, method] = filled;
    let ingredients = filled.find((cell) => cell !== method);

    if (!authoredIngredients(ingredients).length) {
      const sheetItems = await fetchIngredients();
      if (sheetItems.length) {
        if (!ingredients) {
          ingredients = document.createElement('div');
          row.prepend(ingredients);
        }
        renderIngredients(ingredients, sheetItems);
      }
    }

    if (ingredients) decorateIngredients(ingredients);
    if (method) decorateMethod(method, id);
    row.classList.toggle('recipe-details-ingredients-single', row.children.length < 2);
  }));
}
