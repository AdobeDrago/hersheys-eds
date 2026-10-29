/**
 * Nutrition variant of the recipe-details block (class `nutrition`, authored as
 * Recipe Details (Nutrition)), loaded by recipe-details.js.
 *
 * Content model: 1 row x 2 cells.
 *   Label cell: heading ("Nutrition Facts"); paragraphs "Servings Per Container 24",
 *     "Serving size 1 brownie (69g)", "Calories 290"; a list of nutrient lines
 *     ("Total Fat 14g 18%" or "Total Fat 14g | 18%"; nested items are sub-nutrients);
 *     a footnote paragraph.
 *   Aside cell: heading ("Additional questions?") + link (rendered as a button).
 * Decoration turns lines into aligned name / amount / %DV rows. The label cell is the one
 * with a list or a "Nutrition" heading, regardless of order.
 * The section is marked `recipe-details-nutrition-section`.
 */

const NUTRITION_DV = /\s+(\d+(?:\.\d+)?\s?%)\s*\*?$/;
const NUTRITION_AMOUNT = /\s+(<?\s?\d[\d.,]*\s?(?:g|mg|mcg|µg|iu|kcal))$/i;
const NUTRITION_SERVINGS = /servings?\s+per\s+container/i;
const NUTRITION_SERVING_SIZE = /^\s*serving\s+size\s+(.+)$/i;
const NUTRITION_CALORIES = /^\s*calories\s+(\d[\d,]*)\s*$/i;
const NUTRITION_DV_HEADER = /^\s*%\s*daily\s+value\*?\s*$/i;
const NUTRITION_SUB = /^(saturated|trans|poly|mono|dietary\s+fiber|soluble|insoluble|total\s+sugars|sugar\s+alcohol)/i;
const NUTRITION_ADDED_SUGARS = /^includes\b/i;
const NUTRITION_MAJOR = /^(total\s+fat|cholesterol|sodium|total\s+carbohydrate|protein)/i;
const NUTRITION_MICRO = /^(vitamin|calcium|iron|potassium|magnesium|zinc|folate|niacin|riboflavin|thiamin|phosphorus)/i;

/**
 * Creates a span with a class and text.
 * @param {string} className
 * @param {string} text
 */
function nutritionSpan(className, text) {
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
function parseNutritionLine(line) {
  let text = line.replace(/\s+/g, ' ').trim();
  let dv = '';
  if (text.includes('|')) {
    const parts = text.split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) dv = parts.pop();
    text = parts.join(' ');
  } else {
    const match = text.match(NUTRITION_DV);
    if (match) {
      [, dv] = match;
      text = text.slice(0, match.index).trim();
    }
  }
  let name = text;
  let amount = '';
  const amountMatch = text.match(NUTRITION_AMOUNT);
  if (amountMatch && amountMatch.index > 0) {
    [, amount] = amountMatch;
    name = text.slice(0, amountMatch.index).trim();
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
  const { name, amount, dv } = parseNutritionLine(line);
  const row = document.createElement('div');
  row.className = 'recipe-details-nutrition-row';
  const strong = source.querySelector(':scope > strong, :scope > b, :scope > p > strong');
  if (NUTRITION_MAJOR.test(name) || (strong && name.startsWith(strong.textContent.trim()))) {
    row.classList.add('recipe-details-nutrition-row-major');
  }
  if (NUTRITION_ADDED_SUGARS.test(name)) row.classList.add('recipe-details-nutrition-row-indent-2');
  else if (depth > 0 || NUTRITION_SUB.test(name)) row.classList.add('recipe-details-nutrition-row-indent');
  if (NUTRITION_MICRO.test(name)) row.classList.add('recipe-details-nutrition-row-micro');

  const label = document.createElement('span');
  label.className = 'recipe-details-nutrition-label';
  label.append(nutritionSpan('recipe-details-nutrition-name', name));
  if (amount) label.append(' ', nutritionSpan('recipe-details-nutrition-amount', amount));
  row.append(label);
  if (dv) {
    const dvEl = nutritionSpan('recipe-details-nutrition-dv', dv);
    // the visual "% Daily Value*" column header is not announced per row, so add the context
    dvEl.append(nutritionSpan('recipe-details-nutrition-sr-only', ' daily value'));
    row.append(dvEl);
  }
  return row;
}

/**
 * Converts a (possibly nested) nutrient list into rows.
 * @param {HTMLUListElement|HTMLOListElement} list
 * @returns {HTMLElement}
 */
function buildNutritionFacts(list) {
  const facts = document.createElement('div');
  facts.className = 'recipe-details-nutrition-facts';
  const walk = (ul, depth) => {
    [...ul.children].forEach((li) => {
      const clone = li.cloneNode(true);
      clone.querySelectorAll('ul, ol').forEach((nested) => nested.remove());
      const line = clone.textContent.trim();
      if (line) facts.append(buildNutrientRow(line, li, depth));
      li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => walk(sub, depth + 1));
    });
  };
  walk(list, 0);
  const firstMicro = facts.querySelector('.recipe-details-nutrition-row-micro');
  if (firstMicro) firstMicro.classList.add('recipe-details-nutrition-row-micro-first');
  return facts;
}

