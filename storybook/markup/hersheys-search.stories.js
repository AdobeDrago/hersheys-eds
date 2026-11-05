import decorateHersheysSearch from '@adobe/aem-boilerplate/blocks/hersheys-search/hersheys-search.js';
import '@adobe/aem-boilerplate/blocks/hersheys-search/hersheys-search.css';
import {
  createPage, element, picture, section, showcase,
} from './story-helpers.js';

const TITLES = [
  'Chocolate Chip Cookies', 'Fudgy Brownies', 'S’mores Bars', 'Peanut Butter Blossoms',
  'Hot Cocoa Bombs', 'Chocolate Lava Cake', 'Kisses Thumbprint Cookies', 'Cocoa Banana Bread',
  'Rich Chocolate Cheesecake', 'Dark Chocolate Truffles', 'Peppermint Bark', 'Chocolate Pudding Pie',
];

const FACETS = {
  'metaTags.category': { Desserts: 9, Snacks: 3 },
  'metaTags.skillLevel': { Beginner: 7, Intermediate: 5 },
  'metaTags.dietaryNeeds': { Vegetarian: 10, 'Gluten Free': 2 },
};

const IMG = (label) => picture(label, 600, 400).querySelector('img').src;

// per-listing mock data: titles, facet counts (keyed like facetAttributes) and hit shape
const LISTINGS = {
  recipes: {
    titles: TITLES,
    facets: FACETS,
    hit: (title, i) => ({ hero: { rating: (4 + (i % 2) * 0.5).toFixed(1) }, title }),
  },
  activities: {
    titles: [
      'Candy Bouquet', 'Pumpkin Spice Craft', 'Kisses Snowman', 'Paper Candy Wrappers',
      'Chocolate Bar Greeting Card', 'Reese’s Spider Web', 'Candy Cane Reindeer', 'Sweet Valentine Box',
    ],
    facets: {
      'metaTags.category': { Crafts: 6, Decorations: 2 },
      'metaTags.Seasons & Occasions': { Halloween: 3, Christmas: 3, Valentine: 2 },
      'metaTags.skillLevel': { Beginner: 5, Intermediate: 3 },
    },
    hit: (title, i) => ({
      hero: { h1: title, image: IMG(title), rating: (4 + (i % 2) * 0.5).toFixed(1) },
    }),
  },
  products: {
    titles: [
      'HERSHEY’S Milk Chocolate Bar', 'Reese’s Peanut Butter Cups', 'KISSES Milk Chocolate',
      'Almond Joy Bar', 'York Peppermint Patties', 'Twizzlers Strawberry Twists',
      'Jolly Rancher Hard Candy', 'Heath Toffee Bar',
    ],
    facets: {
      'metaTags.brand': {
        'HERSHEY’S': 3, 'Reese’s': 2, Twizzlers: 1, York: 2,
      },
      'metaTags.category': { Chocolate: 6, Candy: 2 },
      'metaTags.dietaryNeeds': { 'Gluten Free': 4 },
      'metaTags.Holidays & Celebrations': { Halloween: 3, Easter: 2 },
      'hero.rating': { 5: 3, 4: 5 },
    },
    hit: (title, i) => ({
      hero: {
        h1: title, image: IMG(title), portion: '1.55 oz', rating: 4 + (i % 2) * 0.5, ratingQuantity: 120 + i,
      },
      metaTags: i % 3 === 0 ? { productLabel: 'Seasonal' } : {},
    }),
  },
  stories: {
    titles: [
      'The Story of Milton Hershey', 'How Kisses Got Their Name', 'Baking Tips for Beginners',
      'A Sweet Holiday Tradition', 'Inside the Chocolate Factory', 'Summer Treats to Share',
    ],
    facets: {
      'metaTags.season': { Summer: 2, Winter: 2, Fall: 2 },
      'metaTags.category': { 'Baking Tips': 2, History: 4 },
    },
    hit: (title) => ({ hero: { h1: title, image: IMG(title), description: 'A short read from the Hershey archives.' } }),
  },
};

function mockAlgolia(hitsPerPage, options = {}, listing = LISTINGS.recipes) {
  const { empty = false, fail = false } = options;
  return async (url, init) => {
    if (fail) return { ok: false, status: 500, json: async () => ({}) };
    const body = JSON.parse(init.body);
    const params = new URLSearchParams(body.requests?.[0]?.params || '');
    const query = (params.get('query') || '').toLowerCase();
    const page = Number(params.get('page') || 0);
    const matches = empty ? [] : listing.titles.filter((t) => t.toLowerCase().includes(query));
    const hits = matches.slice(page * hitsPerPage, (page + 1) * hitsPerPage).map((title, i) => {
      const extra = listing.hit(title, i);
      return {
        objectID: `${title}-${i}`,
        title,
        url: { path: '/' },
        ...extra,
        hero: { ...extra.hero },
      };
    });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          hits,
          nbHits: matches.length,
          page,
          nbPages: Math.ceil(matches.length / hitsPerPage),
          hitsPerPage,
          facets: empty ? {} : listing.facets,
          query,
        }],
      }),
    };
  };
}

function renderSearch(mockOptions, hitsPerPage = 6, type = 'recipes') {
  const root = createPage('Blocks', `Search (${type})`, 'Search results are mocked; no request reaches Algolia.');
  const main = showcase(root);
  const block = element('div', `hersheys-search ${type === 'recipes' ? '' : type} block`.replace(/\s+/g, ' '));
  // The block calls the global fetch; the mock stays installed so later searches stay offline.
  window.fetch = mockAlgolia(hitsPerPage, mockOptions, LISTINGS[type]);
  decorateHersheysSearch(block);
  section(main, block, 'hersheys-search-container');
  return root;
}

export default {
  title: 'Blocks/Search Recipes',
  parameters: {
    docs: { description: { component: 'Production Search (Recipes) decorator and CSS with a mocked Algolia response. Search, facet filters, sort and pagination all run through the real block code. The authored block is empty; optional rows (hits-per-page, endpoint, asset-origin) override the defaults.' } },
  },
};

export const Default = { render: () => renderSearch() };
export const NoResults = { render: () => renderSearch({ empty: true }) };
export const LoadError = { render: () => renderSearch({ fail: true }) };

/** `Search (activities)`: crafts listing with the “Find an Activity” banner. */
export const Activities = { render: () => renderSearch({}, 6, 'activities') };
/** `Search (products)`: product cards with portion, rating and seasonal label; brand facet. */
export const Products = { render: () => renderSearch({}, 6, 'products') };
/** `Search (stories)`: no search banner (the page hero has the heading); season/category facets. */
export const Stories = { render: () => renderSearch({}, 6, 'stories') };
