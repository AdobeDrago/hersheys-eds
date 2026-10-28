import decorateBanner from '@adobe/aem-boilerplate/blocks/banner/banner.js';
import '@adobe/aem-boilerplate/blocks/banner/banner.css';
import {
  contentArgTypes, createPage, element, link, section, showcase,
} from './story-helpers.js';

function renderBanner({ heading, copy }, variant = '') {
  const root = createPage('Blocks', 'Banner');
  const main = showcase(root);
  const banner = element('div', `banner ${variant} block`.replace(/\s+/g, ' '));
  const row = element('div');
  const content = element('div');
  content.append(element('h2', '', heading), element('p', '', copy));
  const cta = element('div');
  const p = element('p');
  p.append(link('Shop now'));
  cta.append(p);
  row.append(content, cta);
  banner.append(row);
  decorateBanner(banner);
  section(main, banner, 'banner-container');
  return root;
}

export default {
  title: 'Blocks/Banner',
  args: { heading: 'Treats for every occasion', copy: 'Find the perfect sweet for your celebration.' },
  argTypes: { heading: contentArgTypes.heading, copy: contentArgTypes.copy },
  parameters: {
    docs: { description: { component: 'Production Banner decorator and CSS. One row with heading, text and a single call to action; the block finds them by element type, so one or two cells both work. The Halloween variant adds the seasonal pattern. The link logs in Actions.' } },
  },
  render: (args) => renderBanner(args),
};

export const Default = {};
export const Halloween = { render: (args) => renderBanner(args, 'halloween') };
export const NoLink = {
  render: (args) => {
    const root = renderBanner(args);
    root.querySelector('.banner-action')?.remove();
    return root;
  },
};
