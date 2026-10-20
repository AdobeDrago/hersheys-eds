import { element, link, picture } from './story-helpers.js';

function contentSection(className) {
  const section = element('div', `section ${className}`.trim());
  const wrapper = element('div', 'default-content-wrapper');
  section.append(wrapper);
  return { section, wrapper };
}

export async function loadFragment(path) {
  const main = element('main');
  if (path === '/nav') {
    const brand = contentSection('hershey-nav');
    const brandLink = link('Hersheyland');
    brand.wrapper.append(brandLink);
    const navigation = contentSection('');
    const list = element('ul');
    ['Chocolate', 'Candy', 'Recipes'].forEach((label) => {
      const item = element('li', '', label);
      const children = element('ul');
      const child = element('li');
      child.append(link(`Explore ${label}`));
      children.append(child);
      item.append(children);
      list.append(item);
    });
    navigation.wrapper.append(list);
    const tools = contentSection('');
    const paragraph = element('p');
    paragraph.append(link('Search favorites', 'https://www.hersheyland.com/search'));
    tools.wrapper.append(paragraph);
    main.append(brand.section, navigation.section, tools.section);
  } else if (path === '/footer') {
    const newsletter = contentSection('newsletter');
    newsletter.wrapper.append(element('h2', '', 'A little sweetness in your inbox'), element('p', '', 'Discover recipes and favorites worth sharing.'));
    const cta = element('p');
    cta.append(link('Sign up', 'https://www.hersheyland.com/', 'button'));
    newsletter.wrapper.append(cta);
    const brand = contentSection('footer-brand');
    brand.wrapper.append(picture('Hersheyland', 320, 100), element('p', '', 'Make life a little sweeter.'));
    const links = contentSection('footer-links');
    const list = element('ul');
    ['Our brands', 'Recipes', 'Contact us', 'Privacy'].forEach((label) => {
      const item = element('li');
      item.append(link(label));
      list.append(item);
    });
    links.wrapper.append(list);
    const legal = contentSection('footer-legal');
    legal.wrapper.append(element('p', '', 'Storybook fixture. Not a published site footer.'));
    main.append(newsletter.section, brand.section, links.section, legal.section);
  } else {
    throw new Error(`No Storybook fragment fixture for ${path}`);
  }
  return main;
}
