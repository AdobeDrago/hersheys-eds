/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: hersheyland.com site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (products template).
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
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome and non-authorable leftovers
    WebImporter.DOMUtils.remove(element, [
      'div.experiencefragment', // hub-navigation (header) and hub-footer experience fragments
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
