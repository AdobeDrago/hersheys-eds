import { action } from 'storybook/actions';

export function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createPage(category, title, description) {
  const root = element('article', 'story-shell');
  root.setAttribute('aria-label', `${category}: ${title}`);
  if (description) root.append(element('p', 'story-note', description));
  return root;
}

export function showcase(root) {
  const specimen = element('div', 'eds-markup hershey-home');
  specimen.dataset.showcase = '';
  const main = element('main');
  specimen.append(main);
  root.append(specimen);
  return main;
}

export function picture(label = 'Chocolate', width = 800, height = 600) {
  const image = element('img');
  image.src = `https://placehold.co/${width}x${height}/3f000b/ffffff/png?text=${encodeURIComponent(label)}`;
  image.alt = `${label} placeholder`;
  image.width = width;
  image.height = height;
  const container = element('picture');
  container.append(image);
  return container;
}

export function link(label, href = 'https://www.hersheyland.com/', className = '') {
  const anchor = element('a', className, label);
  anchor.href = href;
  return anchor;
}

export function trackInteractions(root) {
  root.addEventListener('click', (event) => {
    const target = event.target.closest('a, button');
    if (!target) return;
    if (target.matches('a')) event.preventDefault();
    action(target.matches('a') ? 'navigate' : 'activate')({
      label: target.textContent.trim() || target.getAttribute('aria-label'),
      href: target.getAttribute('href'),
    });
  });
  root.addEventListener('change', (event) => {
    action('change')({ name: event.target.name, value: event.target.value });
  });
  root.addEventListener('keydown', (event) => {
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      action('select tab')({ label: root.querySelector('[role="tab"][aria-selected="true"]').textContent });
    }
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault();
    action('submit')(Object.fromEntries(new FormData(event.target)));
  });
}

export const contentArgTypes = {
  heading: { control: 'text', description: 'Author-provided heading, including long or empty text.' },
  copy: { control: 'text', description: 'Author-provided supporting copy.' },
  showImage: { control: 'boolean', description: 'Include or omit the optional placehold.co image.' },
};

export function section(main, block, name = '') {
  const container = element('div', `section ${name}`.trim());
  const wrapper = element('div', block.classList.contains('block') ? `${block.classList[0]}-wrapper` : 'default-content-wrapper');
  wrapper.append(block);
  container.append(wrapper);
  main.append(container);
  trackInteractions(container);
  return container;
}