/**
 * Builds a two-part summary row (e.g. "Serving size" | "1 brownie (69g)").
 * @param {string} name
 * @param {string} value
 * @param {string} modifier
 */
function nutritionSummaryRow(name, value, modifier) {
  const row = document.createElement('div');
  row.className = `recipe-details-nutrition-summary recipe-details-nutrition-${modifier}`;
  row.append(nutritionSpan('recipe-details-nutrition-name', name), nutritionSpan('recipe-details-nutrition-value', value));
  return row;
}

/**
 * Decorates the Nutrition Facts label cell.
 * @param {Element} cell
 */
function decorateNutritionLabel(cell) {
  cell.classList.add('recipe-details-nutrition-panel');
  const heading = cell.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
  if (heading) heading.classList.add('recipe-details-nutrition-title');

  let dvHeaderPresent = false;
  let seenFacts = false;
  [...cell.children].forEach((el) => {
    if (el === heading) return;
    if (el.matches('ul, ol')) {
      const facts = buildNutritionFacts(el);
      if (!dvHeaderPresent) {
        const header = document.createElement('div');
        header.className = 'recipe-details-nutrition-dv-header';
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
    if (NUTRITION_DV_HEADER.test(text)) {
      el.classList.add('recipe-details-nutrition-dv-header');
      dvHeaderPresent = true;
      return;
    }
    if (seenFacts || text.startsWith('*')) {
      el.classList.add('recipe-details-nutrition-footnote');
      return;
    }
    if (NUTRITION_SERVINGS.test(text)) {
      // split "Servings Per Container 24" so the count can sit right-aligned
      const count = text.match(/^(.*?)\s+(\d[\d.,]*|varied)$/i);
      if (count) el.replaceWith(nutritionSummaryRow(count[1], count[2], 'servings'));
      else el.classList.add('recipe-details-nutrition-servings');
      return;
    }
    const size = text.match(NUTRITION_SERVING_SIZE);
    if (size) {
      el.replaceWith(nutritionSummaryRow('Serving size', size[1], 'serving-size'));
      return;
    }
    const calories = text.match(NUTRITION_CALORIES);
    if (calories) {
      el.replaceWith(nutritionSummaryRow('Calories', calories[1], 'calories'));
      return;
    }
    // pipe-delimited "Label | value" summary lines
    if (text.includes('|')) {
      const [name, ...rest] = text.split('|').map((part) => part.trim());
      if (name && rest.length) el.replaceWith(nutritionSummaryRow(name, rest.join(' '), 'line'));
    }
  });
}

/**
 * Decorates the contact aside cell.
 * @param {Element} cell
 */
function decorateNutritionAside(cell) {
  cell.classList.add('recipe-details-nutrition-aside');
  cell.querySelectorAll(':scope > p').forEach((paragraph) => {
    const links = paragraph.querySelectorAll('a[href]');
    if (links.length === 1 && paragraph.textContent.trim() === links[0].textContent.trim()) {
      paragraph.classList.add('recipe-details-nutrition-cta');
      links[0].classList.add('button');
    }
  });
}

/**
 * Decorates the nutrition variant.
 * @param {Element} block
 */
export default function decorate(block) {
  block.closest('.section')?.classList.add('recipe-details-nutrition-section');
  [...block.children].forEach((row) => {
    row.classList.add('recipe-details-nutrition-row-wrap');
    [...row.children].forEach((cell) => {
      if (!cell.children.length && !cell.textContent.trim()) cell.remove();
    });
    const cells = [...row.children];
    const label = cells.find((cell) => cell.querySelector(':scope > ul, :scope > ol'))
      || cells.find((cell) => /nutrition/i.test(cell.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || ''))
      || (cells.length > 1 ? cells[0] : null);
    cells.forEach((cell) => {
      if (cell === label) decorateNutritionLabel(cell);
      else decorateNutritionAside(cell);
    });
    row.classList.toggle('recipe-details-nutrition-single', cells.length < 2);
  });
}
