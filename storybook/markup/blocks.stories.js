import decorateCards from '@adobe/aem-boilerplate/blocks/cards/cards.js';
import '@adobe/aem-boilerplate/blocks/cards/cards.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-recipes.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-callout.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-brand.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-brand-slider.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-product.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-quotes.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-steps.css';
import '@adobe/aem-boilerplate/blocks/cards/cards-wheel.css';
import {
  contentArgTypes, createPage, element, link, picture, section, showcase,
} from './story-helpers.js';

function render({
  heading, copy, showImage, count, variant,
}) {
  document.body.classList.remove('hershey-brand');
  const root = createPage('Blocks', 'Cards');
  const main = showcase(root);
  const cards = element('div', `cards ${variant} block`);
  Array.from({ length: count }, (_, index) => index).forEach((index) => {
    const row = element('div');
    if (showImage) {
      const image = element('div');
      image.append(picture(`Favorite ${index + 1}`));
      row.append(image);
    }
    const cell = element('div');
    cell.append(element('h3', '', `${heading} ${index + 1}`), element('p', '', copy));
    const cta = element('p');
    cta.append(link(`Explore favorite ${index + 1}`));
    cell.append(cta);
    row.append(cell);
    cards.append(row);
  });
  decorateCards(cards);
  section(main, cards);
  return root;
}

export default {
  title: 'Blocks/Cards',
  render,
  args: {
    heading: 'A shared favorite', copy: 'Bring something sweet to the table.', showImage: true, count: 3, variant: '',
  },
  argTypes: {
    ...contentArgTypes,
    count: {
      control: {
        type: 'range', min: 1, max: 8, step: 1,
      },
      description: 'Number of authored rows.',
    },
    variant: { control: 'select', options: ['', 'welcome-cards', 'products', 'related', 'social', 'slider', 'callout'], description: 'Production Cards block variant.' },
  },
  parameters: {
    docs: { description: { component: 'Production Cards decorator and CSS with author-shaped image/text rows. Edit optional images, text and row count in Controls. Links log navigate; slider buttons log activate in Actions. Check image alternatives, focus and slider keyboard scrolling in Accessibility and by hand.' } },
  },
};
export const Default = {};
export const Welcome = { args: { variant: 'welcome-cards' } };
export const Products = { args: { variant: 'products' } };
export const Related = { args: { variant: 'related' } };
export const Social = { args: { variant: 'social', count: 4 } };
export const Slider = { args: { variant: 'slider', count: 5 } };
/** `Cards (callout)`: a kiss-dot carousel below 992px, a row of three from 992px. */
export const Callout = { args: { variant: 'callout' } };
export const TextOnly = { args: { showImage: false } };

const RECIPES = [
  { title: 'HERSHEY’S “Perfectly Chocolate” Chocolate Cake', bvID: '3' },
  { title: 'HERSHEY’S Chewy Chocolate Cookies', bvID: '61' },
  { title: 'Peanut Butter Blossoms' },
  { title: 'HERSHEY’S Best Brownies', bvID: '30' },
];

function mockRecommend() {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      results: [{
        hits: RECIPES.map(({ title, bvID }, index) => ({
          objectID: `https://www.hersheyland.com/recipes/recipe-${index + 1}.html`,
          url: { href: `https://www.hersheyland.com/recipes/recipe-${index + 1}.html` },
          hero: { h1: title, image: picture(title).querySelector('img').src },
          metaTags: bvID ? { bvID } : {},
        })),
      }],
    }),
  });
}

/** Empty `Cards (slider, related, recipes)`: cards come from Algolia Recommend (mocked). */
export const RelatedRecipes = {
  render: () => {
    const root = createPage('Blocks', 'Cards', 'Related recipes are mocked; no request reaches Algolia.');
    const main = showcase(root);
    const cards = element('div', 'cards slider related recipes block');
    // the block calls the global fetch; the mock stays installed so the story stays offline
    window.fetch = mockRecommend();
    // authored as one section: heading, the empty block, then the View All Recipes button
    const container = section(main, cards);
    const heading = element('div', 'default-content-wrapper');
    heading.append(element('h2', '', 'You Might Also Enjoy...'));
    container.prepend(heading);
    decorateCards(cards);
    return root;
  },
};

/**
 * Builds a Cards block the way brand pages author it: an optional intro (eyebrow, heading) and
 * button as default content around the block, inside one section.
 */
