// the silver rim and the centre kiss frame every wheel; they are decoration, not authored content
const RIM = `${window.hlx.codeBasePath}/icons/kisses-wheel-rim.webp`;
const CENTER = `${window.hlx.codeBasePath}/icons/kisses-wheel-center.svg`;
// spin timings measured on hersheyland.com/brands/kisses
const WINDUP_DEGREES = 24;
const WINDUP_MS = 1000;
const SPIN_MS = 4800;
const SPINS = 5;
const SPIN_EASING = 'cubic-bezier(0.15, 0.6, 0.1, 1)';
const LABELS = {
  spin: 'Spin the Wheel',
  spinning: 'Spinning…',
  again: 'Take Another Spin',
  kicker: 'WHY NOT TRY:',
};

const mod360 = (value) => ((value % 360) + 360) % 360;
const turn = (deg) => `translate(-50%, -50%) rotate(${deg}deg)`;

function decorImage(className, src) {
  const img = document.createElement('img');
  img.className = className;
  img.src = src;
  img.alt = '';
  img.loading = 'lazy';
  return img;
}

/**
 * Sorts the authored rows: the copy (heading and text), the wheel artwork (a picture on its own)
 * and the flavors (a picture and a link).
 * @param {Element} block The cards block
 */
function readRows(block) {
  const copy = [];
  let wheel = null;
  const flavors = [];
  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    const link = row.querySelector('a[href]');
    if (picture && link) {
      flavors.push({ picture, name: link.textContent.trim(), href: link.href });
    } else if (picture && !wheel) {
      wheel = picture;
    } else {
      copy.push(...[...row.querySelectorAll(':scope > div > *')]);
    }
  });
  return { copy, wheel, flavors };
}

/**
 * Cards (wheel) variant, loaded by cards.js for `Cards (wheel)`: a flavor wheel that spins to a
 * random wedge and shows its product, as "Which KISSES Will You Try Next?" on /kisses.
 *
 * Authored rows: the copy (heading and text), the wheel artwork (a picture on its own, the
 * wedges drawn on it), then one row per wedge with the product picture and a link to the
 * product, clockwise from the wedge just right of the top.
 * @param {Element} block The cards block
 */
export default function decorate(block) {
  const { copy, wheel, flavors } = readRows(block);
  if (!wheel || !flavors.length) return;
  const wedge = 360 / flavors.length;
  // the clockwise turn that brings each wedge's centre to the top
  const angles = flavors.map((_, index) => mod360(360 - (index + 0.5) * wedge));

  const copyBox = document.createElement('div');
  copyBox.className = 'cards-wheel-copy';
  copyBox.append(...copy);

  const stage = document.createElement('div');
  stage.className = 'cards-wheel-stage';
  const art = wheel.querySelector('img');
  art.classList.add('cards-wheel-art');
  art.loading = 'lazy';
  art.style.transform = turn(0);
  wheel.classList.add('cards-wheel-art-wrap');

  const result = document.createElement('div');
  result.className = 'cards-wheel-result';
  result.setAttribute('aria-live', 'polite');
  const resultImage = document.createElement('div');
  resultImage.className = 'cards-wheel-result-image';
  const kicker = document.createElement('p');
  kicker.className = 'cards-wheel-kicker';
  kicker.textContent = LABELS.kicker;
  const resultLink = document.createElement('a');
  resultLink.className = 'cards-wheel-result-name';
  result.append(resultImage, kicker, resultLink);
  stage.append(decorImage('cards-wheel-rim', RIM), wheel, decorImage('cards-wheel-center', CENTER), result);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cards-wheel-button';
  button.textContent = LABELS.spin;

  let rotation = 0;
  const run = async (from, to, duration, easing) => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
    const animation = art.animate([{ transform: turn(from) }, { transform: turn(to) }], { duration: motion, easing, fill: 'forwards' });
    await animation.finished;
    art.style.transform = turn(to);
    animation.cancel();
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = LABELS.spinning;
    stage.classList.remove('show-result');
    const index = Math.floor(Math.random() * flavors.length);
    const windup = rotation - WINDUP_DEGREES;
    await run(rotation, windup, WINDUP_MS, 'ease-in-out');
    let target = windup + SPINS * 360;
    target += mod360(angles[index] - mod360(target));
    // land anywhere inside the wedge, never on its edges
    target += (Math.random() - 0.5) * wedge * 0.73;
    await run(windup, target, SPIN_MS, SPIN_EASING);
    rotation = target;

    const flavor = flavors[index];
    const picture = flavor.picture.cloneNode(true);
    picture.querySelector('img').loading = 'eager';
    resultImage.replaceChildren(picture);
    resultLink.textContent = flavor.name;
    resultLink.href = flavor.href;
    stage.classList.add('show-result');
    button.disabled = false;
    button.textContent = LABELS.again;
  });

  block.replaceChildren(copyBox, stage, button);
}
