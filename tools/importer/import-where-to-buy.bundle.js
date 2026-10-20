/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-where-to-buy.js
  var import_where_to_buy_exports = {};
  __export(import_where_to_buy_exports, {
    default: () => import_where_to_buy_default
  });

  // tools/importer/parsers/widget-pricespider.js
  function parse(element, { document }) {
    const configId = (element.getAttribute("ps-config") || element.getAttribute("data-ps-widget-id") || element.id || "").trim();
    const href = configId ? `/widgets/pricespider/where-to-buy.html?config=${encodeURIComponent(configId)}` : "/widgets/pricespider/where-to-buy.html";
    const link = document.createElement("a");
    link.href = href;
    link.textContent = href;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/hersheyland-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust cookie consent (<div id="onetrust-consent-sdk">)
        "#usntA42Toggle",
        // "Enable accessibility" toolbar toggle
        "a.skip-content",
        // "Skip to main content" link
        "#related-upcs",
        // hidden list of related UPC codes
        "#lightbox",
        // product image lightbox overlay (duplicate of gallery image)
        ".mobile-buy-now-container",
        // sticky mobile "Shop Now" duplicate CTA
        "img#amz-px",
        // Amazon tracking pixel
        'img[src*="ispot.tv"]',
        // iSpot.tv tracking pixel
        // recipe-detail: non-authorable recipe widgets/data
        "div.tags",
        // "More Like This" hidden tag links
        "div.recipe-unique-id",
        // empty recipe id container
        ".new-ScreenLock",
        // "BAKE MODE" wakelock toggle (wraps .wakelockParent)
        ".wakelockParent",
        ".ingredients-and-directions .new-svg-parent",
        // decorative wave svg (section style "wave")
        "#maxRecommend",
        // hidden Algolia config inputs
        "#threshold",
        "#pageType",
        "#productTheme",
        ".ready-recipe",
        // "READY TO MAKE THIS?" buy widget label
        ".ingredient-action",
        // sticky buy widget container
        ".ps-ng-widget"
        // PriceSpider buy widget
      ]);
      element.querySelectorAll("div.algolia-recommend").forEach((el) => {
        if (!el.querySelector(".card-container")) el.remove();
      });
      element.querySelectorAll(".algolia-recommend .button-section a.button").forEach((a) => {
        if (a.closest("strong")) return;
        const strong = a.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
      element.querySelectorAll(".ingredients-and-directions .time-summary dl").forEach((dl) => {
        const doc = dl.ownerDocument;
        const frag = doc.createDocumentFragment();
        dl.querySelectorAll("dt").forEach((dt) => {
          const dd = dt.nextElementSibling;
          const label = dt.textContent.trim();
          const value = dd && dd.tagName === "DD" ? dd.textContent.trim() : "";
          if (!label && !value) return;
          const p = doc.createElement("p");
          const strong = doc.createElement("strong");
          strong.textContent = label;
          p.append(strong, ` ${value}`);
          frag.append(p);
        });
        dl.replaceWith(frag);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll("div.experiencefragment").forEach((el) => {
        const isChrome = [...el.children].some((c) => c.classList.contains("cmp-experiencefragment--hub-navigation") || c.classList.contains("cmp-experiencefragment--hub-footer"));
        if (isChrome) el.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "div.embed",
        // empty script/tracking embeds (div.embed > div.cmp-embed)
        "div.product-detail.aem-GridColumn",
        // empty product-detail container
        ".angle-place-holder",
        // decorative angled divider in product overview
        ".angle-container",
        // empty decorative angle divs inside sections
        "iframe",
        // tracking iframes (demdex, TTD pixel, onetrust)
        "link",
        "noscript"
      ]);
    }
  }

  // tools/importer/transformers/hersheyland-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const doc = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-where-to-buy.js
  var parsers = {
    "widget-pricespider": parse
  };
  var PAGE_TEMPLATE = {
    name: "where-to-buy",
    description: "Where to Buy page: retailer/store locator content",
    urls: [
      "https://www.hersheyland.com/where-to-buy.html"
    ],
    blocks: [
      { name: "widget-pricespider", instances: ["div.where-to-buy div.ps-widget"] }
    ],
    sections: [
      {
        id: "s1",
        name: "back-to-products",
        selector: ["div.where-to-buy > div.back-to-product"],
        style: "maroon",
        blocks: [],
        defaultContent: ["div.back-to-product > a"]
      },
      {
        id: "s2",
        name: "store-locator",
        selector: ["div.where-to-buy > div.ps-widget"],
        style: null,
        blocks: ["widget-pricespider"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  function createMetadataBlock(main, document) {
    const meta = {};
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const title = document.querySelector("title");
    if (ogTitle && ogTitle.content) {
      meta.Title = ogTitle.content.trim();
    } else if (title) {
      meta.Title = title.textContent.replace(/[\n\t]/gm, "").trim();
    }
    const desc = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
    if (desc && desc.content) {
      meta.Description = desc.content.trim();
    }
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      const img = document.createElement("img");
      img.src = ogImage.content;
      meta.Image = img;
    }
    const brandTheme = [...document.body.classList].find((c) => /^[a-z]+-primary$/.test(c));
    if (brandTheme) {
      meta.theme = brandTheme;
    }
    document.querySelectorAll('meta[name^="ps-"]').forEach((m) => {
      if (m.content && m.content.trim()) meta[m.getAttribute("name")] = m.content.trim();
    });
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
    return meta;
  }
  var import_where_to_buy_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = createMetadataBlock(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: meta.Title || document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_where_to_buy_exports);
})();
