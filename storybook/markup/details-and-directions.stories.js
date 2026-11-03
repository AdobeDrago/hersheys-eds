import decorate from '@adobe/aem-boilerplate/blocks/details-and-directions/details-and-directions.js';
import '@adobe/aem-boilerplate/blocks/details-and-directions/details-and-directions.css';
import {
  createPage, element, showcase, trackInteractions,
} from './story-helpers.js';

export default {
  title: 'Blocks/Details and Directions',
  parameters: {
    docs: { description: { component: 'Production Details and Directions decorator and CSS for activity pages (Section Metadata Style `activities`): summary, Make Mode, You\'ll Need supplies and directions in lime craft panels. The Make Mode switch logs in Actions. Check reading order with Accessibility and keyboard navigation.' } },
  },
};

function renderActivities() {
  const root = createPage('Blocks', 'Details and Directions');
  const main = showcase(root);
  const container = element('div', 'section activities details-and-directions-container');
  const summary = element('div', 'default-content-wrapper');
  summary.append(
    element('h2', '', "You'll Need & Step-by-Step Directions"),
    element('p', '', 'Yields: 1 web'),
  );
  const block = element('div', 'details-and-directions block');
  const row = element('div');
  const supplies = element('div');
  const supplyList = element('ul');
  ['2 tsp vegetable shortening', 'Black yarn'].forEach((text) => {
    supplyList.append(element('li', '', text));
  });
  supplies.append(element('h3', '', "You'll Need"), supplyList);
  const method = element('div');
  const step = element('li');
  step.append(element('p', '', 'Paint dowel rods and let them dry.'));
  const steps = element('ol');
  steps.append(step);
  method.append(
    element('h3', '', 'Directions'),
    steps,
    element('p', '', 'Tip: Use clothespins for heavier candy.'),
  );
  row.append(supplies, method);
  block.append(row);
  const wrapper = element('div', 'details-and-directions-wrapper');
  wrapper.append(block);
  container.append(summary, wrapper);
  main.append(container);
  trackInteractions(container);
  decorate(block);
  return root;
}

export const Activities = { render: renderActivities };
