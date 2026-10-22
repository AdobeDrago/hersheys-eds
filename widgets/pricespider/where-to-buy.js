import { getMetadata, loadScript } from '../../scripts/aem.js';
import { PRICESPIDER_CDN, PRICESPIDER_LOADER } from '../../scripts/pricespider.js';

/**
 * PriceSpider (Wayvia) Where to Buy store locator.
 * Account settings (ps-key, ps-country, ps-language, ps-library, ps-token) are
 * page metadata, rendered into <head> by EDS. PriceSpider reads ?ps-sku= itself.
 * @param {Element} widget The widget element (data-config from the authored link)
 */
export default async function decorate(widget) {
  const psKey = getMetadata('ps-key');
  if (!psKey) {
    // eslint-disable-next-line no-console
    console.warn('where-to-buy widget: missing ps-key page metadata');
    return;
  }

  const mount = document.createElement('div');
  mount.className = 'ps-widget';
  mount.setAttribute('ps-config', widget.dataset.config || getMetadata('ps-config'));
  widget.replaceChildren(mount);

  const account = psKey.split('-')[0];
  await Promise.all([
    loadScript(PRICESPIDER_LOADER, { async: '' }),
    loadScript(`${PRICESPIDER_CDN}/${account}/ps-utid.js`, { async: '' }),
  ]);
}
