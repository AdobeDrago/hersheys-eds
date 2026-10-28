function button(label, name) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `social-share-${name}`;
  btn.setAttribute('aria-label', label);
  const icon = document.createElement('span');
  icon.className = `social-share-icon social-share-icon-${name}`;
  icon.setAttribute('aria-hidden', 'true');
  btn.append(icon);
  return btn;
}

async function copyUrl(btn) {
  try {
    await navigator.clipboard.writeText(window.location.href);
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1500);
  } catch (e) {
    // clipboard blocked: the page URL is still in the address bar
  }
}

/**
 * Share pill: opens the device share sheet and copies the page URL.
 * Takes no authored content.
 * @param {Element} block
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'social-share-nav';
  nav.setAttribute('aria-label', 'Share this page');

  const share = button('Share', 'share');
  share.addEventListener('click', async () => {
    const data = { title: document.title.split('|')[0].trim(), url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (e) {
        // share sheet dismissed
      }
    } else {
      copyUrl(share);
    }
  });

  const divider = document.createElement('span');
  divider.className = 'social-share-divider';
  divider.setAttribute('aria-hidden', 'true');

  const copy = button('Copy URL', 'link');
  copy.addEventListener('click', () => copyUrl(copy));

  nav.append(share, divider, copy);
  block.replaceChildren(nav);
}
