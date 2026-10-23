import { decorateIcons, getMetadata, toClassName } from '../../scripts/aem.js';

/**
 * Tabs (nutrition) variant, loaded by tabs.js for `Tabs (nutrition)`.
 *
 * Content model: one row per tab, 2 cells (label | content).
 *   Nutrition Facts: paragraphs or list items written as "Name | amount | %DV"
 *     (or "Label | value") become aligned rows; other paragraphs stay as text.
 *   Ingredients: plain paragraphs.
 *   Dietary Info: icon images (or :icon: tokens) each followed by a label.
 * Nutrition Facts comes from the page brand's tab of the nutrition sheet
 * (/products/nutrition.json?sheet=<brand>, row matched by `bvid` GTIN) when
 * there is one; otherwise the authored content is used.
 */

const CELL_SEPARATOR = /\s+\|\s+/;
const NUTRITION_SHEET = '/products/nutrition.json';
const DV_FOOTNOTE = '* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.';
/* [label, sheet column, sub-rows]; each column has a matching `<column>DV` */
const FACTS = [
  ['Calories', 'calories'],
  ['Total Fat', 'totalFat', [['Saturated Fat', 'saturatedFat'], ['Trans Fat', 'transFat']]],
  ['Cholesterol', 'cholesterol'],
  ['Sodium', 'sodium'],
  ['Total Carbohydrates', 'totalCarbohydrates', [['Dietary Fiber', 'dietaryFiber']]],
  ['Total Sugars', 'totalSugars', [['Added Sugars', 'addedSugars']]],
  ['Protein', 'protein'],
  ['Vitamin D', 'vitaminD'],
  ['Calcium', 'calcium'],
  ['Iron', 'iron'],
  ['Potassium', 'potassium'],
];
let blockCount = 0;

/**
 * Sheet tab for the page's brand, from the last breadcrumb item
 * (HERSHEY'S -> hersheys, ROLO® -> rolo).
 * @returns {string}
 */
