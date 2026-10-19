import decorateColumns from '@adobe/aem-boilerplate/blocks/columns/columns.js';
import '@adobe/aem-boilerplate/blocks/columns/columns.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Columns',
  args: { heading: 'A favorite for every moment', copy: 'A little sweetness brings us together.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'Production Columns decorator and CSS. Two authored cells stack on mobile. Controls edit copy and the optional image; CTA links log navigate in Actions. Check reading order and image alternatives with Accessibility and keyboard navigation.' } },
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
export const Feature = {};
export const TextOnly = { args: { showImage: false } };
