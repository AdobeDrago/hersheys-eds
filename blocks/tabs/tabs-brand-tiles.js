import { createOptimizedPicture } from '../../scripts/aem.js';

let tabsId = 0;

/**
 * Tabs (brand-tiles) variant, loaded by tabs.js for `Tabs (brand-tiles)`, as on /brands.
 *
 * The tabs come from the brand-pages sheet (/brands/brand-pages.json; columns path, type, name,
 * image): sheet rows with a name and an image are tiles, sorted by name. The first tab, A-Z, shows
 * all of them; then there is one tab per type, in the order the types first appear in the sheet.
 * A sheet row can have several types, comma-separated (`chocolate, sweet`).
 *
 * Authored rows (optional) override the sheet, one row per tab, 2 cells.
 *   Cell 1: the tab label. It matches the sheet tab with that name (`A-Z` or `All` for A-Z;
 *   singular and plural both match a type, `Sweets` = sweet) and replaces its label.
 *   Cell 2 (optional): the brand tiles, a list with one item per tile holding the tile image
 *   (a picture) and a link whose text is the brand name. Without a list, a paragraph with a
 *   picture followed by a paragraph with a link makes one tile. Authored tiles replace the
 *   tab's sheet tiles; an empty cell keeps them. A label that matches no sheet tab adds a tab
 *   after the sheet tabs (it needs tiles). Deleting a row brings back that tab from the sheet.
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
 * The brand-pages sheet rows that make a tile (name and image), sorted by name (each keeps its
 * sheet row index); fetched once.
 * @returns {Promise<{index: number, path: string, name: string, image: string, types: string[]}[]>}
 */
function fetchBrands() {
  brandsPromise = brandsPromise || fetch(BRAND_SHEET)
    .then((resp) => (resp.ok ? resp.json() : {}))
    .then((json) => json.data || json[':names']?.map((name) => json[name]?.data).find(Boolean) || [])
    .then((rows) => rows
      .map((row, index) => ({
        index,
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
 * @param {string} key a sheet tab (`az` or a type)
 * @param {string} label an authored tab label
 * @returns {boolean} whether the label names that tab (singular and plural both match)
 */
function isTab(key, label) {
  const name = toKey(label);
  if (key === 'az') return ALL_TABS.has(name);
  return name === key || name === `${key}s` || `${name}s` === key;
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
 * @param {string} key the sheet tab: `az` for every brand, else a type
 * @returns {{picture: Element, link: HTMLAnchorElement}[]}
 */
function tilesFromSheet(brands, key) {
  const onTab = ({ types }) => key === 'az' || types.includes(key);
  return brands.filter(onTab).map(({ path, name, image }) => {
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

/**
 * The tabs to show: A-Z and one per sheet type, then authored tabs the sheet doesn't have.
 * Authored rows replace a sheet tab's label and, when they have tiles, its tiles.
 * @param {{label: string, tiles: object[]}[]} authored
 * @param {{index: number, types: string[]}[]} brands
 * @returns {{key: string, label: string, tiles: object[]|null}[]} tiles null = from the sheet
 */
function tabsFor(authored, brands) {
  const tabs = [];
  if (brands.length) {
    tabs.push({ key: 'az', label: 'A-Z', tiles: null });
    // types in the order they first appear in the sheet (brands are sorted by name)
    [...brands].sort((a, b) => a.index - b.index).forEach(({ types }) => types.forEach((type) => {
      if (tabs.some(({ key }) => key === type)) return;
      tabs.push({ key: type, label: type.charAt(0).toUpperCase() + type.slice(1), tiles: null });
    }));
  }
  authored.forEach(({ label, tiles }) => {
    if (!label) return;
    const tab = tabs.find(({ key }) => isTab(key, label));
    if (tab) {
      tab.label = label;
      if (tiles.length) tab.tiles = tiles;
    } else {
      tabs.push({ key: toKey(label), label, tiles });
    }
  });
  return tabs;
}

export default async function decorate(block) {
  const authored = [...block.children].map((row) => {
    const [label, content] = [...row.children];
    return { label: label?.textContent.trim() || '', tiles: content ? tilesFrom(content) : [] };
  });
  const brands = await fetchBrands();
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
  tabsFor(authored, brands).forEach(({ key, label, tiles: chosen }, index) => {
    // authored tiles win; otherwise the tab's tiles come from the brand-pages sheet
    const tiles = (chosen || tilesFromSheet(brands, key)).map(buildTile);
    if (!tiles.length) {
      // eslint-disable-next-line no-console
      console.error(`Tabs (brand-tiles) tab "${label}" has no tiles (authored or from the brand-pages sheet)`);
      return;
    }
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${id}-tab-${index}`;
    tab.textContent = label;
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
    list.append(tab);
    tabs.push(tab);
    panels.push(panel);
  });
  block.replaceChildren(...panels);
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
