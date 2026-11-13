import decorateColumns from '@adobe/aem-boilerplate/blocks/columns/columns.js';
import '@adobe/aem-boilerplate/blocks/columns/columns.css';
import '@adobe/aem-boilerplate/blocks/columns/columns-brand.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

export default {
  title: 'Blocks/Columns',
  args: { heading: 'A favorite for every moment', copy: 'A little sweetness brings us together.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'Production Columns decorator and CSS. Two authored cells stack on mobile. Controls edit copy and the optional image; links log in Actions. Check reading order and image alternatives with Accessibility and keyboard navigation.' } },
  },
  render: ({ heading, copy, showImage }) => {
    const root = createPage('Blocks', 'Columns');
    const main = showcase(root);
    const columns = element('div', 'columns feature block');
    const row = element('div');
    const content = element('div');
    content.append(element('h2', '', heading), element('p', '', copy));
    const cta = element('p');
    cta.append(link('Discover favorites', undefined, 'button'));
    content.append(cta);
    const image = element('div');
    if (showImage) image.append(picture('Made for sharing'));
    else image.append(element('h3', '', 'Made for sharing'), element('p', '', copy));
    row.append(content, image);
    columns.append(row);
    decorateColumns(columns);
    section(main, columns);
    return root;
  },
};

export const Feature = {};
export const TextOnly = { args: { showImage: false } };

/* ---- variants authored on brand and story pages ---- */

const nodeOf = (tag, text) => element(tag, '', text);

function linkP(label, wrap, href) {
  const p = element('p');
  const a = link(label, href, wrap === 'button' ? 'button' : '');
  if (wrap === 'strong' || wrap === 'em') {
    const inner = element(wrap);
    inner.append(a);
    p.append(inner);
  } else p.append(a);
  return p;
}

function cellOf(...nodes) {
  const div = element('div');
  div.append(...nodes);
  return div;
}

function list(tag, items) {
  const node = element(tag);
  items.forEach((text) => node.append(nodeOf('li', text)));
  return node;
}

/**
 * Renders `Columns (<classes>)` as authored: one row per entry of `rows`, each an array of
 * cells. `intro` becomes the band's default-content heading, as on brand pages.
 */
function renderVariant(classes, rows, { intro, note } = {}) {
  const root = createPage('Blocks', 'Columns', note || `Columns (${classes.replace(/ /g, ', ')}), as authored.`);
  const main = showcase(root);
  const columns = element('div', `columns ${classes} block`);
  rows.forEach((cells) => {
    const row = element('div');
    row.append(...cells);
    columns.append(row);
  });
  const container = section(main, columns, 'columns-container');
  if (intro) {
    const head = element('div', 'default-content-wrapper');
    head.append(nodeOf('h2', intro));
    container.prepend(head);
  }
  // columns-brand.css is imported above; the decorator's own loadCSS URL is not served here
  decorateColumns(columns).catch(() => {});
  return root;
}

const COPY = 'Milton Hershey built a town around chocolate, and the story still shapes how we make it.';

/** `Columns (homepage-hero)`: copy beside a desktop and a mobile picture merged into one. */
export const HomepageHero = {
  render: () => renderVariant('homepage-hero', [[
    cellOf(nodeOf('h1', 'Every moment is sweeter'), nodeOf('p', COPY), linkP('Explore', 'button')),
    cellOf(picture('Desktop hero', 1200, 700), picture('Mobile hero', 600, 700)),
  ]]),
};

/** `Columns (fact)`: a “Did You Know?” quick fact, illustration beside heading and copy. */
export const Fact = {
  render: () => renderVariant('fact', [[
    cellOf(picture('Illustration', 1200, 675)),
    cellOf(nodeOf('h3', 'Did you know?'), nodeOf('p', COPY)),
  ]]),
};

/** `Columns (callout)`: wide image beside centred text with a pill button and a text link. */
export const Callout = {
  render: () => renderVariant('callout', [[
    cellOf(picture('Callout', 1200, 800)),
    cellOf(
      nodeOf('h2', 'Bake something new'),
      nodeOf('p', COPY),
      linkP('Get the recipe', 'strong'),
      linkP('See all recipes', 'em'),
    ),
  ]]),
};

/** `Columns (article)`: eyebrow, heading, copy, button and text link beside a framed photo. */
export const Article = {
  render: () => renderVariant('article', [[
    cellOf(
      nodeOf('p', 'S’MORES'),
      nodeOf('h2', 'A campfire classic'),
      nodeOf('p', COPY),
      linkP('Read more', 'strong'),
      linkP('More ideas', 'em'),
    ),
    cellOf(picture('Article photo', 1000, 800)),
  ]]),
};

/**
 * `Columns (video)`: poster with a play button beside a story box. The story does not click
 * play, so no request reaches YouTube.
 */
export const Video = {
  render: () => renderVariant('video', [[
    cellOf(picture('Video poster', 1200, 675), linkP('Watch the video', undefined, 'https://www.youtube.com/watch?v=VIDEO_ID')),
    cellOf(nodeOf('h3', 'PINKY UP. Flavor On.'), nodeOf('p', COPY)),
  ]], { intro: 'Watch the story' }),
};

/**
 * `Columns (video, player)`: the .mp4 link becomes a video player in place of the poster. An
 * .mp4 is used so nothing reaches YouTube; the file does not exist, so the player stays empty.
 */
