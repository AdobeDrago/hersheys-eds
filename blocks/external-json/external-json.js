/**
 * Renders the values of a third-party JSON as dummy content.
 *
 * Content model: 1 row x 1 cell with the complete JSON url, as a link or plain text
 * (e.g. `https://www.hersheyland.com/libs/cq/i18n/dict.en-US.json`).
 * Objects become a term / description list, arrays become lists, and values are shown as text.
 * The browser must be allowed to read the url (CORS); otherwise the url is shown with a message.
 */

/**
 * @param {string} html
 * @returns {string} text with entities decoded and tags removed
 */
function toText(html) {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent;
}

/**
 * @param {*} value
 * @returns {Node}
 */
function render(value) {
  if (Array.isArray(value)) {
    const ul = document.createElement('ul');
    value.forEach((item) => {
      const li = document.createElement('li');
      li.append(render(item));
      ul.append(li);
    });
    return ul;
  }
  if (value && typeof value === 'object') {
    const dl = document.createElement('dl');
    Object.entries(value).forEach(([key, item]) => {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.append(render(item));
      dl.append(dt, dd);
    });
    return dl;
  }
  return document.createTextNode(toText(String(value ?? '')));
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const url = (block.querySelector('a')?.href || block.textContent).trim();
  block.replaceChildren();
  if (!url) return;

  const source = document.createElement('p');
  source.className = 'external-json-source';
  source.textContent = url;
  block.append(source);

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(resp.status);
    block.append(render(await resp.json()));
  } catch (e) {
    const error = document.createElement('p');
    error.className = 'external-json-error';
    error.textContent = 'Could not load this JSON (blocked by the server or not found).';
    block.append(error);
  }
}
