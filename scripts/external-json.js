import { getMetadata } from './aem.js';

export const EXTERNAL_JSON_DOMAIN = 'https://www.hersheyland.com';

/**
 * Optional proxy base. The third-party server sends no CORS headers, so browsers
 * block a direct fetch. When set, requests go to `${EXTERNAL_JSON_PROXY}/${path}`
 * and the proxy forwards them to EXTERNAL_JSON_DOMAIN. Leave empty once the
 * third party allows our origins.
 */
export const EXTERNAL_JSON_PROXY = '';

const cache = new Map();

/**
 * Builds the JSON url from the domain and the authored path (extension included).
 * @param {string} path e.g. `libs/cq/i18n/dict.en-US.json`
 * @returns {string}
 */
export function getExternalJsonUrl(path) {
  const clean = String(path).trim().replace(/^\/+/, '');
  return `${EXTERNAL_JSON_PROXY || EXTERNAL_JSON_DOMAIN}/${clean}`;
}

/**
 * Fetches third-party JSON. Requests are cached per url, so several blocks
 * on one page share a single fetch.
 * @param {string} [path] defaults to the page's `external-json` metadata
 * @returns {Promise<Object|null>} parsed JSON, or null when unset or on failure
 */
export function loadExternalJson(path = getMetadata('external-json')) {
  if (!path || !String(path).trim()) return Promise.resolve(null);
  const url = getExternalJsonUrl(path);
  if (!cache.has(url)) {
    cache.set(url, fetch(url)
      .then((resp) => (resp.ok ? resp.json() : null))
      .catch(() => null));
  }
  return cache.get(url);
}
