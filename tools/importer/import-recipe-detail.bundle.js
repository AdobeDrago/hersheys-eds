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
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-recipe-detail.js
  var import_recipe_detail_exports = {};
  __export(import_recipe_detail_exports, {
    default: () => import_recipe_detail_default
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

  // tools/importer/parsers/hero-recipe.js
  function parse2(element, { document }) {
    const categoryLink = element.querySelector(".label a[href], span.label a, .category a[href]");
    const heading = element.querySelector("h1") || element.querySelector("h2");
    let skillText = "";
    const variance = element.querySelector(".parentVariance");
    if (variance) {
      const label = variance.querySelector(".h5, span:first-of-type");
      const value = variance.querySelector(".h4, span:last-of-type");
      const l = label ? label.textContent.replace(/\s+/g, " ").trim() : "Skill Level:";
      const v = value && value !== label ? value.textContent.replace(/\s+/g, " ").trim() : "";
      skillText = `${l.replace(/:?\s*$/, ":")} ${v}`.trim();
    }
    const images = [...element.querySelectorAll(".recipe-card img, .carousel img, .item img, img")].filter((img) => {
      const src = img.getAttribute("src") || "";
      return src && !src.startsWith("data:") && !img.closest(".rating, .share-nav, .desc-section");
    });
    const heroImage = images[0];
    const descSection = element.querySelector(".desc-section");
    const descContent = [];
    if (descSection) {
      const source = descSection.querySelector(".description") || descSection;
      [...source.children].forEach((child) => {
        if (child.tagName === "P") {
          let current = document.createElement("p");
          const flush = () => {
            if (current.textContent.trim() || current.querySelector("img")) descContent.push(current);
            current = document.createElement("p");
          };
          const nodes = [...child.childNodes];
          for (let i = 0; i < nodes.length; i += 1) {
            const n = nodes[i];
            if (n.nodeType === 1 && n.tagName === "BR") {
              let j = i + 1;
              while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
              if (j < nodes.length && nodes[j].nodeType === 1 && nodes[j].tagName === "BR") {
                flush();
                i = j;
                continue;
              }
              current.append(n);
            } else if (n.nodeType === 1 && n.matches("span.caption")) {
              flush();
              const em = document.createElement("em");
              em.append(...n.childNodes);
              current.append(em);
              flush();
            } else {
              current.append(n);
            }
          }
          flush();
        } else if (child.textContent.trim()) {
          descContent.push(child);
        }
      });
    }
    if (!heading && !heroImage) {
      element.replaceWith(...descContent);
      return;
    }
    const cells = [];
    if (heroImage) cells.push([heroImage]);
    const textCell = [];
    if (categoryLink) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = categoryLink.getAttribute("href");
      a.textContent = categoryLink.textContent.replace(/\s+/g, " ").trim();
      p.append(a);
      textCell.push(p);
    }
    if (heading) {
      const h1 = document.createElement("h1");
      h1.innerHTML = heading.innerHTML;
      textCell.push(h1);
    }
    if (skillText) {
      const p = document.createElement("p");
      p.textContent = skillText;
      textCell.push(p);
    }
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-recipe", cells });
    element.replaceWith(block);
    if (descContent.length) block.after(...descContent);
  }

  // tools/importer/parsers/columns-recipe.js
  var clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  function appendInline(target, src, document) {
    src.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/\s+/g, " ");
        if (t.trim()) {
          const prev = target.lastChild;
          const needsSpace = prev && !/\s$/.test(prev.textContent) && !/^[\s,.;:)]/.test(t.trimStart());
          target.append(document.createTextNode((needsSpace ? " " : "") + t.trim()));
        }
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (["input", "i", "svg", "script", "style", "button"].includes(tag)) return;
      if (["a", "strong", "b", "em", "sup", "sub"].includes(tag)) {
        const text = clean(n.textContent);
        if (!text) return;
        const prev = target.lastChild;
        if (prev && !/\s$/.test(prev.textContent) && !/^[,.;:)]/.test(text)) target.append(document.createTextNode(" "));
        const el = document.createElement(tag === "b" ? "strong" : tag);
        if (tag === "a") el.href = n.getAttribute("href");
        appendInline(el, n, document);
        target.append(el);
        return;
      }
      appendInline(target, n, document);
    });
  }
  function parse3(element, { document }) {
    const ingredientsCell = [];
    const ingRoot = element.querySelector(".ingredients-comp, .leftbox") || element;
    const ingHeading = ingRoot.querySelector("h3, h2, h4");
    const h3Ing = document.createElement("h3");
    h3Ing.textContent = ingHeading ? clean(ingHeading.textContent) : "Ingredients";
    ingredientsCell.push(h3Ing);
    const ingItems = [...ingRoot.querySelectorAll("li.ingredient-item")];
    const ingList = document.createElement("ul");
    (ingItems.length ? ingItems : [...ingRoot.querySelectorAll("ul > li")]).forEach((item) => {
      const li = document.createElement("li");
      const amount = item.querySelector(".ingredient-amount");
      const name = item.querySelector(".ingredient-name");
      if (amount || name) {
        if (amount) li.append(document.createTextNode(clean(amount.textContent)));
        if (name) appendInline(li, name, document);
      } else {
        appendInline(li, item, document);
      }
      if (clean(li.textContent)) ingList.append(li);
    });
    if (ingList.children.length) ingredientsCell.push(ingList);
    const methodCell = [];
    const methodRoot = element.querySelector(".step-by-step-directions, .rightbox") || element;
    const toolItems = [...methodRoot.querySelectorAll(".equipment-item")];
    if (toolItems.length) {
      const headerEl = methodRoot.querySelector(".equipment-header .h4, .equipment-header span, .equipment-header");
      const h3Tools = document.createElement("h3");
      h3Tools.textContent = headerEl ? clean(headerEl.textContent) : "You'll Need";
      const toolList = document.createElement("ul");
      toolItems.forEach((tool) => {
        const text = clean(tool.textContent);
        if (!text) return;
        const li = document.createElement("li");
        const link = tool.querySelector("a[href]");
        if (link) {
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = text;
          li.append(a);
        } else {
          li.textContent = text;
        }
        toolList.append(li);
      });
      methodCell.push(h3Tools, toolList);
    }
    const steps = [...methodRoot.querySelectorAll(".direction-detail")];
    if (steps.length) {
      const dirHeading = [...methodRoot.querySelectorAll("h3, h2")].find((h) => /direction/i.test(h.textContent));
      const h3Dir = document.createElement("h3");
      h3Dir.textContent = dirHeading ? clean(dirHeading.textContent) : "Directions";
      const ol = document.createElement("ol");
      steps.forEach((step) => {
        const li = document.createElement("li");
        const paras = [...step.querySelectorAll(".direction-step p, .direction-index p")];
        if (paras.length) {
          paras.forEach((sp) => {
            const p = document.createElement("p");
            appendInline(p, sp, document);
            if (clean(p.textContent)) li.append(p);
          });
        } else {
          const label = step.querySelector(".direction-step, .direction-index");
          if (label) {
            const p = document.createElement("p");
            appendInline(p, label, document);
            p.textContent = p.textContent.replace(/^\s*\d+\.\s*/, "");
            if (clean(p.textContent)) li.append(p);
          }
        }
        step.querySelectorAll(".description img, .image-container img").forEach((img) => {
          const src = img.getAttribute("src") || "";
          if (src && !src.startsWith("data:")) li.append(img);
        });
        if (li.childNodes.length) ol.append(li);
      });
      methodCell.push(h3Dir, ol);
    }
    if (!ingList.children.length && !methodCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[ingredientsCell, methodCell.length ? methodCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-recipe", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/fragment.js
  var FRAGMENT_PATH = "/fragments/newsletter-signup";
  function parse4(element, { document }) {
    const isNewsletter = element.matches("#responsiveNewsletterV2") || element.querySelector(".hl-nl, #hl-ProfileForm, form.hl-nl-form");
    if (!isNewsletter) return;
    const link = document.createElement("a");
    link.href = FRAGMENT_PATH;
    link.textContent = FRAGMENT_PATH;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "fragment", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-recipe.js
  var clean2 = (s) => (s || "").replace(/\s+/g, " ").trim();
  function toPath(href) {
    if (!href) return "";
    try {
      const u = new URL(href, "https://www.hersheyland.com");
      if (/(^|\.)hersheyland\.com$/i.test(u.hostname)) return `${u.pathname}${u.search}${u.hash}`;
      return u.href;
    } catch (e) {
      return href;
    }
  }
  function findBvId(item) {
    const el = item.querySelector("[data-bv-product-id], [data-bv-productid], [data-product-id]");
    if (!el) return "";
    const v = el.getAttribute("data-bv-product-id") || el.getAttribute("data-bv-productid") || el.getAttribute("data-product-id") || "";
    return /^\d+$/.test(v.trim()) ? v.trim() : "";
  }
  function parse5(element, { document }) {
    let items = [...element.querySelectorAll("li.ais-RelatedProducts-item")];
    if (!items.length) items = [...element.querySelectorAll(".cmp-feature-card__box, .cmp-feature-card")];
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    items.forEach((item) => {
      const linkEl = item.querySelector("a[href]") || item.closest("a[href]");
      const href = toPath(linkEl ? linkEl.getAttribute("href") : "");
      const titleEl = item.querySelector(".copy-container .h4, .copy-container, .card-content .h4, h3, h4");
      const title = clean2(titleEl ? titleEl.textContent : "");
      if (!title && !href) return;
      const key = href || title;
      if (seen.has(key)) return;
      seen.add(key);
      const img = [...item.querySelectorAll("img")].find((i) => {
        const src = i.getAttribute("src") || "";
        return src && !src.startsWith("data:") && !i.closest(".review-container");
      });
      let imageCell = "";
      if (img) {
        const image = document.createElement("img");
        image.src = img.getAttribute("src");
        image.alt = img.getAttribute("alt") || title;
        imageCell = image;
      }
      const body = [];
      const h3 = document.createElement("h3");
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = title || href;
        h3.append(a);
      } else {
        h3.textContent = title;
      }
      body.push(h3);
      const bvId = findBvId(item);
      if (bvId) {
        const p = document.createElement("p");
        p.textContent = `bvid: ${bvId}`;
        body.push(p);
      }
      cells.push([imageCell, body]);
    });
    if (!cells.length) {
      element.remove();
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-recipe", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-nutrition.js
  var clean3 = (s) => (s || "").replace(/\s+/g, " ").trim();
  var DV_RE = /^\d+(?:\.\d+)?\s?%\*?$/;
  function buildNutrient(row, document) {
    const clone = row.cloneNode(true);
    let dv = "";
    const kids = [...clone.children];
    for (let i = kids.length - 1; i >= 0; i -= 1) {
      if (DV_RE.test(clean3(kids[i].textContent))) {
        dv = clean3(kids[i].textContent);
        kids[i].remove();
        break;
      }
    }
    const amountEl = clone.querySelector(".amount");
    const amount = amountEl ? clean3(amountEl.textContent) : "";
    if (amountEl) amountEl.remove();
    const name = clean3(clone.textContent);
    if (!name) return null;
    const bold = [...row.children].some((c) => c.tagName === "STRONG" && !DV_RE.test(clean3(c.textContent)) && clean3(c.textContent).startsWith(name));
    const li = document.createElement("li");
    if (bold) {
      const s = document.createElement("strong");
      s.textContent = name;
      li.append(s);
    } else {
      li.append(document.createTextNode(name));
    }
    let tail = amount ? ` ${amount}` : "";
    if (dv) tail += ` | ${dv}`;
    if (tail) li.append(document.createTextNode(tail));
    let level = 1;
    if (row.classList.contains("level-3")) level = 3;
    else if (row.classList.contains("level-2")) level = 2;
    return { li, level };
  }
  function parse6(element, { document }) {
    const facts = element.querySelector(".nutrition-facts") || element;
    const labelCell = [];
    const titleEl = facts.querySelector(".nutrition-facts-head .h1, .nutrition-facts-head h1, .nutrition-facts-head h2");
    const h3 = document.createElement("h3");
    h3.textContent = titleEl ? clean3(titleEl.textContent) : "Nutrition Facts";
    labelCell.push(h3);
    const servings = facts.querySelector(".per-container");
    if (servings && clean3(servings.textContent)) {
      const p = document.createElement("p");
      p.textContent = clean3(servings.textContent);
      labelCell.push(p);
    }
    const servingSize = [...facts.querySelectorAll(".serving > *")].find((el) => /serving\s+size/i.test(el.textContent));
    if (servingSize) {
      const p = document.createElement("p");
      p.textContent = clean3(servingSize.textContent);
      labelCell.push(p);
    }
    const calories = facts.querySelector(".calories-amount .calories, .calories");
    if (calories) {
      const value = calories.querySelector(".h1, span");
      const v = value ? clean3(value.textContent) : "";
      const label = clean3(calories.textContent.replace(v, "")) || "Calories";
      const p = document.createElement("p");
      p.textContent = `${label} ${v}`.trim();
      labelCell.push(p);
    }
    const rows = [...facts.querySelectorAll(
      ".nutrition-facts-daily-value > .align-left-right, .nutrition-facts-mineral > .align-left-right"
    )];
    const ul = document.createElement("ul");
    const parents = { 1: null, 2: null };
    rows.forEach((row) => {
      const item = buildNutrient(row, document);
      if (!item) return;
      const { li, level } = item;
      const parent = level === 3 ? parents[2] || parents[1] : level === 2 ? parents[1] : null;
      if (parent) {
        let sub = parent.querySelector(":scope > ul");
        if (!sub) {
          sub = document.createElement("ul");
          parent.append(sub);
        }
        sub.append(li);
      } else {
        ul.append(li);
      }
      if (level === 1) {
        parents[1] = li;
        parents[2] = null;
      }
      if (level === 2) parents[2] = li;
    });
    if (ul.children.length) labelCell.push(ul);
    facts.querySelectorAll(".nutrition-facts-foot p, .nutrition-facts-foot").forEach((foot) => {
      if (foot.matches(".nutrition-facts-foot") && foot.querySelector("p")) return;
      const text = clean3(foot.textContent);
      if (!text) return;
      const p = document.createElement("p");
      p.textContent = text;
      labelCell.push(p);
    });
    const asideCell = [];
    const aside = element.querySelector(".nutritional-rest, .questions");
    if (aside) {
      const heading = aside.querySelector("h4, h3, h2, .h4");
      if (heading && clean3(heading.textContent)) {
        const h4 = document.createElement("h4");
        h4.textContent = clean3(heading.textContent);
        asideCell.push(h4);
      }
      aside.querySelectorAll("a[href]").forEach((link) => {
        const text = clean3(link.textContent);
        if (!text) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = text;
        p.append(a);
        asideCell.push(p);
      });
    }
    if (!ul.children.length && !asideCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[labelCell, asideCell.length ? asideCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-nutrition", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget.js
  function findBvId2(element, document) {
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
  function parse7(element, { document }) {
    const bvId = findBvId2(element, document);
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

  // tools/importer/import-recipe-detail.js
  var parsers = {
    "breadcrumb-trail": parse,
    "hero-recipe": parse2,
    "columns-recipe": parse3,
    fragment: parse4,
    "cards-recipe": parse5,
    "columns-nutrition": parse6,
    widget: parse7
  };
  var PAGE_TEMPLATE = {
    name: "recipe-detail",
    description: "Recipe detail page: overview hero, ingredients & directions, newsletter fragment, related recipes, nutrition facts, reviews",
    urls: [
      "https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html"
    ],
    blocks: [
      {
        name: "breadcrumb-trail",
        instances: [
          ".breadcrumb .cmp-breadcrumb"
        ]
      },
      {
        name: "hero-recipe",
        instances: [
          ".recipe-craft-overview .hersheyland-us-recipe"
        ]
      },
      {
        name: "columns-recipe",
        instances: [
          ".ingredients-and-directions .new-ingred-and-direct"
        ]
      },
      {
        name: "fragment",
        instances: [
          "#responsiveNewsletterV2"
        ]
      },
      {
        name: "cards-recipe",
        instances: [
          ".algolia-recommend .card-container"
        ]
      },
      {
        name: "columns-nutrition",
        instances: [
          ".nutritionfacts .nutritional-ingredient-comp"
        ]
      },
      {
        name: "widget",
        instances: [
          ".ratings-and-reviews"
        ]
      }
    ],
    sections: [
      {
        id: "rc2",
        name: "breadcrumb",
        selector: [
          "div.breadcrumb"
        ],
        style: null,
        blocks: [
          "breadcrumb-trail"
        ],
        defaultContent: []
      },
      {
        id: "rc3-overview",
        name: "recipe-overview",
        selector: [
          ".recipe-craft-overview"
        ],
        style: null,
        blocks: [
          "hero-recipe"
        ],
        defaultContent: [
          ".recipe-craft-overview .desc-section"
        ]
      },
      {
        id: "rc3-ingredients",
        name: "ingredients-and-directions",
        selector: [
          ".directions-and-ingredients .ingredients-and-directions",
          ".ingredients-and-directions"
        ],
        style: "light-gray, wave",
        blocks: [
          "columns-recipe"
        ],
        defaultContent: [
          ".ingredients-and-directions .time-parent.new-recipe h2",
          ".ingredients-and-directions .time-parent.new-recipe dl"
        ]
      },
      {
        id: "rc3-newsletter",
        name: "newsletter-signup",
        selector: [
          ".directions-and-ingredients .xfpage",
          "#responsiveNewsletterV2"
        ],
        style: null,
        blocks: [
          "fragment"
        ],
        defaultContent: []
      },
      {
        id: "rc3-related",
        name: "related-recipes",
        selector: [
          ".algolia-recommend"
        ],
        style: null,
        blocks: [
          "cards-recipe"
        ],
        defaultContent: [
          ".algolia-recommend .header h2",
          ".algolia-recommend .button-section a.button"
        ]
      },
      {
        id: "rc3-nutrition",
        name: "nutrition",
        selector: [
          ".nutritionfacts"
        ],
        style: "light-gray",
        blocks: [
          "columns-nutrition"
        ],
        defaultContent: []
      },
      {
        id: "rc4",
        name: "ratings-and-reviews",
        selector: [
          ".ratings-and-reviews"
        ],
        style: null,
        blocks: [
          "widget"
        ],
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
  function renderRelatedRecipes(document) {
    return __async(this, null, function* () {
      const container = document.querySelector(".algolia-recommend");
      if (!container) return;
      const hasCards = () => container.querySelector("li.ais-RelatedProducts-item");
      const wait = (ms) => new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
      window.scrollTo(0, 0);
      for (let i = 0; i < 20 && !hasCards(); i += 1) {
        window.scrollBy(0, 400);
        window.dispatchEvent(new Event("scroll"));
        yield wait(300);
      }
      const deadline = Date.now() + 2e4;
      while (!hasCards() && Date.now() < deadline) {
        container.scrollIntoView({ block: "center" });
        window.dispatchEvent(new Event("scroll"));
        yield wait(500);
      }
      if (!hasCards()) console.warn("Related recipes did not render; cards-recipe will be empty");
      window.scrollTo(0, 0);
    });
  }
  var import_recipe_detail_default = {
    onLoad: (_0) => __async(void 0, [_0], function* ({ document }) {
      yield renderRelatedRecipes(document);
    }),
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
  return __toCommonJS(import_recipe_detail_exports);
})();
