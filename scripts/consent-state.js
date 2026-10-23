// OneTrust "Performance" cookie group; hersheyland.com gates analytics on it
const ANALYTICS_GROUP = 'C0002';

/**
 * Reads consent from OneTrust when it is present, otherwise declines.
 * Side-effect free, so vendor modules can import it without starting the
 * consent bootstrap in consent-check.js.
 *
 * The result can be overridden with a query parameter for testing:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent
 *
 * @returns {boolean} true if the user has consented to analytics
 */
// eslint-disable-next-line import/prefer-default-export
export function hasConsent() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent !== null) {
    return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
  }
  // OneTrust sets this to a comma-wrapped list, e.g. ",C0001,C0002,"
  const groups = window.OnetrustActiveGroups;
  if (typeof groups === 'string') return groups.includes(`,${ANALYTICS_GROUP},`);
  // default: decline
  return false;
}
