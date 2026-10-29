import decorateCards from '@adobe/aem-boilerplate/blocks/cards/cards.js';
import '@adobe/aem-boilerplate/blocks/cards/cards.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-recipes.css';
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

const RECIPES = [
  { title: 'HERSHEY’S “Perfectly Chocolate” Chocolate Cake', bvID: '3' },
  { title: 'HERSHEY’S Chewy Chocolate Cookies', bvID: '61' },
  { title: 'Peanut Butter Blossoms' },
  { title: 'HERSHEY’S Best Brownies', bvID: '30' },
];

function mockRecommend() {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      results: [{
        hits: RECIPES.map(({ title, bvID }, index) => ({
          objectID: `https://www.hersheyland.com/recipes/recipe-${index + 1}.html`,
          url: { href: `https://www.hersheyland.com/recipes/recipe-${index + 1}.html` },
          hero: { h1: title, image: picture(title).querySelector('img').src },
          metaTags: bvID ? { bvID } : {},
        })),
      }],
    }),
  });
}

/** Empty `Cards (slider, related, recipes)`: cards come from Algolia Recommend (mocked). */
export const RelatedRecipes = {
  render: () => {
    const root = createPage('Blocks', 'Cards', 'Related recipes are mocked; no request reaches Algolia.');
    const main = showcase(root);
    const cards = element('div', 'cards slider related recipes block');
    // the block calls the global fetch; the mock stays installed so the story stays offline
    window.fetch = mockRecommend();
    // authored as one section: heading, the empty block, then the View All Recipes button
    const container = section(main, cards);
    const heading = element('div', 'default-content-wrapper');
    heading.append(element('h2', '', 'You Might Also Enjoy...'));
    container.prepend(heading);
    decorateCards(cards);
    return root;
  },
};
