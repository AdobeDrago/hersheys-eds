import decorateIngredients from '@adobe/aem-boilerplate/blocks/recipe-details/recipe-details-ingredients.js';
import decorateNutrition from '@adobe/aem-boilerplate/blocks/recipe-details/recipe-details-nutrition.js';
import '@adobe/aem-boilerplate/blocks/recipe-details/recipe-details.css';
import '@adobe/aem-boilerplate/blocks/recipe-details/recipe-details-ingredients.css';
import '@adobe/aem-boilerplate/blocks/recipe-details/recipe-details-nutrition.css';
import {
  createPage, element, link, section, showcase, trackInteractions,
} from './story-helpers.js';

export default {
  title: 'Blocks/Recipe Details',
  parameters: {
    docs: { description: { component: 'Production Recipe Details variant decorators and CSS. Recipe Details (Ingredients) builds the ingredients, tools, directions, summary, and Bake Mode. Recipe Details (Nutrition) builds the Nutrition Facts label and contact box. Links and the Bake Mode switch log in Actions. Check reading order with Accessibility and keyboard navigation.' } },
  },
};

function renderIngredients() {
  const root = createPage('Blocks', 'Recipe Details');
  const main = showcase(root);
  const container = element('div', 'section recipe-details-container');
  const summary = element('div', 'default-content-wrapper');
  summary.append(
    element('h2', '', 'Ingredients & Directions'),
    element('p', '', 'Yields: 48 cookies'),
    element('p', '', 'Prep: 20 Min. | Bake: 11 Min. | Total: 31 Min.'),
  );
  const block = element('div', 'recipe-details ingredients block');
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
  block.append(row);
  const wrapper = element('div', 'recipe-details-wrapper');
  wrapper.append(block);
  container.append(summary, wrapper);
  main.append(container);
  trackInteractions(container);
  decorateIngredients(block);
  return root;
}

function renderNutrition() {
  const root = createPage('Blocks', 'Recipe Details');
  const main = showcase(root);
  const block = element('div', 'recipe-details nutrition block');
  const row = element('div');
  const label = element('div');
  const nutrients = element('ul');
  [
    'Total Fat 14g 18%',
    'Saturated Fat 8g 40%',
    'Cholesterol 15mg 5%',
    'Sodium 160mg 7%',
    'Total Carbohydrate 39g 14%',
    'Protein 3g',
    'Vitamin D 0mcg 0%',
    'Calcium 40mg 4%',
  ].forEach((text) => nutrients.append(element('li', '', text)));
  label.append(
    element('h3', '', 'Nutrition Facts'),
    element('p', '', 'Servings Per Container 12'),
    element('p', '', 'Serving size 2 cookies (35g)'),
    element('p', '', 'Calories 170'),
    nutrients,
    element('p', '', '*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet.'),
  );
  const aside = element('div');
  const cta = element('p');
  cta.append(link('Contact Customer Service'));
  aside.append(element('h3', '', 'Additional questions?'), cta);
  row.append(label, aside);
  block.append(row);
  section(main, block, 'recipe-details-container');
  decorateNutrition(block);
  return root;
}

export const Ingredients = { render: renderIngredients };
export const Nutrition = { render: renderNutrition };