function brandSheetName() {
  const items = document.querySelectorAll('main .breadcrumb-trail li');
  const brand = items.length ? items[items.length - 1].textContent : '';
  return brand.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

/**
 * Loads only the page brand's nutrition tab and returns this product's row.
 * @returns {Promise<Object|null>}
 */
async function fetchNutritionRow() {
  const gtin = getMetadata('bvid');
  const sheet = brandSheetName();
  if (!gtin || !sheet) return null;
  try {
    const resp = await fetch(`${NUTRITION_SHEET}?sheet=${sheet}`);
    if (!resp.ok) return null;
    const { data = [] } = await resp.json();
    return data
      .map((row) => Object.fromEntries(Object.entries(row)
        .map(([key, value]) => [key.trim(), String(value).trim()])))
      .find((row) => row.gtin === gtin) || null;
  } catch {
    return null; // missing tab or network error: keep the authored table
  }
}

function textEl(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

/**
 * Builds Nutrition Facts content from a sheet row, in the authored line format.
 * @param {Object} row
 * @returns {Element[]}
 */
function buildFacts(row) {
  const out = [];
  if (row.servingSize) {
    const p = document.createElement('p');
    p.append(textEl('strong', `Serving size | ${row.servingSize}`));
    out.push(p);
  }
  if (row.servingsPerContainer) out.push(textEl('p', `Servings Per Container | ${row.servingsPerContainer}`));

  const summary = document.createElement('ul');
  [['Calories', 'calories'], ['Protein', 'protein'], ['Total Carbohydrates', 'totalCarbohydrates']]
    .filter(([, key]) => row[key])
    .forEach(([label, key]) => summary.append(textEl('li', `${label} | ${row[key]}`)));
  if (summary.children.length) out.push(summary);

  out.push(textEl('p', 'Amount per serving | % DV*'));
  const line = (label, key) => {
    const amount = row[key] || '-';
    const dv = row[`${key}DV`] || '-';
    if (amount === '-' && dv === '-') return null;
    return key === 'addedSugars'
      ? `Includes ${amount} Added Sugars | - | ${dv}`
      : `${label} | ${amount} | ${dv}`;
  };
  const facts = document.createElement('ul');
  FACTS.forEach(([label, key, subRows = []]) => {
    const text = line(label, key);
    if (!text) return;
    const li = document.createElement('li');
    li.append(textEl('p', text));
    const subs = subRows.map(([subLabel, subKey]) => line(subLabel, subKey)).filter(Boolean);
    if (subs.length) {
      const ul = document.createElement('ul');
      subs.forEach((sub) => ul.append(textEl('li', sub)));
      li.append(ul);
    }
    facts.append(li);
  });
  out.push(facts, textEl('p', DV_FOOTNOTE));
  return out;
}

/**
 * Splits "a | b | c" text into trimmed parts, or returns null when it is not a row.
 * @param {Element} el
 * @returns {string[]|null}
 */
function rowParts(el) {
  if (el.querySelector('picture, img, ul, ol')) return null;
  const parts = el.textContent.split(CELL_SEPARATOR).map((p) => p.trim());
  return parts.length > 1 ? parts : null;
}

/**
 * Builds a data row element from parts. A row whose source was bold is flagged.
 * @param {string[]} parts
 * @param {Element} source
 */
function buildRow(parts, source) {
  const row = document.createElement('div');
  row.className = 'tabs-nutrition-row';
  row.dataset.cells = parts.length;
  if (source.querySelector('strong, b') && source.textContent.trim()
    === source.querySelector('strong, b').textContent.trim()) {
    row.classList.add('tabs-nutrition-row-strong');
  }
  if (source.closest('li li')) row.classList.add('tabs-nutrition-row-indent');
  parts.forEach((text, i) => {
    const cell = document.createElement('span');
    cell.className = i === 0 ? 'tabs-nutrition-name' : 'tabs-nutrition-value';
    cell.textContent = text;
    row.append(cell);
  });
  return row;
}

/**
 * Converts pipe-delimited lines (paragraphs or list items) into grouped rows.
 * @param {Element} panel
 */
function decorateRows(panel) {
  // lists: each list whose items are all rows becomes one group
  panel.querySelectorAll(':scope ul, :scope ol').forEach((list) => {
    if (list.parentElement.closest('ul, ol')) return; // handled with its outer list
    const items = [...list.querySelectorAll('li')];
    const leafTexts = items.map((li) => {
      const clone = li.cloneNode(true);
      clone.querySelectorAll('ul, ol').forEach((l) => l.remove());
      return { li, parts: rowParts(clone) };
    });
    if (!leafTexts.length || leafTexts.some(({ parts }) => !parts)) return;
    const group = document.createElement('div');
    group.className = 'tabs-nutrition-table';
    // styling hook: list of "Label | value" = summary, list with %DV column = facts
    const twoCell = leafTexts.every(({ parts }) => parts.length === 2);
    group.classList.add(twoCell ? 'tabs-nutrition-summary' : 'tabs-nutrition-facts');
    leafTexts.forEach(({ li, parts }) => group.append(buildRow(parts, li)));
    list.replaceWith(group);
  });

  // paragraphs: consecutive row paragraphs with the same cell count form one group
  let group = null;
  [...panel.children].forEach((el) => {
    const parts = el.matches('p') ? rowParts(el) : null;
    if (!parts) {
      group = null;
      return;
    }
    if (!group || group.dataset.cells !== String(parts.length)) {
      group = document.createElement('div');
      group.className = 'tabs-nutrition-table tabs-nutrition-serving';
      group.dataset.cells = parts.length;
      el.before(group);
    }
    group.append(buildRow(parts, el));
    el.remove();
  });
}

/**
 * Converts `:icon-name:` text tokens (left as plain text when the backend does not
 * convert them) into `span.icon` elements and decorates them, so they render like
 * pipeline-converted icons. A token must stand alone (bounded by whitespace or the
 * start/end of the text) to avoid matching text such as ratios.
 * @param {Element} panel
 */
function decorateIconTokens(panel) {
  const token = /(^|\s):([a-z0-9][a-z0-9-]*):(?=\s|$)/gi;
  const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const text = node.nodeValue;
    token.lastIndex = 0;
    if (!token.test(text)) return;
    token.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let last = 0;
    let match = token.exec(text);
    while (match) {
      const start = match.index + match[1].length;
      if (start > last) fragment.append(text.slice(last, start));
      const span = document.createElement('span');
      span.className = `icon icon-${match[2].toLowerCase()}`;
      fragment.append(span);
      last = token.lastIndex;
      match = token.exec(text);
    }
    if (last < text.length) fragment.append(text.slice(last));
    node.replaceWith(fragment);
  });
  decorateIcons(panel);
}

