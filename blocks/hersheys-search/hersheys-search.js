import {
  resolveConfig,
  searchRecipes,
} from '../../scripts/recipes-search.js';
import { whenVisible } from '../../scripts/scripts.js';
import loadBazaarvoice from '../../scripts/bazaarvoice.js';

// a search that never answers shows the error instead of "Loading recipes…" forever
const SEARCH_TIMEOUT = 8000;

/**
 * Search (Recipes) block — Algolia-backed listing (all-recipes, activities).
 *
 * Variants pick the listing: no variant = recipes, `activities` = crafts.
 * Authoring: optional config rows (key | value): title, placeholder, background (picture),
 *   hits-per-page, endpoint, asset-origin.
 * Renders the search banner, results count, sort, collapsible filters, result grid and
 * a "Show More" button.
 */

// product tag label -> icon in /icons
const TAG_ICONS = { seasonal: 'snowflake', 'limited edition': 'limited-edition' };

const LISTING_VARIANTS = ['recipes', 'activities', 'products', 'stories'];

/**
 * Reads optional authoring config from the first table rows.
 * @param {HTMLElement} block
 * @returns {object}
 */
function readAuthorConfig(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return {};
  const map = {};
  const labels = {};
  const overrides = {};
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const value = cells[1].textContent.trim();
    if (key === 'background') overrides.background = cells[1].querySelector('picture');
    if (key && value) map[key] = value;
  });
  if (map.title) labels.title = map.title;
  if (map.placeholder) labels.placeholder = map.placeholder;
  if (Object.keys(labels).length) overrides.labels = labels;
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
  const { labels } = config;
  const root = el('div', 'hersheys-search-root');

  const banner = el('div', 'hersheys-search-banner');
  if (config.background) banner.append(config.background);
  const title = el('h1', 'hersheys-search-title', labels.title);
  const form = el('form', 'hersheys-search-form');
  form.setAttribute('role', 'search');
  const label = el('label', 'sr-only', `Search ${labels.noun.toLowerCase()}`);
  label.htmlFor = 'hersheys-search-query';
  const input = el('input', 'hersheys-search-query');
  input.type = 'search';
  input.id = 'hersheys-search-query';
  input.name = 'q';
  input.placeholder = labels.placeholder;
  input.autocomplete = 'off';
  const submit = el('button', 'hersheys-search-submit');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Search');
  const reset = el('button', 'hersheys-search-reset');
  reset.type = 'button';
  reset.hidden = true;
  reset.setAttribute('aria-label', 'Clear search');
  form.append(label, input, reset, submit);
  banner.append(title, form);

  const layout = el('div', 'hersheys-search-layout');
  const aside = el('aside', 'hersheys-search-facets');
  aside.setAttribute('aria-label', `Filter ${labels.noun.toLowerCase()}`);
  const stats = el('p', 'hersheys-search-stats');
  stats.setAttribute('aria-live', 'polite');
  stats.tabIndex = -1;
  const panel = el('details', 'hersheys-search-panel');
  const panelHead = el('summary', 'hersheys-search-panel-head');
  const facetsTitle = el('span', 'hersheys-search-facets-title', 'Filter By');
  const facetsCount = el('span', 'hersheys-search-facets-count');
  panelHead.append(facetsTitle, facetsCount);
  const facetsMount = el('div', 'hersheys-search-facets-list');
  const applied = el('div', 'hersheys-search-applied');
  applied.hidden = true;
  const appliedTitle = el('p', 'hersheys-search-applied-title', 'Filtered Items:');
  const chips = el('ul', 'hersheys-search-chips');
  const clear = el('button', 'hersheys-search-clear', 'Clear all filters');
  clear.type = 'button';
  applied.append(appliedTitle, chips, clear);
  panel.append(panelHead, facetsMount);
  aside.append(stats, applied, panel);

  const main = el('div', 'hersheys-search-main');
  const sortWrap = el('div', 'hersheys-search-sortby');
  const sortLabel = el('span', 'hersheys-search-sort-label', 'Sort By');
  sortLabel.id = 'hersheys-search-sort-label';
  const sortBox = el('div', 'hersheys-search-sortbox');
  const sort = el('button', 'hersheys-search-sort');
  sort.type = 'button';
  sort.setAttribute('aria-haspopup', 'listbox');
  sort.setAttribute('aria-expanded', 'false');
  sort.setAttribute('aria-labelledby', `${sortLabel.id} hersheys-search-sort`);
  sort.id = 'hersheys-search-sort';
  const sortList = el('ul', 'hersheys-search-sort-list');
  sortList.setAttribute('role', 'listbox');
  sortList.setAttribute('aria-labelledby', sortLabel.id);
  sortList.hidden = true;
  config.sorts.forEach(([value, text]) => {
    const opt = el('li', 'hersheys-search-sort-option', text);
    opt.setAttribute('role', 'option');
    opt.dataset.value = value;
    opt.tabIndex = -1;
    sortList.append(opt);
  });
  sortBox.append(sort, sortList);
  sortWrap.append(sortLabel, sortBox);

  const status = el('p', 'hersheys-search-status');
  status.hidden = true;
  status.setAttribute('role', 'alert');

  const hits = el('ul', 'hersheys-search-hits');
  const progress = el('div', 'hersheys-search-progress');
  const progressText = el('div', 'hersheys-search-progress-text');
  const progressFill = el('span', 'hersheys-search-progress-fill');
  progress.append(progressText, progressFill);
  const more = el('button', 'hersheys-search-more', `Show More ${labels.noun}`);
  more.type = 'button';
  more.hidden = true;

  main.append(sortWrap, status, hits, progress, more);
  layout.append(aside, main);
  if (config.banner !== false) root.append(banner);
  root.append(layout);
  block.replaceChildren(root);

  return {
    form,
    input,
    reset,
    clear,
    applied,
    chips,
    panel,
    facetsMount,
    facetsCount,
    facetsTitle,
    stats,
    sort,
    sortList,
    status,
    hits,
    more,
    config,
    progress,
    progressText,
    progressFill,
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
    const group = el('details', 'hersheys-search-facet');
    group.open = state.openGroups.has(attr);
    group.dataset.attribute = attr;
    const picked = (state.facetFilters || []).filter((f) => f.startsWith(`${attr}:`)).length;
    group.append(el('summary', 'hersheys-search-facet-legend', `${config.facetLabels[attr] || attr}${picked ? ` - ${picked}` : ''}`));
    const list = el('div', 'hersheys-search-facet-values');
    values.forEach(({ value, count }, idx) => {
      const id = `facet-${attr.replace(/[^a-zA-Z0-9_-]/g, '-')}-${idx}`;
      const row = el('div', 'hersheys-search-facet-row');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.value = value;
      checkbox.dataset.attribute = attr;
      checkbox.checked = (state.facetFilters || []).includes(`${attr}:${value}`);
      const lab = document.createElement('label');
      lab.htmlFor = id;
      if (attr === 'hero.rating') {
        const stars = el('span', 'hersheys-search-facet-stars', '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value)));
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', `${value} stars`);
        lab.append(stars, ` (${count})`);
      } else {
        lab.textContent = `${value} (${count})`;
      }
      row.append(checkbox, lab);
      list.append(row);
    });
    group.append(list);
    facetsMount.append(group);
  });
  const chosen = (state.facetFilters || []).length;
  ui.facetsTitle.textContent = chosen ? `Filter By (${chosen})` : 'Filter By';
  ui.facetsCount.textContent = state.result ? `${state.result.nbHits} results` : '';
  ui.applied.hidden = !chosen;
  ui.chips.replaceChildren(...(state.facetFilters || []).map((filter) => {
    const attr = filter.slice(0, filter.indexOf(':'));
    const value = filter.slice(attr.length + 1);
    const li = el('li', 'hersheys-search-chip');
    const remove = el('button', 'hersheys-search-chip-remove');
    const key = el('span', 'hersheys-search-chip-key', `${config.facetLabels[attr] || attr}: `);
    const val = el('span', `hersheys-search-chip-value${attr === 'metaTags.brand' ? ' is-brand' : ''}`, value);
    remove.append(key, val);
    remove.type = 'button';
    remove.dataset.filter = filter;
    remove.setAttribute('aria-label', `Remove filter ${config.facetLabels[attr] || attr}: ${value}`);
    li.append(remove);
    return li;
  }));
}

