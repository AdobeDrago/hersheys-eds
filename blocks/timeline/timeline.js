/**
 * Timeline block: one decade of the company history (about/history).
 *
 * Content model: one row per item, two cells.
 *   Cell 1: column, `left` or `right` (anything else goes left).
 *   Cell 2: an intro (h2 and optional paragraph) or a card (a picture, plus an h3 year,
 *     an h4 title and description paragraphs; links stay as authored).
 * An item is a card when it holds a picture. The first item's h2 starts with the
 * decade (e.g. "1850s-90s"); its four digits become the block id (#1850) that the
 * Timeline Nav links to.
 * Variants: `light` (tan band, default) and `dark` (brown band). The band is applied to
 * the section so it spans the page width.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
const KISS_PATH = 'M12.1054 55.9497C7.31684 55.9628 3.40651 52.6671 2.03585 47.9379C0.65954 43.1891 1.8269 37.1001 6.73601 31.169C8.33742 29.2345 10.0703 27.4087 11.7895 25.6384C12.1637 25.2531 12.5365 24.8712 12.9073 24.4913C14.2523 23.1133 15.5704 21.7628 16.829 20.3807C22.8563 13.7953 24.6575 8.70933 25.7703 3.86239C25.8327 3.58487 25.9693 3.16811 26.284 2.79108C26.6417 2.36258 27.1999 2.03125 27.9117 2.03125C28.6181 2.03125 29.1753 2.3593 29.5336 2.78912C29.8454 3.16328 29.9823 3.57761 30.0454 3.86094C31.1864 8.70639 33.0169 13.7774 39.0608 20.3294C40.3134 21.6904 41.6239 23.0198 42.9618 24.377C43.3483 24.769 43.7371 25.1634 44.1274 25.5615C45.8556 27.3243 47.5979 29.1444 49.2069 31.0753C54.1432 36.9833 55.3364 43.0661 53.9808 47.8202C52.631 52.5541 48.7364 55.8669 43.9517 55.876L12.1054 55.9497Z';

let spine;
let spineBound = false;

/**
 * Sections that hold a timeline block, in page order.
 * @returns {HTMLElement[]}
 */
function timelineSections() {
  return [...document.querySelectorAll('main .section.timeline-light, main .section.timeline-dark')];
}

/**
 * Builds the centre line and the Hershey's Kiss that rides it: the kiss stays at mid-screen
 * while scrolling and swaps colour each time a decade band ends above the trigger line
 * (hersheyland.com `#timeline-wrapper .kiss-icon`).
 * @returns {HTMLElement}
 */
function buildSpine() {
  const el = document.createElement('div');
  el.className = 'timeline-spine';
  el.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'timeline-kiss');
  svg.setAttribute('viewBox', '0 0 56 58');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', KISS_PATH);
  svg.append(path);
  el.append(svg);
  return el;
}

function updateKiss() {
  if (!spine) return;
  const trigger = window.innerHeight / 2 + (window.innerWidth <= 768 ? 70 : 130);
  const passed = timelineSections()
    .filter((section) => section.getBoundingClientRect().bottom < trigger).length;
  spine.classList.toggle('timeline-spine-dark', passed % 2 === 1);
}

/**
 * Sizes the spine to run from the first to the last timeline section.
 */
function updateSpine() {
  const sections = timelineSections();
  const main = document.querySelector('main');
  if (!sections.length || !main) return;
  if (!spine) {
    spine = buildSpine();
    main.append(spine);
  }
  const first = sections[0];
  const last = sections[sections.length - 1];
  // live: the line starts 49px under the hero curve and ends 41px past the last band's text,
  // before the curved edge into the next band
  const edge = parseFloat(getComputedStyle(last, '::after').height || '0') || 0;
  const top = first.offsetTop + 49;
  const bottom = last.offsetTop + last.offsetHeight - edge - 16 + 41;
  spine.style.top = `${top}px`;
  spine.style.height = `${Math.max(bottom - top, 0)}px`;
  if (!spineBound) {
    spineBound = true;
    window.addEventListener('scroll', updateKiss, { passive: true });
    window.addEventListener('resize', updateSpine);
    // pictures and later bands change the page height as they load
    new ResizeObserver(updateSpine).observe(main);
  }
  updateKiss();
}

/**
 * Cards slide in as they reach the viewport: the left column from the left, the right column
 * from the right (from below on narrow screens), as on hersheyland.com. Only the picture and text
 * move; the year stays put. Without motion the cards just show.
 * @param {HTMLElement} block
 */
function revealOnScroll(block) {
  if (!('IntersectionObserver' in window)
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('timeline-card-in');
      observer.unobserve(entry.target);
    });
  });
  block.querySelectorAll('.timeline-card').forEach((card) => {
    card.classList.add('timeline-card-pending');
    observer.observe(card);
  });
}

export default function decorate(block) {
  const left = document.createElement('div');
  left.className = 'timeline-col timeline-col-left';
  const right = document.createElement('div');
  right.className = 'timeline-col timeline-col-right';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const content = cells.length > 1 ? cells[cells.length - 1] : cells[0];
    if (!content) return;
    const side = cells.length > 1 && /^right$/i.test(cells[0].textContent.trim()) ? right : left;
    const item = document.createElement('div');
    item.className = content.querySelector('picture') ? 'timeline-card' : 'timeline-intro';
    item.append(...content.childNodes);
    if (item.classList.contains('timeline-card')) {
      // the title and text sit in a white box under the picture
      const title = item.querySelector('h4');
      if (title) {
        const body = document.createElement('div');
        body.className = 'timeline-card-body';
        let node = title;
        while (node) {
          const next = node.nextSibling;
          body.append(node);
          node = next;
        }
        item.append(body);
      }
    }
    side.append(item);
  });

  const decade = left.querySelector('h2')?.textContent.match(/\d{4}/);
  if (decade && !document.getElementById(decade[0])) block.id = decade[0];

  const dark = block.classList.contains('dark');
  block.closest('.section')?.classList.add(dark ? 'timeline-dark' : 'timeline-light');

  block.replaceChildren(left, right);
  block.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  updateSpine();
  revealOnScroll(block);
}
