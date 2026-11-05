import decorateTimeline from '@adobe/aem-boilerplate/blocks/timeline/timeline.js';
import '@adobe/aem-boilerplate/blocks/timeline/timeline.css';
import { element, picture, section } from './story-helpers.js';

function card(year, title, copy) {
  const cell = element('div');
  cell.append(element('h3', '', year), picture(title), element('h4', '', title), element('p', '', copy));
  return cell;
}

function row(side, content) {
  const r = element('div');
  r.append(element('div', '', side), content);
  return r;
}

export default function buildTimeline(main, { variant = '', decade = '1850s-90s' } = {}) {
  const block = element('div', `timeline ${variant} block`.replace(/\s+/g, ' '));
  const intro = element('div');
  intro.append(element('h2', '', decade));
  const intro2 = element('div');
  intro2.append(element('h2', '', 'Sweet Beginnings'), element('p', '', 'The early years of the company and its founder.'));
  const start = decade.slice(0, 4);
  block.append(
    row('left', intro),
    row('left', card(start, 'Milton Hershey is Born', 'A founder with big ideas is born in Pennsylvania.')),
    row('right', intro2),
    row('right', card(String(Number(start) + 37), 'The Chocolate Company', 'The company opens its first factory.')),
  );
  section(main, block);
  decorateTimeline(block);
  return block;
}
