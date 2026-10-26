import { getMetadata, loadScript } from './aem.js';
import { hasConsent } from './consent-state.js';

const BV_SCRIPT = 'https://apps.bazaarvoice.com/deployments/hersheys/2021_new_site/production/en_US/bv.js';

let consented = hasConsent();
let bvReady;

/**
 * Turns Bazaarvoice's tracking cookies on or off to match the user's consent.
 * Ratings, reviews and questions render either way.
 * @param {Object} BV the Bazaarvoice API object
 */
function applyConsent(BV) {
  if (!BV || !BV.cookieConsent) return;
  BV.cookieConsent.setConsent({
    bv_metrics: consented,
    BVBRANDID: consented,
    BVBRANDSID: consented,
  });
}

window.addEventListener('consent.update', ({ detail }) => {
  consented = Boolean(detail && detail.consented);
  if (bvReady) applyConsent(window.BV);
});

/**
 * Loads the Bazaarvoice loader once. bv.js renders every `[data-bv-show]`
 * container on the page (inline ratings, reviews, questions).
 * @returns {Promise} resolves with the BV API once bv.js is ready
 */
export default function loadBazaarvoice() {
  if (!bvReady) {
    bvReady = new Promise((resolve) => {
      // bv.js calls window.bvCallback once its API is ready
      window.bvCallback = (BV) => {
        applyConsent(BV);
        resolve(BV);
      };
    });
    // the reviews widget times its fallback from this request
    window.hlx.bvRequestedAt = Date.now();
    // `bazaarvoice-url` metadata overrides the deployment
    loadScript(getMetadata('bazaarvoice-url') || BV_SCRIPT, { async: '' });
  }
  return bvReady;
}
