import decorateHero from '@adobe/aem-boilerplate/blocks/hero/hero.js';
import '@adobe/aem-boilerplate/blocks/hero/hero.css';
import '@adobe/aem-boilerplate/blocks/hero/hero-product.css';
import '@adobe/aem-boilerplate/blocks/hero/hero-article.css';
import '@adobe/aem-boilerplate/blocks/hero/hero-brand.css';
import '@adobe/aem-boilerplate/blocks/hero/hero-marquee.css';
import '@adobe/aem-boilerplate/blocks/hero/hero-video.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

function renderDefault({ heading, copy, showImage }) {
  const root = createPage('Blocks', 'Hero');
  const main = showcase(root);
  const hero = element('div', 'hero block');
  const row = element('div');
  const image = element('div');
  if (showImage) image.append(picture('Hero', 1440, 640));
  const content = element('div');
  content.append(element('h1', '', heading), element('p', '', copy));
  row.append(image, content);
  hero.append(row);
  section(main, hero, 'hero-container');
  return root;
}

function renderRecipe({ heading, copy, showImage }) {
  const root = createPage('Blocks', 'Hero');
  const main = showcase(root);
  const hero = element('div', 'hero recipe block');
  const imageRow = element('div');
  const imageCell = element('div');
  if (showImage) imageCell.append(picture(heading || 'Recipe', 1600, 900));
  imageRow.append(imageCell);
  const textRow = element('div');
  const textCell = element('div');
  const category = element('p');
  category.append(link('Desserts'));
  textCell.append(
    category,
    element('h1', '', heading),
    element('p', '', 'Skill Level: Beginner'),
    element('p', '', copy),
  );
  textRow.append(textCell);
  hero.append(imageRow, textRow);
  decorateHero(hero);
  section(main, hero, 'hero-container');
  return root;
}

export default {
  title: 'Blocks/Hero',
  args: { heading: 'Make life a little sweeter', copy: 'Discover something worth sharing.', showImage: true },
  argTypes: contentArgTypes,
  parameters: {
    docs: { description: { component: 'Production Hero CSS and decorator. The default treatment leaves authored content in place. Hero (Recipe) rebuilds the category, title, skill level, share bar, and image. Controls edit text and optional imagery. Check contrast over images and heading order with Accessibility. Share actions log activate or navigate.' } },
  },
  render: renderDefault,
};
export const Default = {};
export const WithoutImage = { args: { showImage: false } };
export const Recipe = {
  args: {
    heading: "Reese's Oreo Cup Brownies",
    copy: 'A fudgy brownie layered with peanut butter cups and chocolate cookies.',
  },
  render: renderRecipe,
};

/**
 * hero.js lazy-loads `hero-<variant>.css` from the code base path. Storybook imports those
 * stylesheets statically above, so a disabled placeholder link makes aem.js's loadCSS resolve
 * without a request to a path Storybook does not serve.
 */
function markStylesheetLoaded(variant) {
  const href = `/blocks/hero/hero-${variant}.css`;
  if (document.head.querySelector(`link[href="${href}"]`)) return;
  const placeholder = element('link');
  placeholder.rel = 'stylesheet';
  placeholder.href = href;
  placeholder.disabled = true;
  document.head.append(placeholder);
}

function cell(...nodes) {
  const div = element('div');
  div.append(...nodes);
  return div;
}

/** Renders `Hero (<classes>)` with the given rows (arrays of cells), as the backend delivers it. */
function renderVariant(classes, rows, { note, sectionStyle = '' } = {}) {
  const variant = classes.split(' ')[0];
  markStylesheetLoaded(variant);
  const root = createPage('Blocks', 'Hero', note || `Hero (${classes.replace(/ /g, ', ')})`);
  const main = showcase(root);
  const hero = element('div', `hero ${classes} block`);
  rows.forEach((cells) => {
    const row = element('div');
    cells.forEach((c) => row.append(c));
    hero.append(row);
  });
  const container = section(main, hero, `hero-container ${sectionStyle}`.trim());
  decorateHero(hero);
  return { root, container };
}

function paragraph(text) {
  return element('p', '', text);
}

/** `Hero (product)`: all fields authored, so nothing is read from the product master sheet. */
export const Product = {
  render: () => {
    const field = (name, ...nodes) => [element('div', '', name), cell(...nodes)];
    const sizes = element('ul');
    ['5 oz', '10 oz'].forEach((size, i) => {
      const li = element('li');
      if (i === 0) li.append(element('strong', '', size)); else li.append(link(size, '#size'));
      sizes.append(li);
    });
    const cta = paragraph('');
    cta.append(link('Shop Now', '/where-to-buy'));
    return renderVariant('product', [
      field('label', paragraph('Limited Edition')),
      field('image-front', picture('Front', 800, 800)),
      field('image-back', picture('Back', 800, 800)),
      field('Title', paragraph('HERSHEY’S Milk Chocolate Bar')),
      field('Description', paragraph('Smooth, creamy milk chocolate.')),
      field('size', sizes),
      field('button', cta),
    ], { note: 'Hero (product) with every field authored. The sheet fallback and the rating need page metadata and network, so they are not shown.' }).root;
  },
};

