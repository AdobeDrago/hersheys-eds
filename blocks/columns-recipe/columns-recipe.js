import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns (Recipe) block: ingredients | tools + directions.
 *
 * Content model: 1 row x 2 cells.
 *   Ingredients cell: heading ("Ingredients") + unordered list.
 *   Method cell: heading ("You'll Need") + unordered list of tools, then
 *     heading ("Directions") + ordered list; each step holds its text followed by
 *     an optional step image.
 * Decoration: the method cell is split into heading-led panels; the tools panel becomes
 * a collapsible disclosure with a grid list; each direction step gets a "done" checkbox.
 * The cell holding an ordered list is treated as the method cell, regardless of order.
 */

const TOOLS_HEADING = /you.?ll\s+need|tools|equipment/i;
const DIRECTIONS_HEADING = /direction|instruction|method|steps/i;
const HEADING = 'h1, h2, h3, h4, h5, h6';

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
      if (ol) decorateSteps(ol, id);
    }
    return panel;
  });
  cell.replaceChildren(...panels);
}

/**
 * Decorates the ingredients cell.
 * @param {Element} cell
 */
function decorateIngredients(cell) {
  cell.classList.add('columns-recipe-ingredients');
  cell.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => list.classList.add('columns-recipe-ingredient-list'));
  cell.querySelectorAll('picture').forEach(optimize);
}

export default function decorate(block) {
  blockCount += 1;
  const id = blockCount;

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

    if (ingredients) decorateIngredients(ingredients);
    if (method) decorateMethod(method, id);
    row.classList.toggle('columns-recipe-single', filled.length < 2);
  });
}