/**
 * Groups icon images with their labels into badges.
 * @param {Element} panel
 */
function decorateBadges(panel) {
  const icons = [...panel.querySelectorAll('picture, span.icon')];
  if (!icons.length) return;

  let badges = null;
  icons.forEach((icon) => {
    const holder = icon.closest('p') || icon;
    // the panel is still detached here, so check for a parent rather than isConnected
    if (!holder.parentNode || holder.closest('.tabs-nutrition-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'tabs-nutrition-badge';
    const label = document.createElement('span');
    label.className = 'tabs-nutrition-badge-label';

    let text = holder.textContent.trim();
    const next = holder.nextElementSibling;
    if (!text && next && next.matches('p') && !next.querySelector('picture, span.icon')) {
      text = next.textContent.trim();
      next.remove();
    }
    label.textContent = text;
    const img = icon.querySelector('img');
    if (img && !img.alt) img.alt = '';

    if (!badges || badges.nextElementSibling !== holder) {
      badges = document.createElement('div');
      badges.className = 'tabs-nutrition-badges';
      holder.before(badges);
    }
    badge.append(icon);
    if (text) badge.append(label);
    badges.append(badge);
    if (holder !== icon) holder.remove();
  });
}

/**
 * Styling hooks: flags the panel by content type and marks the allergen statement.
 * @param {Element} panel
 */
function decoratePanelType(panel) {
  let type = 'text';
  if (panel.querySelector('.tabs-nutrition-table')) type = 'facts';
  else if (panel.querySelector('.tabs-nutrition-badges')) type = 'badges';
  panel.classList.add(`tabs-nutrition-panel-${type}`);
  panel.querySelectorAll(':scope > p').forEach((p) => {
    if (/^contains\b/i.test(p.textContent.trim())) p.classList.add('tabs-nutrition-allergen');
  });
}

export default async function decorate(block) {
  blockCount += 1;
  const prefix = `tabs-nutrition-${blockCount}`;
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) return;
  const sheetRow = await fetchNutritionRow();

  const tablist = document.createElement('div');
  tablist.className = 'tabs-nutrition-list';
  tablist.setAttribute('role', 'tablist');

  const buttons = [];
  const panels = [];
  const usedIds = new Set();

  rows.forEach((row, i) => {
    const [labelCell, ...contentCells] = [...row.children];
    let id = toClassName(labelCell.textContent) || `tab-${i + 1}`;
    if (usedIds.has(id)) id = `${id}-${i + 1}`;
    usedIds.add(id);

    // panel: merge every cell after the label (authors may add extra cells)
    const panel = document.createElement('div');
    panel.className = 'tabs-nutrition-panel';
    panel.id = `${prefix}-panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${prefix}-tab-${id}`);
    panel.tabIndex = 0;
    if (id === 'nutrition-facts' && sheetRow) {
      panel.append(...buildFacts(sheetRow));
      panel.dataset.source = 'sheet';
    } else {
      contentCells.forEach((cell) => panel.append(...cell.childNodes));
    }
    decorateRows(panel);
    decorateIconTokens(panel);
    decorateBadges(panel);
    decoratePanelType(panel);

    // tab button: move the label nodes (no HTML strings, Trusted Types safe)
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-nutrition-tab';
    button.id = `${prefix}-tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    const labelPara = labelCell.querySelector(':scope > p');
    button.append(...(labelPara && labelCell.children.length === 1
      ? labelPara.childNodes : labelCell.childNodes));

    buttons.push(button);
    panels.push(panel);
    tablist.append(button);
  });

  const select = (index, focus = false) => {
    buttons.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', active);
      btn.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) buttons[index].focus();
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => select(i));
    btn.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowRight') target = (i + 1) % buttons.length;
      else if (e.key === 'ArrowLeft') target = (i - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = buttons.length - 1;
      if (target === null) return;
      e.preventDefault();
      select(target, true);
    });
  });

  block.replaceChildren(tablist, ...panels);
  select(0);
}