/** `Hero (article)`: story image, h1 title and a "Published:" date. Band colour via Style. */
export const Article = {
  args: { style: '' },
  argTypes: {
    style: {
      control: 'select',
      options: ['', 'blue', 'purple', 'lime', 'gold', 'brown', 'navy', 'plum'],
      description: 'Section Metadata Style: the band colour.',
    },
  },
  render: ({ style }) => renderVariant('article', [[
    cell(picture('Story', 1200, 800)),
    cell(element('h1', '', 'How a Sweet Idea Became a Tradition'), paragraph('Published: June 3, 2025')),
  ]], { sectionStyle: style }).root,
};

/** Adds the <source> elements the backend delivers: a wide one, then the plain fallback. */
function withSources(pic) {
  const { src } = pic.querySelector('img');
  [['(min-width: 600px)', 1200], [undefined, 750]].forEach(([media, width]) => {
    const source = element('source');
    if (media) source.media = media;
    source.srcset = `${src}&width=${width}`;
    pic.prepend(source);
  });
  return pic;
}

function brandCells({ logo = true, photo = true }) {
  return [
    photo ? cell(picture('Brand photo', 1200, 1200)) : cell(),
    cell(
      ...(logo ? [picture('Logo', 400, 200)] : []),
      element('h1', '', 'Symphony'),
      paragraph('Smooth milk chocolate, made for sharing.'),
    ),
  ];
}

/** `Hero (brand)`: tan panel with logo, title and intro beside the brand photo. */
export const Brand = {
  render: () => renderVariant('brand', [brandCells({})], {
    note: 'Hero (brand). The panel colour comes from a brand theme, which Storybook does not load.',
  }).root,
};

/**
 * `Hero (brand)` with two photos in the image cell: the first shows from 992px, the second below.
 * The block folds the second into the first as <source> elements; resize the canvas to compare.
 */
export const BrandMobilePhoto = {
  render: () => renderVariant('brand', [[
    cell(picture('Desktop photo', 1200, 1200), withSources(picture('Mobile photo', 800, 1000))),
    cell(
      picture('Logo', 400, 200),
      element('h1', '', 'Symphony'),
      paragraph('Smooth milk chocolate, made for sharing.'),
    ),
  ]]).root,
};

/** `Hero (brand, square)`: square photo; from 992px the photo half is 740px tall. */
export const BrandSquare = { render: () => renderVariant('brand square', [brandCells({})]).root };

/** `Hero (brand, square, overlap)`: below 992px the title rises over the photo. */
export const BrandSquareOverlap = {
  render: () => renderVariant('brand square overlap', [brandCells({})]).root,
};

/** `Hero (brand)` with no logo and no photo cell content: the block leaves them out. */
export const BrandMissingParts = {
  render: () => renderVariant('brand', [brandCells({ logo: false, photo: false })]).root,
};

/** `Hero (marquee)`: scrolling ticker rows behind a logo, intro and product photo. */
export const Marquee = {
  render: () => renderVariant('marquee', [[
    cell(picture('Logo', 600, 300), paragraph('Two favorites, one cup. Try them today.')),
    cell(picture('Product', 900, 900)),
  ]]).root,
};

/** `Hero (marquee, band)`: rows of one wide strip, linked from /icons as authored on /hersheys. */
export const MarqueeBand = {
  render: () => {
    const cta = paragraph('');
    cta.append(link('Tastes like good memories', '/icons/hersheys-tastes-like-good-memories.svg'));
    return renderVariant('marquee band', [[cell(cta)]]).root;
  },
};

// a tiny placeholder: the link only has to look like an .mp4; nothing is requested from a network
const FIXTURE_VIDEO = 'data:video/mp4;base64,AAAA#fixture.mp4';

/**
 * `Hero (video)`: eyebrow, title and intro over a looping muted video with a pause/play button.
 * The video is a placeholder that cannot play, so the poster stays visible.
 */
export const Video = {
  render: () => {
    const videoLink = paragraph('');
    videoLink.append(link(FIXTURE_VIDEO, FIXTURE_VIDEO));
    return renderVariant('video', [[
      cell(videoLink, picture('Poster', 1600, 900)),
      cell(paragraph('Since 1894'), element('h1', '', 'Our History'), paragraph('A look back at the company and its founder.')),
    ]], { note: 'Hero (video) with a poster. The mp4 is a non-playing placeholder: motion cannot be shown offline.' }).root;
  },
};
