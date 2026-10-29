// eslint-disable-next-line import/no-cycle
import { decorateMain } from '../../scripts/scripts.js';
import { loadSection } from '../../scripts/aem.js';
import { absoluteUrl } from '../../scripts/recipes-search.js';

/**
 * Recipe block: renders a recipe page from recipe JSON.
 *
 * The block replaces itself with authored-style sections for the existing
 * Breadcrumb Trail, Hero (Recipe), Columns (Recipe) and Columns (Nutrition) blocks,
 * so those blocks own the decoration and styling.
 */

/**
 * `{slug}` is replaced with the recipe slug. Swap for the proxy URL once it exists,
 * e.g. 'https://<proxy>/api/recipes/{slug}'. Never point this at the private API directly.
 */
const RECIPE_ENDPOINT = `${new URL('./mocks/', import.meta.url).href}{slug}.json`;
const ASSET_ORIGIN = 'https://www.hersheyland.com';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTACT_URL = 'https://www.thehersheycompany.com/en_us/home/contact-us.html';
const NUTRITION_FOOTNOTE = '*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutritional advice.';

/**
 * Uses the authored slug when present, otherwise the last URL path segment
 * (`/recipes/chocolate-cake` and `/recipes/chocolate-cake.html` both give `chocolate-cake`).
 * @param {Element} block
 * @param {string} pathname
 * @returns {string} empty when the slug is not a safe identifier
 */
function readSlug(block, pathname) {
  const authored = block.textContent.trim().toLowerCase();
  const fromPath = pathname.split('/').filter(Boolean).pop()?.replace(/\.html$/, '') ?? '';
  const slug = authored || fromPath;
  return SLUG_PATTERN.test(slug) ? slug : '';
}

