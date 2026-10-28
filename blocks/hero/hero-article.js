/**
 * Hero (article) variant, loaded by hero.js for `Hero (article)`.
 *
 * Content model: 1 row x 2 cells, in any order.
 *   Image cell: the story image.
 *   Text cell: h1 story title, then a "Published: <date>" paragraph.
 * The block reads the first picture, the first heading and the remaining text,
 * so a missing cell leaves that part out instead of breaking the block.
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h1, h2');
  const paragraphs = [...block.querySelectorAll('p')]
    .filter((p) => !p.querySelector('picture') && p.textContent.trim());

  const content = document.createElement('div');
  content.className = 'hero-article-content';

  if (picture) {
    const media = document.createElement('div');
    media.className = 'hero-article-media';
    const img = picture.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
    media.append(picture);
    content.append(media);
  }

  if (heading || paragraphs.length) {
    const text = document.createElement('div');
    text.className = 'hero-article-text';
    if (heading) text.append(heading);
    paragraphs.forEach((p) => {
      p.className = /^published\b/i.test(p.textContent.trim()) ? 'hero-article-date' : '';
      text.append(p);
    });
    content.append(text);
  }
  block.replaceChildren(content);
}
