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

  // tools/importer/import-products.js
  var import_products_exports = {};
  __export(import_products_exports, {
    default: () => import_products_default
  });

  // tools/importer/parsers/breadcrumb-trail.js
  function parse(element, { document }) {
    let items = [...element.querySelectorAll("li.cmp-breadcrumb__item, ol > li, ul > li")];
    if (!items.length) items = [...element.querySelectorAll("a[href]")];
    const list = document.createElement("ul");
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const a = item.matches("a") ? item : item.querySelector("a[href]");
      const text = (a || item).textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const key = `${a ? a.getAttribute("href") : ""}|${text}`;
      if (seen.has(key)) return;
      seen.add(key);
      const li = document.createElement("li");
      if (a) {
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        if (a.title) link.title = a.title;
        link.textContent = text;
        li.append(link);
      } else {
        li.textContent = text;
      }
      list.append(li);
    });
    if (!list.children.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[list]];
    const block = WebImporter.Blocks.createBlock(document, { name: "breadcrumb-trail", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-product.js
  function parse2(element, { document }) {
    let imgs = [...element.querySelectorAll(".product-image .hershey-slider__slide img, .product-image img.main-img")];
    if (!imgs.length) imgs = [...element.querySelectorAll(".image-carousel img.main-img, .image-carousel .product-image img")];
    if (!imgs.length) {
      imgs = [...element.querySelectorAll(".image-carousel img, img")].filter((img) => !img.closest('.product-thumbs, .rating, [class*="bv_"]'));
    }
    const seenSrc = /* @__PURE__ */ new Set();
    const mediaCell = [];
    imgs.forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src");
      if (!src || seenSrc.has(src.split("?")[0])) return;
      seenSrc.add(src.split("?")[0]);
      const out = document.createElement("img");
      out.src = src;
      out.alt = img.getAttribute("alt") || "";
      mediaCell.push(out);
    });
    const details = element.querySelector(".details:not(.hidden-desktop) .details-content") || element.querySelector(".details:not(.hidden-desktop)") || element.querySelector(".details-content") || element;
    const detailsCell = [];
    const srcH1 = details.querySelector("h1") || element.querySelector("h1, h2");
    if (srcH1) {
      const h1 = document.createElement("h1");
      const clone = srcH1.cloneNode(true);
      clone.querySelectorAll(".eyebrow").forEach((e) => {
        if (!e.textContent.trim()) e.remove();
      });
      h1.innerHTML = clone.innerHTML.replace(/\s+/g, " ").trim();
      detailsCell.push(h1);
    }
    const sizeLinks = [...details.querySelectorAll(".sizes a")];
    if (sizeLinks.length) {
      const label = document.createElement("p");
      label.textContent = "Choose a size:";
      detailsCell.push(label);
      const ul = document.createElement("ul");
      const current = sizeLinks.filter((a) => a.classList.contains("default-size") || !a.getAttribute("href"));
      const others = sizeLinks.filter((a) => !current.includes(a));
      [...current, ...others].forEach((a) => {
        const text = a.textContent.replace(/\s+/g, " ").trim();
        if (!text) return;
        const li = document.createElement("li");
        if (current.includes(a)) {
          const strong = document.createElement("strong");
          strong.textContent = text;
          li.append(strong);
        } else {
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = text;
          li.append(link);
        }
        ul.append(li);
      });
      detailsCell.push(ul);
    }
    const descNodes = [...details.querySelectorAll(".product-details p")];
    if (!descNodes.length) {
      const d = details.querySelector(".product-details");
      if (d && d.textContent.trim()) descNodes.push(d);
    }
    descNodes.forEach((node) => {
      if (!node.textContent.trim()) return;
      const p = document.createElement("p");
      p.innerHTML = node.innerHTML.trim();
      detailsCell.push(p);
    });
    const cta = details.querySelector("a.buy-now") || element.querySelector('a.buy-now, a[href*="where-to-buy"]');
    if (cta) {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = cta.getAttribute("href");
      link.textContent = cta.textContent.replace(/\s+/g, " ").trim() || "Shop Now";
      p.append(link);
      detailsCell.push(p);
    }
    if (!mediaCell.length && !detailsCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[mediaCell.length ? mediaCell : "", detailsCell.length ? detailsCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-nutrition.js
  var clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function textP(document, text, bold) {
    const p = document.createElement("p");
    if (bold) {
      const s = document.createElement("strong");
      s.textContent = text;
      p.append(s);
    } else {
      p.textContent = text;
    }
    return p;
  }
  function buildNutrition(panel, document) {
    const out = [];
    panel.querySelectorAll(".nf-serving-row").forEach((row) => {
      const label = clean(row.querySelector(".label"));
      const val = clean(row.querySelector(".val"));
      if (!label && !val) return;
      out.push(textP(document, val ? `${label} | ${val}` : label, row.classList.contains("bold")));
    });
    const macros = [...panel.querySelectorAll(".nf-macro-cell")];
    if (macros.length) {
      const ul = document.createElement("ul");
      macros.forEach((cell) => {
        const label = clean(cell.querySelector(".macro-label"));
        const val = clean(cell.querySelector(".macro-val"));
        if (!label) return;
        const li = document.createElement("li");
        li.textContent = val ? `${label} | ${val}` : label;
        ul.append(li);
      });
      if (ul.children.length) out.push(ul);
    }
    const header = panel.querySelector(".nf-detail-header");
    if (header) {
      let parts = [...header.querySelectorAll(":scope > span, :scope > div, :scope > p")].map(clean).filter(Boolean);
      if (parts.length < 2) {
        const copy = header.cloneNode(true);
        copy.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
        parts = copy.textContent.split(/\s*\n\s*/).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
      }
      if (parts.length) out.push(textP(document, parts.join(" | ")));
    }
    const rows = [...panel.querySelectorAll(".nf-row")];
    if (rows.length) {
      const ul = document.createElement("ul");
      let lastTop = null;
      rows.forEach((row) => {
        const name = clean(row.querySelector(".name"));
        const amount = clean(row.querySelector(".amount")) || "-";
        const dv = clean(row.querySelector(".dv")) || "-";
        if (!name) return;
        const li = document.createElement("li");
        li.append(document.createTextNode(`${name} | ${amount} | ${dv}`));
        if (row.classList.contains("indent") && lastTop) {
          let sub = lastTop.querySelector(":scope > ul");
          if (!sub) {
            sub = document.createElement("ul");
            lastTop.append(sub);
          }
          sub.append(li);
        } else {
          ul.append(li);
          lastTop = li;
        }
      });
      if (ul.children.length) out.push(ul);
    }
    panel.querySelectorAll(".nf-footer p").forEach((p) => {
      const t = clean(p);
      if (t) out.push(textP(document, t));
    });
    return out;
  }
  function buildIngredients(panel, document) {
    const out = [];
    panel.querySelectorAll("p").forEach((p) => {
      const t = clean(p);
      if (t) out.push(textP(document, t));
    });
    return out;
  }
  var toIconName = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  function buildDietary(panel, document) {
    const out = [];
    let cellsEls = [...panel.querySelectorAll(".icon-cell")];
    if (!cellsEls.length) {
      cellsEls = [...panel.querySelectorAll("img, svg")].map((el) => el.parentElement).filter((el, i, arr) => arr.indexOf(el) === i);
    }
    cellsEls.forEach((cell) => {
      var _a;
      const img = cell.querySelector("img");
      const label = clean(cell.querySelector(".icon-label")) || clean(cell.querySelector(":scope > span")) || (((_a = cell.querySelector("svg[aria-label]")) == null ? void 0 : _a.getAttribute("aria-label")) || "").replace(/\s*icon$/i, "");
      const src = img ? img.getAttribute("src") || "" : "";
      if (src && !src.startsWith("data:")) {
        const p = document.createElement("p");
        const outImg = document.createElement("img");
        outImg.src = src;
        outImg.alt = img.getAttribute("alt") || (label ? `${label} icon` : "");
        p.append(outImg);
        out.push(p);
      } else if (label && (img || cell.querySelector("svg"))) {
        out.push(textP(document, `:${toIconName(label)}:`));
      }
      if (label) out.push(textP(document, label));
    });
    return out;
  }
  function buildGeneric(panel, document) {
    const out = [];
    panel.querySelectorAll("p, li, img").forEach((el) => {
      if (el.matches("img")) {
        const img = document.createElement("img");
        img.src = el.getAttribute("src");
        img.alt = el.getAttribute("alt") || "";
        out.push(img);
      } else if (!el.querySelector("p, li")) {
        const t = clean(el);
        if (t) out.push(textP(document, t));
      }
    });
    return out;
  }
  function parse3(element, { document }) {
    const buttons = [...element.querySelectorAll('.tabs button.tab-btn, .tabs [role="tab"]')];
    const panels = [...element.querySelectorAll('.tab-panel, [role="tabpanel"]')].filter((p, i, arr) => !arr.some((o) => o !== p && o.contains(p)));
    const cells = [];
    const used = /* @__PURE__ */ new Set();
    buttons.forEach((btn, i) => {
      const label = clean(btn);
      if (!label) return;
      const key = (btn.id || "").replace(/^btn-/, "");
      let panel = key ? element.querySelector(`#${CSS.escape(key)}`) : null;
      if (!panel || used.has(panel)) panel = panels[i];
      if (!panel) return;
      used.add(panel);
      let content;
      if (panel.querySelector(".nf, .nf-row, .nf-serving-row")) content = buildNutrition(panel, document);
      else if (panel.querySelector(".icon-cell, .di")) content = buildDietary(panel, document);
      else if (panel.querySelector(".ing")) content = buildIngredients(panel, document);
      else content = buildGeneric(panel, document);
      cells.push([label, content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-nutrition", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget.js
  function findBvId(element, document) {
    const meta = document.querySelector('meta[name="bvId"], meta[name="bvid"], meta[name="bv-id"], meta[property="bvId"]');
    const fromMeta = meta && meta.getAttribute("content");
    if (fromMeta && fromMeta.trim()) return fromMeta.trim();
    const attrs = ["data-bv-product-id", "data-bv-productid", "data-product-id"];
    const scope = [element, document];
    for (const root of scope) {
      for (const attr of attrs) {
        const el = root.querySelector(`[${attr}]`);
        const v = el && el.getAttribute(attr);
        if (v && v.trim()) return v.trim();
      }
    }
    const ldScripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    for (const s of ldScripts) {
      try {
        const data = JSON.parse(s.textContent);
        const list = Array.isArray(data) ? data : data["@graph"] || [data];
        for (const item of list) {
          if (item && /product/i.test(item["@type"] || "")) {
            if (item.gtin14) return String(item.gtin14);
            if (item.sku) return String(item.sku).split("-")[0];
          }
        }
      } catch (e) {
      }
    }
    const wtb = document.querySelector('a[href*="ps-sku="]');
    if (wtb) {
      const m = wtb.getAttribute("href").match(/[?&]ps-sku=([^&#]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return "";
  }
  function parse4(element, { document }) {
    const bvId = findBvId(element, document);
    if (!bvId) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const href = `/widgets/bazaarvoice/reviews.html?productId=${encodeURIComponent(bvId)}`;
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
        "img#amz-px"
        // Amazon tracking pixel
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "div.experiencefragment",
        // hub-navigation (header) and hub-footer experience fragments
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

  // tools/importer/transformers/hersheyland-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    if (typeof urlStr !== "string") return false;
    if (!/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-products.js
  var parsers = {
    "breadcrumb-trail": parse,
    "columns-product": parse2,
    "tabs-nutrition": parse3,
    widget: parse4
  };
  var PAGE_TEMPLATE = {
    name: "products",
    description: "Product detail page: breadcrumb, product overview (gallery + details), nutritional information tabs, Bazaarvoice ratings & reviews",
    urls: [
      "https://www.hersheyland.com/products/hersheys-milk-chocolate-candy-bars-9-3-oz-6-pack.html"
    ],
    blocks: [
      { name: "breadcrumb-trail", instances: [".breadcrumb .cmp-breadcrumb"] },
      { name: "columns-product", instances: [".product-overview-hersheyland .product-grid"] },
      { name: "tabs-nutrition", instances: [".nutritional-ingredient-comp .tab-container"] },
      { name: "widget", instances: [".ratings-and-reviews"] }
    ],
    sections: [
      {
        id: "rc1",
        name: "breadcrumb",
        selector: ["div.breadcrumb"],
        style: null,
        blocks: ["breadcrumb-trail"],
        defaultContent: []
      },
      {
        id: "rc3",
        name: "product-overview",
        selector: [".product-overview-hersheyland"],
        style: null,
        blocks: ["columns-product"],
        defaultContent: []
      },
      {
        id: "rc6",
        name: "nutritional-information",
        selector: ["section.light-gray-background", ".nutritionfacts"],
        style: "light-gray",
        blocks: ["tabs-nutrition"],
        defaultContent: [".nutritional-ingredient-comp .card-header h2", ".nutritional-ingredient-comp .card-header p"]
      },
      {
        id: "rc7",
        name: "ratings-and-reviews",
        selector: [".ratings-and-reviews"],
        style: null,
        blocks: ["widget"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
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
    const bvMeta = document.querySelector('meta[name="bvId"], meta[name="bvid"], meta[name="bv-id"]');
    if (bvMeta && bvMeta.content) {
      meta.bvid = bvMeta.content.trim();
    }
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(block);
    return meta;
  }
  var import_products_default = {
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
          blocks: pageBlocks.map((b) => b.name),
          bvid: meta.bvid || ""
        }
      }];
    }
  };
  return __toCommonJS(import_products_exports);
})();
