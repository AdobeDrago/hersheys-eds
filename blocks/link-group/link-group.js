/**
 * Link Group block: a band with an eyebrow and heading beside a slider of square link tiles
 * (the "Explore Recipes, Products, Activities & More" band on about/history).
 *
 * Content model: row 1 holds the eyebrow paragraph and the h2 (any order, any cell). Every
 * further row is one tile: a picture and a link whose text is the tile label. A row without a
 * link or picture is skipped.
 * The slider scrolls three tiles at a time with previous/next buttons and Hershey's Kiss page
 * dots; below 768px the track just swipes. The band is dark brown and sits on the section.
 */
const PAGE_SIZE = 3;

const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');

export default function decorate(block) {
  const rows = [...block.children];
  const head = document.createElement('div');
  head.className = 'link-group-head';
  const tiles = [];

  rows.forEach((row) => {
    const link = row.querySelector('a[href]');
    const picture = row.querySelector('picture');
    if (link && picture) {
      const tile = document.createElement('li');
      tile.className = 'link-group-tile';
      const anchor = document.createElement('a');
      anchor.href = link.href;
      const media = document.createElement('div');
      media.className = 'link-group-media';
      media.append(picture);
      const label = document.createElement('span');
      const text = document.createElement('span');
      text.className = 'link-group-label';
      text.textContent = link.textContent.trim();
      label.append(text);
      anchor.append(media, label);
      tile.append(anchor);
      tiles.push(tile);
    } else {
      head.append(...[...row.querySelectorAll('p, h2, h3')]
        .filter((el) => el.textContent.trim()));
    }
  });
  const eyebrow = [...head.querySelectorAll('p')][0];
  if (eyebrow) eyebrow.className = 'link-group-eyebrow';

  const scrollTo = (left) => track.scrollTo({ left, behavior: smooth() });
  const track = document.createElement('ul');
  track.className = 'link-group-track';
  track.append(...tiles);
  track.tabIndex = 0;
  track.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });

  const controls = document.createElement('div');
  controls.className = 'link-group-controls';
  const prev = document.createElement('button');
  const next = document.createElement('button');
  [[prev, -1, 'Previous'], [next, 1, 'Next']].forEach(([button, dir, name]) => {
    button.type = 'button';
    button.className = `link-group-${dir < 0 ? 'prev' : 'next'}`;
    button.setAttribute('aria-label', `${name} tiles`);
    // one tile at a time (the tile plus its gap)
    button.addEventListener('click', () => {
      const tile = track.querySelector('.link-group-tile');
      const pitch = tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
      scrollTo(track.scrollLeft + dir * pitch);
    });
  });
  const dots = document.createElement('div');
  dots.className = 'link-group-dots';
  const pages = Math.max(1, Math.ceil(tiles.length / PAGE_SIZE));
  // each dot is a row of three tiles
  for (let i = 0; i < pages; i += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show tiles ${i * PAGE_SIZE + 1} to ${Math.min((i + 1) * PAGE_SIZE, tiles.length)}`);
    dot.addEventListener('click', () => {
      const tile = track.querySelector('.link-group-tile');
      const pitch = tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
      scrollTo(Math.min(i * PAGE_SIZE * pitch, track.scrollWidth - track.clientWidth));
    });
    dots.append(dot);
  }
  controls.append(prev, dots, next);

  const slider = document.createElement('div');
  slider.className = 'link-group-slider';
  slider.append(track, controls);

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const tile = track.querySelector('.link-group-tile');
    const pitch = tile ? tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0') : 1;
    let page = Math.min(Math.round(track.scrollLeft / (PAGE_SIZE * pitch)), pages - 1);
    if (max > 0 && track.scrollLeft >= max - 1) page = pages - 1;
    if (!(page >= 0)) page = 0;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === page);
      if (i === page) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    controls.hidden = max <= 0 && window.matchMedia('(width >= 768px)').matches;
  };
  track.addEventListener('scroll', update, { passive: true });
  // the section is still hidden when the block decorates, so measure again once it has a size
  new ResizeObserver(update).observe(track);

  block.replaceChildren(head, slider);
  block.closest('.section')?.classList.add('link-group-section');
  // the footer's ribbon sits on this band's colour instead of the page grey
  document.body.classList.add('footer-on-dark');
  update();
}
