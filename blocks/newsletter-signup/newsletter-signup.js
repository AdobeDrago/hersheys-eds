const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGISTER_URL = 'https://l.hersheys.com/u/register.php';
/* Emarsys registration fields used by the production recipe-page signup. */
const HIDDEN_FIELDS = {
  CID: '1095463636',
  SID: '',
  UID: '',
  f: '1307',
  p: '2',
  a: 'r',
  el: '',
  llid: '',
  c: '',
  counted: '',
  RID: '',
  mailnow: '',
  formType: 'crm-food-service',
};

let blockCount = 0;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const PRIVACY_POLICY = 'https://www.thehersheycompany.com/en_us/home/privacy-policy.html';

/**
 * Everything the author wrote, in order, across every cell.
 * @param {Element} block
 * @returns {Element[]}
 */
function authoredItems(block) {
  return [...block.querySelectorAll(':scope > div > div')].flatMap((cell) => [...cell.children]);
}

/**
 * Heading, introduction, EU/EEA note and the consent paragraph (the one with a link).
 * A missing heading uses the first paragraph. A missing consent uses the production wording.
 * @param {Element} block
 */
function readCopy(block) {
  const items = authoredItems(block);
  const paragraphs = items.filter((item) => item.matches('p') && item.textContent.trim());
  const headingEl = items.find((item) => /^H[1-6]$/.test(item.tagName)) || paragraphs.shift();
  const consentEl = paragraphs.find((paragraph) => paragraph.querySelector('a'));
  const noteEl = paragraphs.find((paragraph) => paragraph !== consentEl
    && /^please note\b/i.test(paragraph.textContent.trim()));
  return {
    headingEl,
    intro: paragraphs.filter((paragraph) => paragraph !== consentEl && paragraph !== noteEl),
    noteEl,
    consentEl,
  };
}

/**
 * Brand or section the signup came from, matching the production embed.
 * @returns {string}
 */
function signupOrigin() {
  const bg = new URLSearchParams(window.location.search).get('newsbkg');
  if (bg) return bg;
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/recipe')) return 'recipes';
  if (path.includes('/craft')) return 'crafts';
  return 'hersheyglobal';
}

function storedEmail() {
  try {
    return new URLSearchParams(window.location.search).get('email')
      || localStorage.getItem('email')
      || '';
  } catch (e) {
    return '';
  }
}

function mailIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', '2');
  rect.setAttribute('y', '5');
  rect.setAttribute('width', '20');
  rect.setAttribute('height', '14');
  rect.setAttribute('rx', '2');
  const flap = document.createElementNS(ns, 'polyline');
  flap.setAttribute('points', '2,5 12,13 22,5');
  svg.append(rect, flap);
  const icon = el('span', 'newsletter-signup-icon');
  icon.append(svg);
  return icon;
}

/**
 * @param {HTMLInputElement} input
 * @param {boolean} invalid
 */
function setInvalid(input, invalid) {
  input.closest('.newsletter-signup-field').classList.toggle('has-error', invalid);
  input.setAttribute('aria-invalid', String(invalid));
}

/**
 * @param {HTMLInputElement} input
 * @param {boolean} fullCheck pattern-check; a keystroke only clears a shown error
 * @returns {boolean}
 */
function validateEmail(input, fullCheck) {
  const value = input.value.trim();
  const invalid = !value || (fullCheck && !EMAIL_RE.test(value));
  setInvalid(input, invalid);
  return !invalid;
}

/**
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function validateOptin(input) {
  setInvalid(input, !input.checked);
  return input.checked;
}

function hiddenInput(name, value) {
  const input = el('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  return input;
}

/**
 * Left column: authored heading, introduction and EU/EEA note.
 * @param {{ headingEl?: Element, intro: Element[], noteEl?: Element }} copy
 */
function buildCopy({ headingEl, intro, noteEl }) {
  const copy = el('div', 'newsletter-signup-copy');
  const heading = el('h2');
  if (headingEl) heading.append(...headingEl.childNodes);
  copy.append(heading);
  intro.forEach((paragraph) => {
    const p = el('p');
    p.append(...paragraph.childNodes);
    copy.append(p);
  });
  if (noteEl) {
    const note = el('p', 'newsletter-signup-note');
    note.append(...noteEl.childNodes);
    copy.append(note);
  }
  return copy;
}

/**
 * Consent paragraph. Uses the production wording when the author did not include a link.
 * @param {Element} [source]
 * @returns {Element}
 */
function consentCopy(source) {
  if (source) return source;
  const paragraph = el('p');
  paragraph.append('I\'d like to receive product news, exciting offers, personalized content, services and more from The Hershey Company and its affiliates and partners, including through direct mail, digital media or digital communications. For further information, please refer to our ');
  const policy = el('a', '', 'Privacy Policy');
  policy.href = PRIVACY_POLICY;
  paragraph.append(policy);
  return paragraph;
}

/**
 * @param {number} id
 * @param {Element} [consentEl]
 */
