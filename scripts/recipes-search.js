/**
 * Recipes search client for Hersheyland Algolia (all-recipes).
 *
 * Default: browser → Algolia Search API (public search-only key).
 * Optional: set `endpoint` to a Worker/proxy URL; the same request shape is POSTed
 * there instead, so a referrer-locked key can be swapped without rewriting the block.
 */

export const DEFAULT_CONFIG = {
  appId: 'DQJUL6CPHC',
  apiKey: 'a6b8675cb5520e40ee6756581786eccd',
  /** Absolute origin for DAM images and recipe links that are not yet on EDS. */
  assetOrigin: 'https://www.hersheyland.com',
  /** When set, POST here instead of calling Algolia from the browser. */
  endpoint: '',
  baseFilter: 'metaTags.templateType: recipe-detail',
  indices: {
    newest: 'crawler_www.hersheyland.com_sorted_by_date_newest',
    rating: 'crawler_www.hersheyland.com_sorted_by_rating',
    alpha: 'crawler_www.hersheyland.com',
  },
  facetAttributes: [
    'metaTags.category',
    'metaTags.Holidays & Celebrations',
    'metaTags.Flavors & Ingredients',
    'metaTags.skillLevel',
    'metaTags.dietaryNeeds',
    'metaTags.Time to Complete',
    'metaTags.brand',
    'hero.rating',
  ],
  facetLabels: {
    'metaTags.category': 'Category',
    'metaTags.Holidays & Celebrations': 'Holidays & Celebrations',
    'metaTags.Flavors & Ingredients': 'Flavors & Ingredients',
    'metaTags.skillLevel': 'Skill Level',
    'metaTags.dietaryNeeds': 'Dietary Needs',
    'metaTags.Time to Complete': 'Time to Complete',
    'metaTags.brand': 'Brand',
    'hero.rating': 'Rating',
  },
  facetValueOrder: {
    'metaTags.skillLevel': ['Beginner', 'Intermediate', 'Advanced'],
    'metaTags.Time to Complete': [
      'from 0 - 29 min',
      'from 30 - 60 min',
      'from 61 - 120 min',
      'from 121 - 180 min',
      'over 180 min',
    ],
    'hero.rating': ['4', '3', '2', '1'],
  },
  hitsPerPage: 20,
  maxValuesPerFacet: 100,
};

/**
 * Shallow-merges overrides with defaults.
 * Only `indices` is deep-merged; `facetAttributes`, `facetLabels`, and
 * `facetValueOrder` are replaced entirely if provided.
 * @param {Partial<typeof DEFAULT_CONFIG>} [overrides]
 * @returns {typeof DEFAULT_CONFIG}
 */
export function resolveConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    indices: { ...DEFAULT_CONFIG.indices, ...overrides.indices },
  };
}

/**
 * Builds an absolute HTTPS URL for a recipe path or DAM image.
 * Rejects protocol-relative and http:// URLs (open-redirect defence).
 * @param {string} path
 * @param {string} assetOrigin
 * @returns {string}
 */
