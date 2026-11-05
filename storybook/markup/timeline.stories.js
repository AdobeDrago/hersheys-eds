import { createPage, showcase } from './story-helpers.js';
import buildTimeline from './timeline-fixture.js';

function render({ variant }) {
  const root = createPage('Blocks', 'Timeline');
  const main = showcase(root);
  buildTimeline(main, { variant });
  return root;
}

export default {
  title: 'Blocks/Timeline',
  render,
  args: { variant: '' },
  argTypes: { variant: { control: 'select', options: ['', 'dark'], description: 'Light (tan) or dark (brown) band.' } },
  parameters: {
    docs: { description: { component: 'Production Timeline decorator and CSS: one decade per block, two columns of intro and year cards. Rows are `left`/`right` plus content; a cell with a picture becomes a card. The first four-digit year in the first h2 becomes the block id used by Timeline Nav. The centre spine and kiss are added to main.' } },
  },
};
export const Light = {};
export const Dark = { args: { variant: 'dark' } };