function renderBrand(name, {
  classes, intro = true, button = false, rows, brandPage = false, eyebrow = 'HERSHEY’S',
}) {
  // brand pages carry this body class (scripts.js); some variants lay out differently with it
  document.body.classList.toggle('hershey-brand', brandPage);
  const root = createPage('Blocks', 'Cards', `Cards (${classes.replace(/ /g, ', ')})${brandPage ? ', on a brand page (body.hershey-brand)' : ''}.`);
  const main = showcase(root);
  const cards = element('div', `cards ${classes} block`);
  rows.forEach((cells) => {
    const row = element('div');
    cells.forEach((cell) => row.append(cell));
    cards.append(row);
  });
  const container = section(main, cards);
  if (intro) {
    const head = element('div', 'default-content-wrapper');
    if (eyebrow) head.append(element('p', '', eyebrow));
    head.append(element('h2', '', name));
    container.prepend(head);
  }
  if (button) {
    const tail = element('div', 'default-content-wrapper');
    const p = element('p', 'button-wrapper');
    p.append(link('View All', undefined, 'button'));
    tail.append(p);
    container.append(tail);
  }
  decorateCards(cards);
  return root;
}

function cellOf(...nodes) {
  const div = element('div');
  div.append(...nodes);
  return div;
}

function imageCell(label) {
  return cellOf(picture(label, 800, 800));
}

function bodyCell({
  tag, title, copy, cta, titleLink,
}) {
  const nodes = [];
  if (tag) nodes.push(element('p', '', tag));
  const heading = element('h3');
  if (titleLink) heading.append(link(title)); else heading.textContent = title;
  nodes.push(heading);
  if (copy) nodes.push(element('p', '', copy));
  if (cta) {
    const p = element('p');
    p.append(link(cta));
    nodes.push(p);
  }
  return cellOf(...nodes);
}

const cardRows = (count, body) => Array.from({ length: count }, (_, i) => [
  imageCell(`Item ${i + 1}`),
  bodyCell({ title: `Sweet idea ${i + 1}`, ...body }),
]);

/** `Cards (slider, brands)`: the “Get a Taste of Our Brands” band, tiles beside the intro. */
export const Brands = {
  render: () => renderBrand('Get a Taste of Our Brands', {
    classes: 'slider brands',
    button: true,
    rows: cardRows(6, { titleLink: true }),
  }),
};

/** `Cards (spotlight)`: one large card beside a column of smaller cards from 992px. */
export const Spotlight = {
  render: () => renderBrand('Recipes to Try', {
    classes: 'spotlight',
    button: true,
    rows: cardRows(4, { copy: 'Cookies, bars and more.', cta: 'Get the recipe' }),
  }),
};

/** `Cards (stories, slider)`: square photos with a story box over their lower edge. */
export const Stories = {
  render: () => renderBrand('More Ways to Enjoy', {
    classes: 'stories slider',
    rows: cardRows(4, { copy: 'A short story about a favorite.', cta: 'Read more' }),
  }),
};

/** `Cards (tiles)`: coloured flavour tiles; odd tiles orange, even purple. */
export const Tiles = {
  render: () => renderBrand('Elevate the Everyday', {
    classes: 'tiles',
    rows: cardRows(4, { copy: 'A flavor for every craving.' }),
  }),
};

/** `Cards (shop)`: an introduction card with no picture, then product tiles with a shop button. */
export const Shop = {
  render: () => renderBrand('Sweet, Salty and Perfectly Creamy', {
    classes: 'shop',
    intro: false,
    rows: [
      [bodyCell({ title: 'Sweet, Salty and Perfectly Creamy', copy: 'Find your favorite below.' })],
      ...cardRows(3, { cta: 'Shop now' }),
    ],
  }),
};

/** `Cards (grid)`: recipe feature list; the paragraph before the title is the photo tag. */
export const Grid = {
  render: () => renderBrand('Chocolate + Mint Recipes', {
    classes: 'grid',
    rows: cardRows(6, { tag: '30 min', titleLink: true }),
  }),
};

/** `Cards (slider, content)`: white recipe or story cards; one, two, then three per view. */
export const Content = {
  render: () => renderBrand('Dessert Ideas', {
    classes: 'slider content',
    button: true,
    rows: cardRows(6, { titleLink: true }),
  }),
};

function productRows(count) {
  return Array.from({ length: count }, (_, i) => [
    imageCell(`Product ${i + 1}`),
    bodyCell({ title: `Chocolate Bar ${i + 1}`, titleLink: true, copy: '1.55 oz' }),
  ]);
}

/** `Cards (product)`: the whole card links to the product page. */
export const Product = {
  render: () => renderBrand('Our Products', { classes: 'product', intro: false, rows: productRows(4) }),
};

