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

function renderQuiz({ correctIndex }) {
  const root = createPage('Blocks', 'Poll', 'Quiz variant: choose an answer to see Correct! or Better luck next time!');
  const main = showcase(root);
  const block = element('div', 'poll quiz block');
  const field = (key, ...nodes) => {
    const row = element('div');
    const value = element('div');
    value.append(...nodes);
    row.append(element('div', '', key), value);
    block.append(row);
  };
  field('eyebrow', element('p', '', 'DID YOU KNOW?'));
  field('question', element('p', '', 'In what year were the first Hershey’s Kisses made?'));
  const list = element('ul');
  ['1896', '1907', '1925'].forEach((label, i) => {
    const li = element('li');
    if (i === correctIndex) li.append(element('strong', '', label)); else li.textContent = label;
    list.append(li);
  });
  field('options', list);
  field('answer', element('p', '', 'Milton Hershey introduced the Kiss in 1907.'));
  field('note', element('p', '', 'Fun fact: the wrapped Kiss arrived in 1921.'));
  decoratePoll(block);
  section(main, block);
  return root;
}

/** `Poll (quiz)`: key/value rows (eyebrow, question, options with right one bold, answer). */
export const Quiz = { render: () => renderQuiz({ correctIndex: 1 }), args: { correctIndex: 1 } };
