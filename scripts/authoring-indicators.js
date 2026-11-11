import { loadCSS } from './aem.js';

/**
 * Authoring indicators: badges that tell authors a block's content is filled in when the page
 * loads (from a sheet), so what they see may not be what they typed. scripts.js loads this
 * only in authoring views (see isAuthoringView there): Document Authoring's visual editor,
 * preview (*.aem.page) and local development. Never on the live site.
 *
 * The badge is placed in the block's wrapper, not in the block, so it survives the block
 * replacing its own children, and it is never part of the authored content.
 * To mark another block, add an entry to DYNAMIC_BLOCKS.
 */
const DYNAMIC_BLOCKS = [
  { selector: '.hero.product', source: 'product master sheet' },
];

/**
 * @param {Element} main
 */
export default function markDynamicBlocks(main) {
  const blocks = DYNAMIC_BLOCKS.flatMap(({ selector, source }) => [
    ...main.querySelectorAll(selector),
  ].map((block) => ({ block, source })));
  if (!blocks.length) return;
  loadCSS(`${window.hlx.codeBasePath}/styles/authoring-indicators.css`);

  blocks.forEach(({ block, source }) => {
    const wrapper = block.parentElement;
    if (!wrapper || wrapper.querySelector(':scope > .authoring-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'authoring-badge';
    badge.setAttribute('role', 'note');
    badge.contentEditable = 'false';
    badge.title = `Dynamic block: fields left empty are filled in from the ${source} when the page loads. Only shown while authoring, never on the live site.`;
    badge.textContent = '⚡ Dynamic';
    wrapper.prepend(badge);
  });
}
