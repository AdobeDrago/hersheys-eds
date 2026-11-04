// number of repeats of a strip per track, enough to cover the widest screens
const REPEATS = 4;

// the two strips of ticker text live in /icons; they are decoration, not authored content
const STRIPS = [
  `${window.hlx.codeBasePath}/icons/hero-marquee-ticker-left.svg`,
  `${window.hlx.codeBasePath}/icons/hero-marquee-ticker-right.svg`,
];

/**
 * Builds one scrolling row of a ticker strip.
 * @param {string} source The strip image URL
 * @param {boolean} reverse Scroll the row to the right instead of the left
 * @returns {Element} The track
 */
function buildTrack(source, reverse) {
  const track = document.createElement('div');
  track.className = 'hero-marquee-track';
  if (reverse) track.classList.add('reverse');
  for (let i = 0; i < REPEATS; i += 1) {
    const img = document.createElement('img');
    img.src = source;
    img.alt = '';
    img.loading = 'lazy';
    track.append(img);
  }
  return track;
}

// the text band: rows of one wide strip, as on /hersheys ("Tastes like good memories")
const BAND_ROWS = 4;
// band scroll speed, in pixels per second, measured on hersheyland.com
const BAND_SPEED = 24;

/**
 * Finds the strip image the author supplied for a band: a picture, or a link to an image file
 * (for strips too large to author on a page, e.g. a file in /icons).
 * @param {Element} block The hero block
 * @returns {HTMLImageElement|null}
 */
function findStrip(block) {
  const img = block.querySelector('img');
  if (img) return img;
  const link = block.querySelector('a[href]');
  if (!link || !/\.(svg|png|webp|jpe?g)(\?|$)/i.test(link.href)) return null;
  const linked = document.createElement('img');
  linked.src = link.href;
  linked.alt = link.textContent.trim() === link.href ? '' : link.textContent.trim();
  return linked;
}

/**
 * `Hero (marquee, band)`: rows of one wide strip of lettering scrolling sideways, each row in
 * the opposite direction to the one above. The block is clipped to the height set on it
 * (`--hero-marquee-band-height`), so the last row can be cut off. Add `rows-N` for another number
 * of rows. Authored as one cell holding the strip (a picture, or a link to an image file); its alt
 * text is the readable copy and the rows are decorative.
 * @param {Element} block The hero block
 */
function decorateBand(block) {
  const strip = findStrip(block);
  if (!strip) return;
  const count = Number(([...block.classList].find((c) => /^rows-\d+$/.test(c)) || '').slice(5))
    || BAND_ROWS;
  const rows = Array.from({ length: count }, (_, index) => {
    const row = document.createElement('div');
    row.className = 'hero-marquee-strip-row';
    if (index % 2) row.classList.add('reverse');
    row.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'hero-marquee-strip-track';
    // two copies side by side: the track scrolls exactly one strip, then repeats
    [0, 1].forEach(() => {
      const copy = document.createElement('img');
      copy.src = strip.currentSrc || strip.src;
      copy.alt = '';
      copy.loading = 'lazy';
      track.append(copy);
    });
    row.append(track);
    return row;
  });

  const text = document.createElement('p');
  text.className = 'hero-marquee-strip-text';
  text.textContent = strip.alt;
  block.replaceChildren(text, ...rows);

  // the strip keeps its proportions at the row height, so its width sets the loop length
  const first = rows[0].querySelector('img');
  const setSpeed = () => {
    const { width } = first.getBoundingClientRect();
    if (width) block.style.setProperty('--hero-marquee-band-duration', `${width / BAND_SPEED}s`);
  };
  if (first.complete) setSpeed();
  else first.addEventListener('load', setSpeed, { once: true });
}

/**
 * Hero (marquee) variant, loaded by hero.js for `Hero (marquee)`: a brand hero with rows of
 * scrolling text on a tilted band behind a logo, copy and product image, as on /oreo-cup.
 *
 * Authored as one row: the copy (logo and text) beside the product image. With `band` it is a text
 * band instead (see decorateBand).
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  if (block.classList.contains('band')) {
    decorateBand(block);
    return;
  }
  const contentRow = block.firstElementChild;

  const ticker = document.createElement('div');
  ticker.className = 'hero-marquee-ticker';
  ticker.setAttribute('aria-hidden', 'true');
  // two strips alternate over four rows: left, right, left, right
  [0, 1, 0, 1].forEach((strip, row) => {
    ticker.append(buildTrack(STRIPS[strip], row % 2 === 1));
  });

  const [copy, media] = [...(contentRow?.children || [])];
  copy?.classList.add('hero-marquee-copy');
  media?.classList.add('hero-marquee-media');
  contentRow?.classList.add('hero-marquee-content');
  block.prepend(ticker);
}
