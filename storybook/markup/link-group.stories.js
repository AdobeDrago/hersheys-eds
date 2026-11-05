import decorateLinkGroup from '@adobe/aem-boilerplate/blocks/link-group/link-group.js';
import '@adobe/aem-boilerplate/blocks/link-group/link-group.css';
import {
  createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

const LABELS = ['About', 'All Brands', 'Recipes', 'Products', 'Activities', 'Our History', 'Shop'];

function render({ eyebrow, heading, count }) {
  const root = createPage('Blocks', 'Link Group');
  const main = showcase(root);
  const block = element('div', 'link-group block');
  const head = element('div');
  const headCell = element('div');
  headCell.append(element('p', '', eyebrow), element('h2', '', heading));
  head.append(headCell);
  block.append(head);
  LABELS.slice(0, count).forEach((label) => {
    const row = element('div');
    const cell = element('div');
    const p = element('p');
    p.append(link(label));
    cell.append(picture(label, 400, 400), p);
    row.append(cell);
    block.append(row);
  });
  const container = section(main, block);
  decorateLinkGroup(block);
  container.classList.add('link-group-section');
  return root;
}

export default {
  title: 'Blocks/Link Group',
  render,
  args: { eyebrow: 'HERSHEYLAND', heading: 'Explore Recipes, Products, Activities & More', count: 7 },
  argTypes: {
    eyebrow: { control: 'text', description: 'First paragraph of row 1.' },
    heading: { control: 'text', description: 'h2 of row 1.' },
    count: {
      control: {
        type: 'range', min: 1, max: 7, step: 1,
      },
      description: 'Number of authored tile rows (picture + link). Three tiles show per page.',
    },
  },
  parameters: {
    docs: { description: { component: 'Production Link Group decorator and CSS. Row 1 holds the eyebrow and heading; every other row is a picture plus link. Previous/next buttons and kiss dots scroll the slider and log in Actions; links log navigate. The block adds footer-on-dark to the document body.' } },
  },
};
export const Default = {};
export const FewTiles = { args: { count: 3 } };
