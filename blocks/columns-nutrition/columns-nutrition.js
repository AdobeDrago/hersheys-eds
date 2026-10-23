/**
 * Columns (Nutrition) block: Nutrition Facts label | "Additional questions?" contact box.
 *
 * Content model: 1 row x 2 cells.
 *   Label cell: heading ("Nutrition Facts"); paragraphs "Servings Per Container 24",
 *     "Serving size 1 brownie (69g)", "Calories 290"; a list of nutrient lines
 *     ("Total Fat 14g 18%" or "Total Fat 14g | 18%"; nested items are sub-nutrients);
 *     a footnote paragraph.
 *   Aside cell: heading ("Additional questions?") + link (rendered as a button).
 * Decoration turns lines into aligned name / amount / %DV rows. The label cell is the one
 * with a list or a "Nutrition" heading, regardless of order.
 */

const DV = /\s+(\d+(?:\.\d+)?\s?%)\s*\*?$/;
const AMOUNT = /\s+(<?\s?\d[\d.,]*\s?(?:g|mg|mcg|µg|iu|kcal))$/i;
const SERVINGS = /servings?\s+per\s+container/i;
const SERVING_SIZE = /^\s*serving\s+size\s+(.+)$/i;
const CALORIES = /^\s*calories\s+(\d[\d,]*)\s*$/i;
const DV_HEADER = /^\s*%\s*daily\s+value\*?\s*$/i;
const SUB_NUTRIENT = /^(saturated|trans|poly|mono|dietary\s+fiber|soluble|insoluble|total\s+sugars|sugar\s+alcohol)/i;
const ADDED_SUGARS = /^includes\b/i;
const MAJOR_NUTRIENT = /^(total\s+fat|cholesterol|sodium|total\s+carbohydrate|protein)/i;
const MICRO_NUTRIENT = /^(vitamin|calcium|iron|potassium|magnesium|zinc|folate|niacin|riboflavin|thiamin|phosphorus)/i;

/**
 * Creates a span with a class and text.
 * @param {string} className
 * @param {string} text
 */
function span(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

/**
 * Splits a nutrient line into name, amount and %DV.
 * @param {string} line
 * @returns {{ name: string, amount: string, dv: string }}
 */
function parseLine(line) {
  let text = line.replace(/\s+/g, ' ').trim();
  let dv = '';
  if (text.includes('|')) {
    const parts = text.split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) dv = parts.pop();
    text = parts.join(' ');
  } else {
    const m = text.match(DV);
    if (m) {
      [, dv] = m;
      text = text.slice(0, m.index).trim();
    }
  }
  let name = text;
  let amount = '';
  const a = text.match(AMOUNT);
  if (a && a.index > 0) {
    [, amount] = a;
    name = text.slice(0, a.index).trim();
  }
  return { name, amount, dv };
}

/**
 * Builds a nutrient row.
 * @param {string} line
 * @param {Element} source authored element (for bold / nesting)
 * @param {number} depth list nesting depth (0 = top level)
 */
function buildNutrientRow(line, source, depth) {
  const { name, amount, dv } = parseLine(line);
  const row = document.createElement('div');
  row.className = 'columns-nutrition-row';
  const strong = source.querySelector(':scope > strong, :scope > b, :scope > p > strong');
  if (MAJOR_NUTRIENT.test(name) || (strong && name.startsWith(strong.textContent.trim()))) {
    row.classList.add('columns-nutrition-row-major');
  }
  if (ADDED_SUGARS.test(name)) row.classList.add('columns-nutrition-row-indent-2');
  else if (depth > 0 || SUB_NUTRIENT.test(name)) row.classList.add('columns-nutrition-row-indent');
  if (MICRO_NUTRIENT.test(name)) row.classList.add('columns-nutrition-row-micro');

  const label = document.createElement('span');
  label.className = 'columns-nutrition-label';
  label.append(span('columns-nutrition-name', name));
  if (amount) label.append(' ', span('columns-nutrition-amount', amount));
  row.append(label);
  if (dv) {
    const dvEl = span('columns-nutrition-dv', dv);
    // the visual "% Daily Value*" column header is not announced per row, so add the context
    dvEl.append(span('columns-nutrition-sr-only', ' daily value'));
    row.append(dvEl);
  }
  return row;
}

/**
 * Converts a (possibly nested) nutrient list into rows.
 * @param {HTMLUListElement|HTMLOListElement} list
 * @returns {HTMLElement}
 */
