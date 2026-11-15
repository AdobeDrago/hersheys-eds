import { createOptimizedPicture } from '../../scripts/aem.js';

let tabsId = 0;

/**
 * Tabs (brand-tiles) variant, loaded by tabs.js for `Tabs (brand-tiles)`, as on /brands.
 *
 * Content model: one row per tab, 2 cells.
 *   Cell 1: the tab label.
 *   Cell 2 (optional): the brand tiles, a list with one item per tile holding the tile image
 *   (a picture) and a link whose text is the brand name. Without a list, a paragraph with a
 *   picture followed by a paragraph with a link makes one tile.
 * Authored tiles win. A row whose second cell is empty or missing gets its tiles from the
 * brand-pages sheet (/brands/brand-pages.json; columns path, type, name, image): rows with a name
 * and an image are tiles, sorted by name. An `A-Z` (or `All`) tab shows all of them; any other
 * tab shows the rows whose type matches its label (`Chocolate` = chocolate, `Sweets` = sweet,
 * `Snacks` = snacks). A row can have several types, comma-separated (`chocolate, sweet`).
 * The whole tile links to the brand page; a link to another site opens in a new tab and gets an
 * external-link icon after its name.
 */

const INTERNAL_HOSTS = /(^|\.)hersheyland\.com$/;
const BRAND_SHEET = '/brands/brand-pages.json';
const ALL_TABS = new Set(['az', 'all', 'allbrands']);
const byName = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/**
 * @param {string} text
 * @returns {string} lower case, letters and digits only (`A-Z` -> `az`)
 */
function toKey(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

let brandsPromise;

/**
 * The brand-pages sheet rows that make a tile (name and image), sorted by name; fetched once.
 * @returns {Promise<{path: string, name: string, image: string, types: string[]}[]>}
 */
function fetchBrands() {
  brandsPromise = brandsPromise || fetch(BRAND_SHEET)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then((json) => json.data || json[':names']?.map((name) => json[name]?.data).find(Boolean) || [])
    .then((rows) => rows
      .map((row) => ({
        path: String(row.path || '').trim(),
        name: String(row.name || '').trim(),
        image: String(row.image || '').trim(),
        types: String(row.type || '').split(',').map((type) => toKey(type)).filter(Boolean),
      }))
      .filter(({ path, name, image }) => path && name && image)
      .sort((a, b) => byName.compare(a.name, b.name)))
    .catch(() => []);
  return brandsPromise;
}

/**
 * @param {string[]} types the row's types
 * @param {string} label the tab label
 * @returns {boolean} whether the sheet row belongs on the tab (singular and plural both match)
 */
function onTab(types, label) {
  const tab = toKey(label);
  if (ALL_TABS.has(tab)) return true;
  return types.some((type) => type === tab || `${type}s` === tab || type === `${tab}s`);
}

/**
 * A picture for a sheet image: site images (paths, or aem.page / aem.live media URLs) get the
 * optimized renditions, other sites' images are used as they are.
 * @param {string} image
 * @returns {Element}
 */
function sheetPicture(image) {
  let url;
  try {
    url = new URL(image, window.location.href);
  } catch (error) {
    return null;
  }
  const isSite = url.origin === window.location.origin
    || (/\.aem\.(page|live)$/.test(url.hostname) && url.pathname.startsWith('/media_'));
  if (isSite) return createOptimizedPicture(`${url.pathname}${url.search}`, '', false, [{ width: '750' }]);
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = url.href;
  img.alt = '';
  img.loading = 'lazy';
  picture.append(img);
  return picture;
}

/**
 * @param {{path: string, name: string, image: string, types: string[]}[]} brands
 * @param {string} label the tab label
 * @returns {{picture: Element, link: HTMLAnchorElement}[]}
 */
function tilesFromSheet(brands, label) {
  return brands.filter(({ types }) => onTab(types, label)).map(({ path, name, image }) => {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = name;
    return { picture: sheetPicture(image), link };
  }).filter(({ picture }) => picture);
}

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

export default async function decorate(block) {
  const rows = [...block.children];
  const authored = rows.map((row) => {
    const content = row.children[1];
    return content ? tilesFrom(content) : [];
  });
  const brands = authored.some((tiles) => !tiles.length) ? await fetchBrands() : [];
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
  rows.forEach((row, index) => {
    const label = row.children[0];
    const text = label?.textContent.trim() || '';
    // authored tiles win; an empty row is filled from the brand-pages sheet
    const source = authored[index].length ? authored[index] : tilesFromSheet(brands, text);
    const tiles = text ? source.map(buildTile) : [];
    if (!tiles.length) {
      // eslint-disable-next-line no-console
      console.error('Tabs (brand-tiles) row needs a label and at least one tile (authored or from the brand-pages sheet)', row);
      row.remove();
      return;
    }
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${id}-tab-${index}`;
    tab.textContent = text;
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
