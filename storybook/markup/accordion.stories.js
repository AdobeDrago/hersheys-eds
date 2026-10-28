import decorateAccordion from '@adobe/aem-boilerplate/blocks/accordion/accordion.js';
import '@adobe/aem-boilerplate/blocks/accordion/accordion.css';
import {
  createPage, element, link, section, showcase,
} from './story-helpers.js';

const ITEMS = [
  ['How should I store baked cookies?', 'Keep them in an airtight container at room temperature for up to five days.'],
  ['Can I freeze the dough?', 'Yes. Scoop the dough, freeze on a tray, then store in a freezer bag for up to three months.'],
  ['Where can I find more recipes?', null],
];

function renderAccordion(items, { open = false } = {}) {
  const root = createPage('Blocks', 'Accordion');
  const main = showcase(root);
  const block = element('div', 'accordion block');
  items.forEach(([question, answer]) => {
    const row = element('div');
    const q = element('div');
    if (question) q.append(element('p', '', question));
    const a = element('div');
    if (answer) {
      a.append(element('p', '', answer));
    } else {
      const p = element('p', '', 'Browse our collection on ');
      p.append(link('Hersheyland'), '.');
      a.append(p);
    }
    row.append(q, a);
    block.append(row);
  });
  decorateAccordion(block);
  if (open) block.querySelector('details')?.setAttribute('open', '');
  section(main, block, 'accordion-container');
  return root;
}

export default {
  title: 'Blocks/Accordion',
  parameters: {
    docs: { description: { component: 'Production Accordion decorator and CSS. Each authored row (question | answer) becomes a native details/summary, so Enter and Space toggle it and screen readers announce the state. Rows without a question are dropped. Links log in Actions.' } },
  },
};

export const Default = { render: () => renderAccordion(ITEMS) };
export const FirstOpen = { render: () => renderAccordion(ITEMS, { open: true }) };
export const MissingQuestion = { render: () => renderAccordion([['', 'This row has no question and is removed.'], ...ITEMS]) };
