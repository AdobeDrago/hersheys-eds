import { loadExternalJson, getExternalJsonUrl } from '../../scripts/external-json.js';

/**
 * Loads third-party JSON from the authored path and lists its entries.
 *
 * Content model: 1 row x 1 cell with the path after the domain, extension included
 * (e.g. `libs/cq/i18n/dict.en-US.json`). The domain is set in scripts/external-json.js.
 * The formed url is always shown as a link, so the JSON can be opened directly even
 * when the browser blocks the request (CORS).
 * Variant `redirect` (authored as External Json (Redirect)): the page navigates straight
 * to the formed url, as previewing a sheet opens its .json. Skipped inside an iframe
 * (e.g. an editor canvas), where the link is shown instead.
 * @param {Element} block
 */
export default async function decorate(block) {
  const path = block.textContent.trim();
  block.replaceChildren();
  if (!path) return;

  const url = getExternalJsonUrl(path);
  if (block.classList.contains('redirect') && window.top === window.self) {
    window.location.replace(url);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = url;
  const title = document.createElement('p');
  title.className = 'external-json-url';
  title.append('JSON url: ', link);
  const status = document.createElement('p');
  status.className = 'external-json-status';
  status.textContent = 'Loading…';
  block.append(title, status);

  const data = await loadExternalJson(path);
  if (!data) {
    status.textContent = 'Could not load the JSON in the browser (likely CORS). Open the link above to view it.';
    return;
  }
  const entries = Object.entries(data);
  status.textContent = `${entries.length} entries`;
  const list = document.createElement('dl');
  entries.forEach(([key, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = typeof value === 'string' ? value : JSON.stringify(value);
    list.append(dt, dd);
  });
  block.append(list);
}