/** `Cards (product, related)` with authored rows. Authored cards win over Algolia. */
export const ProductRelated = {
  render: () => renderBrand('Related Products', { classes: 'product related', intro: false, rows: productRows(4) }),
};

/** `Cards (quotes)`: top edge picture, slides (eyebrow, quote, author), bottom edge picture. */
export const Quotes = {
  render: () => {
    const slide = (n) => cellOf(
      element('p', '', 'FAN FAVORITE'),
      element('p', '', `“This is the best treat I have ever had, number ${n}.”`),
      element('p', '', `Fan ${n}`),
    );
    return renderBrand('Fan Quotes', {
      classes: 'quotes',
      intro: false,
      rows: [[imageCell('Top edge')], [slide(1)], [slide(2)], [slide(3)], [imageCell('Bottom edge')]],
    });
  },
};

/** `Cards (steps)`: one slide at a time; each row is heading, product picture, caption. */
export const Steps = {
  render: () => renderBrand('Unwrap. Enjoy. Repeat.', {
    classes: 'steps',
    intro: false,
    rows: ['Unwrap', 'Enjoy', 'Repeat'].map((step, i) => [
      cellOf(element('p', '', step)),
      imageCell(step),
      cellOf(element('p', '', `Step ${i + 1}: ${step.toLowerCase()} your favorite.`)),
    ]),
  }),
};

/** `Cards (slider, related, recipes)` with authored cards. Authored cards win over Algolia. */
export const Recipes = {
  render: () => renderBrand('You Might Also Enjoy...', {
    classes: 'slider related recipes',
    eyebrow: '',
    button: true,
    rows: cardRows(6, { titleLink: true }),
  }),
};

/** `Cards (product, slider)` on a brand page: product cards scroll with arrows and dots. */
export const ProductSlider = {
  render: () => renderBrand('Our Products', {
    classes: 'product slider',
    eyebrow: '',
    button: true,
    brandPage: true,
    rows: productRows(8),
  }),
};

/** `Cards (brand, slider)`: handled as the product variant, so it looks like Product Slider. */
export const BrandSlider = {
  render: () => renderBrand('Our Products', {
    classes: 'brand slider',
    eyebrow: '',
    button: true,
    brandPage: true,
    rows: productRows(8),
  }),
};

/** `Cards (slider, brands)` on a brand page: the band without the following-section rule. */
export const BrandsBrandPage = {
  render: () => renderBrand('Get a Taste of Our Brands', {
    classes: 'slider brands',
    button: true,
    brandPage: true,
    rows: cardRows(6, { titleLink: true }),
  }),
};

/** `Cards (stories, slider)` on a brand page: one kiss indicator per page of cards. */
export const StoriesBrandPage = {
  render: () => renderBrand('More Ways to Enjoy', {
    classes: 'stories slider',
    brandPage: true,
    rows: cardRows(6, { copy: 'A short story about a favorite.', cta: 'Read more' }),
  }),
};

/** `Cards (slider, content)` on a brand page: one kiss indicator per page of cards. */
export const ContentBrandPage = {
  render: () => renderBrand('Dessert Ideas', {
    classes: 'slider content',
    button: true,
    brandPage: true,
    rows: cardRows(8, { titleLink: true }),
  }),
};

/** `Cards (product)` with badges: a paragraph before the name gets an icon for known tags. */
export const ProductBadges = {
  render: () => renderBrand('Our Products', {
    classes: 'product',
    intro: false,
    rows: ['Seasonal', 'Limited Edition', 'New'].map((tag, i) => [
      imageCell(`Product ${i + 1}`),
      cellOf(
        element('p', '', tag),
        (() => { const h = element('h3'); h.append(link(`Chocolate Bar ${i + 1}`)); return h; })(),
        element('p', '', '1.55 oz'),
      ),
    ]),
  }),
};

/**
 * `Cards (wheel)`: rows are the copy, the wheel artwork on its own, then one row per wedge
 * (product picture and link, clockwise from the wedge right of the top). Spin lands on a random
 * wedge and shows its product; reduced motion skips the animation.
 */
export const Wheel = {
  render: () => {
    const flavors = ['Milk Chocolate', 'Almond', 'Caramel', 'Dark', 'Cookies n Creme', 'Mint']
      .map((name) => {
        const p = element('p');
        p.append(link(name));
        return [imageCell(name), cellOf(p)];
      });
    return renderBrand('Which KISSES Will You Try Next?', {
      classes: 'wheel',
      intro: false,
      rows: [
        [cellOf(element('h2', '', 'Which KISSES Will You Try Next?'), element('p', '', 'Give the wheel a spin.'))],
        [imageCell('Wheel art')],
        ...flavors,
      ],
    });
  },
};
