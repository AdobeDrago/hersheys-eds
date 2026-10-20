const SUBMIT_TEXT = /submit|sign\s*up|subscribe/i;
const DEFAULT_PLACEHOLDER = 'Enter your email to sign up';
// social networks rendered as /icons/<name>.svg; value = icon width at 24 height (aspect ratio)
const SOCIAL_ICONS = {
  instagram: 21, tiktok: 21, youtube: 27, facebook: 24, pinterest: 23,
};

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
 * DA wraps images in <picture>, and linked images in <a>.
 * @param {Element} p
 */
function isImageOnly(p) {
  if (p.tagName !== 'P' || p.children.length !== 1 || p.textContent.trim()) return false;
  let el = p.firstElementChild;
  if (el.tagName === 'A' && el.children.length === 1) el = el.firstElementChild;
  return el.tagName === 'IMG' || el.tagName === 'PICTURE';
}

/**
 * Marks image-only paragraphs as media so CSS can position them.
 * @param {Element} band
 */
function decorateMedia(band) {
  const media = [...band.querySelectorAll(':scope > p')].filter(isImageOnly);
  // a sign-up band with a single image only carries the Kisses art (the wave is then CSS)
  const first = band.classList.contains('footer-band-signup') && media.length === 1 ? 2 : 1;
  media.forEach((p, i) => {
    p.classList.add('footer-media', `footer-media-${first + i}`);
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
  // DA footer authors only the label text: it gets the envelope icon and a default placeholder
  const textOnlyLabel = hasPlaceholder && !hasLabel;

  const form = document.createElement('form');
  form.className = 'footer-newsletter';
  form.method = 'post';
  form.action = `${url.origin}${url.pathname}`;
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
  } else if (textOnlyLabel) {
    const icon = document.createElement('img');
    icon.src = `${window.hlx.codeBasePath}/icons/envelope.svg`;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    label.append(icon, document.createTextNode(placeholderP.textContent.trim()));
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
    input.placeholder = textOnlyLabel ? DEFAULT_PLACEHOLDER : placeholderP.textContent.trim();
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
 * Known social network of a link, by hostname.
 * @param {HTMLAnchorElement} a
 * @returns {string|undefined} network name
 */
function socialNetwork(a) {
  const { hostname } = new URL(a.href, window.location.href);
  return Object.keys(SOCIAL_ICONS).find((name) => hostname.includes(`${name}.com`));
}

/**
 * Lists whose items are all image links (or text links to known social
 * networks) become icon lists; the image is rendered as a CSS mask so the
 * icon follows the link color (hover states). Other lists are plain link lists.
 * @param {Element} band
 */
function decorateLists(band) {
  band.querySelectorAll(':scope > ul').forEach((ul) => {
    const items = [...ul.children];
    const iconList = items.length && items.every((li) => {
      const a = li.querySelector('a');
      return a && ((a.querySelector('img') && !a.textContent.trim()) || socialNetwork(a));
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
      if (img) {
        icon.style.setProperty('--icon', `url("${img.getAttribute('src')}")`);
        a.setAttribute('aria-label', img.alt);
        a.title = img.alt;
        img.replaceWith(icon);
        return;
      }
      // DA footer authors the network name as link text
      const name = socialNetwork(a);
      const label = a.textContent.trim();
      icon.style.setProperty('--icon', `url("${window.hlx.codeBasePath}/icons/${name}.svg")`);
      icon.style.aspectRatio = `${SOCIAL_ICONS[name]} / 24`;
      a.setAttribute('aria-label', label);
      a.title = label;
      a.replaceChildren(icon);
    });
  });
}

/**
 * Splits a band's single long link list into two columns (source layout).
 * @param {Element} band
 */
function splitLinkColumns(band) {
  const lists = band.querySelectorAll(':scope > ul.footer-links');
  if (lists.length !== 1 || lists[0].children.length < 4) return;
  const [list] = lists;
  const column = list.cloneNode(false);
  column.append(...[...list.children].slice(Math.ceil(list.children.length / 2)));
  list.after(column);
}

/**
 * Merges link-only sections into the preceding band: the DA footer authors
 * the corporate links as their own section, but they share the social band.
 * @param {Element[]} sections footer fragment sections
 * @returns {Element[]} bands
 */
function groupBands(sections) {
  return sections.reduce((bands, section, i) => {
    const linksOnly = i > 1 && i < sections.length - 1
      && [...section.children].every((el) => el.tagName === 'UL');
    if (linksOnly) bands[bands.length - 1].append(...section.children);
    else bands.push(section);
    return bands;
  }, []);
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
  const sections = [...fragment.body.children].filter((el) => el.tagName === 'DIV');
  groupBands(sections).forEach((section, i, all) => {
    section.classList.add('footer-band', `footer-band-${i + 1}`);
    const legal = i === all.length - 1 && all.length > 1;
    if (legal) section.classList.add('footer-band-legal');
    decorateNewsletter(section);
    decorateMedia(section);
    decorateLists(section);
    if (!legal) splitLinkColumns(section);
    footer.append(section);
  });
  decorateConsentLinks(footer);
  block.append(footer);
}
