import decorateWidget from '@adobe/aem-boilerplate/blocks/widget/widget.js';
import {
  createPage, element, link, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Widget Loader',
  args: { heading: 'Widget loader fixture' },
  argTypes: { heading: { control: 'text', description: 'Heading passed as an authored query parameter to the mock widget.' } },
  parameters: {
    docs: { description: { component: 'Production Widget loader fetching Storybook-only HTML, CSS and JavaScript assets. The authored URL carries query parameters into data attributes. Controls edit the heading; the loaded button logs activate in Actions. Accessibility checks the resulting loaded DOM. This is not a production widget.' } },
  },
  render: ({ heading }) => {
    const root = createPage('Blocks', 'Widget Loader', 'Production loader with local mock assets; no production widgets exist yet.');
    const main = showcase(root);
    const widget = element('div', 'widget block');
    const row = element('div');
    const cell = element('div');
    cell.append(link('Mock widget source', `/widgets/storybook-demo.html?heading=${encodeURIComponent(heading)}`));
    row.append(cell);
    widget.append(row);
    section(main, widget, 'widget-container');
    decorateWidget(widget).then(() => {
      if (!widget.querySelector('[data-widget-ready]')) {
        widget.setAttribute('role', 'alert');
        widget.textContent = 'Widget fixture failed to load. Check the browser console.';
      }
    });
    return root;
  },
};
export const Default = {};
