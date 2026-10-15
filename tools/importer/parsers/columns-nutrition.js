/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-nutrition. Base: columns (custom local block, blocks/columns-nutrition).
 * Source: https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html
 * Block contract: 1 row x 2 cells.
 *   Cell 1 (label): <h3>Nutrition Facts</h3>; <p>Servings Per Container 24</p>;
 *     <p>Serving size 1 brownie (69g)</p>; <p>Calories 290</p>;
 *     <ul> of nutrient lines "Name amount | %DV" (major nutrient names bold; level-2/3
 *     sub-nutrients nested under their parent); footnote <p>.
 *     "% Daily Value*" header and "Amount per serving" are block-generated / decoration.
 *   Cell 2 (aside): <h4>Additional questions?</h4> + <p><a>Contact Customer Service</a></p>.
 * Source DOM (.nutritional-ingredient-comp):
 *   .nutrition-facts-head .h1 / .per-container / .serving > strong ("Serving size")
 *   .calories-amount .calories (span.h1 = value)
 *   .nutrition-facts-daily-value > div.align-left-right[.level-2|.level-3]
 *   .nutrition-facts-mineral > div.align-left-right
 *   .nutrition-facts-foot p
 *   .nutritional-rest .questions h4 + .nutrition-cta a
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const DV_RE = /^\d+(?:\.\d+)?\s?%\*?$/;

/** Builds one nutrient <li> from a source row. Returns { li, level } or null. */
function buildNutrient(row, document) {
  const clone = row.cloneNode(true);
  // %DV: last direct child element (strong/span) whose text is a percentage
  let dv = '';
  const kids = [...clone.children];
  for (let i = kids.length - 1; i >= 0; i -= 1) {
    if (DV_RE.test(clean(kids[i].textContent))) {
      dv = clean(kids[i].textContent);
      kids[i].remove();
      break;
    }
  }
  const amountEl = clone.querySelector('.amount');
  const amount = amountEl ? clean(amountEl.textContent) : '';
  if (amountEl) amountEl.remove();
  const name = clean(clone.textContent);
  if (!name) return null;

  // bold when the source renders the nutrient name in <strong>
  const bold = [...row.children].some((c) => c.tagName === 'STRONG'
    && !DV_RE.test(clean(c.textContent)) && clean(c.textContent).startsWith(name));

  const li = document.createElement('li');
  if (bold) {
    const s = document.createElement('strong');
    s.textContent = name;
    li.append(s);
  } else {
    li.append(document.createTextNode(name));
  }
  let tail = amount ? ` ${amount}` : '';
  if (dv) tail += ` | ${dv}`;
  if (tail) li.append(document.createTextNode(tail));

  let level = 1;
  if (row.classList.contains('level-3')) level = 3;
  else if (row.classList.contains('level-2')) level = 2;
  return { li, level };
}

export default function parse(element, { document }) {
  const facts = element.querySelector('.nutrition-facts') || element;

  // ---------- Cell 1: Nutrition Facts label ----------
  const labelCell = [];
  const titleEl = facts.querySelector('.nutrition-facts-head .h1, .nutrition-facts-head h1, .nutrition-facts-head h2');
  const h3 = document.createElement('h3');
  h3.textContent = titleEl ? clean(titleEl.textContent) : 'Nutrition Facts';
  labelCell.push(h3);

  const servings = facts.querySelector('.per-container');
  if (servings && clean(servings.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(servings.textContent);
    labelCell.push(p);
  }

  const servingSize = [...facts.querySelectorAll('.serving > *')]
    .find((el) => /serving\s+size/i.test(el.textContent));
  if (servingSize) {
    const p = document.createElement('p');
    p.textContent = clean(servingSize.textContent);
    labelCell.push(p);
  }

  const calories = facts.querySelector('.calories-amount .calories, .calories');
  if (calories) {
    const value = calories.querySelector('.h1, span');
    const v = value ? clean(value.textContent) : '';
    const label = clean(calories.textContent.replace(v, '')) || 'Calories';
    const p = document.createElement('p');
    p.textContent = `${label} ${v}`.trim();
    labelCell.push(p);
  }

  const rows = [...facts.querySelectorAll(
    '.nutrition-facts-daily-value > .align-left-right, .nutrition-facts-mineral > .align-left-right',
  )];
  const ul = document.createElement('ul');
  const parents = { 1: null, 2: null };
  rows.forEach((row) => {
    const item = buildNutrient(row, document);
    if (!item) return;
    const { li, level } = item;
    const parent = level === 3 ? (parents[2] || parents[1]) : level === 2 ? parents[1] : null;
    if (parent) {
      let sub = parent.querySelector(':scope > ul');
      if (!sub) {
        sub = document.createElement('ul');
        parent.append(sub);
      }
      sub.append(li);
    } else {
      ul.append(li);
    }
    if (level === 1) { parents[1] = li; parents[2] = null; }
    if (level === 2) parents[2] = li;
  });
  if (ul.children.length) labelCell.push(ul);

  facts.querySelectorAll('.nutrition-facts-foot p, .nutrition-facts-foot').forEach((foot) => {
    if (foot.matches('.nutrition-facts-foot') && foot.querySelector('p')) return;
    const text = clean(foot.textContent);
    if (!text) return;
    const p = document.createElement('p');
    p.textContent = text;
    labelCell.push(p);
  });

  // ---------- Cell 2: contact aside ----------
  const asideCell = [];
  const aside = element.querySelector('.nutritional-rest, .questions');
  if (aside) {
    const heading = aside.querySelector('h4, h3, h2, .h4');
    if (heading && clean(heading.textContent)) {
      const h4 = document.createElement('h4');
      h4.textContent = clean(heading.textContent);
      asideCell.push(h4);
    }
    aside.querySelectorAll('a[href]').forEach((link) => {
      const text = clean(link.textContent);
      if (!text) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = text;
      p.append(a);
      asideCell.push(p);
    });
  }

  if (!ul.children.length && !asideCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[labelCell, asideCell.length ? asideCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-nutrition', cells });
  element.replaceWith(block);
}