function buildFacts(list) {
  const facts = document.createElement('div');
  facts.className = 'columns-nutrition-facts';
  const walk = (ul, depth) => {
    [...ul.children].forEach((li) => {
      const clone = li.cloneNode(true);
      clone.querySelectorAll('ul, ol').forEach((l) => l.remove());
      const line = clone.textContent.trim();
      if (line) facts.append(buildNutrientRow(line, li, depth));
      li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => walk(sub, depth + 1));
    });
  };
  walk(list, 0);
  const firstMicro = facts.querySelector('.columns-nutrition-row-micro');
  if (firstMicro) firstMicro.classList.add('columns-nutrition-row-micro-first');
  return facts;
}

/**
 * Builds a two-part summary row (e.g. "Serving size" | "1 brownie (69g)").
 * @param {string} name
 * @param {string} value
 * @param {string} modifier
 */
function summaryRow(name, value, modifier) {
  const row = document.createElement('div');
  row.className = `columns-nutrition-summary columns-nutrition-${modifier}`;
  row.append(span('columns-nutrition-name', name), span('columns-nutrition-value', value));
  return row;
}

/**
 * Decorates the Nutrition Facts label cell.
 * @param {Element} cell
 */
function decorateLabel(cell) {
  cell.classList.add('columns-nutrition-panel');
  const heading = cell.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
  if (heading) heading.classList.add('columns-nutrition-title');

  let dvHeaderPresent = false;
  let seenFacts = false;
  [...cell.children].forEach((el) => {
    if (el === heading) return;
    if (el.matches('ul, ol')) {
      const facts = buildFacts(el);
      if (!dvHeaderPresent) {
        const header = document.createElement('div');
        header.className = 'columns-nutrition-dv-header';
        header.textContent = '% Daily Value*';
        // visual column header only: each %DV value carries its own screen-reader context
        header.setAttribute('aria-hidden', 'true');
        facts.prepend(header);
        dvHeaderPresent = true;
      }
      el.replaceWith(facts);
      seenFacts = true;
      return;
    }
    if (!el.matches('p')) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) {
      el.remove();
      return;
    }
    if (DV_HEADER.test(text)) {
      el.classList.add('columns-nutrition-dv-header');
      dvHeaderPresent = true;
      return;
    }
    if (seenFacts || text.startsWith('*')) {
      el.classList.add('columns-nutrition-footnote');
      return;
    }
    if (SERVINGS.test(text)) {
      // split "Servings Per Container 24" so the count can sit right-aligned
      const count = text.match(/^(.*?)\s+(\d[\d.,]*|varied)$/i);
      if (count) el.replaceWith(summaryRow(count[1], count[2], 'servings'));
      else el.classList.add('columns-nutrition-servings');
      return;
    }
    const size = text.match(SERVING_SIZE);
    if (size) {
      el.replaceWith(summaryRow('Serving size', size[1], 'serving-size'));
      return;
    }
    const calories = text.match(CALORIES);
    if (calories) {
      el.replaceWith(summaryRow('Calories', calories[1], 'calories'));
      return;
    }
    // pipe-delimited "Label | value" summary lines
    if (text.includes('|')) {
      const [name, ...rest] = text.split('|').map((p) => p.trim());
      if (name && rest.length) el.replaceWith(summaryRow(name, rest.join(' '), 'line'));
    }
  });
}

/**
 * Decorates the contact aside cell.
 * @param {Element} cell
 */
function decorateAside(cell) {
  cell.classList.add('columns-nutrition-aside');
  cell.querySelectorAll(':scope > p').forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    if (links.length === 1 && p.textContent.trim() === links[0].textContent.trim()) {
      p.classList.add('columns-nutrition-cta');
      links[0].classList.add('button');
    }
  });
}

export default function decorate(block) {
  block.closest('.section')?.classList.add('columns-nutrition-section');
  [...block.children].forEach((row) => {
    row.classList.add('columns-nutrition-row-wrap');
    [...row.children].forEach((cell) => {
      if (!cell.children.length && !cell.textContent.trim()) cell.remove();
    });
    const cells = [...row.children];
    const label = cells.find((cell) => cell.querySelector(':scope > ul, :scope > ol'))
      || cells.find((cell) => /nutrition/i.test(cell.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || ''))
      || (cells.length > 1 ? cells[0] : null);
    cells.forEach((cell) => {
      if (cell === label) decorateLabel(cell);
      else decorateAside(cell);
    });
    row.classList.toggle('columns-nutrition-single', cells.length < 2);
  });
}
