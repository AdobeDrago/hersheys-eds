const PREFIX = 'poll:';

/**
 * Reads a saved vote; storage can be blocked, so failures mean "no vote yet".
 * @param {string} key
 * @returns {number} The chosen option index or -1
 */
function readVote(key) {
  try {
    const saved = window.localStorage.getItem(PREFIX + key);
    return saved === null ? -1 : Number(saved);
  } catch (e) {
    return -1;
  }
}

function saveVote(key, index) {
  try {
    window.localStorage.setItem(PREFIX + key, String(index));
  } catch (e) {
    // storage is blocked: the vote still counts for this visit
  }
}

// fixed copy of the quiz results, as on hersheyland.com/brands/kisses
const QUIZ_CORRECT = 'Correct!';
const QUIZ_INCORRECT = 'Better luck next time!';
const QUIZ_ANSWER = 'Correct Answer:';
// decorative clusters page themes can dress (e.g. the KISSES that fade in on a right answer)
const QUIZ_CLUSTERS = 7;

/**
 * Reads the quiz's key/value rows into a map of lower-case key to value cell.
 * @param {Element} block The poll block
 * @returns {Map<string, Element>}
 */
function readFields(block) {
  const fields = new Map();
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const key = keyCell?.textContent.trim().toLowerCase();
    if (key && valueCell) fields.set(key, valueCell);
  });
  return fields;
}

function paragraph(className, html) {
  const p = document.createElement('p');
  p.className = className;
  p.innerHTML = html;
  return p;
}

/**
 * `Poll (quiz)`: a trivia question with answer buttons, as the "Did you know?" bands on
 * /kisses. Choosing an answer swaps the question for "Correct!" or "Better luck next time!"
 * (with the right answer), then the explanation and an optional note.
 *
 * Authored as key/value rows: `eyebrow`, `question`, `options` (a list; the correct answer in
 * bold), `answer` (the explanation) and `note`. Nothing is stored or sent.
 * @param {Element} block The poll block
 */
function decorateQuiz(block) {
  const fields = readFields(block);
  const text = (key) => fields.get(key)?.textContent.trim() || '';
  const options = [...(fields.get('options')?.querySelectorAll('li') || [])].map((li) => ({
    label: li.textContent.trim(),
    correct: !!li.querySelector('strong, b'),
  }));
  const right = options.find((option) => option.correct);
  const answer = fields.get('answer');
  const answerHtml = answer?.querySelector('p') ? answer.querySelector('p').innerHTML : answer?.innerHTML || '';

  const question = document.createElement('div');
  question.className = 'poll-quiz-view poll-quiz-question';
  if (text('eyebrow')) question.append(paragraph('poll-quiz-eyebrow', text('eyebrow')));
  const title = document.createElement('h3');
  title.className = 'poll-quiz-title';
  title.textContent = text('question');
  const list = document.createElement('div');
  list.className = 'poll-quiz-options';
  question.append(title, list);

  const result = (correct) => {
    const view = document.createElement('div');
    view.className = `poll-quiz-view poll-quiz-result ${correct ? 'poll-quiz-correct' : 'poll-quiz-incorrect'}`;
    view.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('h3');
    heading.className = 'poll-quiz-title';
    heading.textContent = correct ? QUIZ_CORRECT : QUIZ_INCORRECT;
    view.append(heading);
    if (!correct && right) view.append(paragraph('poll-quiz-answer', `<strong>${QUIZ_ANSWER} ${right.label}</strong>`));
    view.append(paragraph('poll-quiz-body', answerHtml));
    if (text('note')) view.append(paragraph('poll-quiz-note', `<em>${text('note')}</em>`));
    return view;
  };
  const correctView = result(true);
  const incorrectView = result(false);

  const buttons = options.map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'poll-quiz-option';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      buttons.forEach((b) => { b.disabled = true; });
      block.classList.add('answered', option.correct ? 'correct' : 'incorrect');
      question.setAttribute('aria-hidden', 'true');
      (option.correct ? correctView : incorrectView).setAttribute('aria-hidden', 'false');
    }, { once: true });
    list.append(button);
    return button;
  });

  const decor = document.createElement('div');
  decor.className = 'poll-quiz-decor';
  decor.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < QUIZ_CLUSTERS; i += 1) decor.append(document.createElement('span'));

  const inner = document.createElement('div');
  inner.className = 'poll-quiz-inner';
  inner.setAttribute('aria-live', 'polite');
  inner.append(question, correctView, incorrectView);
  block.replaceChildren(decor, inner);
}

/**
 * `Poll`: one question with a set of answers and the running vote counts, as on /rolo.
 *
 * Authored rows: the first holds the question; every row after holds an answer and its vote
 * count. The counts are the starting tally; a visitor's choice adds one to its answer for
 * this browser only (nothing is sent anywhere) and the percentages follow.
 * @param {Element} block The poll block
 */
export default function decorate(block) {
  if (block.classList.contains('quiz')) {
    decorateQuiz(block);
    return;
  }
  const [questionRow, ...answerRows] = [...block.children];
  const question = questionRow?.textContent.trim() || '';
  const answers = answerRows.map((row) => ({
    // authored text is wrapped in a paragraph; the label is the paragraph's content
    label: (row.children[0]?.querySelector('p') || row.children[0])?.innerHTML.trim() || '',
    votes: Number(row.children[1]?.textContent.replace(/\D/g, '')) || 0,
  }));
  const key = question.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  let chosen = readVote(key);
  if (chosen >= answers.length) chosen = -1;

  const heading = document.createElement('h2');
  heading.className = 'poll-question';
  heading.textContent = question;
  const list = document.createElement('ul');
  list.className = 'poll-answers';

  const buttons = answers.map((answer, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'poll-answer';
    button.innerHTML = '<span class="poll-bar"></span><span class="poll-label"></span><span class="poll-percent"></span>';
    button.querySelector('.poll-label').innerHTML = `${answer.label} <span class="poll-votes"></span>`;
    button.addEventListener('click', () => {
      if (chosen === index) return;
      if (chosen >= 0) answers[chosen].votes -= 1;
      answers[index].votes += 1;
      chosen = index;
      saveVote(key, index);
      // eslint-disable-next-line no-use-before-define
      render();
    });
    item.append(button);
    list.append(item);
    return button;
  });

  function render() {
    const total = answers.reduce((sum, answer) => sum + answer.votes, 0) || 1;
    buttons.forEach((button, index) => {
      const percent = Math.round((answers[index].votes / total) * 100);
      button.querySelector('.poll-bar').style.width = `${percent}%`;
      button.querySelector('.poll-percent').textContent = `${percent}%`;
      button.querySelector('.poll-votes').textContent = answers[index].votes;
      button.setAttribute('aria-pressed', String(index === chosen));
      button.setAttribute('aria-label', `${button.querySelector('.poll-label').textContent.trim()}, ${answers[index].votes} votes, ${percent}%`);
    });
  }

  block.replaceChildren(heading, list);
  render();
}
