import { createOptimizedPicture } from '../../scripts/aem.js';
import { whenVisible } from '../../scripts/scripts.js';

const LAYOUTS = ['grid', 'list', 'carousel'];
const FIELD_KEYS = ['title', 'description', 'image', 'link', 'date'];
// fallbacks tried, in order, when the author leaves the `next` row empty
const NEXT_GUESSES = ['next', 'links.next', 'paging.next'];
const DEFAULT_MAX = 6;
const DEFAULT_COLUMNS = 3;
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_PREFIX = 'dynamic-feed:';
// cards appended per animation frame, so a long response never blocks the main thread
const CHUNK_SIZE = 12;
const DESCRIPTION_LIMIT = 200;
const EMPTY_TEXT = 'No items available';
const IMAGE_FALLBACK_ALT = 'Feed image';

/**
 * Parses a URL and accepts it only over https, so authored or API-supplied values can't
 * point the block at `javascript:`, `data:` or plain-http resources.
 * @param {string} value Absolute URL, or relative to `base`
 * @param {string} [base] Base URL for relative values
 * @returns {URL|null}
 */
function toHttpsUrl(value, base) {
  try {
    const url = new URL(String(value), base);
    return url.protocol === 'https:' ? url : null;
  } catch (e) {
    return null;
  }
}

/**
 * Reads a value from nested JSON with a dot path: `data.results`, `media.0.url`.
 * An empty path returns the object itself; a missing step returns undefined.
 * @param {*} obj Parsed JSON
 * @param {string} path Dot-separated keys or array indexes
 * @returns {*}
 */
function getPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), obj);
}

/**
 * Parses the `fields` row, `title=name;image=thumbnail.url`, into a map of card field to
 * JSON path. Unknown card fields are dropped.
 * @param {string} text Authored mapping
 * @returns {Object<string, string>}
 */
function parseFields(text) {
  return Object.fromEntries(text.split(';')
    .map((pair) => pair.split('=').map((part) => part.trim()))
    .filter(([key, path]) => FIELD_KEYS.includes(key) && path));
}

/**
 * Parses the `next` row: `path` reads a next-page URL; `path=param` reads a cursor and
 * sends it back as `?param=cursor` on the endpoint.
 * @param {string} text Authored value
 * @returns {{ paths: string[], param: string }}
 */
function parseNext(text) {
  const [path, param = ''] = text.split('=').map((part) => part.trim());
  return { paths: path ? [path] : NEXT_GUESSES, param };
}

function toPositiveInt(text, fallback) {
  const value = Number.parseInt(text, 10);
  return value > 0 ? value : fallback;
}

/**
 * Turns the block's key/value rows into a validated config. Authors may omit rows or add
 * unknown ones; omitted rows take their defaults, unknown ones are ignored.
 * @param {Element} block The dynamic-feed block
 * @returns {{ endpoint: URL|null, itemsPath: string, fields: Object<string, string>,
 *   next: { paths: string[], param: string }, max: number, columns: number }}
 */
function readConfig(block) {
  const rows = new Map([...block.children].map((row) => {
    const [keyCell, valueCell] = row.children;
    // DA turns pasted URLs into links; the href is the reliable value
    const value = valueCell?.querySelector('a')?.href || valueCell?.textContent || '';
    return [keyCell?.textContent.trim().toLowerCase() || '', value.trim()];
  }));
  return {
    endpoint: toHttpsUrl(rows.get('endpoint') || ''),
    itemsPath: rows.get('items') || '',
    fields: parseFields(rows.get('fields') || 'title=title;description=description;image=image;link=url;date=date'),
    next: parseNext(rows.get('next') || ''),
    max: toPositiveInt(rows.get('max'), DEFAULT_MAX),
    columns: toPositiveInt(rows.get('columns'), DEFAULT_COLUMNS),
  };
}

/**
 * Returns cached JSON for a URL while it is younger than the TTL. Storage can be blocked
 * or hold corrupt data, so any failure is a cache miss.
 * @param {string} url Request URL, the cache key
 * @param {number} now Current time in ms
 * @returns {*} Parsed JSON or undefined
 */
function readCache(url, now) {
  try {
    const entry = JSON.parse(window.sessionStorage.getItem(CACHE_PREFIX + url));
    return entry && now - entry.t < CACHE_TTL_MS ? entry.data : undefined;
  } catch (e) {
    return undefined;
  }
}

function writeCache(url, data, now) {
  try {
    window.sessionStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ t: now, data }));
  } catch (e) {
    // storage is blocked or full: the feed still renders, it just refetches next time
  }
}

