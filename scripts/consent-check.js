import { hasConsent } from './consent-state.js';

let consentedLoaded = false;

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  // Launch can't be unloaded: on withdrawal, reload so the next view runs without it.
  // Keyed on the request, not window._satellite, which only exists once the download finishes.
  if (!consented && window.hlx?.launchRequested) {
    window.location.reload();
    return;
  }
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

// OneTrust calls OptanonWrapper on load and whenever preferences change
const previousWrapper = window.OptanonWrapper;
window.OptanonWrapper = () => {
  if (typeof previousWrapper === 'function') previousWrapper();
  onConsentUpdate();
};

onConsentUpdate();
