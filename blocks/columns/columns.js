export default function decorate(block) {
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
}
