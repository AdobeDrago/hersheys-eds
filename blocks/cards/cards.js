import { createOptimizedPicture } from '../../scripts/aem.js';

let sliderId = 0;

function decorateSlider(block, list) {
  sliderId += 1;
  list.id = `cards-slider-${sliderId}`;
  list.tabIndex = 0;
  const controls = document.createElement('div');
  controls.className = 'cards-slider-controls';
  const buttons = [-1, 1].map((direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = direction < 0 ? '\u2190' : '\u2192';
    button.setAttribute('aria-label', direction < 0 ? 'Previous cards' : 'Next cards');
    button.setAttribute('aria-controls', list.id);
    button.addEventListener('click', () => {
      list.scrollBy({
        left: direction * list.clientWidth,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
    controls.append(button);
    return button;
  });
  const update = () => {
    buttons[0].disabled = list.scrollLeft <= 1;
    buttons[1].disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
  };
  list.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(list);
  block.append(controls);
  update();
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  const linkedImages = ['slider', 'welcome-cards', 'social'].some((variant) => block.classList.contains(variant));
  if (linkedImages) {
    ul.querySelectorAll('li').forEach((card) => {
      const picture = card.querySelector('.cards-card-image picture');
      const link = card.querySelector('.cards-card-body a[href]');
      if (picture && link && !picture.closest('a')) {
        const label = link.getAttribute('aria-label') || link.textContent.trim()
          || picture.querySelector('img')?.alt;
        if (!label) return;
        const imageLink = document.createElement('a');
        imageLink.href = link.href;
        imageLink.setAttribute('aria-label', label);
        picture.replaceWith(imageLink);
        imageLink.append(picture);
      }
    });
  }
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
  if (block.classList.contains('slider')) decorateSlider(block, ul);
}
