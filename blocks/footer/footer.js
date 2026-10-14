const SUBMIT_TEXT = /submit|sign\s*up|subscribe/i;

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content (local preview) first, then the site root (DA/EDS production).
 * @returns {Promise<{body: HTMLElement, base: string}|null>}
 */
async function fetchFooter() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return { body: doc.body, base: resp.url || window.location.href };
}

/**
 * Resolves relative image paths against the fragment URL, so
 * "images/x.svg" in /content/footer.plain.html becomes /content/images/x.svg.
 * @param {HTMLElement} root fragment root
 * @param {string} base fragment URL
 */
function rebaseImages(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || /^(https?:|data:|\/)/i.test(src)) return;
    const url = new URL(src, base);
    img.setAttribute('src', url.pathname + url.search);
  });
}

/**
 * Paragraph containing only one image (decorative / artwork).
 * @param {Element} p
 */
function isImageOnly(p) {
  return p.tagName === 'P' && p.children.length === 1
    && p.firstElementChild.tagName === 'IMG' && !p.textContent.trim();
}

/**
 * Marks image-only paragraphs as media so CSS can position them.
 * @param {Element} band
 */
function decorateMedia(band) {
  [...band.querySelectorAll(':scope > p')].filter(isImageOnly).forEach((p, i) => {
    p.classList.add('footer-media', `footer-media-${i + 1}`);
    const img = p.querySelector('img');
    img.loading = 'lazy';
    if (!img.alt) img.setAttribute('aria-hidden', 'true');
  });
}

/**
 * Builds a newsletter form from an authored "Submit" link.
 * The preceding plain paragraph is the input placeholder; a paragraph with an
 * icon before that becomes the visible label. Query params become hidden fields.
 * @param {Element} band
 */
function decorateNewsletter(band) {
  const cta = [...band.querySelectorAll(':scope > p')].find((p) => {
    const a = p.querySelector('a');
    return a && p.children.length === 1 && SUBMIT_TEXT.test(a.textContent);
  });
  if (!cta) return;
  const link = cta.querySelector('a');
  const url = new URL(link.href, window.location.href);
  const placeholderP = cta.previousElementSibling;
  const hasPlaceholder = placeholderP && placeholderP.tagName === 'P'
    && !placeholderP.querySelector('a, img') && placeholderP.textContent.trim();
  const labelP = hasPlaceholder ? placeholderP.previousElementSibling : cta.previousElementSibling;
  const hasLabel = labelP && labelP.tagName === 'P' && labelP.querySelector('img')
    && labelP.textContent.trim();

  const form = document.createElement('form');
  form.className = 'footer-newsletter';
  form.method = 'post';
  form.action = url.pathname;
  url.searchParams.forEach((value, name) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = value;
    form.append(hidden);
  });

  const inputId = 'footer-newsletter-email';
  const label = document.createElement('label');
  label.className = 'footer-newsletter-label';
  label.htmlFor = inputId;
  if (hasLabel) {
    const icon = labelP.querySelector('img');
    icon.setAttribute('aria-hidden', 'true');
    label.append(icon, document.createTextNode(labelP.textContent.trim()));
    labelP.remove();
  }

  const field = document.createElement('div');
  field.className = 'footer-newsletter-field';
  const input = document.createElement('input');
  input.type = 'email';
  input.name = 'email';
  input.id = inputId;
  input.required = true;
  input.autocomplete = 'email';
  if (hasPlaceholder) {
    input.placeholder = placeholderP.textContent.trim();
    placeholderP.remove();
  }
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'footer-newsletter-submit';
  submit.setAttribute('aria-label', link.textContent.trim());
  field.append(input, submit);

  form.append(label, field);
  cta.replaceWith(form);
  band.classList.add('footer-band-signup');
}

/**
 * Lists whose items are all image links become icon lists; the image is
 * rendered as a CSS mask so the icon follows the link color (hover states).
 * Other lists are plain link lists.
 * @param {Element} band
 */
function decorateLists(band) {
  band.querySelectorAll(':scope > ul').forEach((ul) => {
    const items = [...ul.children];
    const iconList = items.length && items.every((li) => {
      const a = li.querySelector('a');
      return a && a.querySelector('img') && !a.textContent.trim();
    });
    if (!iconList) {
      ul.classList.add('footer-links');
      return;
    }
    ul.classList.add('footer-social');
    items.forEach((li) => {
      const a = li.querySelector('a');
      const img = a.querySelector('img');
      const icon = document.createElement('span');
      icon.className = 'footer-social-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.setProperty('--icon', `url("${img.getAttribute('src')}")`);
      a.setAttribute('aria-label', img.alt);
      a.title = img.alt;
      img.replaceWith(icon);
    });
  });
}

/**
 * "#" links open the consent manager's preference center when one is present.
 * @param {Element} footer
 */
function decorateConsentLinks(footer) {
  footer.querySelectorAll('a[href="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.OneTrust && typeof window.OneTrust.ToggleInfoDisplay === 'function') {
        window.OneTrust.ToggleInfoDisplay();
      }
    });
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;
  rebaseImages(fragment.body, fragment.base);

  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  [...fragment.body.children].filter((el) => el.tagName === 'DIV').forEach((section, i, all) => {
    section.classList.add('footer-band', `footer-band-${i + 1}`);
    if (i === all.length - 1 && all.length > 1) section.classList.add('footer-band-legal');
    decorateMedia(section);
    decorateNewsletter(section);
    decorateLists(section);
    footer.append(section);
  });
  decorateConsentLinks(footer);
  block.append(footer);
}
