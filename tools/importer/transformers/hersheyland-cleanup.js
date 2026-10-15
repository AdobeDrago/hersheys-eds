/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: hersheyland.com site-wide cleanup.
 * Shared by the "products" and "recipe-detail" templates. Selectors verified in
 * migration-work/_backup-products/cleaned.html (products) and
 * migration-work/cleaned.html (recipe-detail). Selectors absent on a page are no-ops.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets / hidden data that can interfere with block parsing
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk', // OneTrust cookie consent (<div id="onetrust-consent-sdk">)
      '#usntA42Toggle', // "Enable accessibility" toolbar toggle
      'a.skip-content', // "Skip to main content" link
      '#related-upcs', // hidden list of related UPC codes
      '#lightbox', // product image lightbox overlay (duplicate of gallery image)
      '.mobile-buy-now-container', // sticky mobile "Shop Now" duplicate CTA
      'img#amz-px', // Amazon tracking pixel
      'img[src*="ispot.tv"]', // iSpot.tv tracking pixel
      // recipe-detail: non-authorable recipe widgets/data
      'div.tags', // "More Like This" hidden tag links
      'div.recipe-unique-id', // empty recipe id container
      '.new-ScreenLock', // "BAKE MODE" wakelock toggle (wraps .wakelockParent)
      '.wakelockParent',
      '.ingredients-and-directions .new-svg-parent', // decorative wave svg (section style "wave")
      '#maxRecommend', // hidden Algolia config inputs
      '#threshold',
      '#pageType',
      '#productTheme',
      '.ready-recipe', // "READY TO MAKE THIS?" buy widget label
      '.ingredient-action', // sticky buy widget container
      '.ps-ng-widget', // PriceSpider buy widget
    ]);

    // Algolia "related" carousel: empty on product pages (client-rendered),
    // but holds related-recipe cards (cards-recipe) on recipe pages.
    element.querySelectorAll('div.algolia-recommend').forEach((el) => {
      if (!el.querySelector('.card-container')) el.remove();
    });

    // "View All Recipes" CTA: bold so EDS decorateButtons renders it as a button.
    element.querySelectorAll('.algolia-recommend .button-section a.button').forEach((a) => {
      if (a.closest('strong')) return;
      const strong = a.ownerDocument.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    });

    // Recipe yields/times (<dl> of dt/dd pairs, partly nested) would become a
    // jumbled list; emit one "<strong>Prep:</strong> 12 min." paragraph per pair.
    element.querySelectorAll('.ingredients-and-directions .time-summary dl').forEach((dl) => {
      const doc = dl.ownerDocument;
      const frag = doc.createDocumentFragment();
      dl.querySelectorAll('dt').forEach((dt) => {
        const dd = dt.nextElementSibling;
        const label = dt.textContent.trim();
        const value = dd && dd.tagName === 'DD' ? dd.textContent.trim() : '';
        if (!label && !value) return;
        const p = doc.createElement('p');
        const strong = doc.createElement('strong');
        strong.textContent = label;
        p.append(strong, ` ${value}`);
        frag.append(p);
      });
      dl.replaceWith(frag);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome and non-authorable leftovers
    // Header/footer experience fragments only. Recipe pages wrap the whole
    // recipe body in another XF (e.g. .cmp-experiencefragment--reeses-oreo-cup-brownies).
    element.querySelectorAll('div.experiencefragment').forEach((el) => {
      const isChrome = [...el.children].some((c) => c.classList.contains('cmp-experiencefragment--hub-navigation')
        || c.classList.contains('cmp-experiencefragment--hub-footer'));
      if (isChrome) el.remove();
    });

    WebImporter.DOMUtils.remove(element, [
      'div.embed', // empty script/tracking embeds (div.embed > div.cmp-embed)
      'div.product-detail.aem-GridColumn', // empty product-detail container
      '.angle-place-holder', // decorative angled divider in product overview
      '.angle-container', // empty decorative angle divs inside sections
      'iframe', // tracking iframes (demdex, TTD pixel, onetrust)
      'link',
      'noscript',
    ]);
  }
}
