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
    docs: { description: { component: 'Production Columns decorator and CSS. Two authored cells stack on mobile. Controls edit copy and the optional image; links log in Actions. Check reading order and image alternatives with Accessibility and keyboard navigation.' } },
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

function buttonRow(label, className) {
  const row = element('p', 'button-wrapper');
  row.append(link(label, undefined, `button ${className}`));
  return row;
}

function renderPanel({ heading, copy }, variant) {
  const root = createPage('Blocks', 'Columns');
  const main = showcase(root);
  const columns = element('div', `columns article panel ${variant} block`.trim());
  const row = element('div');
  const content = element('div');
  content.append(
    element('p', '', 'Chocolate & Fun'),
    element('h3', '', heading),
    element('p', '', copy),
    buttonRow('Explore Events', 'primary'),
    buttonRow('Plan Your Visit', 'secondary'),
  );
  const image = element('div');
  image.append(picture('Attraction', 592, 377));
  if (variant === 'yellow') row.append(image, content);
  else row.append(content, image);
  columns.append(row);
  decorateColumns(columns);
  section(main, columns);
  return root;
}

export const Panel = { render: (args) => renderPanel(args, '') };
export const PanelYellow = { render: (args) => renderPanel(args, 'yellow') };
