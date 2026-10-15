/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumb-trail. Base: breadcrumb (custom).
 * Source: https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html
 * Block contract (blocks/breadcrumb-trail): 1 row, 1 cell holding the ordered breadcrumb links
 * as a list. First link = home; trailing unlinked item = current page.
 * Source DOM: nav.cmp-breadcrumb > ol.cmp-breadcrumb__list > li.cmp-breadcrumb__item > a > span
 */
export default function parse(element, { document }) {
  // Iterate list items (iterationSafe per structure.json), fallback to anchors directly.
  let items = [...element.querySelectorAll('li.cmp-breadcrumb__item, ol > li, ul > li')];
  if (!items.length) items = [...element.querySelectorAll('a[href]')];

  const list = document.createElement('ul');
  const seen = new Set();
  items.forEach((item) => {
    const a = item.matches('a') ? item : item.querySelector('a[href]');
    const text = (a || item).textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const key = `${a ? a.getAttribute('href') : ''}|${text}`;
    if (seen.has(key)) return;
    seen.add(key);

    const li = document.createElement('li');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      if (a.title) link.title = a.title;
      link.textContent = text;
      li.append(link);
    } else {
      li.textContent = text;
    }
    list.append(li);
  });

  if (!list.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[list]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumb-trail', cells });
  element.replaceWith(block);
}
