import { element, link, picture } from './story-helpers.js';

const SITE = 'https://www.hersheyland.com/';

function contentSection(className) {
  const section = element('div', `section ${className}`.trim());
  const wrapper = element('div', 'default-content-wrapper');
  section.append(wrapper);
  return { section, wrapper };
}

// Placeholder image; icon-like images pass an empty alt exactly as authors would.
function media(label, width, height, alt = label) {
  const container = picture(label, width, height);
  container.querySelector('img').alt = alt;
  return container;
}

function wrap(tag, ...children) {
  const node = element(tag);
  node.append(...children);
  return node;
}

const paragraph = (...children) => wrap('p', ...children);
const list = (items) => wrap('ul', ...items);
const item = (...children) => wrap('li', ...children);

const NAV = [
  ['Chocolate', 'Explore Chocolate', '/chocolate', ['Bars', 'Kisses', 'Baking Chips', 'Syrup']],
  ['Candy', 'Explore Candy', '/candy', ['Chewy', 'Fruity', 'Mints', 'Zero Sugar']],
  ['Recipes', 'Explore Recipes', '/recipes', ['Cakes', 'Cookies', 'Brownies', 'Desserts']],
];

const SOCIAL = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Pinterest'];

const FOOTER_LINKS = [
  'Contact Customer Service', 'Company', 'Shop', 'Visit', 'Careers', 'Foodservice',
];

const LEGAL_LINKS = [
  'Do Not Sell or Share My Personal Information', 'Notice to Parents', 'Privacy Policy',
  'Terms & Conditions', 'Web Accessibility', 'Cookie Preferences',
];

const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function navFragment(main) {
  const brand = contentSection('hershey-nav');
  const home = link('', '/');
  home.append(media('Logo', 240, 69, 'Hersheyland'));
  brand.wrapper.append(paragraph(home));

  const sections = contentSection('');
  sections.wrapper.append(list(NAV.map(([label, overview, path, children]) => item(
    paragraph(label),
    list([
      item(paragraph(link(overview, `${SITE}${path}`))),
      ...children.map((text) => {
        const anchor = link('', `${SITE}${path}/${slug(text)}`);
        anchor.append(media(text, 150, 150, ''));
        return item(paragraph(anchor), paragraph(text));
      }),
    ]),
  ))));

  const tools = contentSection('');
  tools.wrapper.append(paragraph(
    link('Search products, recipes and activity ideas', `${SITE}/search`),
    media('Search', 24, 24, ''),
  ));
  main.append(brand.section, sections.section, tools.section);
}

function footerFragment(main) {
  const newsletter = contentSection('newsletter');
  const cta = link('Sign Up for the Newsletter', `${SITE}/newsletter?source=storybook`, 'button');
  newsletter.wrapper.append(
    element('h2', '', "Let's Keep in Touch"),
    element('p', '', 'Unwrap recipe ideas, celebration inspiration and product news.'),
    paragraph(media('Mail', 19, 12, 'Envelope icon')),
    element('p', '', 'TREAT YOUR INBOX TO SOMETHING SWEET!'),
    paragraph(cta),
    paragraph(media('Artwork', 311, 359, '')),
  );

  const brand = contentSection('footer-brand');
  const home = link('', '/');
  home.append(media('Logo', 600, 165, 'Hersheyland'));
  brand.wrapper.append(paragraph(home), list(SOCIAL.map((label) => item(
    media(label, 24, 24, label),
    link(label, `${SITE}/social/${slug(label)}`),
  ))));

  const links = contentSection('footer-links');
  links.wrapper.append(list(FOOTER_LINKS.map((label) => item(link(label, `${SITE}/${slug(label)}`)))));

  const legal = contentSection('footer-legal');
  legal.wrapper.append(
    element('p', '', '©2026 Example Company. All Rights Reserved.'),
    list(LEGAL_LINKS.map((label) => item(link(label, `${SITE}/${slug(label)}`)))),
  );
  main.append(newsletter.section, brand.section, links.section, legal.section);
}

export async function loadFragment(path) {
  const main = element('main');
  if (path === '/nav') navFragment(main);
  else if (path === '/footer') footerFragment(main);
  else throw new Error(`No Storybook fragment fixture for ${path}`);
  return main;
}
