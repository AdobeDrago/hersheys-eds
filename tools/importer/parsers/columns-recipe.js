/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-recipe. Base: columns (custom local block, blocks/columns-recipe/columns-recipe.js).
 * Source: https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html
 * Block contract: 1 row x 2 cells.
 *   Cell 1 (ingredients): <h3>Ingredients</h3> + <ul> (quantity + ingredient; product links kept).
 *   Cell 2 (method): <h3>You'll Need</h3> + <ul> of tools; <h3>Directions</h3> + <ol>,
 *     each <li> = step text paragraph (bold quantities) followed by the step image.
 * Skipped (block-generated): step checkboxes / indexes, collapsible tools toggle.
 * Source DOM (.new-ingred-and-direct):
 *   .leftbox .ingredients-comp > h3 + ul.key-ingredient-list > li.ingredient-item
 *     .ingredient-amount (.number-amount + unit) / .ingredient-name .h4 (span | a)
 *   .rightbox .step-by-step-directions
 *     .equipment-items .equipment-header span.h4 "You'll Need" / .equipment-item span.h6
 *     h3 "Directions" / .directions > .direction-detail
 *       .direction-step label p (step text) / .description img (step image)
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Appends inline content of `src` into `target`, unwrapping spans/divs, keeping a/strong/em/sup. */
function appendInline(target, src, document) {
  src.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.textContent.replace(/\s+/g, ' ');
      if (t.trim()) {
        const prev = target.lastChild;
        const needsSpace = prev && !/\s$/.test(prev.textContent) && !/^[\s,.;:)]/.test(t.trimStart());
        target.append(document.createTextNode((needsSpace ? ' ' : '') + t.trim()));
      }
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (['input', 'i', 'svg', 'script', 'style', 'button'].includes(tag)) return;
    if (['a', 'strong', 'b', 'em', 'sup', 'sub'].includes(tag)) {
      const text = clean(n.textContent);
      if (!text) return;
      const prev = target.lastChild;
      if (prev && !/\s$/.test(prev.textContent) && !/^[,.;:)]/.test(text)) target.append(document.createTextNode(' '));
      const el = document.createElement(tag === 'b' ? 'strong' : tag);
      if (tag === 'a') el.href = n.getAttribute('href');
      appendInline(el, n, document);
      target.append(el);
      return;
    }
    appendInline(target, n, document);
  });
}

export default function parse(element, { document }) {
  // ---------- Cell 1: ingredients ----------
  const ingredientsCell = [];
  const ingRoot = element.querySelector('.ingredients-comp, .leftbox') || element;
  const ingHeading = ingRoot.querySelector('h3, h2, h4');
  const h3Ing = document.createElement('h3');
  h3Ing.textContent = ingHeading ? clean(ingHeading.textContent) : 'Ingredients';
  ingredientsCell.push(h3Ing);

  const ingItems = [...ingRoot.querySelectorAll('li.ingredient-item')];
  const ingList = document.createElement('ul');
  (ingItems.length ? ingItems : [...ingRoot.querySelectorAll('ul > li')]).forEach((item) => {
    const li = document.createElement('li');
    const amount = item.querySelector('.ingredient-amount');
    const name = item.querySelector('.ingredient-name');
    if (amount || name) {
      if (amount) li.append(document.createTextNode(clean(amount.textContent)));
      if (name) appendInline(li, name, document);
    } else {
      appendInline(li, item, document);
    }
    if (clean(li.textContent)) ingList.append(li);
  });
  // Ingredient sub-group headings are not present on this template; keep the list only.
  if (ingList.children.length) ingredientsCell.push(ingList);

  // ---------- Cell 2: tools + directions ----------
  const methodCell = [];
  const methodRoot = element.querySelector('.step-by-step-directions, .rightbox') || element;

  const toolItems = [...methodRoot.querySelectorAll('.equipment-item')];
  if (toolItems.length) {
    const headerEl = methodRoot.querySelector('.equipment-header .h4, .equipment-header span, .equipment-header');
    const h3Tools = document.createElement('h3');
    h3Tools.textContent = headerEl ? clean(headerEl.textContent) : "You'll Need";
    const toolList = document.createElement('ul');
    toolItems.forEach((tool) => {
      const text = clean(tool.textContent);
      if (!text) return;
      const li = document.createElement('li');
      const link = tool.querySelector('a[href]');
      if (link) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      toolList.append(li);
    });
    methodCell.push(h3Tools, toolList);
  }

  const steps = [...methodRoot.querySelectorAll('.direction-detail')];
  if (steps.length) {
    const dirHeading = [...methodRoot.querySelectorAll('h3, h2')].find((h) => /direction/i.test(h.textContent));
    const h3Dir = document.createElement('h3');
    h3Dir.textContent = dirHeading ? clean(dirHeading.textContent) : 'Directions';
    const ol = document.createElement('ol');
    steps.forEach((step) => {
      const li = document.createElement('li');
      const paras = [...step.querySelectorAll('.direction-step p, .direction-index p')];
      if (paras.length) {
        paras.forEach((sp) => {
          const p = document.createElement('p');
          appendInline(p, sp, document);
          if (clean(p.textContent)) li.append(p);
        });
      } else {
        const label = step.querySelector('.direction-step, .direction-index');
        if (label) {
          const p = document.createElement('p');
          appendInline(p, label, document);
          p.textContent = p.textContent.replace(/^\s*\d+\.\s*/, '');
          if (clean(p.textContent)) li.append(p);
        }
      }
      step.querySelectorAll('.description img, .image-container img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (src && !src.startsWith('data:')) li.append(img);
      });
      if (li.childNodes.length) ol.append(li);
    });
    methodCell.push(h3Dir, ol);
  }

  if (!ingList.children.length && !methodCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[ingredientsCell, methodCell.length ? methodCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-recipe', cells });
  element.replaceWith(block);
}
