import decorateColumns from '@adobe/aem-boilerplate/blocks/columns/columns.js';
import '@adobe/aem-boilerplate/blocks/columns/columns.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase, trackInteractions,
} from './story-helpers.js';

export default {
  title: 'Blocks/Columns',
  args: { heading: 'A favorite for every moment', copy: 'A little sweetness brings us together.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'Production Columns decorator and CSS. Two authored cells stack on mobile. Columns (Recipe) builds the ingredients, tools, directions, summary, and Bake Mode. Controls edit copy and the optional image; links and the Bake Mode switch log in Actions. Check reading order and image alternatives with Accessibility and keyboard navigation.' } },
  },
  render: ({ heading, copy, showImage }) => {
    const root = createPage('Blocks', 'Columns');
    const main = showcase(root);
    const columns = element('div', 'columns feature block');
    const row = element('div');
    const content = element('div');
    content.append(element('h2', '', heading), element('p', '', copy));
    const cta = element('p');
    cta.append(link('Discover favorites', undefined, 'button'));
    content.append(cta);
    const image = element('div');
    if (showImage) image.append(picture('Made for sharing'));
    else image.append(element('h3', '', 'Made for sharing'), element('p', '', copy));
    row.append(content, image);
    columns.append(row);
    decorateColumns(columns);
    section(main, columns);
    return root;
  },
};
function renderRecipe() {
  const root = createPage('Blocks', 'Columns');
  const main = showcase(root);
  const container = element('div', 'section columns-container columns-recipe-section');
  const summary = element('div', 'default-content-wrapper');
  summary.append(
    element('h2', '', 'Ingredients & Directions'),
    element('p', '', 'Yields: 48 cookies'),
    element('p', '', 'Prep: 20 Min. | Bake: 11 Min. | Total: 31 Min.'),
  );
  const columns = element('div', 'columns recipe block');
  const row = element('div');
  const ingredients = element('div');
  const ingredientList = element('ul');
  ["4 HERSHEY'S Milk Chocolate Candy Bars", '24 marshmallows'].forEach((text) => {
    ingredientList.append(element('li', '', text));
  });
  ingredients.append(element('h3', '', 'Ingredients'), ingredientList);
  const method = element('div');
  const tools = element('ul');
  ['Oven', 'Mixer'].forEach((text) => tools.append(element('li', '', text)));
  const step = element('li');
  step.append(element('p', '', 'Heat oven to 350°F.'));
  const steps = element('ol');
  steps.append(step);
  method.append(
    element('h3', '', "You'll Need"),
    tools,
    element('h3', '', 'Directions'),
    steps,
    element('p', '', 'Tip: Serve warm.'),
  );
  row.append(ingredients, method);
  columns.append(row);
  const wrapper = element('div', 'columns-wrapper');
  wrapper.append(columns);
  container.append(summary, wrapper);
  main.append(container);
  trackInteractions(container);
  decorateColumns(columns);
  return root;
}

export const Feature = {};
export const TextOnly = { args: { showImage: false } };
export const Recipe = { render: renderRecipe };
