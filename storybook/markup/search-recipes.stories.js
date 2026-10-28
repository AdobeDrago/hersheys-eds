import decorateSearchRecipes from '@adobe/aem-boilerplate/blocks/search-recipes/search-recipes.js';
import '@adobe/aem-boilerplate/blocks/search-recipes/search-recipes.css';
import {
  createPage, element, section, showcase,
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

function mockAlgolia(hitsPerPage, { empty = false, fail = false } = {}) {
  return async (url, init) => {
    if (fail) return { ok: false, status: 500, json: async () => ({}) };
    const body = JSON.parse(init.body);
    const params = new URLSearchParams(body.requests?.[0]?.params || '');
    const query = (params.get('query') || '').toLowerCase();
    const page = Number(params.get('page') || 0);
    const matches = empty ? [] : TITLES.filter((t) => t.toLowerCase().includes(query));
    const hits = matches.slice(page * hitsPerPage, (page + 1) * hitsPerPage).map((title, i) => ({
      objectID: `${title}-${i}`,
      title,
      url: { path: '/' },
      hero: { rating: (4 + (i % 2) * 0.5).toFixed(1) },
    }));
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
          facets: empty ? {} : FACETS,
          query,
        }],
      }),
    };
  };
}

function renderSearch(mockOptions, hitsPerPage = 6) {
  const root = createPage('Blocks', 'Search (Recipes)', 'Search results are mocked; no request reaches Algolia.');
  const main = showcase(root);
  const block = element('div', 'search-recipes block');
  // The block calls the global fetch; the mock stays installed so later searches stay offline.
  window.fetch = mockAlgolia(hitsPerPage, mockOptions);
  decorateSearchRecipes(block);
  section(main, block, 'search-recipes-container');
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
