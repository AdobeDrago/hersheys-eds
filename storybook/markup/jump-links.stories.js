import decorateJumpLinks from '@adobe/aem-boilerplate/blocks/jump-links/jump-links.js';
import '@adobe/aem-boilerplate/blocks/jump-links/jump-links.css';
import {
  createPage, element, link, picture, showcase, trackInteractions,
} from './story-helpers.js';

const TILES = [
  ['Trending Questions', '#trending-topics'],
  ['All About Hersheyland', '#all-about-hersheyland'],
  ['Allergens & Ingredients', '#allergens--ingredients'],
  ['Manufacturing & Products', '#manufacturing--products'],
  ['Our Brands', '#question-about-our-brands'],
  ['Milton & The Hershey Company', '#milton--the-hershey-company'],
];

function renderJumpLinks(tiles, { icons = true } = {}) {
  const root = createPage('Blocks', 'Jump Links');
  const main = showcase(root);
  const block = element('div', 'jump-links block');
  tiles.forEach(([label, href]) => {
    const row = element('div');
    const icon = element('div');
    if (icons) icon.append(picture('?', 50, 50));
    const text = element('div');
    if (label) text.append(href ? link(label, href) : label);
    row.append(icon, text);
    block.append(row);
  });
  decorateJumpLinks(block);
  const container = element('div', 'section jump-links-container');
  const heading = element('div', 'default-content-wrapper');
  heading.append(element('h2', '', 'Jump to a Section'));
  const wrapper = element('div', 'jump-links-wrapper');
  wrapper.append(block);
  container.append(heading, wrapper);
  main.append(container);
  trackInteractions(container);
  return root;
}

export default {
  title: 'Blocks/Jump Links',
  parameters: {
    docs: { description: { component: 'Production Jump Links decorator and CSS. Each authored row (icon | link) becomes a bordered tile linking to a heading on the page; the icon is decorative and the link text names the tile. Rows without a link are dropped. Links log in Actions.' } },
  },
};

export const Default = { render: () => renderJumpLinks(TILES) };
export const WithoutIcons = { render: () => renderJumpLinks(TILES.slice(0, 3), { icons: false }) };
export const MissingLink = { render: () => renderJumpLinks([['Not linked', ''], ...TILES.slice(0, 2)]) };