/**
 * Fetches JSON with a timeout. Rejects on network/CORS errors (TypeError), timeouts
 * (AbortError) and non-2xx responses, so callers handle every failure in one place.
 * @param {string} url Request URL
 * @returns {Promise<*>} Parsed JSON
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Loads one page of the feed, from the session cache when fresh, else from the network.
 * @param {string} url Request URL
 * @returns {Promise<*>} Parsed JSON
 */
async function loadJson(url) {
  const cached = readCache(url, Date.now());
  if (cached !== undefined) return cached;
  const data = await fetchJson(url);
  writeCache(url, data, Date.now());
  return data;
}

/**
 * Finds the next page in a response: the first configured path holding a value. A URL
 * is used as is; any other value is a cursor sent back as a query parameter.
 * @param {*} data Parsed JSON
 * @param {{ paths: string[], param: string }} next Parsed `next` row
 * @param {URL} endpoint The configured endpoint
 * @returns {string} Next page URL, or '' when there is none
 */
function findNextUrl(data, next, endpoint) {
  const value = next.paths.map((path) => getPath(data, path)).find((v) => v != null && v !== '');
  if (value == null) return '';
  if (next.param) {
    const url = new URL(endpoint);
    url.searchParams.set(next.param, String(value));
    return url.href;
  }
  return toHttpsUrl(value, endpoint)?.href || '';
}

function toText(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/**
 * Maps one raw API item onto the card fields. Every value becomes plain text or an https
 * URL; nothing from the API is ever treated as HTML.
 * @param {*} raw One item from the API array
 * @param {Object<string, string>} fields Card field to JSON path
 * @param {URL} base Endpoint, for resolving relative links and images
 * @returns {{ title: string, description: string, image: string, link: string, date: string }}
 */
function mapItem(raw, fields, base) {
  const read = (key) => (fields[key] ? toText(getPath(raw, fields[key])) : '');
  return {
    title: read('title'),
    description: truncate(read('description'), DESCRIPTION_LIMIT),
    image: toHttpsUrl(read('image'), base)?.href || '',
    link: toHttpsUrl(read('link'), base)?.href || '',
    date: read('date'),
  };
}

/**
 * Formats a date for display; values that aren't dates are left out.
 * @param {string} value ISO date or timestamp
 * @returns {{ iso: string, label: string }|null}
 */
function formatDate(value) {
  const date = new Date(/^\d+$/.test(value) ? Number(value) : value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    label: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date),
  };
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/**
 * Builds the card image. Same-origin images go through EDS image optimisation; external
 * ones keep their own URL, since `createOptimizedPicture` drops a URL's query string and
 * adds EDS-only width/format parameters a third-party host won't understand.
 * @param {string} src https image URL
 * @param {string} alt Alternative text
 * @param {boolean} eager Load immediately (first card above the fold)
 * @returns {Element}
 */
function renderImage(src, alt, eager) {
  if (new URL(src).origin === window.location.origin) {
    return createOptimizedPicture(src, alt, eager, [{ width: '750' }]);
  }
  const img = element('img');
  img.src = src;
  img.alt = alt;
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  return img;
}

/**
 * Builds one feed card: an article in a list item, with an optional image, the title
 * (linked when the item has a link), a date and a description. The image link is a
 * duplicate of the title link, so it is hidden from keyboard and screen readers.
 * @param {ReturnType<typeof mapItem>} item Mapped item
 * @param {boolean} eager Load the image immediately
 * @returns {HTMLLIElement}
 */
function renderCard(item, eager) {
  const li = element('li', 'dynamic-feed-item');
  const article = element('article', 'dynamic-feed-card');
  if (item.image) {
    const media = element(item.link ? 'a' : 'div', 'dynamic-feed-media');
    if (item.link) {
      media.href = item.link;
      media.tabIndex = -1;
      media.setAttribute('aria-hidden', 'true');
    }
    media.append(renderImage(item.image, item.title || IMAGE_FALLBACK_ALT, eager));
    article.append(media);
  }
  const body = element('div', 'dynamic-feed-body');
  const title = element('h3', 'dynamic-feed-title');
  if (item.link) {
    const link = element('a', '', item.title || item.link);
    link.href = item.link;
    title.append(link);
  } else {
    title.textContent = item.title;
  }
  body.append(title);
  const date = formatDate(item.date);
  if (date) {
    const time = element('time', 'dynamic-feed-date', date.label);
    time.dateTime = date.iso;
    body.append(time);
  }
  if (item.description) body.append(element('p', 'dynamic-feed-description', item.description));
  article.append(body);
  li.append(article);
  return li;
}

function renderSkeleton(count) {
  return Array.from({ length: count }, () => {
    const li = element('li', 'dynamic-feed-item dynamic-feed-skeleton');
    li.setAttribute('aria-hidden', 'true');
    li.innerHTML = '<div class="dynamic-feed-media"></div><div class="dynamic-feed-body"><span></span><span></span><span></span></div>';
    return li;
  });
}

const nextFrame = () => new Promise((resolve) => { requestAnimationFrame(resolve); });

/**
 * Appends cards in chunks of CHUNK_SIZE, one chunk per animation frame.
 * @param {HTMLUListElement} list Feed list
 * @param {ReturnType<typeof mapItem>[]} items Mapped items
 * @param {boolean} eagerFirst Load the first image immediately
 */
async function appendCards(list, items, eagerFirst) {
  for (let start = 0; start < items.length; start += CHUNK_SIZE) {
    const fragment = document.createDocumentFragment();
    items.slice(start, start + CHUNK_SIZE)
      .forEach((item, i) => fragment.append(renderCard(item, eagerFirst && start + i === 0)));
    list.append(fragment);
    // eslint-disable-next-line no-await-in-loop
    if (start + CHUNK_SIZE < items.length) await nextFrame();
  }
}

/**
 * Loads one page and maps it to card items, never rejecting: any failure (CORS,
 * timeout, non-2xx, unexpected shape) yields no items and no next page.
 * @param {string} url Page URL
 * @param {ReturnType<typeof readConfig>} config Block config
 * @returns {Promise<{ ok: boolean, items: ReturnType<typeof mapItem>[], nextUrl: string }>}
 */
async function loadPage(url, config) {
  try {
    const data = await loadJson(url);
    const raw = getPath(data, config.itemsPath);
    if (!Array.isArray(raw)) throw new Error(`No array at "${config.itemsPath || '(root)'}"`);
    const items = raw.slice(0, config.max)
      .map((entry) => mapItem(entry, config.fields, config.endpoint))
      .filter((item) => item.title || item.link);
    return { ok: true, items, nextUrl: findNextUrl(data, config.next, config.endpoint) };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`dynamic-feed: could not load ${url}`, error);
    return { ok: false, items: [], nextUrl: '' };
  }
}