/**
 * @param {object} hit
 * @returns {HTMLLIElement}
 */
function buildCard(hit) {
  const li = el('li', 'hersheys-search-card');
  const link = document.createElement('a');
  link.className = 'hersheys-search-card-link';
  link.href = hit.href || '#';

  const media = el('div', 'hersheys-search-card-image');
  if (hit.label) {
    const tag = el('span', 'hersheys-search-card-tag');
    const icon = TAG_ICONS[hit.label.toLowerCase()];
    if (icon) {
      const glyph = el('i', 'hersheys-search-card-tag-icon');
      glyph.style.setProperty('--tag-icon', `url("${window.hlx.codeBasePath}/icons/${icon}.svg")`);
      glyph.setAttribute('aria-hidden', 'true');
      tag.append(glyph);
    }
    tag.append(hit.label);
    media.append(tag);
  }
  if (hit.imageUrl) {
    const img = document.createElement('img');
    img.src = hit.imageUrl;
    img.alt = hit.imageAlt;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.append(img);
  }
  const body = el('div', 'hersheys-search-card-body');
  body.append(el('h3', 'hersheys-search-card-title', hit.title));
  if (hit.portion) body.append(el('p', 'hersheys-search-card-desc', hit.portion));
  if (hit.bvid) {
    // Bazaarvoice fills the stars and review count in once bv.js has scanned the new card
    const rating = el('div', 'hersheys-search-card-rating');
    rating.dataset.bvShow = 'inline_rating';
    rating.dataset.bvProductId = hit.bvid;
    body.append(rating);
  } else if (hit.rating) {
    body.append(el('p', 'hersheys-search-card-rating', `Rating: ${hit.rating}`));
  }
  link.append(media, body);
  li.append(link);
  return li;
}

