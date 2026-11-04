import { loadCSS } from '../../scripts/aem.js';

// variants only brand pages author; their styles live in columns-brand.css
const BRAND_VARIANTS = ['fact', 'callout', 'article', 'video', 'quotes', 'blog', 'blobs'];

/**
 * `Columns (video)`: the YouTube link beside the poster becomes a play button that swaps the
 * poster for the embedded player.
 * @param {Element} block The columns block element
 */
function decorateVideo(block) {
  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    const link = [...cell.querySelectorAll('a[href]')].find((a) => /youtu\.?be/.test(a.href));
    const picture = cell.querySelector('picture');
    if (!link || !picture) return;
    const url = new URL(link.href);
    const id = url.searchParams.get('v') || url.pathname.split('/').pop();
    if (!id) return;
    const alt = picture.querySelector('img')?.alt || '';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'columns-video-play';
    button.setAttribute('aria-label', alt ? `Play video: ${alt}` : 'Play video');
    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      iframe.title = alt || 'Video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      cell.replaceChildren(iframe);
    }, { once: true });
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
  if (block.classList.contains('video')) decorateVideo(block);
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
