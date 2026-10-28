const NETWORKS = [
  { name: 'Facebook', icon: 'facebook', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { name: 'Pinterest', icon: 'pinterest', href: (u, t) => `https://pinterest.com/pin/create/button/?url=${u}&description=${t}` },
  { name: 'Email', icon: 'envelope', href: (u) => `mailto:?subject=Check%20out%20this%20page&body=${u}` },
];

function icon(name) {
  const span = document.createElement('span');
  span.className = `social-share-icon social-share-icon-${name}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function button(label, name) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `social-share-${name}`;
  btn.setAttribute('aria-label', label);
  btn.append(icon(name));
  return btn;
}

/**
 * Share pill: a toggle that reveals Facebook, Pinterest, email and print,
 * plus a button that copies the page URL. Takes no authored content.
 * @param {Element} block
 */
export default function decorate(block) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title.split('|')[0].trim());

  const nav = document.createElement('nav');
  nav.className = 'social-share-nav';
  nav.setAttribute('aria-label', 'Share this page');

  const toggle = button('Share', 'share');
  toggle.setAttribute('aria-expanded', 'false');

  const list = document.createElement('ul');
  list.hidden = true;
  NETWORKS.forEach(({ name, icon: iconName, href }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href(url, title);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `${name} (opens in new window)`);
    a.append(icon(iconName));
    li.append(a);
    list.append(li);
  });
  const printLi = document.createElement('li');
  const print = button('Print', 'print');
  print.addEventListener('click', () => window.print());
  printLi.append(print);
  list.append(printLi);

  const copy = button('Copy URL', 'copy');
  copy.querySelector('.social-share-icon').classList.replace('social-share-icon-copy', 'social-share-icon-link');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copy.classList.add('copied');
      setTimeout(() => copy.classList.remove('copied'), 1500);
    } catch (e) {
      // clipboard blocked: the page URL is still in the address bar
    }
  });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    block.classList.toggle('open', open);
  });

  const divider = document.createElement('span');
  divider.className = 'social-share-divider';
  divider.setAttribute('aria-hidden', 'true');

  nav.append(toggle, divider, list, copy);
  block.replaceChildren(nav);
}
