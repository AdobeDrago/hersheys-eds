/**
 * Breadcrumb Trail block.
 *
 * Content model: one cell containing the breadcrumb links in order (as a list,
 * separate paragraphs, or links in a single paragraph). The first link is
 * treated as "home" and rendered with a home icon; the label stays available
 * to assistive technology. A trailing item without a link is the current page.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const SEPARATOR_ONLY = /^[\s>/|›»→-]+$/;

/**
 * Builds the inline home icon (DOM API only, no HTML strings).
 * @returns {SVGElement}
 */
function buildHomeIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  // cropped to the drawn house so CSS can size the icon like the source glyph
  svg.setAttribute('viewBox', '2 3 20 18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('breadcrumb-trail-home-icon');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M12 3 2 12h3v9h6v-6h2v6h6v-9h3z');
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  return svg;
}

/**
 * Collects breadcrumb items (anchors or plain text) in authored order.
 * @param {Element} block
 * @returns {Array<{ link: HTMLAnchorElement|null, text: string }>}
 */
function collectItems(block) {
  const items = [];
  const leaves = [...block.querySelectorAll('li, p')]
    .filter((node) => !node.querySelector('li, p'));
  const sources = leaves.length ? leaves : [...block.querySelectorAll(':scope > div > div')];

  sources.forEach((node) => {
    const links = [...node.querySelectorAll('a[href]')];
    if (links.length) {
      links.forEach((a) => items.push({ link: a, text: a.textContent.trim() }));
      return;
    }
    const text = node.textContent.trim();
    if (text && !SEPARATOR_ONLY.test(text)) items.push({ link: null, text });
  });

  return items.filter((item) => item.text || item.link);
}

export default function decorate(block) {
  const items = collectItems(block);
  if (!items.length) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const list = document.createElement('ol');
  list.className = 'breadcrumb-trail-list';

  items.forEach(({ link, text }, i) => {
    const li = document.createElement('li');
    li.className = 'breadcrumb-trail-item';
    const isLast = i === items.length - 1;

    let target;
    if (link) {
      target = document.createElement('a');
      target.href = link.getAttribute('href');
      if (link.title) target.title = link.title;
      if (isLast && new URL(target.href, window.location.href).pathname
        === window.location.pathname) {
        target.setAttribute('aria-current', 'page');
      }
    } else {
      target = document.createElement('span');
      if (isLast) target.setAttribute('aria-current', 'page');
    }
    target.classList.add('breadcrumb-trail-link');

    const label = document.createElement('span');
    label.className = 'breadcrumb-trail-label';
    label.textContent = text;

    if (i === 0 && link) {
      li.classList.add('breadcrumb-trail-home');
      target.append(buildHomeIcon());
    }
    target.append(label);
    li.append(target);
    list.append(li);
  });

  nav.append(list);
  block.replaceChildren(nav);
}
