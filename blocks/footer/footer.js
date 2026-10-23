import { getMetadata } from '../../scripts/aem.js';
import loadHersheyTheme from '../../scripts/hershey-theme.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Exposes an authored image as a CSS custom property so it can be used as a mask or background,
 * which keeps the image managed in DA instead of hardcoded in CSS.
 * @param {Element} target The element that receives the custom property
 * @param {string} property The custom property name
 * @param {HTMLImageElement} img The authored image
 */
function useImage(target, property, img) {
  target.style.setProperty(property, `url("${img.src}")`);
}

/**
 * Turns the authored newsletter content into copy, sign-up form and artwork groups.
 * The authored "Sign Up" link becomes the form action so it stays the single source of truth.
 * @param {Element} section The newsletter section
 */
function decorateNewsletter(section) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return;
  const heading = wrapper.querySelector('h2');
  const action = wrapper.querySelector('a.button');
  const paragraphs = [...wrapper.querySelectorAll(':scope > p')];
  const pictures = paragraphs.filter((p) => p.querySelector('picture'));
  // the last picture is the artwork; an earlier one is the envelope icon for the eyebrow line
  const art = pictures.length ? pictures[pictures.length - 1] : null;
  const icon = pictures.length > 1 ? pictures[0] : null;
  const [description, eyebrow] = paragraphs
    .filter((p) => !pictures.includes(p) && !p.contains(action));
  if (!heading || !action) return;

  const copy = document.createElement('div');
  copy.className = 'newsletter-copy';
  copy.append(heading);
  if (description) copy.append(description);

  const signup = document.createElement('div');
  signup.className = 'newsletter-signup';
  if (eyebrow) {
    eyebrow.classList.add('newsletter-eyebrow');
    const iconImage = icon?.querySelector('img');
    if (iconImage) {
      useImage(eyebrow, '--eyebrow-icon', iconImage);
      eyebrow.classList.add('has-icon');
    }
    signup.append(eyebrow);
  }
  icon?.remove();

  const url = new URL(action.href);
  const form = document.createElement('form');
  form.action = `${url.origin}${url.pathname}`;
  form.method = 'get';
  url.searchParams.forEach((value, name) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = value;
    form.append(hidden);
  });
  const input = document.createElement('input');
  input.type = 'email';
  input.name = 'email';
  input.required = true;
  input.autocomplete = 'email';
  input.placeholder = 'Enter your email to sign up';
  input.setAttribute('aria-label', input.placeholder);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.setAttribute('aria-label', action.textContent.trim());
  form.append(input, submit);
  signup.append(form);

  if (art) art.classList.add('newsletter-art');
  action.closest('p').remove();
  wrapper.prepend(copy, signup);
}

/**
 * The authored logo image becomes the faint watermark behind the footer links, and each authored
 * social image becomes its link's icon (CSS mask). The logo link and the social link text stay in
 * the DOM for assistive technology.
 * @param {Element} section The footer brand section
 */
function decorateBrand(section) {
  const logo = section.querySelector(':scope p img');
  if (logo) {
    useImage(section, '--footer-watermark', logo);
    section.classList.add('has-watermark');
  }

  section.querySelectorAll(':scope ul li').forEach((item) => {
    const link = item.querySelector('a');
    const icon = item.querySelector('img');
    if (!link || !icon) return;
    link.classList.add('social');
    const label = document.createElement('span');
    label.textContent = link.textContent.trim();
    link.replaceChildren(label);
    icon.alt = '';
    useImage(link, '--social-icon', icon);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) throw new Error(`Unable to load footer fragment: ${footerPath}`);
  if (fragment.querySelector('.newsletter')) {
    block.classList.add('hershey-footer');
    await loadHersheyTheme();
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  if (block.classList.contains('hershey-footer')) {
    const newsletter = footer.querySelector('.newsletter');
    if (newsletter) decorateNewsletter(newsletter);
    const brand = footer.querySelector('.footer-brand');
    if (brand) decorateBrand(brand);
  }

  block.append(footer);
}
