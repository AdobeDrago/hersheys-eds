// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

const SVG_NS = 'http://www.w3.org/2000/svg';
// magnifier glyph used by the source search submit button
const SEARCH_ICON_PATH = 'M16.041 15.856c-.034.026-.067.055-.099.087s-.06.064-.087.099c-1.258 1.213-2.969 1.958-4.855 1.958-1.933 0-3.682-.782-4.95-2.05S4 12.933 4 11s.782-3.682 2.05-4.95S9.067 4 11 4s3.682.782 4.95 2.05S18 9.067 18 11c0 1.886-.745 3.597-1.959 4.856zm5.666 4.437-3.675-3.675A8.96 8.96 0 0 0 20 11c0-2.485-1.008-4.736-2.636-6.364S13.485 2 11 2 6.264 3.008 4.636 4.636 2 8.515 2 11s1.008 4.736 2.636 6.364S8.515 20 11 20a8.96 8.96 0 0 0 5.618-1.968l3.675 3.675a.999.999 0 1 0 1.414-1.414z';

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content (local preview) first, then the site root (DA/EDS production).
 * @returns {Promise<{body: HTMLElement, base: string}|null>}
 */
async function fetchNav() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return { body: doc.body, base: resp.url || window.location.href };
}

/**
 * Resolves relative media references against the fragment URL, so
 * "images/x.svg" in /content/nav.plain.html becomes /content/images/x.svg.
 * @param {HTMLElement} root fragment root
 * @param {string} base fragment URL
 */
function rebaseMedia(root, base) {
  const abs = (value) => {
    if (!value || /^(https?:|data:|\/)/i.test(value)) return value;
    return new URL(value, base).pathname + new URL(value, base).search;
  };
  root.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', abs(img.getAttribute('src')));
  });
  root.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset')
      .split(',')
      .map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [abs(url), ...descriptor].join(' ');
      })
      .join(', ');
    source.setAttribute('srcset', srcset);
  });
}

function createIcon(className) {
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

/**
 * Wraps loose text nodes of an element in a span with the given class.
 * @param {Element} el element
 * @param {string} className class for the label span
 */
function wrapLabel(el, className) {
  const label = document.createElement('span');
  label.className = className;
  [...el.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !n.matches('picture, img')))
    .forEach((n) => label.append(n));
  label.textContent = label.textContent.replace(/\s+/g, ' ').trim();
  el.append(label);
}

function closeDropdown(item) {
  const trigger = item.querySelector(':scope > .nav-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  item.classList.remove('is-open');
}

function closeAllDropdowns(sections, except) {
  sections.querySelectorAll(':scope .nav-drop.is-open').forEach((item) => {
    if (item !== except) closeDropdown(item);
  });
}

/**
 * Shifts an open dropdown left when it would overflow the viewport edge.
 * @param {Element} item open nav item
 */
function clampDropdown(item) {
  const dropdown = item.querySelector(':scope > .nav-dropdown');
  if (!dropdown) return;
  dropdown.style.removeProperty('transform');
  if (!isDesktop.matches) return;
  const viewportRight = document.documentElement.clientWidth - 8;
  const overflow = dropdown.getBoundingClientRect().right - viewportRight;
  if (overflow > 0) dropdown.style.transform = `translateX(-${Math.ceil(overflow)}px)`;
}

function openDropdown(sections, item) {
  closeAllDropdowns(sections, item);
  const trigger = item.querySelector(':scope > .nav-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  item.classList.add('is-open');
  clampDropdown(item);
}

/**
 * Builds the dropdown panel for a top-level nav item from its nested list.
 * List items with an image become icon cards; list items without an image
 * become the "explore" link shown above the cards.
 * @param {HTMLUListElement} list nested list from the fragment
 * @returns {HTMLDivElement} dropdown element
 */
function buildDropdown(list) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';
  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel';
  const cards = document.createElement('ul');
  cards.className = 'nav-dropdown-cards';

  [...list.children].forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    // DA authoring may put the card label in a sibling paragraph of the image link
    if (!link.textContent.trim()) {
      [...li.children]
        .filter((el) => !el.contains(link))
        .forEach((el) => link.append(' ', ...el.childNodes));
    }
    const media = li.querySelector('picture') || li.querySelector('img');
    if (media) {
      // authoring tools may place the image next to (not inside) the link
      if (!link.contains(media)) link.prepend(media);
      link.classList.add('nav-card');
      const icon = document.createElement('span');
      icon.className = 'nav-card-icon';
      icon.append(media);
      wrapLabel(link, 'nav-card-label');
      link.prepend(icon);
      const card = document.createElement('li');
      card.append(link);
      cards.append(card);
    } else {
      const explore = document.createElement('p');
      explore.className = 'nav-dropdown-explore';
      link.classList.add('nav-explore');
      link.append(createIcon('nav-explore-chevron'));
      explore.append(link);
      panel.append(explore);
    }
  });

  if (cards.children.length) panel.append(cards);
  dropdown.append(panel);
  return dropdown;
}

