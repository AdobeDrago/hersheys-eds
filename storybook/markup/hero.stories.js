import '@adobe/aem-boilerplate/blocks/hero/hero.css';
import {
  contentArgTypes, createPage, element, picture, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Hero',
  args: { heading: 'Make life a little sweeter', copy: 'Discover something worth sharing.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'The production Hero is CSS-only: its empty decorator does not prevent rendering. This authored two-cell fixture showcases that CSS. Controls edit text and optional imagery. Check contrast over images and heading order with Accessibility; this block has no actions.' } },
  },
  render: ({ heading, copy, showImage }) => {
    const root = createPage('Blocks', 'Hero');
    const main = showcase(root);
    const hero = element('div', 'hero block');
    const row = element('div');
    const image = element('div');
    if (showImage) image.append(picture('Hero', 1440, 640));
    const content = element('div');
    content.append(element('h1', '', heading), element('p', '', copy));
    row.append(image, content);
    hero.append(row);
    section(main, hero, 'hero-container');
    return root;
  },
};
export const Default = {};
export const WithoutImage = { args: { showImage: false } };
