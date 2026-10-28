import { getMetadata, loadScript } from './aem.js';
import { hasConsent } from './consent-state.js';

// Hershey's Adobe company path on assets.adobedtm.com (every property and environment)
// plus its production library id; never loaded from the prototype
const BLOCKED_LAUNCH = /\/11439a76c997\/|launch-8f1a5dc4f498/i;

/**
 * Loads Adobe Launch once the user has consented to analytics.
 * Off by default: nothing loads until the `launch-url` metadata holds a
 * Launch library URL. Hershey's Launch libraries (any property or build) are refused so no
 * analytics reach Hershey's reports from this prototype.
 */
const launchUrl = getMetadata('launch-url');
if (launchUrl && BLOCKED_LAUNCH.test(launchUrl)) {
  // eslint-disable-next-line no-console
  console.warn('consented: refusing hersheyland.com launch library');
} else if (launchUrl && hasConsent()) {
  // consent-check.js reloads on withdrawal once this is set; Launch can't be unloaded
  window.hlx.launchRequested = true;
  loadScript(launchUrl, { async: '' }).catch(() => {
    // eslint-disable-next-line no-console
    console.warn('consented: failed to load adobe launch');
  });
}
