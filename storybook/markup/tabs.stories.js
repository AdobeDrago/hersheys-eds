import decorateTabs from '@adobe/aem-boilerplate/blocks/tabs/tabs.js';
import '@adobe/aem-boilerplate/blocks/tabs/tabs.css';
import {
  contentArgTypes, createPage, element, picture, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Tabs',
  args: {
    heading: 'Explore your favorites', copy: 'Find something sweet for every occasion.', showImage: true, labels: ['Chocolate', 'Candy', 'Baking'],
  },
  argTypes: {
    ...contentArgTypes,
    labels: { control: 'object', description: 'Non-empty labels for authored tab rows; edit to test long labels and additional panels.' },
  },
  parameters: {
    docs: { description: { component: 'Production Tabs decorator and CSS. Controls change authored labels, panels and images. Pointer activation logs activate in Actions; keyboard selection logs select tab. Check tab/panel relationships in Accessibility and use Left/Right/Home/End to verify roving focus.' } },
  },
  render: ({
    heading, copy, showImage, labels,
  }) => {
    const root = createPage('Blocks', 'Tabs');
    const main = showcase(root);
    const tabs = element('div', 'tabs block');
    labels.forEach((label) => {
      const row = element('div');
      const content = element('div');
      if (showImage) content.append(picture(label));
      content.append(element('h3', '', label), element('p', '', copy));
      row.append(element('div', '', label), content);
      tabs.append(row);
    });
    const container = section(main, tabs);
    container.querySelector('div').before(element('h2', '', heading));
    decorateTabs(tabs);
    return root;
  },
};
export const Default = {};
export const TextOnly = { args: { showImage: false } };
