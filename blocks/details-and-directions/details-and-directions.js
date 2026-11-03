import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Details and Directions block for activity (craft) pages. Authored as Details and Directions
 * in a section whose Section Metadata Style is `activities`.
 *
 * Content model: 1 row x 2 cells.
 *   Supplies cell: heading ("You'll Need") + unordered list.
 *   Directions cell: heading ("Directions") + ordered list; each step holds its text followed by
 *     an optional step image. An optional heading-led tools list before it becomes a disclosure.
 * The cell holding an ordered list is treated as the directions cell, regardless of order.
 * When the first row has no authored supplies, they come from the `youllneed1..n` columns of
 * the page's row in the supplies sheet (matched on `pagepath`).
 * Generated, not authored: the section summary (heading + Yields) and the Make Mode switch.
 */

const TOOLS_HEADING = /you.?ll\s+need|tools|equipment/i;
const DIRECTIONS_HEADING = /direction|instruction|method|steps/i;
const HEADING = 'h1, h2, h3, h4, h5, h6';
const MODE_PARAGRAPH = /^\s*Make\s+Mode\s*:\s*(.*)$/i;
const MODE_LABEL = 'Make Mode';
const MODE_DESCRIPTION = 'Prevent your screen from going dark.';
const SUPPLIES_SHEET = '/activities/youllneedsteps.json';
const SUPPLIES_HEADING = 'You\'ll Need';
const SUPPLY_COLUMN = /^youllneed(\d+)$/;
const SITE_HOSTS = ['www.hersheyland.com', 'hersheyland.com'];

let blockCount = 0;
let suppliesSheet;

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
      current.className = 'details-and-directions-panel';
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
  details.className = 'details-and-directions-panel details-and-directions-tools';
  details.open = true;
  const summary = document.createElement('summary');
  summary.className = 'details-and-directions-tools-summary';
  summary.append(heading);
  const body = document.createElement('div');
  body.className = 'details-and-directions-tools-body';
  body.append(...panel.childNodes);
  body.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('details-and-directions-tools-list'));
  details.append(summary, body);
  return details;
}

/**
 * Decorates each ordered-list step: text wrapper, step media, and a done checkbox.
 * @param {HTMLOListElement} list
 * @param {number} id unique block index for checkbox ids
 */
