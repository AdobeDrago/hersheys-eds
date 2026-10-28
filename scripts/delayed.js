import { getMetadata, loadScript } from './aem.js';

/**
 * Delayed phase: third parties that load after first paint.
 *
 * - Bazaarvoice: bazaarvoice.js, on pages with review containers; cookies follow consent.
 * - OneTrust: cookie banner, then consent-check.js reads the visitor's choice.
 * - Adobe Launch: consented.js, only after Performance (C0002) consent.
 *
 * Loaded by the blocks that need them, which never wait on them without a time limit:
 * - Algolia: blocks/search-recipes once the block is visible; cards (product, related)
 *   when the block loads, giving up after 2 s.
 * - Wayvia (PriceSpider): widgets/pricespider/where-to-buy.js.
 */

// Hershey's OneTrust test domain script (stage.hersheyland.com); it handles consent only
const ONETRUST_ID = '019aeff7-8232-75db-b3f5-0ed1b6a4b972-test';

/**
 * Loads the OneTrust CMP stub (cookie banner and consent state).
 */
async function loadOneTrust() {
  const domainScript = getMetadata('onetrust-id') || ONETRUST_ID;
  await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
    'data-domain-script': domainScript,
    charset: 'UTF-8',
  });
}

// ratings & reviews render for everyone; tracking cookies follow consent
if (document.querySelector('[data-bv-show]')) {
  import('./bazaarvoice.js').then(({ default: loadBazaarvoice }) => loadBazaarvoice());
}
loadOneTrust()
  .catch(() => {
    // footer cookie links read this to fall back instead of waiting for a CMP that won't come
    window.hlx.oneTrustFailed = true;
    // eslint-disable-next-line no-console
    console.warn('delayed: failed to load onetrust');
  })
  .finally(() => import('./consent-check.js'));