/**
 * @param {ReturnType<buildShell>} ui
 * @param {object} state
 */
function renderHits(ui, state) {
  const {
    hits, stats, more, status,
  } = ui;
  const { result } = state;
  hits.setAttribute('aria-busy', state.loading ? 'true' : 'false');
  hits.classList.toggle('hersheys-search-hits-pending', !state.result && !state.error);

  if (state.error) {
    status.hidden = false;
    status.textContent = `Unable to load ${ui.config.labels.noun.toLowerCase()}. Please try again.`;
    stats.textContent = '';
    more.hidden = true;
    ui.progress.hidden = true;
    return;
  }
  status.hidden = true;
  status.textContent = '';

  if (!result) {
    stats.textContent = 'Loading…';
    more.hidden = true;
    ui.progress.hidden = true;
    return;
  }

  const q = state.query ? ` for “${state.query}”` : '';
  stats.replaceChildren('Showing ');
  stats.append(el('strong', '', `${result.nbHits} results`), q);

  // load more appends to the grid; any other search starts the grid over
  if (state.rendered !== result) {
    if (result.page === 0) hits.replaceChildren();
    result.hits.forEach((hit) => hits.append(buildCard(hit)));
    state.rendered = result;
    if (result.hits.some((hit) => hit.bvid)) loadBazaarvoice();
  }
  const seen = result.page * result.hitsPerPage + result.hits.length;
  ui.progressText.textContent = `You've seen ${seen} of ${result.nbHits} ${ui.config.labels.noun.toLowerCase()}`;
  ui.progressFill.style.width = `${(seen / result.nbHits) * 100}%`;
  ui.progress.hidden = !result.nbHits;
  more.hidden = result.page >= result.nbPages - 1;
  more.disabled = state.loading;
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
  const controller = new AbortController();
  state.controller = controller;
  // abort with a TimeoutError reason so it isn't mistaken for a superseded search
  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Search timed out', 'TimeoutError'));
  }, SEARCH_TIMEOUT);
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
  } finally {
    clearTimeout(timeout);
  }
  state.loading = false;
  renderFacets(ui, state);
  renderHits(ui, state);
  if (state.scrollAfterLoad && block) {
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

/**
 * Reads `?category=…` style parameters (see config.facetParams) into facet filters.
 * Algolia facet values are sentence case ("Baking tips"); the links say "Baking Tips".
 * @param {object} config
 * @returns {string[]}
 */
function facetsFromUrl(config) {
  const params = new URLSearchParams(window.location.search);
  return Object.entries(config.facetParams || {}).flatMap(([param, attr]) => params.getAll(param)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => `${attr}:${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()}`));
}

