/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbTrailParser from './parsers/breadcrumb-trail.js';
import columnsProductParser from './parsers/columns-product.js';
import tabsNutritionParser from './parsers/tabs-nutrition.js';
import widgetParser from './parsers/widget.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/hersheyland-cleanup.js';
import sectionsTransformer from './transformers/hersheyland-sections.js';
import dmImagesTransformer from './transformers/hersheyland-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'breadcrumb-trail': breadcrumbTrailParser,
  'columns-product': columnsProductParser,
  'tabs-nutrition': tabsNutritionParser,
  widget: widgetParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'products',
  description: 'Product detail page: breadcrumb, product overview (gallery + details), nutritional information tabs, Bazaarvoice ratings & reviews',
  urls: [
    'https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html',
  ],
  blocks: [
    { name: 'breadcrumb-trail', instances: ['.breadcrumb .cmp-breadcrumb'] },
    { name: 'columns-product', instances: ['.product-overview-hersheyland .product-grid'] },
    { name: 'tabs-nutrition', instances: ['.nutritional-ingredient-comp .tab-container'] },
    { name: 'widget', instances: ['.ratings-and-reviews'] },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'breadcrumb',
      selector: ['div.breadcrumb'],
      style: null,
      blocks: ['breadcrumb-trail'],
      defaultContent: [],
    },
    {
      id: 'rc3',
      name: 'product-overview',
      selector: ['.product-overview-hersheyland'],
      style: null,
      blocks: ['columns-product'],
      defaultContent: [],
    },
    {
      id: 'rc6',
      name: 'nutritional-information',
      selector: ['section.light-gray-background', '.nutritionfacts'],
      style: 'light-gray',
      blocks: ['tabs-nutrition'],
      defaultContent: ['.nutritional-ingredient-comp .card-header h2', '.nutritional-ingredient-comp .card-header p'],
    },
    {
      id: 'rc7',
      name: 'ratings-and-reviews',
      selector: ['.ratings-and-reviews'],
      style: null,
      blocks: ['widget'],
      defaultContent: [],
    },
  ],
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
 * (title, description, image) and adds `bvid`, which columns-product reads
 * to render the Bazaarvoice inline rating.
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

  const bvMeta = document.querySelector('meta[name="bvId"], meta[name="bvid"], meta[name="bv-id"]');
  if (bvMeta && bvMeta.content) {
    meta.bvid = bvMeta.content.trim();
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);
  return meta;
}

export default {
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