/**
 * Decorates the main navigation list (top-level items + dropdowns).
 * @param {HTMLElement} sections nav sections container
 */
function decorateSections(sections) {
  const list = sections.querySelector('ul');
  if (!list) return;
  list.classList.add('nav-list');
  [...list.children].forEach((item) => {
    item.classList.add('nav-item');
    // DA authoring wraps top-level labels and links in paragraphs: unwrap them
    item.querySelectorAll(':scope > p').forEach((p) => p.replaceWith(...p.childNodes));
    let trigger = item.querySelector(':scope > a');
    if (!trigger) {
      // a top-level label without a link: make it a non-navigating trigger
      trigger = document.createElement('a');
      [...item.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .forEach((n) => trigger.append(n));
      trigger.textContent = trigger.textContent.trim();
      item.prepend(trigger);
    }
    trigger.classList.add('nav-trigger');
    const sub = item.querySelector(':scope > ul');
    if (!sub) return;

    item.classList.add('nav-drop');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.append(createIcon('nav-chevron'));
    const dropdown = buildDropdown(sub);
    sub.remove();
    trigger.after(dropdown);

    item.addEventListener('mouseenter', () => {
      if (isDesktop.matches) openDropdown(sections, item);
    });
    item.addEventListener('mouseleave', () => {
      if (isDesktop.matches) closeDropdown(item);
    });
    item.addEventListener('focusin', () => {
      if (isDesktop.matches) openDropdown(sections, item);
    });
    item.addEventListener('focusout', (e) => {
      if (isDesktop.matches && !item.contains(e.relatedTarget)) closeDropdown(item);
    });
    trigger.addEventListener('click', (e) => {
      // desktop: the trigger is a real link (source behaviour). mobile: expand in place.
      if (isDesktop.matches) return;
      e.preventDefault();
      if (item.classList.contains('is-open')) closeDropdown(item);
      else openDropdown(sections, item);
    });
  });
}

/**
 * Builds the search form from the authored search link
 * (link href = results page + fixed params, link text = placeholder).
 * @param {HTMLElement} tools nav tools container
 */
function decorateSearch(tools) {
  const link = tools.querySelector('a');
  if (!link) return;
  const url = new URL(link.getAttribute('href'), window.location.href);
  const placeholder = link.textContent.trim();

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = url.pathname;
  form.method = 'get';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'searchQuery';
  input.className = 'nav-search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  input.autocomplete = 'off';
  form.append(input);

  url.searchParams.forEach((value, key) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = key;
    hidden.value = value;
    form.append(hidden);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Search');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', SEARCH_ICON_PATH);
  svg.append(path);
  submit.append(svg);
  form.append(submit);

  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) e.preventDefault();
  });

  tools.replaceChildren(form);
}

/**
 * Toggles the entire nav (mobile)
 * @param {Element} nav The container element
 * @param {boolean} forceExpanded Optional param to force nav expand behavior
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  rebaseMedia(fragment.body, fragment.base);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const sectionDivs = [...fragment.body.children].filter((el) => el.tagName === 'DIV');
  ['brand', 'sections', 'tools'].forEach((name, i) => {
    const section = sectionDivs[i];
    if (!section) return;
    const container = document.createElement('div');
    container.className = `nav-${name}`;
    container.append(...section.childNodes);
    nav.append(container);
  });

  const brand = nav.querySelector('.nav-brand');
  if (brand) {
    const brandLink = brand.querySelector('a');
    if (brandLink) {
      brandLink.classList.add('nav-brand-link');
      const logo = brandLink.querySelector('img');
      if (logo) {
        logo.classList.add('nav-logo');
        logo.loading = 'eager';
        if (!brandLink.getAttribute('aria-label')) brandLink.setAttribute('aria-label', logo.alt || 'Home');
      }
    }
  }

  const sections = nav.querySelector('.nav-sections');
  if (sections) decorateSections(sections);

  const tools = nav.querySelector('.nav-tools');
  if (tools) decorateSearch(tools);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.append(createIcon('nav-hamburger-icon'));
  hamburgerButton.addEventListener('click', () => toggleMenu(nav));
  hamburger.append(hamburgerButton);
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // close dropdowns / menu on Escape
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = sections && sections.querySelector('.nav-drop.is-open');
    if (open) {
      closeDropdown(open);
      open.querySelector(':scope > .nav-trigger').focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburgerButton.focus();
    }
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    if (sections) closeAllDropdowns(sections);
    toggleMenu(nav, false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