function isStringList(value) {
  return Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string');
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function optionalMinutes(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

/** Same-site paths and https URLs only. */
function optionalHref(value) {
  const href = optionalString(value);
  return /^(\/(?!\/)|https:\/\/)/.test(href) ? href : '';
}

/**
 * @param {unknown} data
 * @returns {{ name: string, amount: string, dailyValue: string, nutrients: object[] } | null}
 */
function parseNutrient(data) {
  const name = optionalString(data?.name);
  if (!name) return null;
  return {
    name,
    amount: optionalString(data.amount),
    dailyValue: optionalString(data.dailyValue),
    nutrients: Array.isArray(data.nutrients)
      ? data.nutrients.map(parseNutrient).filter(Boolean) : [],
  };
}

function parseNutrition(data) {
  const nutrients = Array.isArray(data?.nutrients)
    ? data.nutrients.map(parseNutrient).filter(Boolean) : [];
  if (!nutrients.length) return null;
  return {
    servings: optionalString(data.servings),
    servingSize: optionalString(data.servingSize),
    calories: optionalString(data.calories),
    nutrients,
  };
}

/**
 * Returns the recipe if the payload has the expected shape, otherwise null.
 * @param {unknown} data
 */
function parseRecipe(data) {
  if (!data || typeof data !== 'object') return null;
  const {
    title, ingredients, directions, image, category,
  } = data;
  if (!optionalString(title) || !isStringList(ingredients) || !isStringList(directions)) {
    return null;
  }
  return {
    title: title.trim(),
    description: optionalString(data.description),
    image: {
      src: absoluteUrl(optionalString(image?.src), ASSET_ORIGIN),
      alt: optionalString(image?.alt),
    },
    category: { name: optionalString(category?.name), url: optionalHref(category?.url) },
    skillLevel: optionalString(data.skillLevel),
    recipeYield: optionalString(data.yield),
    prepTime: optionalMinutes(data.prepTime),
    cookTime: optionalMinutes(data.cookTime),
    totalTime: optionalMinutes(data.totalTime),
    ingredients,
    tools: isStringList(data.tools) ? data.tools : [],
    directions,
    tip: optionalString(data.tip),
    nutrition: parseNutrition(data.nutrition),
  };
}

async function fetchRecipe(slug) {
  const response = await fetch(RECIPE_ENDPOINT.replace('{slug}', encodeURIComponent(slug)));
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const recipe = parseRecipe(await response.json());
  if (!recipe) throw new Error('Unexpected response shape');
  return recipe;
}

/**
 * Creates an element; string children become text nodes, falsy children are skipped.
 * @param {string} tag
 * @param {object} [props] element properties, e.g. className, href
 * @param {...(Node|string|false|null|undefined)} children
 */
function h(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(Boolean));
  return node;
}

/** Authored block table: `authoredBlock(className, [row 1 cells], [row 2 cells])`. */
function authoredBlock(className, ...rows) {
  const toRow = (cells) => h('div', {}, ...cells.map((content) => h('div', {}, ...content)));
  return h('div', { className }, ...rows.map(toRow));
}

function list(tag, items) {
  return h(tag, {}, ...items.map((text) => h('li', {}, text)));
}

function buildBreadcrumb(recipe) {
  const { category } = recipe;
  return h(
    'div',
    {},
    authoredBlock('breadcrumb-trail', [[h(
      'ul',
      {},
      h('li', {}, h('a', { href: '/' }, 'Hersheyland')),
      h('li', {}, h('a', { href: '/recipes' }, 'Recipes')),
      category.name && h('li', {}, category.url ? h('a', { href: category.url }, category.name) : category.name),
    )]]),
  );
}

function buildHero(recipe) {
  const { category, image } = recipe;
  const picture = image.src && h('picture', {}, h('img', { src: image.src, alt: image.alt }));
  const categoryLink = category.name && category.url
    && h('p', {}, h('a', { href: category.url }, category.name));
  return h(
    'div',
    {},
    authoredBlock(
      'hero recipe',
      [[picture]],
      [[
        categoryLink,
        h('h1', {}, recipe.title),
        recipe.skillLevel && h('p', {}, `Skill Level: ${recipe.skillLevel}`),
        recipe.description && h('p', {}, recipe.description),
      ]],
    ),
  );
}

function buildMethod(recipe) {
  const times = [
    ['Prep', recipe.prepTime],
    ['Bake', recipe.cookTime],
    ['Total', recipe.totalTime],
  ].filter(([, minutes]) => minutes).map(([label, minutes]) => `${label}: ${minutes} Min.`);

  return h(
    'div',
    {},
    h('h2', {}, 'Ingredients & Directions'),
    recipe.recipeYield && h('p', {}, `Yields: ${recipe.recipeYield}`),
    times.length && h('p', {}, times.join(' | ')),
    authoredBlock('columns recipe', [
      [h('h3', {}, 'Ingredients'), list('ul', recipe.ingredients)],
      [
        recipe.tools.length && h('h3', {}, 'You\'ll Need'),
        recipe.tools.length && list('ul', recipe.tools),
        h('h3', {}, 'Directions'),
        list('ol', recipe.directions),
        recipe.tip && h('p', {}, `Tip: ${recipe.tip}`),
      ],
    ]),
  );
}

/** Nutrient lines use the Columns (Nutrition) `Name amount | %DV` format; sub-nutrients nest. */
function nutrientList(nutrients) {
  return h('ul', {}, ...nutrients.map((nutrient) => h(
    'li',
    {},
    [nutrient.name, nutrient.amount].filter(Boolean).join(' ')
      + (nutrient.dailyValue ? ` | ${nutrient.dailyValue}` : ''),
    nutrient.nutrients.length && nutrientList(nutrient.nutrients),
  )));
}

function buildNutrition(nutrition) {
  return h(
    'div',
    {},
    authoredBlock('columns nutrition', [
      [
        h('h3', {}, 'Nutrition Facts'),
        nutrition.servings && h('p', {}, `Servings Per Container ${nutrition.servings}`),
        nutrition.servingSize && h('p', {}, `Serving size ${nutrition.servingSize}`),
        nutrition.calories && h('p', {}, `Calories ${nutrition.calories}`),
        nutrientList(nutrition.nutrients),
        h('p', {}, NUTRITION_FOOTNOTE),
      ],
      [
        h('h3', {}, 'Additional questions?'),
        h('p', {}, h('a', { href: CONTACT_URL }, 'Contact Customer Service')),
      ],
    ]),
  );
}

function isoDuration(minutes) {
  return minutes ? `PT${minutes}M` : undefined;
}

function buildStructuredData(recipe, url) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    mainEntityOfPage: url,
    name: recipe.title,
    description: recipe.description || undefined,
    image: recipe.image.src || undefined,
    recipeCategory: recipe.category.name || undefined,
    recipeYield: recipe.recipeYield || undefined,
    prepTime: isoDuration(recipe.prepTime),
    cookTime: isoDuration(recipe.cookTime),
    totalTime: isoDuration(recipe.totalTime),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.directions.map((text) => ({ '@type': 'HowToStep', text })),
  });
  return script;
}

/**
 * Inserts the recipe sections before the block's section and removes the block.
 * @param {Element} block
 * @param {HTMLElement[]} sections decorated sections
 */
function replaceBlock(block, sections) {
  const section = block.closest('.section');
  section.before(...sections);
  block.parentElement.remove();
  if (!section.children.length) section.remove();
}

export default async function decorate(block) {
  const slug = readSlug(block, window.location.pathname);
  block.replaceChildren(h('p', { className: 'recipe-loading' }, 'Loading recipe…'));

  let recipe;
  try {
    if (!slug) throw new Error('Missing or invalid recipe slug');
    recipe = await fetchRecipe(slug);
  } catch (error) {
    block.replaceChildren(h('p', { className: 'recipe-error' }, 'Sorry, this recipe could not be loaded.'));
    // eslint-disable-next-line no-console
    console.error(`recipe: failed to load "${slug}"`, error);
    return;
  }

  const main = h(
    'main',
    {},
    buildBreadcrumb(recipe),
    buildHero(recipe),
    buildMethod(recipe),
    recipe.nutrition && buildNutrition(recipe.nutrition),
  );
  decorateMain(main);
  const sections = [...main.children];
  replaceBlock(block, sections);
  document.head.append(buildStructuredData(recipe, window.location.href));

  // breadcrumb and hero are above the fold; the rest loads without holding up the page
  const [breadcrumb, hero, ...rest] = sections;
  await loadSection(breadcrumb);
  await loadSection(hero);
  rest.reduce((loaded, section) => loaded.then(() => loadSection(section)), Promise.resolve());
}
