import {
  createPage, element, picture, section, showcase,
} from './story-helpers.js';

export function renderWidget({ heading, label, showImage }) {
  const root = createPage('Widgets', 'Interactive fixture', 'Storybook-only widget fixture. This repository has no production /widgets implementation.');
  const main = showcase(root);
  const widget = element('div', 'widget-demo');
  if (showImage) widget.append(picture('Find your favorite', 1000, 400));
  widget.append(element('h2', '', heading));
  const form = element('form');
  const field = element('label', '', 'Choose a favorite ');
  const select = element('select');
  select.name = 'favorite';
  ['Chocolate', 'Candy', 'Baking'].forEach((value) => {
    const option = element('option', '', value);
    option.value = value;
    select.append(option);
  });
  field.append(select);
  const button = element('button', 'button', label);
  button.type = 'submit';
  const result = element('p');
  result.setAttribute('role', 'status');
  form.addEventListener('submit', () => {
    result.textContent = `Your favorite: ${select.value}`;
  });
  form.append(field, button);
  widget.append(form, result);
  section(main, widget);
  return root;
}

export default {
  title: 'Widgets/Interactive Fixture',
  args: { heading: 'Find your next favorite', label: 'Show my favorite', showImage: true },
  argTypes: {
    heading: { control: 'text', description: 'Heading for this mock experience.' },
    label: { control: 'text', description: 'Submit-button label.' },
    showImage: { control: 'boolean', description: 'Include the optional placehold.co image.' },
  },
  render: renderWidget,
  parameters: {
    docs: { description: { component: 'An explicitly mocked experience, not a shipped widget. Controls edit its heading, button and image. Changing the select logs change; submitting logs submit and updates a live status. Accessibility checks form labels and status semantics; verify keyboard selection and announcements manually.' } },
  },
};
export const Default = {};
export const WithoutImage = { args: { showImage: false } };
