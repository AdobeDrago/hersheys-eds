const EMAIL_RE = /^[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

const RULES = {
  firstName: (v) => !!v,
  lastName: (v) => !!v,
  email: (v) => EMAIL_RE.test(v),
  zip: (v) => ZIP_RE.test(v),
};

/**
 * Validates a single field and toggles its error state.
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
function validate(input) {
  const rule = RULES[input.name];
  const valid = input.type === 'checkbox' ? input.checked : rule(input.value.trim());
  input.closest('.newsletter-field').classList.toggle('has-error', !valid);
  input.setAttribute('aria-invalid', String(!valid));
  return valid;
}

function getStoredEmail() {
  try {
    return localStorage.getItem('email') || '';
  } catch (e) {
    return '';
  }
}

/**
 * POC: validates and shows the success message. No data is sent anywhere.
 * @param {Element} widget
 */
export default function decorate(widget) {
  const form = widget.querySelector('form');
  if (!form) return;
  const emailInput = form.elements.email;
  emailInput.value = new URLSearchParams(window.location.search).get('email') || getStoredEmail();

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
    widget.querySelector('.newsletter-register').hidden = true;
    const thanks = widget.querySelector('.newsletter-thanks');
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
