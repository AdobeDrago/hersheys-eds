/**
 * Columns (Image Pair): two images side by side, stacked on mobile.
 * Content model: 1 row x 2 columns, each cell holding one image.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (cell.querySelector('picture')) cell.classList.add('columns-image-pair-image');
  });
}
