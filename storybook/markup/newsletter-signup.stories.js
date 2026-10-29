import decorateNewsletterSignup from '@adobe/aem-boilerplate/blocks/newsletter-signup/newsletter-signup.js';
import '@adobe/aem-boilerplate/blocks/newsletter-signup/newsletter-signup.css';
import {
  createPage, element, link, section, showcase,
} from './story-helpers.js';

function renderSignup() {
  const root = createPage('Blocks', 'Newsletter Signup');
  const main = showcase(root);
  const block = element('div', 'newsletter-signup block');
  const row = element('div');
  const cell = element('div');
  const consent = element('p', '', 'I\'d like to receive product news, exciting offers, personalized content, services and more from The Hershey Company and its affiliates and partners, including through direct mail, digital media or digital communications. For further information, please refer to our ');
  consent.append(link('Privacy Policy', 'https://www.thehersheycompany.com/en_us/home/privacy-policy.html'));
  cell.append(
    element('h2', '', 'Love Desserts? Stay Inspired!'),
    element('p', '', 'Join our twice-a-month newsletter and receive recipe inspiration, celebration ideas, news on the latest candy innovations, contests and promotions, and more across Hershey\'s family of brands. Just tell us where to send it and where you\'re from.'),
    element('p', '', 'Please note, visitors from countries in the EU/EEA should not use this form.'),
    consent,
  );
  row.append(cell);
  block.append(row);
  decorateNewsletterSignup(block);
  section(main, block, 'newsletter-signup-container');
  return root;
}

export default {
  title: 'Blocks/Newsletter Signup',
  parameters: {
    docs: { description: { component: 'Production Newsletter Signup decorator and CSS. One authored cell: heading, introduction, the EU/EEA note, and the consent paragraph with its privacy link. Email, Sign Me Up and the confirmation are built in. Submit with an empty email or an unchecked box to see the errors. A valid submit shows the confirmation.' } },
  },
  render: renderSignup,
};

export const Default = {};
