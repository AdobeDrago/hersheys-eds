import { loadCSS } from '../../scripts/aem.js';

// variants only brand pages author; their styles live in columns-brand.css
const BRAND_VARIANTS = ['fact', 'callout', 'article', 'video', 'quotes', 'blog', 'blobs', 'follow'];

const YOUTUBE = /youtu\.?be/;
const MP4 = /\.mp4$/i;

/**
 * The player for a video link: the YouTube embed, or the .mp4 itself with controls.
 * @param {URL} url The video link
 * @param {string} title The player's accessible title
 * @param {boolean} autoplay Whether the video starts at once
 * @returns {Element|null} The player, or null when the link has no YouTube id
 */
function createPlayer(url, title, autoplay) {
  if (MP4.test(url.pathname)) {
    const video = document.createElement('video');
    video.src = url.href;
    video.controls = true;
    video.autoplay = autoplay;
    video.playsInline = true;
    video.title = title;
    return video;
  }
  const id = url.searchParams.get('v') || url.pathname.split('/').pop();
  if (!id) return null;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?${autoplay ? 'autoplay=1&' : ''}rel=0`;
  iframe.title = title || 'Video';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  if (!autoplay) iframe.loading = 'lazy';
  return iframe;
}

/**
 * `Columns (video)` and `Columns (follow)`: the YouTube or .mp4 link beside the poster becomes a
 * play button that swaps the poster for the player. `Columns (video, player)`, or a link without a
 * poster, shows the player at once, as the HERSHEY'S trailer on hersheyland.com does.
 * @param {Element} block The columns block element
 */
function decorateVideo(block) {
  const showPlayer = block.classList.contains('player');
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const link = [...cell.querySelectorAll('a[href]')]
      .find((a) => YOUTUBE.test(a.href) || MP4.test(new URL(a.href).pathname));
    if (!link) return;
    const url = new URL(link.href);
    const picture = cell.querySelector('picture');
    const alt = picture?.querySelector('img')?.alt || '';
    if (showPlayer || !picture) {
      // the poster's alt text, or else the link text unless it is the bare URL, titles the player
      const text = link.textContent.trim();
      const title = alt || (text === link.href ? 'Video player' : text);
      const inline = createPlayer(url, title, false);
      if (!inline) return;
      (link.closest('p') || link).replaceWith(inline);
      picture?.closest('p')?.remove();
      picture?.remove();
      return;
    }
    const player = createPlayer(url, alt || 'Video', true);
    if (!player) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'columns-video-play';
    button.setAttribute('aria-label', alt ? `Play video: ${alt}` : 'Play video');
    button.addEventListener('click', () => cell.replaceChildren(player), { once: true });
    (link.closest('p') || link).replaceWith(button);
  });
}

/**
 * Decorates columns. Layout variants keep their authored rows.
 * @param {Element} block The columns block element
 */
export default async function decorate(block) {
  const brandStyles = BRAND_VARIANTS.some((variant) => block.classList.contains(variant))
    ? loadCSS(`${window.hlx.codeBasePath}/blocks/columns/columns-brand.css`)
    : null;
  if (block.classList.contains('video') || block.classList.contains('follow')) decorateVideo(block);
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (block.classList.contains('homepage-hero') && pic) {
        const pictures = [...col.querySelectorAll('picture')];
        if (pictures.length === 2) {
          const [desktop, mobile] = pictures;
          const responsive = document.createElement('picture');
          [...mobile.querySelectorAll('source')].forEach((source) => {
            source.media = `(width < 900px)${source.media ? ` and ${source.media}` : ''}`;
            responsive.append(source);
          });
          const mobileImage = mobile.querySelector('img');
          if (!responsive.children.length && mobileImage) {
            const source = document.createElement('source');
            source.media = '(width < 900px)';
            source.srcset = mobileImage.src;
            responsive.append(source);
          }
          [...desktop.children].forEach((child) => responsive.append(child));
          const img = responsive.querySelector('img') || mobileImage;
          if (img) {
            if (!responsive.contains(img)) responsive.append(img);
            img.loading = 'eager';
            img.setAttribute('fetchpriority', 'high');
          } else {
            // eslint-disable-next-line no-console
            console.error('Homepage hero pictures require a fallback image', block);
          }
          col.replaceChildren(responsive);
        }
        col.classList.add('columns-img-col');
      }
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
  await brandStyles;
}
