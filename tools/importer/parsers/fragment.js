/* eslint-disable */
/* global WebImporter */
/**
 * Parser for fragment. Base: fragment (local block, blocks/fragment/fragment.js).
 * Source: https://www.hersheyland.com/recipes/reeses-oreo-cup-brownies.html
 * Source DOM: div#responsiveNewsletterV2.cmp-container > div.embed > .hl-nl (newsletter
 * sign-up experience fragment, shared by every recipe page; heading/copy + Emarsys form).
 * Output: Fragment block, 1 row x 1 cell holding a link to /fragments/newsletter-signup.
 * blocks/fragment decorate() reads the link href and loads `${path}.plain.html`; the
 * buildAutoBlocks /fragments/ scan skips links already inside a .fragment block, so the
 * content is loaded exactly once. The shared fragment content itself is authored separately.
 */
const FRAGMENT_PATH = '/fragments/newsletter-signup';

export default function parse(element, { document }) {
  // Only replace a recognised newsletter XF; anything else is left untouched.
  const isNewsletter = element.matches('#responsiveNewsletterV2')
    || element.querySelector('.hl-nl, #hl-ProfileForm, form.hl-nl-form');
  if (!isNewsletter) return;

  const link = document.createElement('a');
  link.href = FRAGMENT_PATH;
  link.textContent = FRAGMENT_PATH;

  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'fragment', cells });
  element.replaceWith(block);
}
