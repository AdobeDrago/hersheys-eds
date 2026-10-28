import decorateSocialShare from '@adobe/aem-boilerplate/blocks/social-share/social-share.js';
import '@adobe/aem-boilerplate/blocks/social-share/social-share.css';
import {
  createPage, element, section, showcase,
} from './story-helpers.js';

function renderShare({ open = false } = {}) {
  const root = createPage('Blocks', 'Social Share');
  const main = showcase(root);
  const block = element('div', 'social-share block');
  decorateSocialShare(block);
  if (open) block.querySelector('.social-share-share').click();
  section(main, block, 'social-share-container');
  return root;
}

export default {
  title: 'Blocks/Social Share',
  parameters: {
    docs: { description: { component: 'Production Social Share decorator and CSS. The block takes no authored content: it reads the current page URL and title to build the Facebook, Pinterest and email links. The Share button toggles the list (aria-expanded); Print and Copy URL are buttons. Inside Storybook the shared URL is the preview iframe address.' } },
  },
};

export const Default = { render: () => renderShare() };
export const Open = { render: () => renderShare({ open: true }) };
