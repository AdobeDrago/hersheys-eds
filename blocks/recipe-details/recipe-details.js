import { loadCSS } from '../../scripts/aem.js';

const VARIANTS = ['ingredients', 'nutrition'];

/**
 * Recipe Details block. Each variant has its own markup, so it loads its own script and styles:
 * Recipe Details (Ingredients) builds ingredients, tools, directions, and Bake Mode;
 * Recipe Details (Nutrition) builds the Nutrition Facts label and the contact box.
 * Without a variant class the authored content is left as is.
 * @param {Element} block
 */
export default async function decorate(block) {
  const variant = VARIANTS.find((name) => block.classList.contains(name));
  if (!variant) {
    // eslint-disable-next-line no-console
    console.error('Recipe Details needs a variant: Ingredients or Nutrition', block);
    return;
  }
  const [{ default: decorateVariant }] = await Promise.all([
    import(`./recipe-details-${variant}.js`),
    loadCSS(`${window.hlx.codeBasePath}/blocks/recipe-details/recipe-details-${variant}.css`),
  ]);
  await decorateVariant(block);
}