export const VideoPlayer = {
  render: () => renderVariant('video player', [[
    cellOf(picture('Video poster', 1200, 675), linkP('Watch the video', undefined, '/story-trailer.mp4')),
    cellOf(nodeOf('h3', 'The HERSHEY\'S trailer'), nodeOf('p', COPY)),
  ]], { intro: 'Watch the story' }),
};

const quote = (before, highlight, after) => {
  const p = element('p');
  p.append(before, element('strong', '', highlight), after);
  return cellOf(p, nodeOf('p', '- A happy fan'));
};

/** `Columns (quotes)`: italic quotes; the first row holds one, later rows sit side by side. */
export const Quotes = {
  render: () => renderVariant('quotes', [
    [quote('“I could not stop eating ', 'every single bite', ' of it.”')],
    [
      quote('“The ', 'creamy center', ' is perfect.”'),
      quote('“A treat my whole ', 'family loves', '.”'),
    ],
  ], { intro: 'What People Are Saying' }),
};

/** `Columns (blog)`: a grey story box with stacked photos beside eyebrow, heading and story. */
export const Blog = {
  render: () => renderVariant('blog', [[
    cellOf(picture('Photo one', 800, 600), picture('Photo two', 800, 600)),
    cellOf(nodeOf('p', 'OUR STORY'), nodeOf('h2', 'How it all got started'), nodeOf('p', COPY), nodeOf('p', COPY)),
  ]]),
};

/** `Columns (blobs)`: heading on a blob, a photo, then copy on a second blob (three cells). */
export const Blobs = {
  render: () => renderVariant('blobs', [[
    cellOf(nodeOf('h2', 'A name with a rich history')),
    cellOf(picture('Photo', 800, 800)),
    cellOf(nodeOf('p', COPY)),
  ]]),
};

/** `Columns (activity)`: story-page text with a pill button and indented lists beside an image. */
export const Activity = {
  render: () => renderVariant('activity', [[
    cellOf(
      nodeOf('h3', 'What you need'),
      list('ul', ['2 cups flour', '1 bar chocolate']),
      nodeOf('h3', 'Steps'),
      list('ol', ['Mix the batter.', 'Bake for 20 minutes.']),
      linkP('Print the activity', 'button'),
    ),
    cellOf(picture('Activity', 800, 800)),
  ]]),
};

/** `Columns (craft)`: small square image beside top-aligned text. */
export const Craft = {
  render: () => renderVariant('craft', [[
    cellOf(picture('Craft', 600, 600)),
    cellOf(nodeOf('h3', 'Paint the rods'), nodeOf('p', COPY), list('ol', ['Paint.', 'Let dry.'])),
  ]]),
};

/** `Columns (closing)`: a small image beside a wide text column. */
export const Closing = {
  render: () => renderVariant('closing', [[
    cellOf(picture('Closing', 600, 600)),
    cellOf(nodeOf('p', COPY), nodeOf('p', 'Happy making!')),
  ]]),
};

/** `Columns (pair)`: two images side by side. */
export const Pair = {
  render: () => renderVariant('pair', [[
    cellOf(picture('First', 800, 600)),
    cellOf(picture('Second', 800, 600)),
  ]]),
};
function buttonRow(label, className) {
  const row = element('p', 'button-wrapper');
  row.append(link(label, undefined, `button ${className}`));
  return row;
}

function renderPanel({ heading, copy }, variant) {
  const root = createPage('Blocks', 'Columns');
  const main = showcase(root);
  const columns = element('div', `columns article panel ${variant} block`.trim());
  const row = element('div');
  const content = element('div');
  content.append(
    element('p', '', 'Chocolate & Fun'),
    element('h3', '', heading),
    element('p', '', copy),
    buttonRow('Explore Events', 'primary'),
    buttonRow('Plan Your Visit', 'secondary'),
  );
  const image = element('div');
  image.append(picture('Attraction', 592, 377));
  if (variant === 'yellow') row.append(image, content);
  else row.append(content, image);
  columns.append(row);
  decorateColumns(columns);
  section(main, columns);
  return root;
}

export const Panel = { render: (args) => renderPanel(args, '') };
export const PanelYellow = { render: (args) => renderPanel(args, 'yellow') };
export const PanelTan = { render: (args) => renderPanel(args, 'tan') };

/** `Columns (follow)`: copy and social icon links beside a portrait poster that plays an .mp4. */
export const Follow = {
  render: ({ copy }) => {
    const root = createPage('Blocks', 'Columns');
    const main = showcase(root);
    const columns = element('div', 'columns follow block');
    const row = element('div');
    const content = element('div');
    const social = element('p');
    social.append(
      link('TikTok', 'https://www.tiktok.com/@hersheys'),
      link('Instagram', 'https://www.instagram.com/hersheys/'),
      link('YouTube', 'https://www.youtube.com/@hersheys'),
    );
    content.append(element('p', '', copy), social);
    const video = element('div');
    const poster = element('p');
    poster.append(picture('World Kindness Day', 302, 600));
    const play = element('p');
    play.append(link('Play video', '/media/kindness-day.mp4'));
    video.append(poster, play);
    row.append(content, video);
    columns.append(row);
    decorateColumns(columns);
    section(main, columns);
    return root;
  },
};
