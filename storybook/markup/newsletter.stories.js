import decorateNewsletter from '@adobe/aem-boilerplate/blocks/newsletter/newsletter.js';
import '@adobe/aem-boilerplate/blocks/newsletter/newsletter.css';
import {
  createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

function row(...cells) {
  const r = element('div');
  cells.forEach((text) => r.append(element('div', '', text)));
  return r;
}

function buildBlock() {
  const block = element('div', 'newsletter block');

  const content = element('div');
  content.append(
    element('h1', '', 'Sign up for sweet updates'),
    element('p', '', 'Get recipes, offers and news from Hershey’s.'),
    element('p', '', 'Fields marked * are required.'),
  );
  const contentRow = element('div');
  contentRow.append(element('div', '', 'Content'), content);

  const consent = element('div');
  const consentText = element('p', '', 'I agree to receive emails and accept the ');
  consentText.append(link('Privacy Policy'));
  consent.append(consentText);
  const consentRow = element('div');
  consentRow.append(element('div', '', 'Consent'), consent, element('div', '', 'Please accept to continue.'));

  const thanks = element('div');
  const socials = element('p');
  ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Pinterest'].forEach((name) => {
    socials.append(link(name, `https://www.${name.toLowerCase()}.com/hersheys`), ' ');
  });
  const thanksButton = element('p');
  thanksButton.append(link('Explore recipes'));
  thanks.append(
    picture('Thank you', 600, 400),
    element('h2', '', 'Thank you!'),
    element('p', '', 'You’re signed up. Look for something sweet in your inbox.'),
    thanksButton,
    element('p', '', 'Follow us'),
    socials,
  );
  const thanksRow = element('div');
  thanksRow.append(element('div', '', 'Thank you'), thanks);

  block.append(
    contentRow,
    row('First name', 'First name', 'Please enter your first name.'),
    row('Last name', 'Last name', 'Please enter your last name.'),
    row('Email', 'name@example.com', 'Please enter a valid email address.'),
    row('Zip', '12345', 'Please enter a valid ZIP code.'),
    consentRow,
    row('Button', 'Sign up'),
    thanksRow,
  );
  return block;
}

export default {
  title: 'Blocks/Newsletter',
  parameters: {
    docs: { description: { component: 'Production Newsletter decorator and CSS. Every label, placeholder, error and the thank-you card are authored rows. Submit with empty or invalid fields to see inline errors and focus return to the first one; a valid submit swaps in the thank-you card and logs the values in Actions. Add ?email= to the URL to prefill the email field.' } },
  },
  render: () => {
    const root = createPage('Blocks', 'Newsletter');
    const main = showcase(root);
    const block = buildBlock();
    decorateNewsletter(block);
    section(main, block, 'newsletter-container');
    return root;
  },
};

export const Default = {};
export const ThankYou = {
  render: () => {
    const root = createPage('Blocks', 'Newsletter');
    const main = showcase(root);
    const block = buildBlock();
    decorateNewsletter(block);
    block.querySelector('.newsletter-register').hidden = true;
    block.querySelector('.newsletter-thanks').hidden = false;
    section(main, block, 'newsletter-container');
    return root;
  },
};
