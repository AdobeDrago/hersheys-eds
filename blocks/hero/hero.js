import { loadCSS } from '../../scripts/aem.js';

export default async function decorate(block) {
  // each variant has its own markup, so it loads its own script and styles
  const variant = ['product', 'article'].find((name) => block.classList.contains(name));
  if (!variant) return;
  const [{ default: decorateVariant }] = await Promise.all([
    import(`./hero-${variant}.js`),
    loadCSS(`${window.hlx.codeBasePath}/blocks/hero/hero-${variant}.css`),
  ]);
  await decorateVariant(block);
}
