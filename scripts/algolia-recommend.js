/**
 * Algolia Recommend client for hersheyland.com "related" content
 * (cards: product, related and slider, related, recipes).
 *
 * Records in the crawler index are keyed by their production URL, so the objectID is this
 * page's path on www.hersheyland.com. When Recommend has no model for that record, the
 * fallback returns other records of the same template type, as on hersheyland.com.
 */

const ALGOLIA = {
  appId: 'DQJUL6CPHC',
  apiKey: 'a6b8675cb5520e40ee6756581786eccd', // search-only key, public on hersheyland.com
  indexName: 'crawler_www.hersheyland.com',
};
export const PRODUCTION = 'https://www.hersheyland.com';
// later sections and the footer wait for the calling block, so a slow Algolia keeps its
// authored cards. A cold request (DNS, TLS, CORS preflight) took up to 1.3 s in testing;
// 4 s leaves room for slow mobile.
const TIMEOUT = 4000;

/**
 * @param {object} options
 * @param {string} options.templateType `metaTags.templateType` for the fallback,
 *   e.g. `product-detail` or `recipe-detail`
 * @param {number} options.max maximum number of hits
 * @param {number} [options.timeout] ms before the request is aborted
 * @returns {Promise<object[]>} raw Algolia hits
 */
export default async function fetchRelated({ templateType, max, timeout = TIMEOUT }) {
  const { pathname } = window.location;
  const objectID = `${PRODUCTION}${pathname.endsWith('.html') ? pathname : `${pathname}.html`}`;
  // AbortSignal.timeout isn't in Safari 15
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const resp = await fetch(`https://${ALGOLIA.appId}-dsn.algolia.net/1/indexes/*/recommendations`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': ALGOLIA.appId,
      'X-Algolia-API-Key': ALGOLIA.apiKey,
    },
    body: JSON.stringify({
      requests: [{
        indexName: ALGOLIA.indexName,
        model: 'related-products',
        objectID,
        threshold: 0,
        maxRecommendations: max,
        // Hershey's Algolia app: keep this prototype's requests out of their analytics
        queryParameters: { analytics: false },
        fallbackParameters: { facetFilters: [`metaTags.templateType:${templateType}`], analytics: false },
      }],
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
  if (!resp.ok) throw new Error(`Algolia request failed with HTTP ${resp.status}`);
  const { results } = await resp.json();
  return results?.[0]?.hits || [];
}
