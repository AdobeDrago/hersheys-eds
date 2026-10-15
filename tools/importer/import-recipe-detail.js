/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbTrailParser from './parsers/breadcrumb-trail.js';
import heroRecipeParser from './parsers/hero-recipe.js';
import columnsRecipeParser from './parsers/columns-recipe.js';
import fragmentParser from './parsers/fragment.js';
import cardsRecipeParser from './parsers/cards-recipe.js';
import columnsNutritionParser from './parsers/columns-nutrition.js';
import widgetParser from './parsers/widget.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/hersheyland-cleanup.js';
import sectionsTransformer from './transformers/hersheyland-sections.js';
import dmImagesTransformer from './transformers/hersheyland-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'breadcrumb-trail': breadcrumbTrailParser,
  'hero-recipe': heroRecipeParser,
  'columns-recipe': columnsRecipeParser,
  fragment: fragmentParser,
  'cards-recipe': cardsRecipeParser,
  'columns-nutrition': columnsNutritionParser,
  widget: widgetParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'recipe-detail',
  description: 'Recipe detail page: overview hero, ingredients & directions, newsletter fragment, related recipes, nutrition facts, reviews',
  urls: [
    'https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html'
  ],
  blocks: [
    {
      name: 'breadcrumb-trail',
      instances: [
        '.breadcrumb .cmp-breadcrumb'
      ]
    },
    {
      name: 'hero-recipe',
      instances: [
        '.recipe-craft-overview .hersheyland-us-recipe'
      ]
    },
    {
      name: 'columns-recipe',
      instances: [
        '.ingredients-and-directions .new-ingred-and-direct'
      ]
    },
    {
      name: 'fragment',
      instances: [
        '#responsiveNewsletterV2'
      ]
    },
    {
      name: 'cards-recipe',
      instances: [
        '.algolia-recommend .card-container'
      ]
    },
    {
      name: 'columns-nutrition',
      instances: [
        '.nutritionfacts .nutritional-ingredient-comp'
      ]
    },
    {
      name: 'widget',
      instances: [
        '.ratings-and-reviews'
      ]
    }
  ],
  sections: [
    {
      id: 'rc2',
      name: 'breadcrumb',
      selector: [
        'div.breadcrumb'
      ],
      style: null,
      blocks: [
        'breadcrumb-trail'
      ],
      defaultContent: []
    },
    {
      id: 'rc3-overview',
      name: 'recipe-overview',
      selector: [
        '.recipe-craft-overview'
      ],
      style: null,
      blocks: [
        'hero-recipe'
      ],
      defaultContent: [
        '.recipe-craft-overview .desc-section'
      ]
    },
    {
      id: 'rc3-ingredients',
      name: 'ingredients-and-directions',
      selector: [
        '.directions-and-ingredients .ingredients-and-directions',
        '.ingredients-and-directions'
      ],
      style: 'light-gray, wave',
      blocks: [
        'columns-recipe'
      ],
      defaultContent: [
        '.ingredients-and-directions .time-parent.new-recipe h2',
        '.ingredients-and-directions .time-parent.new-recipe dl'
      ]
    },
    {
      id: 'rc3-newsletter',
      name: 'newsletter-signup',
      selector: [
        '.directions-and-ingredients .xfpage',
        '#responsiveNewsletterV2'
      ],
      style: null,
      blocks: [
        'fragment'
      ],
      defaultContent: []
    },
    {
      id: 'rc3-related',
      name: 'related-recipes',
      selector: [
        '.algolia-recommend'
      ],
      style: null,
      blocks: [
        'cards-recipe'
      ],
      defaultContent: [
        '.algolia-recommend .header h2',
        '.algolia-recommend .button-section a.button'
      ]
    },
    {
      id: 'rc3-nutrition',
      name: 'nutrition',
      selector: [
        '.nutritionfacts'
      ],
      style: 'light-gray',
      blocks: [
        'columns-nutrition'
      ],
      defaultContent: []
    },
    {
      id: 'rc4',
      name: 'ratings-and-reviews',
      selector: [
        '.ratings-and-reviews'
      ],
      style: null,
      blocks: [
        'widget'
      ],
      defaultContent: []
    }
  ]
};

// TRANSFORMER REGISTRY
// Order: cleanup → sections → DM images (DM runs afterTransform only, once parsers have built cells)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * Builds the page Metadata block. Mirrors WebImporter.rules.createMetadata
 * (title, description, image) and adds `theme` (brand color theme) and `bvid`,
 * which hero-recipe reads to render the Bazaarvoice inline rating
 * and widget uses for the reviews productId.
 * @param {Element} main
 * @param {Document} document
 */
function createMetadataBlock(main, document) {
  const meta = {};

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const title = document.querySelector('title');
  if (ogTitle && ogTitle.content) {
    meta.Title = ogTitle.content.trim();
  } else if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '').trim();
  }

  const desc = document.querySelector('meta[name="description"]')
    || document.querySelector('meta[property="og:description"]');
  if (desc && desc.content) {
    meta.Description = desc.content.trim();
  }

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    const img = document.createElement('img');
    img.src = ogImage.content;
    meta.Image = img;
  }

  // Brand theme: source sets it as a body class (e.g. reese-primary, hershey-primary);
  // theme metadata reproduces that class on the EDS body for brand-colored blocks.
  // Lowercase key: getMetadata() matches meta[name="theme"] exactly.
  const brandTheme = [...document.body.classList].find((c) => /^[a-z]+-primary$/.test(c));
  if (brandTheme) {
    meta.theme = brandTheme;
  }

  const bvMeta = document.querySelector('meta[name="bvId"], meta[name="bvid"], meta[name="bv-id"]');
  if (bvMeta && bvMeta.content) {
    meta.bvid = bvMeta.content.trim();
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);
  return meta;
}

/**
 * The related-recipes slider (Algolia Recommend) only renders once it scrolls
 * into view. Scroll it into view and wait for its cards before transforming.
 * @param {Document} document
 */
async function renderRelatedRecipes(document) {
  const container = document.querySelector('.algolia-recommend');
  if (!container) return;
  const hasCards = () => container.querySelector('li.ais-RelatedProducts-item');
  const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
  // Step down the page: the slider's scripts load on scroll, not on a jump to the section.
  window.scrollTo(0, 0);
  for (let i = 0; i < 20 && !hasCards(); i += 1) {
    window.scrollBy(0, 400);
    window.dispatchEvent(new Event('scroll'));
    // eslint-disable-next-line no-await-in-loop
    await wait(300);
  }
  const deadline = Date.now() + 20000;
  while (!hasCards() && Date.now() < deadline) {
    container.scrollIntoView({ block: 'center' });
    window.dispatchEvent(new Event('scroll'));
    // eslint-disable-next-line no-await-in-loop
    await wait(500);
  }
  if (!hasCards()) console.warn('Related recipes did not render; cards-recipe will be empty');
  window.scrollTo(0, 0);
}

export default {
  onLoad: async ({ document }) => {
    await renderRelatedRecipes(document);
  },

  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform transformers (cleanup, section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform transformers (final cleanup, section metadata, DM images)
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = createMetadataBlock(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: meta.Title || document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
        bvid: meta.bvid || '',
      },
    }];
  },
};
