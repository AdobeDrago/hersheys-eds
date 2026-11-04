const num = (value) => Number.parseFloat(value);

function buildCallout(cells) {
  const [textCell, targetCell, labelYCell, sideCell, colorCell] = cells;
  const text = textCell?.textContent.trim();
  const [x, y] = (targetCell?.textContent || '').split(/[,\s]+/).filter(Boolean).map(num);
  const ly = num(labelYCell?.textContent);
  if (!text || [x, y, ly].some(Number.isNaN)) return null;

  const callout = document.createElement('div');
  callout.className = 'annotated-image-callout';
  if (/^left$/i.test(sideCell?.textContent.trim())) callout.classList.add('side-left');
  const color = colorCell?.textContent.trim();
  if (color) callout.style.setProperty('--callout-color', color);
  callout.style.setProperty('--x', `${x}%`);
  callout.style.setProperty('--y', `${y}%`);
  callout.style.setProperty('--ly', `${ly}%`);
  callout.style.setProperty('--line-top', `${Math.min(y, ly)}%`);
  callout.style.setProperty('--line-height', `${Math.abs(ly - y)}%`);

  ['dot', 'line'].forEach((part) => {
    const el = document.createElement('span');
    el.className = `annotated-image-${part}`;
    callout.append(el);
  });
  const label = document.createElement('span');
  label.className = 'annotated-image-label';
  label.textContent = text;
  callout.append(label);
  return callout;
}

/**
 * Rows are keyed by their first cell:
 *  image   | picture
 *  callout | label | x, y (% of image) | label line y (%) | right/left | color (optional)
 *  content | richtext
 * Each `image` row starts a new figure; `callout` rows attach to the last figure.
 * @param {Element} block The annotated-image block element
 */
export default function decorate(block) {
  const figures = document.createElement('div');
  figures.className = 'annotated-image-figures';
  let content;
  let figure;

  [...block.children].forEach((row) => {
    const [keyCell, ...cells] = [...row.children];
    const key = keyCell?.textContent.trim().toLowerCase();
    if (key === 'image') {
      const picture = cells[0]?.querySelector('picture');
      if (!picture) return;
      figure = document.createElement('div');
      figure.className = 'annotated-image-figure';
      figure.append(picture);
      figures.append(figure);
    } else if (key === 'callout' && figure) {
      const callout = buildCallout(cells);
      if (callout) figure.append(callout);
    } else if (key === 'content' && cells[0]) {
      content = document.createElement('div');
      content.className = 'annotated-image-content';
      content.append(...cells[0].childNodes);
    }
  });

  block.replaceChildren(figures);
  if (content) block.append(content);
}
