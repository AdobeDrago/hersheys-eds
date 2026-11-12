import decorateTabs from '@adobe/aem-boilerplate/blocks/tabs/tabs.js';
import decorateBrandTiles from '@adobe/aem-boilerplate/blocks/tabs/tabs-brand-tiles.js';
import '@adobe/aem-boilerplate/blocks/tabs/tabs.css';
import '@adobe/aem-boilerplate/blocks/tabs/tabs-nutrition.css';
import '@adobe/aem-boilerplate/blocks/tabs/tabs-brand-tiles.css';
import {
  contentArgTypes, createPage, element, picture, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Tabs',
  args: {
    heading: 'Explore your favorites', copy: 'Find something sweet for every occasion.', showImage: true, labels: ['Chocolate', 'Candy', 'Baking'],
  },
  argTypes: {
    ...contentArgTypes,
    variant: { control: 'select', options: ['', 'recipes'], description: 'Production Tabs variant (nutrition has its own stories).' },
    labels: { control: 'object', description: 'Non-empty labels for authored tab rows; edit to test long labels and additional panels.' },
  },
  parameters: {
    docs: { description: { component: 'Production Tabs decorator and CSS. Controls change authored labels, panels and images. Pointer activation logs activate in Actions; keyboard selection logs select tab. Check tab/panel relationships in Accessibility and use Left/Right/Home/End to verify roving focus.' } },
  },
  render: ({
    heading, copy, showImage, labels, variant,
  }) => {
    const root = createPage('Blocks', 'Tabs');
    const main = showcase(root);
    const tabs = element('div', `tabs ${variant || ''} block`.replace(/\s+/g, ' '));
    labels.forEach((label) => {
      const row = element('div');
      const content = element('div');
      if (showImage) content.append(picture(label));
      content.append(element('h3', '', label), element('p', '', copy));
      row.append(element('div', '', label), content);
      tabs.append(row);
    });
    const container = section(main, tabs);
    container.querySelector('div').before(element('h2', '', heading));
    decorateTabs(tabs);
    return root;
  },
};
export const Default = {};
export const TextOnly = { args: { showImage: false } };
/** `Tabs (recipes)`: CSS-only variant; the panel heading loses its top margin. */
export const Recipes = {
  args: { variant: 'recipes', labels: ['Cakes', 'Cookies', 'Brownies'] },
};

const FACTS_ROWS = [
  'Serving size | 1 bar (43 g)',
  'Servings Per Container | 1',
  'Amount per serving | % DV*',
  'Total Fat | 13g | 17%',
  'Total Carbohydrates | 25g | 9%',
  'Total Sugars | 24g | -',
  'Protein | 3g | -',
];

function nutritionTabs(factsCell) {
  const root = createPage('Blocks', 'Tabs', 'Tabs (nutrition), as authored on product pages.');
  const main = showcase(root);
  const tabs = element('div', 'tabs nutrition block');
  const row = (label, ...nodes) => {
    const r = element('div');
    const content = element('div');
    content.append(...nodes);
    r.append(element('div', '', label), content);
    tabs.append(r);
  };
  row('Nutrition Facts', ...factsCell);
  row('Ingredients', element('p', '', 'Milk chocolate (sugar, milk, chocolate, cocoa butter), almonds.'), element('p', '', 'Contains milk and almonds.'));
  const badge = (label) => [picture(label, 48, 48), element('p', '', label)];
  row('Dietary Info', ...badge('Gluten free'), ...badge('Kosher'));
  section(main, tabs);
  return { root, tabs };
}

// The variant loads its stylesheet through loadCSS; a rel-less link with the expected href makes
// loadCSS resolve at once (the CSS is imported above), instead of requesting a file Storybook
// does not serve.
function markNutritionCssLoaded() {
  const href = `${window.hlx.codeBasePath}/blocks/tabs/tabs-nutrition.css`;
  if (document.head.querySelector(`link[href="${href}"]`)) return;
  const marker = element('link');
  marker.setAttribute('href', href);
  document.head.append(marker);
}

