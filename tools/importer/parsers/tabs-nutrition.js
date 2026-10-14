/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-nutrition. Base: tabs.
 * Source: https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html
 * Block contract (blocks/tabs-nutrition): one row per tab, 2 cells [label | panel content].
 *   Nutrition Facts: "Label | value" / "Name | amount | %DV" lines (paragraphs or list items;
 *     nested list items render indented, a fully-bold line renders bold), other paragraphs as text.
 *   Ingredients: plain paragraphs.
 *   Dietary Info: icon image paragraph followed by a label paragraph.
 * Source DOM (.tab-container):
 *   .tabs > button.tab-btn#btn-tab-{key}   -> labels
 *   .tab-panel#tab-{key}                    -> panels
 *     .nf-serving-row (.label/.val), .nf-macro-cell (.macro-label/.macro-val),
 *     .nf-detail-header spans, .nf-row(.indent) (.name, .amount, .dv), .nf-footer p
 *     .ing p, .allergen-box p
 *     .icon-cell > img + .icon-label
 */
const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function textP(document, text, bold) {
  const p = document.createElement('p');
  if (bold) {
    const s = document.createElement('strong');
    s.textContent = text;
    p.append(s);
  } else {
    p.textContent = text;
  }
  return p;
}

function buildNutrition(panel, document) {
  const out = [];

  // Serving rows -> "Label | value" paragraphs
  panel.querySelectorAll('.nf-serving-row').forEach((row) => {
    const label = clean(row.querySelector('.label'));
    const val = clean(row.querySelector('.val'));
    if (!label && !val) return;
    out.push(textP(document, val ? `${label} | ${val}` : label, row.classList.contains('bold')));
  });

  // Macro summary -> list of "Label | value"
  const macros = [...panel.querySelectorAll('.nf-macro-cell')];
  if (macros.length) {
    const ul = document.createElement('ul');
    macros.forEach((cell) => {
      const label = clean(cell.querySelector('.macro-label'));
      const val = clean(cell.querySelector('.macro-val'));
      if (!label) return;
      const li = document.createElement('li');
      li.textContent = val ? `${label} | ${val}` : label;
      ul.append(li);
    });
    if (ul.children.length) out.push(ul);
  }

  // Detail header -> "Amount per serving | % DV*" paragraph directly before the facts list
  // (the block renders it as a 2-cell row group right above the facts table).
  // Rendered DOM wraps each label in <span>; the server HTML the bulk import sees has bare
  // text lines ("Amount per serving\n% DV*"), so fall back to splitting on line breaks / <br>.
  const header = panel.querySelector('.nf-detail-header');
  if (header) {
    let parts = [...header.querySelectorAll(':scope > span, :scope > div, :scope > p')]
      .map(clean).filter(Boolean);
    if (parts.length < 2) {
      const copy = header.cloneNode(true);
      copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
      parts = copy.textContent.split(/\s*\n\s*/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
    }
    if (parts.length) out.push(textP(document, parts.join(' | ')));
  }

  // Nutrient rows -> list "Name | amount | %DV", indented rows nested under previous top-level row
  const rows = [...panel.querySelectorAll('.nf-row')];
  if (rows.length) {
    const ul = document.createElement('ul');
    let lastTop = null;
    rows.forEach((row) => {
      const name = clean(row.querySelector('.name'));
      const amount = clean(row.querySelector('.amount')) || '-';
      const dv = clean(row.querySelector('.dv')) || '-';
      if (!name) return;
      const li = document.createElement('li');
      li.append(document.createTextNode(`${name} | ${amount} | ${dv}`));
      if (row.classList.contains('indent') && lastTop) {
        let sub = lastTop.querySelector(':scope > ul');
        if (!sub) {
          sub = document.createElement('ul');
          lastTop.append(sub);
        }
        sub.append(li);
      } else {
        ul.append(li);
        lastTop = li;
      }
    });
    if (ul.children.length) out.push(ul);
  }

  // Footnote
  panel.querySelectorAll('.nf-footer p').forEach((p) => {
    const t = clean(p);
    if (t) out.push(textP(document, t));
  });

  return out;
}

function buildIngredients(panel, document) {
  const out = [];
  panel.querySelectorAll('p').forEach((p) => {
    const t = clean(p);
    if (t) out.push(textP(document, t));
  });
  return out;
}

// Dietary icons are inline SVG (live) or data: URI imgs (cleaned DOM). Neither survives the
// import, so each icon is emitted as an EDS icon token (:ou-d:, :gluten-free:) resolving to
// /icons/{name}.svg, followed by its label paragraph. A real (http) img src is kept as an image.
const toIconName = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function buildDietary(panel, document) {
  const out = [];
  let cellsEls = [...panel.querySelectorAll('.icon-cell')];
  if (!cellsEls.length) {
    cellsEls = [...panel.querySelectorAll('img, svg')].map((el) => el.parentElement)
      .filter((el, i, arr) => arr.indexOf(el) === i);
  }
  cellsEls.forEach((cell) => {
    const img = cell.querySelector('img');
    const label = clean(cell.querySelector('.icon-label'))
      || clean(cell.querySelector(':scope > span'))
      || (cell.querySelector('svg[aria-label]')?.getAttribute('aria-label') || '').replace(/\s*icon$/i, '');
    const src = img ? img.getAttribute('src') || '' : '';
    if (src && !src.startsWith('data:')) {
      const p = document.createElement('p');
      const outImg = document.createElement('img');
      outImg.src = src;
      outImg.alt = img.getAttribute('alt') || (label ? `${label} icon` : '');
      p.append(outImg);
      out.push(p);
    } else if (label && (img || cell.querySelector('svg'))) {
      out.push(textP(document, `:${toIconName(label)}:`));
    }
    if (label) out.push(textP(document, label));
  });
  return out;
}

function buildGeneric(panel, document) {
  const out = [];
  panel.querySelectorAll('p, li, img').forEach((el) => {
    if (el.matches('img')) {
      const img = document.createElement('img');
      img.src = el.getAttribute('src');
      img.alt = el.getAttribute('alt') || '';
      out.push(img);
    } else if (!el.querySelector('p, li')) {
      const t = clean(el);
      if (t) out.push(textP(document, t));
    }
  });
  return out;
}

export default function parse(element, { document }) {
  const buttons = [...element.querySelectorAll('.tabs button.tab-btn, .tabs [role="tab"]')];
  const panels = [...element.querySelectorAll('.tab-panel, [role="tabpanel"]')]
    .filter((p, i, arr) => !arr.some((o) => o !== p && o.contains(p)));

  const cells = [];
  const used = new Set();
  buttons.forEach((btn, i) => {
    const label = clean(btn);
    if (!label) return;
    const key = (btn.id || '').replace(/^btn-/, '');
    let panel = key ? element.querySelector(`#${CSS.escape(key)}`) : null;
    if (!panel || used.has(panel)) panel = panels[i];
    if (!panel) return;
    used.add(panel);

    let content;
    if (panel.querySelector('.nf, .nf-row, .nf-serving-row')) content = buildNutrition(panel, document);
    else if (panel.querySelector('.icon-cell, .di')) content = buildDietary(panel, document);
    else if (panel.querySelector('.ing')) content = buildIngredients(panel, document);
    else content = buildGeneric(panel, document);

    cells.push([label, content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-nutrition', cells });
  element.replaceWith(block);
}
