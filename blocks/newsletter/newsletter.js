const EMAIL_RE = /^[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

/* field name -> input config; labels, placeholders and errors are authored */
const FIELDS = {
  'first name': {
    name: 'firstName', type: 'text', autocomplete: 'given-name', maxlength: 60, rule: (v) => !!v,
  },
  'last name': {
    name: 'lastName', type: 'text', autocomplete: 'family-name', maxlength: 60, rule: (v) => !!v,
  },
  email: {
    name: 'email', type: 'email', autocomplete: 'email', maxlength: 255, rule: (v) => EMAIL_RE.test(v),
  },
  zip: {
    name: 'zip', type: 'text', autocomplete: 'postal-code', maxlength: 16, rule: (v) => ZIP_RE.test(v),
  },
};
const RULES = Object.fromEntries(Object.values(FIELDS).map(({ name, rule }) => [name, rule]));

const SOCIAL = ['instagram', 'tiktok', 'youtube', 'facebook', 'pinterest'];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Reads the authored rows into { key: [cell, cell, ...] }.
 * @param {Element} block
 * @returns {Object<string, Element[]>}
 */
function readRows(block) {
  const rows = {};
  [...block.children].forEach((row) => {
    const [key, ...cells] = [...row.children];
    if (key) rows[key.textContent.trim().toLowerCase().replace(/[-\s]+/g, ' ')] = cells;
  });
  return rows;
}

const text = (cells) => (cells && cells[0] ? cells[0].textContent.trim() : '');

function getStoredEmail() {
  try {
    return localStorage.getItem('email') || '';
  } catch (e) {
    return '';
  }
}

/**
 * Validates a single field and toggles its error state.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function validate(input) {
  const valid = input.type === 'checkbox' ? input.checked : RULES[input.name](input.value.trim());
  input.closest('.newsletter-field').classList.toggle('has-error', !valid);
  input.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function buildField(config, [labelCell, placeholderCell, errorCell]) {
  const field = el('div', 'newsletter-field');
  const id = `newsletter-${config.name}`;
  const label = el('label', null, labelCell ? labelCell.textContent.trim() : '');
  label.htmlFor = id;
  const star = el('span', null, ' *');
  star.setAttribute('aria-hidden', 'true');
  label.append(star);

  const input = el('input');
  input.type = config.type;
  input.id = id;
  input.name = config.name;
  input.maxLength = config.maxlength;
  input.autocomplete = config.autocomplete;
  if (placeholderCell) input.placeholder = placeholderCell.textContent.trim();

  field.append(label, input, el('span', 'newsletter-error', errorCell ? errorCell.textContent.trim() : ''));
  return field;
}

function buildConsent(rows) {
  const [consentCell, errorCell] = rows.consent || [];
  const field = el('div', 'newsletter-field newsletter-optin');
  const input = el('input');
  input.type = 'checkbox';
  input.id = 'newsletter-optin';
  input.name = 'optin';
  input.value = 'y';
  const label = el('label');
  label.htmlFor = input.id;
  if (consentCell) label.append(...consentCell.querySelector('p')?.childNodes || consentCell.childNodes);
  const star = el('span', null, ' *');
  star.setAttribute('aria-hidden', 'true');
  label.append(star);
  label.querySelectorAll('a').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  field.append(input, label, el('span', 'newsletter-error', errorCell ? errorCell.textContent.trim() : ''));
  return field;
}

function buildRegister(rows) {
  const section = el('section', 'newsletter-register');
  const [content] = rows.content || [];
  const items = content ? [...content.children] : [];
  const headingEl = items.find((item) => /^H[1-6]$/.test(item.tagName)) || items[0];
  const [introEl, noteEl] = items.filter((item) => item !== headingEl);
  const h1 = el('h1');
  if (headingEl) h1.append(...headingEl.childNodes);
  section.append(h1);
  if (introEl) {
    const intro = el('p', 'newsletter-intro');
    intro.append(...introEl.childNodes);
    section.append(intro);
  }
  if (noteEl) {
    const note = el('p');
    const small = el('small');
    small.append(...noteEl.childNodes);
    note.append(small);
    section.append(note);
  }

  const form = el('form');
  form.name = 'newsletter-form';
  form.noValidate = true;
  const row = () => el('div', 'newsletter-row');
  const nameRow = row();
  const zipRow = row();
  let emailField;
  Object.keys(FIELDS).forEach((key) => {
    if (!rows[key]) return;
    const field = buildField(FIELDS[key], rows[key]);
    if (key === 'zip') zipRow.append(field);
    else if (key === 'email') emailField = field;
    else nameRow.append(field);
  });
  form.append(nameRow);
  if (emailField) form.append(emailField);
  form.append(zipRow);
  form.append(buildConsent(rows));

  const submit = el('button', null, text(rows.button));
  submit.type = 'submit';
  form.append(submit);
  section.append(form);
  return { section, form };
}

function buildSocial(caption, links) {
  const social = el('div', 'newsletter-social');
  if (caption) {
    const p = el('p');
    p.append(...caption.childNodes);
    social.append(p);
  }
  links.forEach((a) => {
    const network = SOCIAL.find((name) => a.href.includes(name)) || SOCIAL.find((name) => a.textContent.toLowerCase().includes(name));
    if (!network) return;
    const link = el('a', `newsletter-social-${network}`);
    link.href = a.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', network);
    social.append(link);
  });
  return social;
}

/**
 * Builds the thank-you card from one authored cell: image, heading, message,
 * a paragraph holding only a link (the button), then the social text and links.
 * @param {Object<string, Element[]>} rows
 */
function buildThanks(rows) {
  const section = el('section', 'newsletter-thanks');
  section.hidden = true;
  const [cell] = rows['thank you'] || [];
  if (!cell) return section;

  const picture = cell.querySelector('picture');
  if (picture) {
    picture.classList.add('newsletter-thanks-image');
    section.append(picture);
  }
  const body = el('div', 'newsletter-thanks-body');
  const headingEl = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (headingEl) {
    const h2 = el('h2');
    h2.append(...headingEl.childNodes);
    body.append(h2);
  }

  const paragraphs = [...cell.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const linksOnly = (p) => p.querySelector('a') && !p.textContent.replace(/\s/g, '').replace(p.querySelector('a').textContent.replace(/\s/g, ''), '');
  const socialLinks = paragraphs.find((p) => p.querySelectorAll('a').length > 1);
  const buttonP = paragraphs.find((p) => p !== socialLinks && linksOnly(p));
  const texts = paragraphs.filter((p) => p !== socialLinks && p !== buttonP);
  const [message, caption] = texts;

  if (message) {
    const p = el('p');
    p.append(...message.childNodes);
    body.append(p);
  }
  const actions = el('div', 'newsletter-thanks-actions');
  const link = buttonP?.querySelector('a');
  if (link) {
    link.className = 'button';
    actions.append(link);
  }
  actions.append(buildSocial(caption, socialLinks ? [...socialLinks.querySelectorAll('a')] : []));
  body.append(actions);
  section.append(body);
  return section;
}

/**
 * Uses the authored background image on the surrounding section.
 * @param {Element} block
 * @param {Object<string, Element[]>} rows
 */
function applyBackground(block, rows) {
  const img = rows.background?.[0]?.querySelector('img');
  const section = block.closest('.section');
  if (!img || !section) return;
  const url = new URL(img.src, window.location.href);
  url.searchParams.set('width', '2000');
  section.style.backgroundImage = `url("${url.href}")`;
}

/**
 * Newsletter sign-up. Every label, message, link and image is authored in DA;
 * the block builds the form, validates it and shows the thank-you message.
 * POC: nothing is sent anywhere on submit.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = readRows(block);
  applyBackground(block, rows);

  const container = el('div', 'newsletter-form-container');
  const { section: register, form } = buildRegister(rows);
  const thanks = buildThanks(rows);
  container.append(register, thanks);
  block.replaceChildren(container);

  const emailInput = form.elements.email;
  if (emailInput) {
    emailInput.value = new URLSearchParams(window.location.search).get('email') || getStoredEmail();
  }

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', () => validate(input));
    input.addEventListener('input', () => {
      if (input.closest('.has-error')) validate(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = [...form.querySelectorAll('input')].map(validate);
    if (results.includes(false)) {
      form.querySelector('.has-error input').focus();
      return;
    }
    register.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