function isAboveTheFold(block) {
  return block.closest('.section') === document.querySelector('main .section');
}

/**
 * `Dynamic Feed`: cards built client-side from any JSON API. Authored as key/value rows
 * (endpoint, items, fields, next, max, columns); the layout is a block option:
 * `Dynamic Feed (grid)` (default), `(list)` or `(carousel)`.
 * @param {Element} block The dynamic-feed block
 */
export default function decorate(block) {
  const config = readConfig(block);
  if (!LAYOUTS.some((layout) => block.classList.contains(layout))) block.classList.add('grid');
  block.style.setProperty('--feed-columns', config.columns);

  const list = element('ul', 'dynamic-feed-list');
  list.setAttribute('aria-busy', 'true');
  list.append(...renderSkeleton(config.max));
  if (block.classList.contains('carousel')) {
    // scrollable region: focusable so keyboard users can scroll it with the arrow keys
    list.tabIndex = 0;
    list.setAttribute('role', 'region');
    list.setAttribute('aria-label', 'Feed carousel');
  }
  const status = element('p', 'dynamic-feed-status');
  status.setAttribute('aria-live', 'polite');
  const more = element('button', 'dynamic-feed-more button primary', 'Load more');
  more.type = 'button';
  more.hidden = true;
  block.replaceChildren(list, more, status);

  if (!config.endpoint) {
    // eslint-disable-next-line no-console
    console.warn('dynamic-feed: the endpoint row is missing or not an https URL');
    list.replaceChildren();
    list.removeAttribute('aria-busy');
    status.textContent = EMPTY_TEXT;
    block.classList.add('is-empty');
    return;
  }

  const eager = isAboveTheFold(block);
  let nextUrl = '';

  const showPage = async (page, first) => {
    if (first) list.replaceChildren();
    await appendCards(list, page.items, first && eager);
    list.removeAttribute('aria-busy');
    if (!first && !page.ok) {
      // keep the button and the same next URL so the visitor can retry
      status.textContent = 'Could not load more items';
      return;
    }
    nextUrl = page.nextUrl;
    more.hidden = !nextUrl;
    if (first && !page.items.length) {
      status.textContent = EMPTY_TEXT;
      block.classList.add('is-empty');
    } else if (!first) {
      status.textContent = `${page.items.length} more items loaded`;
    }
  };

  more.addEventListener('click', async () => {
    more.disabled = true;
    list.setAttribute('aria-busy', 'true');
    await showPage(await loadPage(nextUrl, config), false);
    more.disabled = false;
  });

  const start = async () => showPage(await loadPage(config.endpoint.href, config), true);
  if (eager) start();
  else whenVisible(block, start);
}
