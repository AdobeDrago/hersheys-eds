/**
 * Banner block: a full-width band with a heading and text on the left and one call
 * to action on the right. Variants: `halloween` adds the seasonal pattern.
 *
 * Content model: one row, one or two cells, in any arrangement. The block reads the
 * first heading, the plain paragraphs (text) and the first link (call to action),
 * so authors can put everything in one cell or split text and link across two.
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const link = block.querySelector('a[href]');
  const paragraphs = [...block.querySelectorAll('p')]
    .filter((p) => !p.querySelector('a[href]') && p.textContent.trim());

  const text = document.createElement('div');
  text.className = 'banner-text';
  if (heading) text.append(heading);
  text.append(...paragraphs);

  const content = document.createElement('div');
  content.className = 'banner-content';
  content.append(text);

  if (link) {
    link.className = 'banner-cta';
    link.removeAttribute('title'); // the visible label is the accessible name
    const action = document.createElement('div');
    action.className = 'banner-action';
    action.append(link);
    content.append(action);
  }
  block.replaceChildren(content);
}
