// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

/**
 * Block info: a Document Authoring editor panel (library row "Block info") that tells authors
 * when the block they have selected is dynamic, i.e. some of its content is filled in from a
 * sheet when the page loads. It only lives in the editor; nothing is added to pages.
 *
 * The editor sends the page as HTML plus the selected block's position among the page's
 * blocks (tables other than Metadata and Section Metadata). To mark another block, add an
 * entry to DYNAMIC_BLOCKS.
 */
const DYNAMIC_BLOCKS = [
  {
    block: 'hero',
    variant: 'product',
    label: 'Hero (Product)',
    message: 'Any field you leave empty (images, product name, sizes, description, label) is filled in when the page loads, from the product master sheet. The sheet tab comes from the page\'s brand metadata and the product row from its bvid. Anything you type yourself overrides the sheet.',
  },
];

// tables the editor does not count as blocks when it numbers the selection
const NOT_BLOCKS = new Set(['metadata', 'section-metadata']);

const selectedEl = document.querySelector('.block-info-selected');
const listEl = document.querySelector('.block-info-list');

/**
 * The page's blocks in editor order, each with its name and variants.
 * @param {string} html the live document
 */
function getBlocks(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return [...doc.querySelectorAll('div[class]')]
    .filter((div) => !div.parentElement?.closest('div[class]'))
    .map((div) => {
      const [name = '', ...variants] = div.className.trim().toLowerCase().split(/\s+/);
      return { name, variants };
    })
    .filter(({ name }) => name && !NOT_BLOCKS.has(name) && name !== 'block-marker');
}

function findDynamic({ name, variants }) {
  return DYNAMIC_BLOCKS.find((rule) => rule.block === name
    && (!rule.variant || variants.includes(rule.variant)));
}

function blockLabel({ name, variants }) {
  return variants.length ? `${name} (${variants.join(', ')})` : name;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderSelected(block) {
  if (!block) {
    selectedEl.replaceChildren(el('p', 'block-info-hint', 'Select a block to see whether its content is dynamic.'));
    return;
  }
  const rule = findDynamic(block);
  if (!rule) {
    const card = el('div', 'block-info-card');
    card.append(
      el('p', 'block-info-name', blockLabel(block)),
      el('p', 'block-info-text', 'Not dynamic: this block shows what you author.'),
    );
    selectedEl.replaceChildren(card);
    return;
  }
  const card = el('div', 'block-info-card is-dynamic');
  card.append(
    el('p', 'block-info-badge', '⚡ Dynamic'),
    el('p', 'block-info-name', rule.label),
    el('p', 'block-info-text', rule.message),
  );
  selectedEl.replaceChildren(card);
}

function renderPage(blocks) {
  const dynamic = blocks.map(findDynamic).filter(Boolean);
  if (!dynamic.length) {
    listEl.replaceChildren(el('li', 'block-info-empty', 'None'));
    return;
  }
  listEl.replaceChildren(...dynamic.map((rule) => el('li', 'block-info-item', `⚡ ${rule.label}`)));
}

function render({ html, selection }) {
  const blocks = getBlocks(html);
  const index = selection?.blockIndex;
  renderSelected(Number.isInteger(index) ? blocks[index] : null);
  renderPage(blocks);
}

(async function init() {
  const { actions } = await DA_SDK;
  if (typeof actions?.subscribeLiveDocument !== 'function') {
    selectedEl.replaceChildren(el('p', 'block-info-hint', 'Open this panel from the page editor to see block info.'));
    return;
  }
  actions.subscribeLiveDocument(render);
}());
