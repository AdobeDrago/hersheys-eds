// the floor shadow under every product ships with the variant; it is decoration
const SHADOW = `${window.hlx.codeBasePath}/icons/rolo-slider-bottom-shadow.webp`;
const FADE_MS = 350;

/**
 * Builds a slide: the product picture floating over its static shadow.
 * @param {HTMLPictureElement} picture
 * @returns {HTMLElement}
 */
function buildSlide(picture) {
  const slide = document.createElement('li');
  slide.className = 'cards-steps-slide';
  const visual = document.createElement('div');
  visual.className = 'cards-steps-visual';
  const product = document.createElement('div');
  product.className = 'cards-steps-product';
  if (picture) product.append(picture);
  const shadow = document.createElement('img');
  shadow.className = 'cards-steps-shadow';
  shadow.src = SHADOW;
  shadow.alt = '';
  shadow.loading = 'lazy';
  visual.append(shadow, product);
  slide.append(visual);
  return slide;
}

/**
 * Cards (steps) variant, loaded by cards.js for `Cards (steps)`: a one-card-at-a-time carousel
 * under big concentric arcs, as the "Unwrap. Enjoy. Repeat." slider on /rolo. The heading and
 * the caption change with the slide.
 *
 * Authored rows, one per slide: the heading, the product picture, the caption.
 * @param {Element} block The cards block
 */
export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const [title, picture, caption] = [...row.children];
    return {
      title: title?.textContent.trim() || '',
      picture: picture?.querySelector('picture'),
      // authored text is wrapped in a paragraph; the caption element is the paragraph
      caption: (caption?.querySelector('p') || caption)?.innerHTML.trim() || '',
    };
  });

  const arcs = document.createElement('div');
  arcs.className = 'cards-steps-arcs';
  arcs.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.className = 'cards-steps-stage';
  const inner = document.createElement('div');
  inner.className = 'cards-steps-inner';

  const heading = document.createElement('h2');
  heading.className = 'cards-steps-title';
  const slider = document.createElement('div');
  slider.className = 'cards-steps-slider';
  const viewport = document.createElement('div');
  viewport.className = 'cards-steps-viewport';
  const track = document.createElement('ul');
  track.className = 'cards-steps-track';
  const slides = items.map((item) => buildSlide(item.picture));
  track.append(...slides);
  viewport.append(track);

  const caption = document.createElement('p');
  caption.className = 'cards-steps-caption';
  caption.setAttribute('aria-live', 'polite');
  const dots = document.createElement('div');
  dots.className = 'cards-steps-dots';

  let current = 0;
  let timer;
  const show = (index) => {
    current = (index + items.length) % items.length;
    track.style.setProperty('--cards-steps-index', current);
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
    [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    heading.classList.add('is-hidden');
    caption.classList.add('is-hidden');
    clearTimeout(timer);
    timer = setTimeout(() => {
      heading.textContent = items[current].title;
      caption.innerHTML = items[current].caption;
      heading.classList.remove('is-hidden');
      caption.classList.remove('is-hidden');
    }, FADE_MS);
  };

  [-1, 1].forEach((direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `cards-steps-arrow ${direction < 0 ? 'prev' : 'next'}`;
    button.setAttribute('aria-label', direction < 0 ? 'Previous' : 'Next');
    button.addEventListener('click', () => show(current + direction));
    slider.append(button);
  });
  items.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => show(i));
    dots.append(dot);
  });

  slider.prepend(viewport);
  inner.append(heading, slider, caption, dots);
  stage.append(inner);
  block.replaceChildren(arcs, stage);

  // first slide: no fade, the text is there from the start
  heading.textContent = items[0]?.title || '';
  caption.innerHTML = items[0]?.caption || '';
  track.style.setProperty('--cards-steps-index', 0);
  slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== 0)));
  [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === 0)));
}
