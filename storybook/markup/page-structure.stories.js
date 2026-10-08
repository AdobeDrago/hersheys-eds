import decorateHeader from '@adobe/aem-boilerplate/blocks/header/header.js';
import '@adobe/aem-boilerplate/blocks/header/header.css';
import decorateFooter from '@adobe/aem-boilerplate/blocks/footer/footer.js';
import '@adobe/aem-boilerplate/blocks/footer/footer.css';
import {
  contentArgTypes, createPage, element, picture, section, showcase, trackInteractions,
} from './story-helpers.js';

function renderStructure(name, decorate) {
  const root = createPage('Blocks / Page Structure', name, 'Production decorator and CSS; backend fragment loading is replaced with a local author-shaped fixture.');
  const main = showcase(root);
  const landmark = element(name.toLowerCase());
  const block = element('div', `${name.toLowerCase()} block`);
  block.dataset.blockStatus = 'loading';
  landmark.append(block);
  main.replaceWith(landmark);
  trackInteractions(landmark);
  decorate(block).then(() => {
    block.dataset.blockStatus = 'loaded';
  }).catch((error) => {
    block.dataset.blockStatus = 'error';
    const alert = element('p', '', `Unable to render ${name}: ${error.message}`);
    alert.setAttribute('role', 'alert');
    block.append(alert);
    // eslint-disable-next-line no-console
    console.error(error);
  });
  return root;
}

export default {
  title: 'Blocks/Page Structure',
  parameters: {
    docs: { description: { component: 'Header and Footer run production decorators against a Storybook-only loadFragment adapter. No CMS requests or global page bootstrapping. Actions record menu activation, navigation and search submission. Verify keyboard dropdowns, Escape, focus loss and mobile navigation in addition to axe Accessibility checks. Fragment is a composed-content fixture, not a network-loading test.' } },
  },
};
export const Header = { render: () => renderStructure('Header', decorateHeader) };
export const Footer = { render: () => renderStructure('Footer', decorateFooter) };
export const Fragment = {
  args: { heading: 'A separately authored moment', copy: 'Reusable content belongs in its own document.', showImage: true },
  argTypes: contentArgTypes,
  render: ({ heading, copy, showImage }) => {
    const root = createPage('Blocks / Page Structure', 'Fragment', 'Composed fragment content fixture. Fetching and section replacement are covered by the EDS runtime, not this visual specimen.');
    const main = showcase(root);
    const content = element('div');
    content.append(element('h2', '', heading), element('p', '', copy));
    if (showImage) content.append(picture('Reusable content', 1000, 400));
    section(main, content);
    return root;
  },
};
