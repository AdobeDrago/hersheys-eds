import decorateTimelineNav from '@adobe/aem-boilerplate/blocks/timeline-nav/timeline-nav.js';
import '@adobe/aem-boilerplate/blocks/timeline-nav/timeline-nav.css';
import {
  createPage, element, link, section, showcase,
} from './story-helpers.js';
import buildTimeline from './timeline-fixture.js';

const DECADES = [
  ['1850s-90s: Sweet Beginnings', '#1850'],
  ['1900s-10s: Hershey’s First Brands', '#1900'],
];

function render({ label, withTimeline }) {
  const root = createPage('Blocks', 'Timeline Nav');
  const main = showcase(root);
  // the card hangs over the bottom edge of the hero above it, so the story needs one
  const hero = element('div', 'section');
  hero.style.cssText = 'height:240px;background:#3c131c;color:#fff;display:grid;place-items:center';
  hero.append(element('h1', '', 'Our History'));
  main.append(hero);
  const block = element('div', 'timeline-nav block');
  if (label) {
    const row = element('div');
    row.append(element('p', '', label));
    block.append(row);
  }
  DECADES.forEach(([text, href]) => {
    const row = element('div');
    const p = element('p');
    p.append(link(text, href));
    row.append(p);
    block.append(row);
  });
  section(main, block);
  decorateTimelineNav(block);
  if (!withTimeline) {
    // room under the card for the open menu
    const space = element('div', 'section');
    space.style.height = '420px';
    main.append(space);
  }
  if (withTimeline) {
    buildTimeline(main, { decade: '1850s-90s' });
    buildTimeline(main, { variant: 'dark', decade: '1900s-10s' });
  }
  return root;
}

export default {
  title: 'Blocks/Timeline Nav',
  render,
  args: { label: '', withTimeline: true },
  argTypes: {
    label: { control: 'text', description: 'Optional plain paragraph that replaces the “Select a Decade” button label.' },
    withTimeline: { control: 'boolean', description: 'Render Timeline blocks below so the decade links have targets to scroll to.' },
  },
  parameters: {
    docs: { description: { component: 'Production Timeline Nav decorator and CSS. The button toggles the decade menu (aria-expanded); Escape and outside click close it. Choosing a decade scrolls to the matching Timeline block id.' } },
  },
};
export const Default = {};
export const CustomLabel = { args: { label: 'Jump to a decade' } };
export const MenuOnly = { args: { withTimeline: false } };
