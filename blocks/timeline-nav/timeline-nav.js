/**
 * Timeline Nav block: the "Select a Decade" dropdown under the history hero.
 *
 * Content model: a list of links, one per decade (`#1850`, `#1900`, ...). The first
 * paragraph without a link, if any, is the button label (default "Select a Decade").
 * Links to in-page ids scroll to that decade; the menu closes on Escape and on outside click.
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')];
  const label = [...block.querySelectorAll('p')]
    .find((p) => !p.querySelector('a') && p.textContent.trim())?.textContent.trim() || 'Select a Decade';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'timeline-nav-button';
  button.setAttribute('aria-expanded', 'false');
  button.textContent = label;

  const menu = document.createElement('ul');
  menu.className = 'timeline-nav-menu';
  menu.hidden = true;
  // once a decade has been picked, the prompt is also offered as the first choice to clear it
  let chosen = false;
  const none = document.createElement('li');
  none.hidden = true;
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'timeline-nav-reset';
  reset.textContent = label;
  none.append(reset);
  menu.append(none);
  links.forEach((link) => {
    const li = document.createElement('li');
    li.append(link);
    menu.append(li);
  });
  button.setAttribute('aria-haspopup', 'true');

  const toggle = (open) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };
  // as on hersheyland.com: opening shows the prompt again, choosing a decade names it in the
  // button, so scrolling back to the top shows where you are
  button.addEventListener('click', () => {
    if (menu.hidden) {
      button.textContent = label;
      button.classList.remove('selected');
    }
    toggle(menu.hidden);
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.timeline-nav-reset')) {
      button.textContent = label;
      button.classList.remove('selected');
      chosen = false;
      none.hidden = true;
      toggle(false);
      button.focus();
      return;
    }
    const link = e.target.closest('a');
    if (!link) return;
    button.textContent = link.textContent.trim();
    button.classList.add('selected');
    chosen = true;
    none.hidden = false;
    toggle(false);
    // glide from the box to the decade instead of jumping
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
    window.history.pushState(null, '', link.hash);
  });
  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || menu.hidden) return;
    toggle(false);
    button.focus();
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !block.contains(e.target)) toggle(false);
  });

  // sits on the tan band the hero's curved edge leads into
  block.closest('.section')?.classList.add('timeline-nav-section');

  const wrap = document.createElement('div');
  wrap.className = 'timeline-nav-dropdown';
  wrap.append(button, menu);
  block.replaceChildren(wrap);
}
