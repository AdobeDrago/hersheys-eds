/**
 * Jump Links block: a grid of icon tiles that link to sections further down the page, e.g.
 * "Jump to a Section" on hersheyland.com/about/faqs.
 *
 * Content model: one row per tile, with an icon and a link in any cell order. The link's
 * `#heading-id` is the target section. A row without a link is left out; a row without an
 * icon becomes a label-only tile.
 */

/**
 * Builds one tile from an authored row.
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildTile(row) {
  const link = row.querySelector('a[href]');
  const label = link?.textContent.trim();
  if (!label) return null;
  const tile = document.createElement('a');
  tile.className = 'jump-links-tile';
  tile.href = link.getAttribute('href');
  const picture = row.querySelector('picture');
  if (picture) {
    const icon = document.createElement('span');
    icon.className = 'jump-links-icon';
    picture.querySelector('img')?.setAttribute('alt', '');
    icon.append(picture);
    tile.append(icon);
  }
  const text = document.createElement('span');
  text.className = 'jump-links-label';
  text.textContent = label;
  tile.append(text);
  const item = document.createElement('li');
  item.append(tile);
  return item;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'jump-links-list';
  list.append(...[...block.children].map(buildTile).filter(Boolean));
  block.replaceChildren(list);
}
