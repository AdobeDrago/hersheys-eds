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
  svg.setAttribute('viewBox', '0 0 576 512');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('breadcrumb-trail-home-icon');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1H416 392c-22.1 0-40-17.9-40-40v-24-64c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.7h-32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24z');
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
