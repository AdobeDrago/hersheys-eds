import {
  resolveConfig,
  searchRecipes,
} from '../../scripts/recipes-search.js';

/**
 * Search (Recipes) block — Algolia-backed all-recipes listing.
 *
 * Authoring: empty block (or optional config rows via readBlockConfig keys:
 *   hits-per-page, endpoint, asset-origin).
 * Renders search box, facet filters, sort, result grid, pagination.
 */

/**
 * Reads optional authoring config from the first table rows.
 * @param {HTMLElement} block
 * @returns {object}
 */
function readAuthorConfig(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return {};
  const map = {};
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const value = cells[1].textContent.trim();
    if (key && value) map[key] = value;
  });
  const overrides = {};
  if (map.endpoint) {
    try {
      const u = new URL(map.endpoint);
      if (u.protocol === 'https:') overrides.endpoint = map.endpoint;
    } catch {
      // invalid endpoint — ignore
    }
  }
  if (map['asset-origin']) {
    try {
      const u = new URL(map['asset-origin']);
      if (u.protocol === 'https:') overrides.assetOrigin = map['asset-origin'].replace(/\/$/, '');
    } catch {
      // invalid origin — ignore
    }
  }
  if (map['hits-per-page'] && /^\d+$/.test(map['hits-per-page'])) {
    overrides.hitsPerPage = Number(map['hits-per-page']);
  }
  return overrides;
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * Builds the static chrome once; state drives updates.
 * @param {HTMLElement} block
 * @param {object} config
 */
function buildShell(block, config) {
  const root = el('div', 'search-recipes-root');

  const header = el('div', 'search-recipes-header');
  const title = el('h2', 'search-recipes-title', 'Search for a Recipe');
  const form = el('form', 'search-recipes-form');
  form.setAttribute('role', 'search');
  const label = el('label', 'search-recipes-label', 'Search recipes');
  label.htmlFor = 'search-recipes-query';
  label.classList.add('sr-only');
  const input = el('input', 'search-recipes-query');
  input.type = 'search';
  input.id = 'search-recipes-query';
  input.name = 'q';
  input.placeholder = 'Enter recipe name, ingredients, category, etc.';
  input.autocomplete = 'off';
  const submit = el('button', 'search-recipes-submit button primary', 'Search');
  submit.type = 'submit';
  form.append(label, input, submit);
  header.append(title, form);

  const layout = el('div', 'search-recipes-layout');
  const aside = el('aside', 'search-recipes-facets');
  aside.setAttribute('aria-label', 'Filter recipes');
  const facetsTitle = el('h3', 'search-recipes-facets-title', 'Filter by');
  const facetsMount = el('div', 'search-recipes-facets-list');
  const clear = el('button', 'search-recipes-clear button', 'Clear filters');
  clear.type = 'button';
  aside.append(facetsTitle, facetsMount, clear);

  const main = el('div', 'search-recipes-main');
  const toolbar = el('div', 'search-recipes-toolbar');
  const stats = el('p', 'search-recipes-stats');
  stats.setAttribute('aria-live', 'polite');
  stats.tabIndex = -1;
  const sortLabel = el('label', 'search-recipes-sort-label', 'Sort by');
  const sort = el('select', 'search-recipes-sort');
  sort.id = 'search-recipes-sort';
  sortLabel.htmlFor = sort.id;
  [
    ['newest', 'Most Recent'],
    ['rating', 'Rating (Highest-Lowest)'],
    ['alpha', 'A-Z'],
  ].forEach(([value, text]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    sort.append(opt);
  });
  toolbar.append(stats, sortLabel, sort);

  const status = el('p', 'search-recipes-status');
  status.hidden = true;
  status.setAttribute('role', 'alert');

  const hits = el('ul', 'search-recipes-hits');
  const pager = el('nav', 'search-recipes-pagination');
  pager.setAttribute('aria-label', 'Recipe results pages');

  main.append(toolbar, status, hits, pager);
  layout.append(aside, main);
  root.append(header, layout);
  block.replaceChildren(root);

  return {
    form, input, clear, facetsMount, stats, sort, status, hits, pager, config,
  };
}

/**
 * @param {ReturnType<buildShell>} ui
 * @param {object} state
 */
function renderFacets(ui, state) {
  const { facetsMount, config } = ui;
  facetsMount.replaceChildren();
  config.facetAttributes.forEach((attr) => {
    const values = state.result?.facets?.[attr] || [];
    if (!values.length) return;
    const group = el('fieldset', 'search-recipes-facet');
    const legend = el('legend', 'search-recipes-facet-legend', config.facetLabels[attr] || attr);
    group.append(legend);
    values.forEach(({ value, count }, idx) => {
      const id = `facet-${attr.replace(/[^a-zA-Z0-9_-]/g, '-')}-${idx}`;
      const row = el('div', 'search-recipes-facet-row');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.value = value;
      checkbox.dataset.attribute = attr;
      checkbox.checked = (state.facetFilters || []).includes(`${attr}:${value}`);
      const lab = document.createElement('label');
      lab.htmlFor = id;
      lab.textContent = attr === 'hero.rating' ? `${value}+ stars (${count})` : `${value} (${count})`;
      row.append(checkbox, lab);
      group.append(row);
    });
    facetsMount.append(group);
  });
}

/**
 * @param {ReturnType<buildShell>} ui
 * @param {object} state
 */
