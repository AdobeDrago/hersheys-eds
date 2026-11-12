let tabsId = 0;

/**
 * Tabs (brand-tiles) variant, loaded by tabs.js for `Tabs (brand-tiles)`, as on /brands.
 *
 * Content model: one row per tab, 2 cells.
 *   Cell 1: the tab label.
 *   Cell 2: the brand tiles, a list with one item per tile holding the tile image (a picture) and
 *   a link whose text is the brand name. Without a list, a paragraph with a picture followed by a
 *   paragraph with a link makes one tile.
 * The whole tile links to the brand page; a link to another site opens in a new tab and gets an
 * external-link icon after its name.
 */

const INTERNAL_HOSTS = /(^|\.)hersheyland\.com$/;

/**
 * @param {HTMLAnchorElement} link
 * @returns {boolean} whether the link leaves the site
 */
function isExternal(link) {
  try {
    const { hostname } = new URL(link.href, window.location.href);
    return hostname !== window.location.hostname && !INTERNAL_HOSTS.test(hostname);
  } catch (error) {
    return false;
  }
}

/**
 * @param {Element} cell the tiles cell
 * @returns {{picture: Element, link: HTMLAnchorElement}[]}
 */
function tilesFrom(cell) {
  const items = [...cell.querySelectorAll('li')];
  const groups = items.length ? items : [...cell.querySelectorAll('p')].reduce((all, p) => {
    if (p.querySelector('picture')) all.push(document.createElement('div'));
    all[all.length - 1]?.append(p.cloneNode(true));
    return all;
  }, []);
  return groups.map((group) => ({
    picture: group.querySelector('picture'),
    link: group.querySelector('a[href]'),
  })).filter(({ picture, link }) => picture && link);
}

/**
 * @param {{picture: Element, link: HTMLAnchorElement}} tile
 * @returns {HTMLLIElement}
 */
function buildTile({ picture, link }) {
  const card = document.createElement('a');
  card.className = 'brand-tile';
  card.href = link.href;
  if (isExternal(link)) {
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
  }
  const image = document.createElement('span');
  image.className = 'brand-tile-image';
  image.append(picture);
  const label = document.createElement('span');
  label.className = 'brand-tile-label';
  const text = document.createElement('span');
  text.textContent = link.textContent.trim();
  label.append(text);
  if (card.target) {
    const icon = document.createElement('span');
    icon.className = 'brand-tile-external';
    icon.setAttribute('aria-hidden', 'true');
    label.append(icon);
    card.setAttribute('aria-label', `${text.textContent} (opens in a new tab)`);
  }
  card.append(image, label);
  const item = document.createElement('li');
  item.append(card);
  return item;
}

export default function decorate(block) {
  tabsId += 1;
  const id = `brand-tiles-${tabsId}`;
  const bar = document.createElement('div');
  bar.className = 'brand-tiles-bar';
  const list = document.createElement('div');
  list.className = 'tabs-list';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', block.closest('.section')?.querySelector('h2')?.textContent.trim() || 'Brand categories');
  bar.append(list);
  const tabs = [];
  const panels = [];
  [...block.children].forEach((row, index) => {
    const [label, content] = [...row.children];
    const tiles = content ? tilesFrom(content).map(buildTile) : [];
    if (!label?.textContent.trim() || !tiles.length) {
      // eslint-disable-next-line no-console
      console.error('Tabs (brand-tiles) row needs a label and at least one tile', row);
      row.remove();
      return;
    }
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${id}-tab-${index}`;
    tab.textContent = label.textContent.trim();
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${index}`);
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel-${index}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    const grid = document.createElement('ul');
    grid.className = 'brand-tiles-grid';
    grid.append(...tiles);
    panel.append(grid);
    row.replaceWith(panel);
    list.append(tab);
    tabs.push(tab);
    panels.push(panel);
  });
  if (!tabs.length) return;
  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      const destinations = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (event.key in destinations) {
        event.preventDefault();
        select(destinations[event.key], true);
      }
    });
  });
  block.prepend(bar);
  select(0);
}