export function absoluteUrl(path, assetOrigin) {
  if (!path) return '';
  if (/^https:\/\//i.test(path)) return path;
  if (/^(\/\/|http:\/\/)/i.test(path)) return '';
  const origin = (assetOrigin || DEFAULT_CONFIG.assetOrigin).replace(/\/$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Maps an Algolia hit to a display card model.
 * @param {object} hit
 * @param {typeof DEFAULT_CONFIG} config
 */
export function mapHit(hit, config) {
  const path = hit?.url?.path || hit?.url?.href || '';
  const imagePath = hit?.hero?.image || '';
  return {
    objectID: hit.objectID || '',
    title: hit.title || hit?.hero?.h1 || '',
    description: hit?.hero?.description || '',
    href: absoluteUrl(path, config.assetOrigin),
    imageUrl: absoluteUrl(imagePath, config.assetOrigin),
    rating: hit?.hero?.rating ?? hit?.hero?.starRating ?? null,
    ratingQuantity: hit?.hero?.ratingQuantity ?? null,
  };
}

/**
 * Orders facet values using dashboard ordering when present.
 * @param {string} attribute
 * @param {Record<string, number>} values
 * @param {typeof DEFAULT_CONFIG} config
 * @returns {Array<{ value: string, count: number }>}
 */
export function orderFacetValues(attribute, values, config) {
  const entries = Object.entries(values || {}).map(([value, count]) => ({ value, count }));
  const preferred = config.facetValueOrder[attribute];
  if (!preferred) {
    return entries.sort((a, b) => a.value.localeCompare(b.value));
  }
  const rank = new Map(preferred.map((v, i) => [v, i]));
  // hide values not in preferred list when order is used
  // (matches Algolia sortRemainingBy: hidden for rating/time)
  const known = entries.filter((e) => rank.has(e.value));
  if (attribute === 'hero.rating'
    || attribute === 'metaTags.Time to Complete'
    || attribute === 'metaTags.skillLevel') {
    return known.sort((a, b) => rank.get(a.value) - rank.get(b.value));
  }
  const rest = entries
    .filter((e) => !rank.has(e.value))
    .sort((a, b) => a.value.localeCompare(b.value));
  return [...known.sort((a, b) => rank.get(a.value) - rank.get(b.value)), ...rest];
}

/**
 * Groups flat `attribute:value` filters into Algolia facetFilters
 * (OR within the same attribute, AND across attributes).
 * @param {string[]|string[][]} facetFilters
 * @returns {string[][]}
 */
export function groupFacetFilters(facetFilters) {
  if (!facetFilters.length) return [];
  // already nested
  if (Array.isArray(facetFilters[0])) return facetFilters;
  const byAttr = new Map();
  facetFilters.forEach((entry) => {
    const sep = entry.indexOf(':');
    if (sep < 0) return;
    const attr = entry.slice(0, sep);
    if (!byAttr.has(attr)) byAttr.set(attr, []);
    byAttr.get(attr).push(entry);
  });
  return [...byAttr.values()];
}

/**
 * Encodes Algolia `params` query string for the multi-query endpoint.
 * @param {object} options
 * @param {string} [options.query]
 * @param {number} [options.page]
 * @param {number} [options.hitsPerPage]
 * @param {string[]|string[][]} [options.facetFilters]
 *   Flat `['attr:value']` or InstantSearch-style groups
 *   (OR within attribute, AND across attributes).
 * @param {typeof DEFAULT_CONFIG} config
 * @returns {string}
 */
function buildParams({
  query = '', page = 0, hitsPerPage, facetFilters = [],
}, config) {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('page', String(page));
  params.set('hitsPerPage', String(hitsPerPage ?? config.hitsPerPage));
  params.set('filters', config.baseFilter);
  params.set('facets', JSON.stringify(config.facetAttributes));
  params.set('maxValuesPerFacet', String(config.maxValuesPerFacet));
  // Hershey's Algolia app: keep this prototype's searches out of their analytics
  params.set('analytics', 'false');
  if (facetFilters.length) {
    params.set('facetFilters', JSON.stringify(groupFacetFilters(facetFilters)));
  }
  return params.toString();
}

/**
 * @param {object} result Algolia result or proxy-shaped result
 * @param {typeof DEFAULT_CONFIG} config
 */
function normalizeResult(result, config) {
  const facets = {};
  config.facetAttributes.forEach((attr) => {
    const raw = (result.facets && result.facets[attr]) || {};
    facets[attr] = orderFacetValues(attr, raw, config);
  });
  return {
    hits: (result.hits || []).map((hit) => mapHit(hit, config)),
    nbHits: result.nbHits || 0,
    page: result.page || 0,
    nbPages: result.nbPages || 0,
    hitsPerPage: result.hitsPerPage || config.hitsPerPage,
    facets,
    query: result.query || '',
    index: result.index || '',
  };
}

/**
 * Calls Algolia multi-query (or a proxy endpoint).
 * @param {object} searchRequest
 * @param {string} [searchRequest.query]
 * @param {number} [searchRequest.page]
 * @param {number} [searchRequest.hitsPerPage]
 * @param {string} [searchRequest.indexKey] newest | rating | alpha
 * @param {string[]} [searchRequest.facetFilters]
 * @param {Partial<typeof DEFAULT_CONFIG>} [overrides]
 * @param {AbortSignal} [signal]
 */
export async function searchRecipes(searchRequest, overrides, signal) {
  const request = searchRequest ?? {};
  const config = resolveConfig(overrides);
  const indexKey = request.indexKey || 'newest';
  const indexName = config.indices[indexKey] || config.indices.newest;
  const payload = {
    query: request.query || '',
    page: request.page || 0,
    hitsPerPage: request.hitsPerPage ?? config.hitsPerPage,
    facetFilters: request.facetFilters || [],
    indexName,
    indexKey,
  };

  if (config.endpoint) {
    const resp = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!resp.ok) throw new Error(`Recipes search proxy failed (${resp.status})`);
    const data = await resp.json();
    return normalizeResult(data, config);
  }

  const url = `https://${config.appId}-dsn.algolia.net/1/indexes/*/queries`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Algolia-Application-Id': config.appId,
      'X-Algolia-API-Key': config.apiKey,
    },
    body: JSON.stringify({
      requests: [{
        indexName,
        params: buildParams(payload, config),
      }],
    }),
    signal,
  });
  if (!resp.ok) throw new Error(`Algolia search failed (${resp.status})`);
  const data = await resp.json();
  const result = (data.results && data.results[0]) || {};
  return normalizeResult(result, config);
}