function renderHits(ui, state) {
  const { hits, stats, pager, status } = ui;
  const result = state.result;
  hits.replaceChildren();
  pager.replaceChildren();
  hits.setAttribute('aria-busy', state.loading ? 'true' : 'false');

  if (state.error) {
    status.hidden = false;
    status.textContent = 'Unable to load recipes. Please try again.';
    stats.textContent = '';
    return;
  }
  status.hidden = true;
  status.textContent = '';

  if (state.loading && !result) {
    stats.textContent = 'Loading recipes…';
    return;
  }

  if (!result) {
    stats.textContent = 'Loading recipes…';
    return;
  }

  if (state.loading) {
    stats.textContent = 'Loading…';
  } else {
    const from = result.nbHits ? result.page * result.hitsPerPage + 1 : 0;
    const to = Math.min((result.page + 1) * result.hitsPerPage, result.nbHits);
    const q = state.query ? ` for “${state.query}”` : '';
    stats.textContent = result.nbHits
      ? `Showing ${from}–${to} of ${result.nbHits} recipes${q}`
      : `No recipes found${q}`;
  }

  result.hits.forEach((hit) => {
    const li = el('li', 'search-recipes-card');
    const link = document.createElement('a');
    link.className = 'search-recipes-card-link';
    link.href = hit.href || '#';

    const media = el('div', 'search-recipes-card-image');
    if (hit.imageUrl) {
      const img = document.createElement('img');
      img.src = hit.imageUrl;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.append(img);
    }
    const body = el('div', 'search-recipes-card-body');
    const h = el('h3', 'search-recipes-card-title', hit.title);
    body.append(h);
    if (hit.rating != null) {
      body.append(el('p', 'search-recipes-card-rating', `Rating: ${hit.rating}`));
    }
    link.append(media, body);
    li.append(link);
    hits.append(li);
  });

  if (result.nbPages <= 1) return;
  const prev = el('button', 'search-recipes-page button', 'Previous');
  prev.type = 'button';
  prev.disabled = result.page <= 0 || state.loading;
  prev.dataset.page = String(result.page - 1);
  const next = el('button', 'search-recipes-page button', 'Next');
  next.type = 'button';
  next.disabled = result.page >= result.nbPages - 1 || state.loading;
  next.dataset.page = String(result.page + 1);
  const indicator = el('span', 'search-recipes-page-indicator', `Page ${result.page + 1} of ${result.nbPages}`);
  pager.append(prev, indicator, next);
}

/**
 * @param {ReturnType<buildShell>} ui
 * @param {object} state
 * @param {HTMLElement} [block]
 */
async function runSearch(ui, state, block) {
  const gen = (state.fetchGen || 0) + 1;
  state.fetchGen = gen;
  if (state.controller) state.controller.abort();
  state.controller = new AbortController();
  state.loading = true;
  renderHits(ui, state);
  try {
    const result = await searchRecipes({
      query: state.query,
      page: state.page,
      hitsPerPage: ui.config.hitsPerPage,
      indexKey: state.indexKey,
      facetFilters: state.facetFilters,
    }, ui.config, state.controller.signal);
    if (gen !== state.fetchGen) return;
    state.result = result;
    state.error = false;
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    if (gen !== state.fetchGen) return;
    state.error = true;
    state.result = null;
  }
  state.loading = false;
  renderFacets(ui, state);
  renderHits(ui, state);
  if (state.scrollAfterLoad && block) {
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ui.stats.focus({ preventScroll: true });
    state.scrollAfterLoad = false;
  }
}

/**
 * Collects checked facet filters as Algolia facetFilter strings.
 * @param {HTMLElement} facetsMount
 * @returns {string[]}
 */
function collectFacetFilters(facetsMount) {
  return [...facetsMount.querySelectorAll('input[type="checkbox"]:checked')]
    .map((box) => `${box.dataset.attribute}:${box.value}`);
}

export default function decorate(block) {
  const author = readAuthorConfig(block);
  const config = resolveConfig(author);
  const ui = buildShell(block, config);
  const state = {
    query: '',
    page: 0,
    indexKey: 'newest',
    facetFilters: [],
    result: null,
    error: false,
    loading: false,
    fetchGen: 0,
    controller: null,
    scrollAfterLoad: false,
  };

  let debounceTimer = 0;
  const searchSoon = (delay = 0) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => runSearch(ui, state, block), delay);
  };

  ui.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.query = ui.input.value.trim();
    state.page = 0;
    searchSoon();
  });

  ui.input.addEventListener('input', () => {
    state.query = ui.input.value.trim();
    state.page = 0;
    searchSoon(300);
  });

  ui.sort.addEventListener('change', () => {
    state.indexKey = ui.sort.value;
    state.page = 0;
    searchSoon();
  });

  ui.clear.addEventListener('click', () => {
    state.facetFilters = [];
    state.page = 0;
    ui.facetsMount.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = false;
    });
    searchSoon();
  });

  ui.facetsMount.addEventListener('change', (e) => {
    if (!(e.target instanceof HTMLInputElement) || e.target.type !== 'checkbox') return;
    state.facetFilters = collectFacetFilters(ui.facetsMount);
    state.page = 0;
    searchSoon();
  });

  ui.pager.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    state.scrollAfterLoad = true;
    searchSoon();
  });

  searchSoon();
}
