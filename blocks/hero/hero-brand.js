/**
 * Hero (brand) variant, loaded by hero.js for `Hero (brand)`.
 *
 * Content model: 1 row x 2 cells, in any order.
 *   Image cell: the brand photo.
 *   Text cell: brand logo image, h1 title, then one or more paragraphs.
 * The logo is the picture that shares a cell with the heading; any other picture is the photo.
 * A missing cell or logo leaves that part out instead of breaking the block.
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2');
  const textCell = heading ? heading.closest('.hero > div > div') : null;
  const pictures = [...block.querySelectorAll('picture')];
  const logo = textCell ? pictures.find((picture) => textCell.contains(picture)) : null;
  const photo = pictures.find((picture) => picture !== logo);
  const paragraphs = [...block.querySelectorAll('p')]
    .filter((p) => !p.querySelector('picture') && p.textContent.trim());

  const content = document.createElement('div');
  content.className = 'hero-brand-content';

  if (photo) {
    const media = document.createElement('div');
    media.className = 'hero-brand-media';
    const img = photo.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
    media.append(photo);
    content.append(media);
  }

  if (logo || heading || paragraphs.length) {
    const text = document.createElement('div');
    text.className = 'hero-brand-text';
    if (logo) {
      const wrapper = document.createElement('div');
      wrapper.className = 'hero-brand-logo';
      const img = logo.querySelector('img');
      if (img) img.loading = 'eager';
      wrapper.append(logo);
      text.append(wrapper);
    }
    if (heading) text.append(heading);
    text.append(...paragraphs);
    content.append(text);
  }
  block.replaceChildren(content);
}