function buildForm(id, consentEl) {
  const form = el('form', 'newsletter-signup-form');
  form.noValidate = true;
  form.action = REGISTER_URL;
  form.method = 'get';
  Object.entries(HIDDEN_FIELDS).forEach(([name, value]) => form.append(hiddenInput(name, value)));
  form.append(hiddenInput('inp_14076', ''));

  const honeypot = el('div', 'newsletter-signup-honeypot');
  honeypot.setAttribute('aria-hidden', 'true');
  const trap = el('input');
  trap.type = 'text';
  trap.name = 'inp_15961';
  trap.tabIndex = -1;
  trap.autocomplete = 'off';
  honeypot.append(el('label', '', 'Phone'), trap);
  form.append(honeypot);

  const emailId = `newsletter-signup-${id}-email`;
  const emailField = el('div', 'newsletter-signup-field');
  const emailLabel = el('label', 'newsletter-signup-label', 'Email');
  emailLabel.htmlFor = emailId;
  emailLabel.append(el('span', 'newsletter-signup-required', ' *'));
  const wrap = el('div', 'newsletter-signup-input');
  const email = el('input');
  email.type = 'email';
  email.id = emailId;
  email.name = 'inp_3';
  email.maxLength = 255;
  email.autocomplete = 'email';
  email.inputMode = 'email';
  email.placeholder = 'youremail@yourdomain.com';
  email.value = storedEmail();
  wrap.append(mailIcon(), email);
  const emailError = el('span', 'newsletter-signup-error', 'Please provide a valid email address.');
  emailError.id = `${emailId}-error`;
  email.setAttribute('aria-describedby', emailError.id);
  emailField.append(emailLabel, wrap, emailError);

  const optinId = `newsletter-signup-${id}-optin`;
  const optinField = el('div', 'newsletter-signup-field');
  const check = el('div', 'newsletter-signup-check');
  const optin = el('input');
  optin.type = 'checkbox';
  optin.id = optinId;
  optin.name = 'optin';
  optin.value = 'y';
  const optinLabel = el('label', 'newsletter-signup-optin');
  optinLabel.htmlFor = optinId;
  const consent = consentCopy(consentEl);
  optinLabel.append(...(consent.querySelector('p')?.childNodes || consent.childNodes));
  optinLabel.append(el('span', 'newsletter-signup-required', ' *'));
  optinLabel.querySelectorAll('a').forEach((anchor) => {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  });
  check.append(optin, optinLabel);
  const optinError = el('span', 'newsletter-signup-error', 'Please accept the terms and conditions to continue.');
  optinError.id = `${optinId}-error`;
  optin.setAttribute('aria-describedby', optinError.id);
  optinField.append(check, optinError);

  const button = el('button', 'newsletter-signup-submit', 'Sign Me Up');
  button.type = 'submit';
  form.append(emailField, optinField, button);
  return { form, email, optin };
}

function buildSuccess() {
  const success = el('div', 'newsletter-signup-success');
  success.hidden = true;
  success.setAttribute('aria-live', 'polite');
  success.append(
    el('h3', '', 'You have successfully subscribed!'),
    el('p', '', 'Check your inbox for a welcome email and connect with us on social media to see what\'s new.'),
  );
  return success;
}

function showSuccess(layout, success) {
  layout.hidden = true;
  success.hidden = false;
}

/**
 * Posts the signup the way the production embed does, then shows the confirmation.
 * A filled honeypot is treated as success and is not sent.
 * @param {HTMLFormElement} form
 * @param {HTMLElement} layout
 * @param {HTMLElement} success
 */
async function submitSignup(form, layout, success) {
  if (form.elements.inp_15961?.value) {
    showSuccess(layout, success);
    return;
  }
  const origin = form.elements.inp_14076;
  if (origin && !origin.value) origin.value = signupOrigin();
  const params = new URLSearchParams(new FormData(form));
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    await fetch(`${REGISTER_URL}?${params}`, { method: 'GET', mode: 'no-cors' });
    showSuccess(layout, success);
  } catch (e) {
    button.disabled = false;
  }
}

/**
 * Newsletter Signup. The two-column email capture used on recipe pages
 * (heading and note on the left, email, consent and Sign Me Up on the right).
 * The block holds one cell: a heading, the introduction, the EU/EEA note,
 * and an optional consent paragraph containing the privacy link.
 * Email, the button and the confirmation use the production wording.
 * @param {Element} block
 */
export default function decorate(block) {
  blockCount += 1;
  const copy = readCopy(block);
  const layout = el('div', 'newsletter-signup-layout');
  const { form, email, optin } = buildForm(blockCount, copy.consentEl);
  const wrap = el('div', 'newsletter-signup-form-wrap');
  wrap.append(form);
  layout.append(buildCopy(copy), wrap);
  const success = buildSuccess();
  block.replaceChildren(layout, success);

  email.addEventListener('change', () => validateEmail(email, true));
  email.addEventListener('input', () => {
    if (email.closest('.has-error')) validateEmail(email, false);
  });
  optin.addEventListener('change', () => validateOptin(optin));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailOk = validateEmail(email, true);
    const optinOk = validateOptin(optin);
    if (!emailOk || !optinOk) {
      form.querySelector('.has-error input').focus();
      return;
    }
    submitSignup(form, layout, success);
  });
}