export default function decorate(block) {
  const author = readAuthorConfig(block);
  const type = LISTING_VARIANTS.find((name) => block.classList.contains(name));
  const config = resolveConfig({ ...author, type });
  const ui = buildShell(block, config);
  const state = {
    query: '',
    page: 0,
    indexKey: config.sorts[0][0],
    facetFilters: facetsFromUrl(config),
    // a group preselected from the URL starts open (the first one only)
    openGroups: new Set(facetsFromUrl(config).slice(0, 1).map((f) => f.slice(0, f.indexOf(':')))),
    rendered: null,
    result: null,
    error: false,
    loading: false,
    fetchGen: 0,
    controller: null,
    scrollAfterLoad: false,
  };

  // the filter box is always open on desktop; on mobile "Filter by" folds it away
  const desktop = window.matchMedia('(width >= 992px)');
  const syncPanel = () => { ui.panel.open = desktop.matches; };
  syncPanel();
  desktop.addEventListener('change', syncPanel);
  ui.panel.querySelector('summary').addEventListener('click', (e) => {
    if (desktop.matches) e.preventDefault();
  });

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

  ui.reset.addEventListener('click', () => {
    ui.input.value = '';
    ui.reset.hidden = true;
    state.query = '';
    state.page = 0;
    ui.input.focus();
    searchSoon();
  });

  ui.input.addEventListener('input', () => {
    ui.reset.hidden = !ui.input.value;
    state.query = ui.input.value.trim();
    state.page = 0;
    searchSoon(300);
  });

  const setSort = (value) => {
    const [, text] = config.sorts.find(([key]) => key === value);
    ui.sort.textContent = text;
    ui.sortList.querySelectorAll('li').forEach((opt) => {
      opt.setAttribute('aria-selected', String(opt.dataset.value === value));
    });
  };
  const toggleSort = (open) => {
    ui.sortList.hidden = !open;
    ui.sort.setAttribute('aria-expanded', String(open));
  };
  setSort(state.indexKey);
  ui.sort.addEventListener('click', () => toggleSort(ui.sortList.hidden));
  ui.sortList.addEventListener('click', (e) => {
    const opt = e.target.closest('li');
    if (!opt) return;
    state.indexKey = opt.dataset.value;
    state.page = 0;
    setSort(state.indexKey);
    toggleSort(false);
    ui.sort.focus();
    searchSoon();
  });
  ui.sortList.addEventListener('keydown', (e) => {
    const opts = [...ui.sortList.children];
    const at = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') opts[Math.min(at + 1, opts.length - 1)].focus();
    else if (e.key === 'ArrowUp') opts[Math.max(at - 1, 0)].focus();
    else if (e.key === 'Enter' || e.key === ' ') document.activeElement.click();
    else return;
    e.preventDefault();
  });
  ui.sort.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    toggleSort(true);
    ui.sortList.firstElementChild.focus();
  });
  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || ui.sortList.hidden) return;
    toggleSort(false);
    ui.sort.focus();
  });
  document.addEventListener('click', (e) => {
    if (!ui.sortList.hidden && !e.target.closest('.hersheys-search-sortbox')) toggleSort(false);
  });

  ui.clear.addEventListener('click', () => {
    state.facetFilters = [];
    state.page = 0;
    searchSoon();
  });

  ui.chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.hersheys-search-chip-remove');
    if (!chip) return;
    state.facetFilters = state.facetFilters.filter((f) => f !== chip.dataset.filter);
    state.page = 0;
    searchSoon();
  });

  ui.facetsMount.addEventListener('toggle', (e) => {
    const { attribute } = e.target.dataset;
    if (!attribute) return;
    if (e.target.open) {
      // one group open at a time, as on hersheyland.com
      state.openGroups.clear();
      state.openGroups.add(attribute);
      ui.facetsMount.querySelectorAll('details.hersheys-search-facet[open]').forEach((group) => {
        if (group !== e.target) group.open = false;
      });
    } else {
      state.openGroups.delete(attribute);
    }
  }, true);

  ui.facetsMount.addEventListener('change', (e) => {
    if (!(e.target instanceof HTMLInputElement) || e.target.type !== 'checkbox') return;
    state.facetFilters = collectFacetFilters(ui.facetsMount);
    state.page = 0;
    searchSoon();
  });

  ui.more.addEventListener('click', () => {
    if (state.loading) return;
    state.page = (state.result?.page ?? state.page) + 1;
    searchSoon();
  });

  // in the first section the results are the page's main content (and its largest paint), so
  // query now; the block never waits for the answer. Further down, wait until it's on screen.
  if (block.closest('.section') === document.querySelector('main .section')) searchSoon();
  else whenVisible(block, searchSoon);
}
