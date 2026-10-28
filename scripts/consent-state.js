// OneTrust "Performance" cookie group; hersheyland.com gates analytics on it
const ANALYTICS_GROUP = 'C0002';

/**
 * Reads consent from OneTrust when it is present, otherwise declines.
 * Side-effect free, so vendor modules can import it without starting the
 * consent bootstrap in consent-check.js.
 *
 * On localhost and *.aem.page previews only, a query parameter overrides it for testing:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent
 *
 * @returns {boolean} true if the user has consented to analytics
 */
// eslint-disable-next-line import/prefer-default-export
export function hasConsent() {
  // never on the live site, where a shared link could grant consent for someone
  const { hostname } = window.location;
  const testHost = hostname === 'localhost' || hostname.endsWith('.aem.page');
  const consent = testHost ? new URLSearchParams(window.location.search).get('consent') : null;
  if (consent !== null) {
    return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
  }
  // OneTrust sets this to a comma-wrapped list, e.g. ",C0001,C0002,"
  const groups = window.OnetrustActiveGroups;
  if (typeof groups === 'string') return groups.includes(`,${ANALYTICS_GROUP},`);
  // default: decline
  return false;
}
