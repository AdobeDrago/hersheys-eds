/**
 * Cards (quotes) variant, loaded by cards.js for `Cards (quotes)`: fan quotes on a blue band
 * between two scalloped edges, as on /oreo-cup.
 *
 * Authored rows: the first holds the top edge picture and the last the bottom edge picture.
 * Every row between is one slide, either an eyebrow, a quote and an author as three
 * paragraphs, or a picture on its own.
 * @param {Element} block The cards block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const top = rows.shift();
  const bottom = rows.pop();

  const band = document.createElement('div');
  band.className = 'cards-quotes-band';
  const viewport = document.createElement('div');
  viewport.className = 'cards-quotes-viewport';
  const track = document.createElement('ul');
  track.className = 'cards-quotes-track';
  const dots = document.createElement('div');
  dots.className = 'cards-quotes-dots';

  const slides = rows.map((row) => {
    const li = document.createElement('li');
    li.className = 'cards-quotes-slide';
    const cell = row.firstElementChild;
    if (cell?.querySelector('picture')) li.classList.add('image');
    else li.classList.add('text');
    li.append(...(cell?.childNodes || []));
    row.remove();
    return li;
  });
  track.append(...slides);

  const show = (index) => {
    track.style.setProperty('--cards-quotes-index', index);
    slides.forEach((slide, i) => {
      slide.toggleAttribute('inert', i !== index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    [...dots.children].forEach((dot, i) => {
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  };

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.textContent = i + 1;
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => show(i));
    dots.append(dot);
  });

  viewport.append(track);
  band.append(viewport, dots);
  top?.classList.add('cards-quotes-top');
  bottom?.classList.add('cards-quotes-bottom');
  block.replaceChildren(...[top, band, bottom].filter(Boolean));
  if (slides.length) show(0);
}
