import decorateHero from '@adobe/aem-boilerplate/blocks/hero/hero.js';
import '@adobe/aem-boilerplate/blocks/hero/hero.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

function renderDefault({ heading, copy, showImage }) {
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
}

function renderRecipe({ heading, copy, showImage }) {
  const root = createPage('Blocks', 'Hero');
  const main = showcase(root);
  const hero = element('div', 'hero recipe block');
  const imageRow = element('div');
  const imageCell = element('div');
  if (showImage) imageCell.append(picture(heading || 'Recipe', 1600, 900));
  imageRow.append(imageCell);
  const textRow = element('div');
  const textCell = element('div');
  const category = element('p');
  category.append(link('Desserts'));
  textCell.append(
    category,
    element('h1', '', heading),
    element('p', '', 'Skill Level: Beginner'),
    element('p', '', copy),
  );
  textRow.append(textCell);
  hero.append(imageRow, textRow);
  decorateHero(hero);
  section(main, hero, 'hero-container');
  return root;
}

export default {
  title: 'Blocks/Hero',
  args: { heading: 'Make life a little sweeter', copy: 'Discover something worth sharing.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'Production Hero CSS and decorator. The default treatment leaves authored content in place. Hero (Recipe) rebuilds the category, title, skill level, share bar, and image. Controls edit text and optional imagery. Check contrast over images and heading order with Accessibility. Share actions log activate or navigate.' } },
  },
  render: renderDefault,
};
export const Default = {};
export const WithoutImage = { args: { showImage: false } };
export const Recipe = {
  args: {
    heading: "Reese's Oreo Cup Brownies",
    copy: 'A fudgy brownie layered with peanut butter cups and chocolate cookies.',
  },
  render: renderRecipe,
};
