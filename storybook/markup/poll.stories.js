import decoratePoll from '@adobe/aem-boilerplate/blocks/poll/poll.js';
import '@adobe/aem-boilerplate/blocks/poll/poll.css';
import {
  createPage, element, section, showcase,
} from './story-helpers.js';

function render({ question, answers }) {
  const root = createPage('Blocks', 'Poll');
  const main = showcase(root);
  const block = element('div', 'poll block');
  const q = element('div');
  q.append(element('div', '', question));
  block.append(q);
  answers.forEach(({ label, votes }) => {
    const row = element('div');
    const labelCell = element('div');
    labelCell.append(element('p', '', label));
    row.append(labelCell, element('div', '', String(votes)));
    block.append(row);
  });
  decoratePoll(block);
  section(main, block);
  return root;
}

export default {
  title: 'Blocks/Poll',
  render,
  args: {
    question: 'Which ROLO flavor is your favorite?',
    answers: [
      { label: 'Original', votes: 120 },
      { label: 'Caramel', votes: 85 },
      { label: 'Mint', votes: 40 },
    ],
  },
  argTypes: {
    question: { control: 'text', description: 'Row 1: the question.' },
    answers: { control: 'object', description: 'One row per answer: label and starting vote count.' },
  },
  parameters: {
    docs: { description: { component: 'Production Poll decorator and CSS. A click adds one vote to that answer for this browser only (saved in localStorage under the question) and updates the percentages. Clear localStorage keys starting with poll: to reset.' } },
  },
};
export const Default = {};
export const TwoAnswers = {
  args: { answers: [{ label: 'Yes', votes: 10 }, { label: 'No', votes: 5 }] },
};
export const NoVotes = {
  args: { question: 'What should we make next?', answers: [{ label: 'Brownies', votes: 0 }, { label: 'Cookies', votes: 0 }] },
};
