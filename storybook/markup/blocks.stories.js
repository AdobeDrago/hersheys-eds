import decorateCards from '@adobe/aem-boilerplate/blocks/cards/cards.js';
import '@adobe/aem-boilerplate/blocks/cards/cards.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

function render({
  heading, copy, showImage, count, variant,
}) {
  const root = createPage('Blocks', 'Cards');
  const main = showcase(root);
  const cards = element('div', `cards ${variant} block`);
  Array.from({ length: count }, (_, index) => index).forEach((index) => {
    const row = element('div');
    if (showImage) {
      const image = element('div');
      image.append(picture(`Favorite ${index + 1}`));
      row.append(image);
    }
    const cell = element('div');
    cell.append(element('h3', '', `${heading} ${index + 1}`), element('p', '', copy));
    const cta = element('p');
    cta.append(link(`Explore favorite ${index + 1}`));
    cell.append(cta);
    row.append(cell);
    cards.append(row);
  });
  decorateCards(cards);
  section(main, cards);
  return root;
}

export default {
  title: 'Blocks/Cards',
  render,
  args: {
    heading: 'A shared favorite', copy: 'Bring something sweet to the table.', showImage: true, count: 3, variant: '',
  },
  argTypes: {
    ...contentArgTypes,
    count: {
      control: {
        type: 'range', min: 1, max: 8, step: 1,
      },
      description: 'Number of authored rows.',
    },
    variant: { control: 'select', options: ['', 'welcome-cards', 'products', 'related', 'social', 'slider'], description: 'Production Cards block variant.' },
  },
  parameters: {
    docs: { description: { component: 'Production Cards decorator and CSS with author-shaped image/text rows. Edit optional images, text and row count in Controls. Links log navigate; slider buttons log activate in Actions. Check image alternatives, focus and slider keyboard scrolling in Accessibility and by hand.' } },
  },
};
export const Default = {};
export const Welcome = { args: { variant: 'welcome-cards' } };
export const Products = { args: { variant: 'products' } };
export const Related = { args: { variant: 'related' } };
export const Social = { args: { variant: 'social', count: 4 } };
export const Slider = { args: { variant: 'slider', count: 5 } };
export const TextOnly = { args: { showImage: false } };
