/*
 * `Cards (flip, slider)`: cards that turn over when clicked, as the SOUR STRIPS flavours do on
 * hersheyland.com/brands/sourstrips. Authored like any card (picture, then a title, copy and a
 * button); the front shows the picture large with a flip icon, the back the picture small over the
 * title, copy and button. A card may carry two pictures in its picture cell: the first is the
 * front, the second the back. Clicking the back (outside its button) turns the card back again.
 */

/**
 * Turns a card over, moving focus to the face now showing.
 * @param {Element} card The card (li)
 * @param {boolean} open Show the back
 */
function flip(card, open) {
  card.classList.toggle('cards-flip-open', open);
  const front = card.querySelector('.cards-flip-front');
  const back = card.querySelector('.cards-flip-back');
  front.setAttribute('aria-expanded', String(open));
  front.inert = open;
  back.inert = !open;
  (open ? back.querySelector('.cards-flip-close') : front).focus({ preventScroll: true });
}

/**
 * Builds the two faces of each card.
 * @param {Element} list The cards list (ul)
 */
export default function decorateFlip(list) {
  [...list.children].forEach((card) => {
    const [first, second] = card.querySelectorAll('picture');
    const heading = card.querySelector('h2, h3, h4');
    const body = heading?.closest('li > div');
    const title = heading?.textContent.trim() || '';

    const front = document.createElement('button');
    front.type = 'button';
    front.className = 'cards-flip-front';
    front.setAttribute('aria-label', `Reveal ${title}'s information`);
    front.setAttribute('aria-expanded', 'false');
    if (first) front.append(second ? first : first.cloneNode(true));
    // a front picture of its own is the whole face
    if (second) front.classList.add('cards-flip-front-art');
    const icon = document.createElement('span');
    icon.className = 'cards-flip-icon';
    front.append(icon);

    const back = document.createElement('div');
    back.className = 'cards-flip-back';
    back.inert = true;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'cards-flip-close';
    close.setAttribute('aria-label', `Hide ${title}'s information`);
    back.append(close);
    if (second || first) back.append(second || first);
    if (body) {
      body.className = 'cards-card-body';
      back.append(body);
    }

    const inner = document.createElement('div');
    inner.className = 'cards-flip-inner';
    inner.append(front, back);
    card.replaceChildren(inner);

    front.addEventListener('click', () => flip(card, true));
    close.addEventListener('click', () => flip(card, false));
    back.addEventListener('click', (event) => {
      if (!event.target.closest('a, button')) flip(card, false);
    });
  });
}
