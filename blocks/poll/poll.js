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

/**
 * `Poll`: one question with a set of answers and the running vote counts, as on /rolo.
 *
 * Authored rows: the first holds the question; every row after holds an answer and its vote
 * count. The counts are the starting tally; a visitor's choice adds one to its answer for
 * this browser only (nothing is sent anywhere) and the percentages follow.
 * @param {Element} block The poll block
 */
export default function decorate(block) {
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