function decorateSteps(list, id) {
  list.classList.add('details-and-directions-steps');
  [...list.children].forEach((li, i) => {
    li.classList.add('details-and-directions-step');

    const media = document.createElement('div');
    media.className = 'details-and-directions-step-media';
    li.querySelectorAll('picture').forEach((picture) => {
      const holder = picture.parentElement;
      media.append(picture);
      // drop wrappers left empty by moving the picture out
      if (holder !== li && !holder.children.length && !holder.textContent.trim()) holder.remove();
    });

    const text = document.createElement('div');
    text.className = 'details-and-directions-step-text';
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

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `details-and-directions-${id}-step-${i + 1}`;
    checkbox.className = 'details-and-directions-step-check';
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
  details.className = 'details-and-directions-tip';
  const summary = document.createElement('summary');
  summary.textContent = 'Tip';
  const content = document.createElement('div');
  content.className = 'details-and-directions-tip-content';
  content.append(tip);
  details.append(summary, content);
  lastStep.append(details);
}

/**
 * Decorates the directions cell (optional tools + directions).
 * @param {Element} cell
 * @param {number} id
 */
function decorateMethod(cell, id) {
  cell.classList.add('details-and-directions-method');
  const panels = splitPanels(cell).map((panel) => {
    const heading = panel.querySelector(`:scope > :is(${HEADING})`);
    const title = heading ? heading.textContent : '';
    const ol = panel.querySelector(':scope > ol');
    if (heading && !ol && TOOLS_HEADING.test(title)) return buildTools(panel);
    if (ol || DIRECTIONS_HEADING.test(title)) {
      panel.classList.add('details-and-directions-directions');
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
 * Turns supply paragraphs into list items so they share the list styling.
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
 * Decorates the supplies cell; a leading amount ("1 bag", "2 tsp") is split from the name.
 * @param {Element} cell
 */
function decorateSupplies(cell) {
  cell.classList.add('details-and-directions-supplies');
  listParagraphs(cell);
  cell.querySelectorAll(':scope > ul, :scope > ol').forEach((list) => {
    list.classList.add('details-and-directions-supply-list');
    [...list.children].forEach((item) => {
      const firstText = [...item.childNodes]
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const amount = firstText?.textContent.match(
        /^(\s*(?:\d+\s+)?(?:\d+\/\d+|\d+)(?:\s+(?:cups?|tbsp|tsp))?)\s+/i,
      );
      if (!amount) return;

      firstText.textContent = firstText.textContent.slice(amount[0].length);
      const quantity = document.createElement('span');
      quantity.className = 'details-and-directions-supply-amount';
      quantity.textContent = amount[1].trim();
      const name = document.createElement('span');
      name.className = 'details-and-directions-supply-name';
      name.append(...item.childNodes);
      item.append(quantity, name);
    });
  });
  cell.querySelectorAll('picture').forEach(optimize);
}

/**
 * @param {Element} [cell]
 * @returns {boolean} whether the cell holds authored supply items
 */
function hasSupplies(cell) {
  if (!cell) return false;
  return Boolean(cell.querySelector('li'))
    || [...cell.querySelectorAll(':scope > p')].some((p) => p.textContent.trim());
}

/**
 * Normalizes a page path so `/x/page.html`, `/x/page/` and full URLs compare equal.
 * @param {string} path
 * @returns {string}
 */
function pageKey(path) {
  const { pathname } = new URL(path, window.location.origin);
  return pathname.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
}

/**
 * Fetches the supplies sheet once per page; failures resolve to no rows.
 * @returns {Promise<object[]>}
 */
function fetchSuppliesSheet() {
  suppliesSheet ??= fetch(SUPPLIES_SHEET)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then((json) => (Array.isArray(json.data) ? json.data : []))
    .catch(() => []);
  return suppliesSheet;
}

/**
 * Supply values for a page, in column order (`youllneed1`, `youllneed2`, ...), blanks dropped.
 * @param {object[]} rows sheet rows
 * @param {string} pathname
 * @returns {string[]}
 */
function findSupplies(rows, pathname) {
  const key = pageKey(pathname);
  const row = rows.find((entry) => typeof entry?.pagepath === 'string'
    && entry.pagepath.trim() && pageKey(entry.pagepath.trim()) === key);
  if (!row) return [];
  return Object.keys(row)
    .map((column) => [Number(column.match(SUPPLY_COLUMN)?.[1]), row[column]])
    .filter(([index, value]) => index && typeof value === 'string' && value.trim())
    .sort(([a], [b]) => a - b)
    .map(([, value]) => value.trim());
}

/**
 * Site links become relative like authored ones (`/products/x`); only http(s) links survive.
 * @param {string} href
 * @returns {string|null}
 */
function supplyHref(href) {
  let url;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (!SITE_HOSTS.includes(url.hostname)) return url.href;
  return `${url.pathname.replace(/\.html$/, '')}${url.search}${url.hash}`;
}

/**
 * Builds a list item from a sheet value. The value may contain `<a>` links; everything else is
 * kept as text, so sheet markup never reaches the page as HTML.
 * @param {string} value
 * @returns {HTMLLIElement}
 */
function buildSupplyItem(value) {
  const li = document.createElement('li');
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  parsed.body.childNodes.forEach((node) => {
    const href = node.nodeName === 'A' ? supplyHref(node.getAttribute('href') || '') : null;
    if (!href) {
      li.append(node.textContent);
      return;
    }
    const link = document.createElement('a');
    link.href = href;
    link.textContent = node.textContent.trim();
    li.append(link);
  });
  return li;
}

/**
 * Fills a supplies cell (or a new one) from the sheet row for this page.
 * @param {Element} [cell] authored supplies cell without items, e.g. only a heading
 * @returns {Promise<Element|null>} the filled cell, or null when the sheet has nothing
 */
async function loadSupplies(cell) {
  const values = findSupplies(await fetchSuppliesSheet(), window.location.pathname);
  if (!values.length) return null;
  const target = cell ?? document.createElement('div');
  if (!target.querySelector(HEADING)) {
    const heading = document.createElement('h3');
    heading.textContent = SUPPLIES_HEADING;
    target.prepend(heading);
  }
  const list = document.createElement('ul');
  list.append(...values.map(buildSupplyItem));
  target.append(list);
  return target;
}

/**
 * Drops empty cells and identifies the supplies and directions cells of a row.
 * @param {Element} row
 * @returns {{ supplies?: Element, method?: Element }}
 */
function splitRow(row) {
  [...row.children]
    .filter((cell) => !cell.children.length && !cell.textContent.trim())
    .forEach((cell) => cell.remove());
  const filled = [...row.children];
  let method = filled.find((cell) => cell.querySelector(':scope > ol'));
  if (!method && filled.length > 1) [, method] = filled;
  return { supplies: filled.find((cell) => cell !== method), method };
}

/**
 * Creates one label/value item for the summary.
 * @param {string} label
 * @param {string} value
 * @returns {HTMLDivElement}
 */
function buildSummaryItem(label, value) {
  const item = document.createElement('div');
  item.className = `details-and-directions-summary-item details-and-directions-summary-${label.toLowerCase()}`;
  const term = document.createElement('dt');
  term.textContent = `${label}:`;
  const description = document.createElement('dd');
  description.textContent = value;
  item.append(term, description);
  return item;
}

/**
 * Requests or releases the screen wake lock used by Make Mode.
 * @param {HTMLInputElement} control
 * @param {HTMLElement} status
 * @param {{ sentinel: WakeLockSentinel|null }} state
 */
async function updateWakeLock(control, status, state) {
  if (!control.checked) {
    if (state.sentinel) await state.sentinel.release();
    state.sentinel = null;
    status.textContent = `${MODE_LABEL} is off.`;
    return;
  }

  try {
    state.sentinel = await navigator.wakeLock.request('screen');
    status.textContent = `${MODE_LABEL} is on.`;
    state.sentinel.addEventListener('release', () => {
      state.sentinel = null;
      if (document.visibilityState === 'visible' && control.checked) {
        control.checked = false;
        status.textContent = `${MODE_LABEL} was turned off.`;
      }
    });
  } catch (e) {
    control.checked = false;
    status.textContent = `${MODE_LABEL} is not available on this device.`;
  }
}

/**
 * Builds the progressively enhanced Make Mode control.
 * @param {number} id
 * @param {string} text description shown under the label
 * @returns {HTMLDivElement}
 */
function buildMode(id, text) {
  const mode = document.createElement('div');
  mode.className = 'details-and-directions-mode';

  const copy = document.createElement('div');
  copy.className = 'details-and-directions-mode-copy';
  const heading = document.createElement('p');
  heading.className = 'details-and-directions-mode-heading';
  heading.textContent = `${MODE_LABEL}:`;
  const description = document.createElement('p');
  description.textContent = text;
  copy.append(heading, description);

  const toggle = document.createElement('label');
  toggle.className = 'details-and-directions-mode-switch';
  toggle.setAttribute('for', `details-and-directions-${id}-mode`);
  const control = document.createElement('input');
  control.id = `details-and-directions-${id}-mode`;
  control.type = 'checkbox';
  control.role = 'switch';
  control.setAttribute('aria-label', MODE_LABEL);
  const slider = document.createElement('span');
  slider.className = 'details-and-directions-mode-slider';
  toggle.append(control, slider);

  const status = document.createElement('span');
  status.className = 'details-and-directions-mode-status';
  status.setAttribute('aria-live', 'polite');

  if (!('wakeLock' in navigator)) {
    control.disabled = true;
    status.textContent = `${MODE_LABEL} is not supported by this browser.`;
  } else {
    const state = { sentinel: null };
    control.addEventListener('change', () => updateWakeLock(control, status, state));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && control.checked && !state.sentinel) {
        updateWakeLock(control, status, state);
      }
    });
  }

  mode.append(toggle, copy, status);
  return mode;
}

/**
 * Converts the authored heading and summary paragraphs above the block into the
 * summary layout and adds Make Mode. An authored `Make Mode: ...` paragraph sets the
 * switch text and is not shown as a paragraph.
 * @param {HTMLElement} section
 * @param {number} id
 */
function decorateSummary(section, id) {
  section.classList.add('details-and-directions-section');
  const summary = section.querySelector(':scope > .default-content-wrapper');
  if (!summary || summary.classList.contains('details-and-directions-summary')) return;

  const heading = summary.querySelector(':scope > h1, :scope > h2');
  if (!heading) return;

  summary.classList.add('details-and-directions-summary');
  heading.classList.add('details-and-directions-summary-heading');
  const main = document.createElement('div');
  main.className = 'details-and-directions-summary-main';
  main.append(heading);

  const paragraphs = [...summary.querySelectorAll(':scope > p')];
  const modeParagraph = paragraphs.find((p) => MODE_PARAGRAPH.test(p.textContent));
  const modeText = modeParagraph?.textContent.match(MODE_PARAGRAPH)[1].trim() || MODE_DESCRIPTION;
  modeParagraph?.remove();

  const yields = paragraphs.find((p) => /^Yields:/i.test(p.textContent.trim()));
  if (yields) {
    const list = document.createElement('dl');
    list.className = 'details-and-directions-yield';
    list.append(buildSummaryItem('Yields', yields.textContent.replace(/^Yields:\s*/i, '')));
    main.append(list);
    yields.remove();
  }

  main.append(...summary.children);
  summary.replaceChildren(main, buildMode(id, modeText));
}

export default async function decorate(block) {
  const section = block.closest('.section');
  if (!section?.classList.contains('activities')) {
    // eslint-disable-next-line no-console
    console.error('Details and Directions needs the Section Metadata Style: activities', block);
    return;
  }
  blockCount += 1;
  const id = blockCount;

  decorateSummary(section, id);

  // authored supplies win; only an unauthored first row waits for the sheet
  if (!block.children.length) block.append(document.createElement('div'));
  const [firstRow] = block.children;
  const authored = splitRow(firstRow).supplies;
  if (!hasSupplies(authored)) {
    const loaded = await loadSupplies(authored);
    if (loaded && !authored) firstRow.prepend(loaded);
  }

  [...block.children].forEach((row) => {
    row.classList.add('details-and-directions-row');
    const { supplies, method } = splitRow(row);

    if (supplies) decorateSupplies(supplies);
    if (method) decorateMethod(method, id);
    row.classList.toggle('details-and-directions-single', row.children.length < 2);
  });
}
