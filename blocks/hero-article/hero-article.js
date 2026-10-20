import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero (Article) block: split layout, image beside a colored title panel.
 *
 * Content model: 2 rows x 1 column (row order is not enforced).
 *   Image row: the hero image.
 *   Text row: h1 article title and optional paragraphs (e.g. "Published: ...").
 * @param {Element} block
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const content = document.createElement('div');
  content.className = 'hero-article-content';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    [...cell.children].forEach((el) => {
      if (el.matches('picture') || el.querySelector('picture')) return;
      if (el.textContent.trim()) content.append(el);
    });
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      content.append(p);
    }
  });

  const heading = content.querySelector('h1, h2');
  if (heading) heading.classList.add('hero-article-title');
  content.querySelectorAll('p').forEach((p) => p.classList.add('hero-article-meta'));

  let media = null;
  if (picture) {
    const img = picture.querySelector('img');
    media = document.createElement('div');
    media.className = 'hero-article-media';
    if (img && new URL(img.src, window.location.href).origin === window.location.origin) {
      media.append(createOptimizedPicture(img.src, img.alt || '', true, [
        { media: '(min-width: 900px)', width: '1000' },
        { width: '750' },
      ]));
    } else {
      media.append(picture);
    }
  }

  block.replaceChildren(...[media, content].filter(Boolean));
}
