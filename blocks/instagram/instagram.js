import { loadScript } from '../../scripts/aem.js';
import { hasConsent } from '../../scripts/consent-state.js';

const PLATFORM_URL = 'https://elfsightcdn.com/platform.js';
const APP_ID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/**
 * Renders an Elfsight Instagram feed, as on hersheyland.com brand pages.
 * The authored cell holds the Elfsight app id. The feed sets third-party cookies, so nothing
 * loads until the visitor has consented (see scripts/consent-state.js).
 * @param {Element} block The instagram block
 */
export default async function decorate(block) {
  const appId = block.textContent.trim();
  block.textContent = '';
  if (!APP_ID.test(appId) || !hasConsent()) return;

  const app = document.createElement('div');
  app.className = `elfsight-app-${appId}`;
  app.dataset.elfsightAppLazy = '';
  block.append(app);

  try {
    await loadScript(PLATFORM_URL, { async: '' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('instagram: failed to load the Elfsight platform');
    app.remove();
  }
}
