import decorateBreadcrumb from '@adobe/aem-boilerplate/blocks/breadcrumb-trail/breadcrumb-trail.js';
import '@adobe/aem-boilerplate/blocks/breadcrumb-trail/breadcrumb-trail.css';
import {
  createPage, element, link, section, showcase,
} from './story-helpers.js';

function renderTrail(items, current = true) {
  const root = createPage('Blocks', 'Breadcrumb Trail');
  const main = showcase(root);
  const block = element('div', 'breadcrumb-trail block');
  const cell = element('div');
  const list = element('ul');
  items.forEach((label, i) => {
    const li = element('li');
    if (i === items.length - 1 && current) li.textContent = label;
    else li.append(link(label));
    list.append(li);
  });
  cell.append(list);
  const row = element('div');
  row.append(cell);
  block.append(row);
  decorateBreadcrumb(block);
  section(main, block, 'breadcrumb-trail-container');
  return root;
}

export default {
  title: 'Blocks/Breadcrumb Trail',
  parameters: {
    docs: { description: { component: 'Production Breadcrumb Trail decorator and CSS. The first link renders as a home icon with its label kept for assistive technology; a trailing item without a link is the current page (aria-current). Links log in Actions.' } },
  },
};

export const Default = { render: () => renderTrail(['Home', 'Recipes', 'Desserts', 'Chocolate Chip Cookies']) };
export const TwoLevels = { render: () => renderTrail(['Home', 'Recipes']) };
export const LongTrail = {
  render: () => renderTrail(['Home', 'Recipes', 'Holidays & Celebrations', 'Halloween', 'Candy Treats', 'Reese’s Peanut Butter Monster Cookie Bars']),
};
export const LinkedCurrentPage = { render: () => renderTrail(['Home', 'Recipes', 'Desserts'], false) };
