import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  if (block.classList.contains('product')) {
    // the product variant has its own markup, so it loads its own script and styles
    const [{ default: decorateProduct }] = await Promise.all([
      import('./hero-product.js'),
      loadCSS(`${window.hlx.codeBasePath}/blocks/hero/hero-product.css`),
    ]);
    decorateProduct(block);
  }
}