function nutritionRender(factsCell) {
  markNutritionCssLoaded();
  const { root, tabs } = nutritionTabs(factsCell);
  decorateTabs(tabs);
  return root;
}

/** `Tabs (nutrition)` with authored facts: "Name | amount | %DV" lines become aligned rows. */
export const Nutrition = {
  render: () => nutritionRender(FACTS_ROWS.map((text) => element('p', '', text))),
};

const SHEET_ROW = {
  gtin: '00034000000019',
  servingSize: '1 bar (43 g)',
  servingsPerContainer: '1',
  calories: '230',
  totalFat: '13g',
  totalFatDV: '17%',
  saturatedFat: '8g',
  saturatedFatDV: '40%',
  transFat: '0g',
  cholesterol: '5mg',
  cholesterolDV: '2%',
  sodium: '35mg',
  sodiumDV: '2%',
  totalCarbohydrates: '25g',
  totalCarbohydratesDV: '9%',
  dietaryFiber: '1g',
  dietaryFiberDV: '4%',
  totalSugars: '24g',
  addedSugars: '22g',
  addedSugarsDV: '44%',
  protein: '3g',
};

/**
 * Empty Nutrition Facts tab: the block fills it from the nutrition sheet (brand and bvid page
 * metadata). The sheet request is mocked, and only that request, so no network is used and
 * other stories keep the real fetch.
 */
export const NutritionFromSheet = {
  render: () => {
    markNutritionCssLoaded();
    const { root, tabs } = nutritionTabs([]);
    const metas = [['brand', "HERSHEY'S"], ['bvid', '34000000019']].map(([name, content]) => {
      const meta = element('meta');
      meta.name = name;
      meta.content = content;
      document.head.append(meta);
      return meta;
    });
    const realFetch = window.fetch;
    window.fetch = (input, init) => (String(input).startsWith('/products/nutrition.json')
      ? Promise.resolve(new Response(JSON.stringify({ data: [SHEET_ROW] }), { status: 200 }))
      : realFetch(input, init));
    // the decorator lazy-loads its script before it reads the metadata and calls fetch, so the
    // mock and the metadata stay until decoration is done, then everything is restored
    decorateTabs(tabs).catch(() => {}).finally(() => {
      window.fetch = realFetch;
      metas.forEach((meta) => meta.remove());
    });
    return root;
  },
};

export const BrandTiles = {
  name: 'Brand tiles',
  args: {
    heading: 'Explore & Shop Our Brands',
    tabs: { 'A-Z': 6, Chocolate: 4, Sweets: 3 },
  },
  argTypes: {
    tabs: { control: 'object', description: 'Tab label and how many tiles it holds. A tile is a picture and a link; links to other sites open in a new tab with an external-link icon.' },
  },
  parameters: {
    docs: { description: { story: 'Tabs (brand-tiles), the brand listing on /brands: a full-width dark bar of tabs over rows of four brand tiles (three from 768px, two below). Left/Right/Home/End move between tabs.' } },
  },
  render: ({ heading, tabs: tabCounts }) => {
    const root = createPage('Blocks', 'Tabs (brand-tiles)');
    const main = showcase(root);
    const block = element('div', 'tabs brand-tiles block');
    Object.entries(tabCounts).forEach(([label, count]) => {
      const row = element('div');
      const list = element('ul');
      Array.from({ length: count }, (_, i) => `${label} brand ${i + 1}`).forEach((name, i) => {
        const item = element('li');
        const link = element('a', '', name.toUpperCase());
        link.href = i === count - 1 ? 'https://www.example.com/' : '#';
        item.append(picture(name), link);
        list.append(item);
      });
      row.append(element('div', '', label), element('div', '', ''));
      row.lastElementChild.append(list);
      block.append(row);
    });
    const container = section(main, block);
    container.querySelector('div').before(element('h2', '', heading));
    decorateBrandTiles(block);
    return root;
  },
};
