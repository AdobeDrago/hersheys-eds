import {
  annotation, comparison, explorationControls, leadingChoices, workspace,
  workspaceArgs, workspaceControls,
} from '../../design-system.js';
import { element, link, picture } from '../story-helpers.js';

const text = 'A little sweetness makes an ordinary moment memorable.';
const heading = 'The good stuff belongs together';
const definitions = {
  h1: 'Large page titles',
  h2: 'Section titles',
  h3: 'Subsection titles',
  h4: 'Detail headings',
  h5: 'Small headings',
  h6: 'Supporting headings',
  p: 'Reading text',
  strong: 'Strong emphasis',
  em: 'Gentle emphasis',
  cite: 'Citations',
  a: 'Inline links',
  button: 'Calls to action',
  ul: 'Unordered lists',
  ol: 'Ordered lists',
  blockquote: 'Quotations',
  image: 'Images and captions',
  table: 'Tables',
  hr: 'Section dividers',
};

function button(label, href, variant, args) {
  const action = link(label, href, `button ${variant}`);
  const sizes = { Compact: '8px 16px', Designed: null, Generous: '16px 32px' };
  if (sizes[args.buttonSize]) action.style.padding = sizes[args.buttonSize];
  if (args.cornerRadius !== undefined) action.style.borderRadius = `${args.cornerRadius}px`;
  return action;
}

function table(args) {
  const node = element('table', 'markup-table');
  node.append(element('caption', '', args.text));
  const head = element('thead');
  const row = element('tr');
  ['Treat', 'Moment'].forEach((label) => {
    const cell = element('th', '', label);
    cell.scope = 'col';
    row.append(cell);
  });
  head.append(row);
  const body = element('tbody');
  args.rows.forEach((values) => {
    const tr = element('tr');
    values.forEach((value) => tr.append(element('td', '', value)));
    body.append(tr);
  });
  node.append(head, body);
  return node;
}

function fragment(kind, args) {
  const content = element('div', 'content-fragment');
  if (/^h[1-6]$/.test(kind)) {
    const title = element(kind, '', args.text);
    if (args.headingColor) title.style.color = args.headingColor;
    title.style.textAlign = args.alignment;
    title.classList.add('content-heading-experiment');
    title.style.setProperty('--design-heading-scale', (args.headingScale || 100) / 100);
    content.append(title);
    if (args.supportingCopy) content.append(element('p', '', args.copy));
  } else if (kind === 'p') {
    content.append(element('p', '', args.text));
  } else if (['strong', 'em'].includes(kind)) {
    const paragraph = element('p', '', 'A moment for ');
    paragraph.append(element(kind, '', args.text), document.createTextNode('. Discover something worth sharing with the people you love.'));
    content.append(paragraph);
  } else if (kind === 'cite') {
    content.append(element('p', '', 'A little sweetness makes an ordinary moment memorable.'), element('cite', '', args.text));
  } else if (kind === 'a') {
    const paragraph = element('p', '', 'Discover ');
    paragraph.append(link(args.text, args.href), document.createTextNode(' and make something worth sharing.'));
    content.append(paragraph);
  } else if (kind === 'button') {
    content.append(button(args.text, args.href, args.variant, args));
  } else if (kind === 'ul' || kind === 'ol') {
    const list = element(kind);
    args.items.forEach((item) => list.append(element('li', '', item)));
    content.append(list);
  } else if (kind === 'blockquote') {
    const quote = element('blockquote');
    quote.append(element('p', '', args.text), element('cite', '', args.attribution));
    content.append(quote);
  } else if (kind === 'image') {
    const figure = element('figure');
    if (args.showImage) {
      const ratios = { Landscape: [1000, 500], Square: [600, 600], Portrait: [500, 700] };
      const ratio = ratios[args.imageShape];
      if (!ratio) throw new Error(`Unknown image shape: ${args.imageShape}`);
      const image = picture('Made for sharing', ...ratio);
      image.querySelector('img').alt = args.alt;
      image.querySelector('img').style.borderRadius = `${args.imageRadius}px`;
      figure.append(image);
    }
    if (args.showCaption) figure.append(element('figcaption', '', args.text));
    content.append(figure);
  } else if (kind === 'table') content.append(table(args));
  else if (kind === 'hr') {
    content.append(element('p', '', 'A sweet beginning.'), element('hr'), element('p', '', 'A new chapter.'));
  }
  return content;
}

function applyReading(content, args, measure = args.measure) {
  content.style.maxWidth = `${measure}ch`;
  content.style.fontSize = `${args.bodySize}px`;
  content.style.textAlign = args.alignment;
  if (args.textColor) content.style.color = args.textColor;
  const leading = leadingChoices[args.leading];
  if (leading === undefined) throw new Error(`Unknown line spacing: ${args.leading}`);
  if (leading) content.style.lineHeight = String(leading);
}

function article(args, focusKind) {
  const content = element('article', 'content-article');
  content.append(annotation('In a page', args));
  const title = element('h1', '', args.articleTitle || heading);
  if (args.headingColor) title.style.color = args.headingColor;
  content.append(title, element('p', 'content-intro', args.copy || text));
  if (focusKind) {
    content.append(fragment(focusKind, args));
    content.append(element('p', '', 'Choose a favorite, bring people together, and turn a small idea into a memorable moment.'));
  } else {
    if (args.showImage) {
      content.append(fragment('image', {
        ...args,
        text: args.text,
      }));
    }
    content.append(element('h2', '', 'Make something worth sharing'));
    const paragraph = element('p', '', `${text} Add `);
    paragraph.append(element('strong', '', 'a little emphasis'), document.createTextNode(', '), element('em', '', 'a gentle note'), document.createTextNode(' or '), link('a useful destination'), document.createTextNode(' as part of the story.'));
    content.append(paragraph);
    content.append(fragment('ul', { ...args, items: ['Choose a favorite', 'Create something simple', 'Share the moment'] }));
    content.append(fragment('blockquote', { ...args, text, attribution: 'Hersheyland' }));
    content.append(element('h3', '', 'A favorite for every occasion'));
    content.append(table({ ...args, text: 'Favorites and moments', rows: [['Kisses', 'A small celebration'], ['Reese\'s', 'A well-earned break']] }));
    content.append(element('hr'), button('Explore favorites', 'https://www.hersheyland.com/', args.variant, args));
  }
  applyReading(content, args);
  return content;
}

function render(kind, args) {
  const { root, main } = workspace(definitions[kind] || 'Content overview', args, 'content-board');
  main.style.fontSize = `${args.bodySize}px`;
  main.style.textAlign = args.alignment;
  if (args.textColor) main.style.color = args.textColor;
  if (leadingChoices[args.leading]) main.style.lineHeight = String(leadingChoices[args.leading]);
  if (kind === 'overview') {
    main.append(article(args));
  } else if (args.layout === 'In a page') {
    main.append(article(args, kind));
  } else if (args.layout === 'Isolated') {
    const content = fragment(kind, args);
    applyReading(content, args);
    main.append(content);
  } else if (kind === 'button') {
    const rail = element('div', 'content-action-rail');
    ['primary', 'secondary', 'accent'].forEach((variant) => {
      const item = element('div');
      item.append(annotation(variant.replace(/^./, (letter) => letter.toUpperCase()), args));
      item.append(fragment(kind, { ...args, variant }));
      rail.append(item);
    });
    main.append(rail);
    const section = element('div', 'content-action-context');
    section.append(annotation('With surrounding content', args), element('h2', '', heading), element('p', '', args.copy));
    section.append(fragment(kind, args));
    section.style.maxWidth = `${args.measure}ch`;
    main.append(section);
  } else if (kind === 'image') {
    const grid = element('div', 'content-image-comparison');
    grid.style.maxWidth = `${args.measure}ch`;
    ['Landscape', args.imageShape === 'Landscape' ? 'Square' : args.imageShape].forEach((shape) => {
      const item = element('div');
      item.append(annotation(shape, args), fragment(kind, { ...args, imageShape: shape }));
      grid.append(item);
    });
    main.append(grid);
  } else {
    const grid = element('div', 'content-variant-grid');
    const variants = /^h[1-6]$/.test(kind)
      ? [['Short copy', args.measure, args.text], ['Wrapping copy', args.measure, `${args.text}. ${args.text}.`]]
      : [['Narrow measure', 36, args.text], ['Comfortable measure', args.measure, args.text]];
    variants.forEach(([label, measure, copy]) => {
      const { row, sample } = comparison(label, args, 'content-comparison');
      const content = fragment(kind, { ...args, text: copy });
      applyReading(content, args, measure);
      sample.append(content);
      grid.append(row);
    });
    main.append(grid);
  }
  return root;
}

export default function contentMeta(kind) {
  if (kind !== 'overview' && !definitions[kind]) throw new Error(`Unknown content element: ${kind}`);
  const args = {
    ...workspaceArgs,
    text: /^h[1-6]$/.test(kind) ? heading : text,
    copy: text,
    layout: 'Compare',
    measure: 66,
    bodySize: 18,
    leading: 'Designed',
    alignment: 'left',
  };
  const argTypes = {
    ...workspaceControls,
    text: explorationControls.text,
    copy: explorationControls.copy,
    layout: {
      name: 'Presentation', control: 'inline-radio', options: ['Compare', 'In a page', 'Isolated'], description: 'Compare treatments, review the element in realistic content, or isolate it.',
    },
    measure: {
      name: 'Reading width · ch',
      control: {
        type: 'range', min: 30, max: 90, step: 2,
      },
      description: 'Explore line length and wrapping.',
    },
    bodySize: {
      name: 'Body size · px',
      control: {
        type: 'range', min: 14, max: 26, step: 1,
      },
    },
    leading: { name: 'Line spacing', control: 'select', options: Object.keys(leadingChoices) },
    alignment: { name: 'Alignment', control: 'inline-radio', options: ['left', 'center', 'right'] },
    textColor: { name: 'Try a text color', control: 'color', description: 'Preview-only experiment. Reset Controls to return to the designed color.' },
  };
  if (/^h[1-6]$/.test(kind) || kind === 'overview') {
    args.supportingCopy = true;
    argTypes.supportingCopy = { name: 'Supporting text', control: 'boolean' };
    argTypes.headingColor = { name: 'Try a heading color', control: 'color' };
    if (kind !== 'overview') {
      args.headingScale = 100;
      argTypes.headingScale = {
        name: 'Heading size · %',
        control: {
          type: 'range', min: 75, max: 150, step: 5,
        },
      };
    } else {
      delete argTypes.supportingCopy;
    }
  }
  if (kind === 'a' || kind === 'button') {
    args.text = 'Explore favorites';
    args.href = 'https://www.hersheyland.com/';
    argTypes.href = { name: 'Destination', control: 'text' };
  }
  if (kind === 'button' || kind === 'overview') {
    Object.assign(args, {
      variant: 'primary', buttonSize: 'Designed', actionColor: '', actionTextColor: '',
    });
    Object.assign(argTypes, {
      variant: { name: 'Action treatment', control: 'inline-radio', options: ['primary', 'secondary', 'accent'] },
      buttonSize: { name: 'Action spacing', control: 'inline-radio', options: ['Compact', 'Designed', 'Generous'] },
      cornerRadius: {
        name: 'Try corner rounding · px',
        control: {
          type: 'range', min: 0, max: 50, step: 2,
        },
      },
      actionColor: explorationControls.actionColor,
      actionTextColor: explorationControls.actionTextColor,
    });
  }
  if (kind === 'ul' || kind === 'ol') {
    args.items = ['Choose a favorite', 'Share it with someone', 'Enjoy the moment'];
    argTypes.items = { name: 'List items', control: 'object' };
  }
  if (kind === 'blockquote') {
    args.attribution = 'Hersheyland';
    argTypes.attribution = { name: 'Attribution', control: 'text' };
  }
  if (kind === 'image' || kind === 'overview') {
    Object.assign(args, {
      showImage: true, showCaption: true, imageShape: 'Landscape', imageRadius: 0, alt: 'Made for sharing placeholder',
    });
    Object.assign(argTypes, {
      showImage: { name: 'Show image', control: 'boolean' },
      showCaption: { name: 'Show caption', control: 'boolean' },
      imageShape: { name: 'Image proportions', control: 'inline-radio', options: ['Landscape', 'Square', 'Portrait'] },
      imageRadius: {
        name: 'Image rounding · px',
        control: {
          type: 'range', min: 0, max: 48, step: 2,
        },
      },
      alt: { name: 'Image alternative', control: 'text' },
    });
  }
  if (kind === 'table') {
    args.text = 'Favorites and moments';
    args.rows = [['Kisses', 'A small celebration'], ['Reese\'s', 'A well-earned break']];
    argTypes.rows = { name: 'Table content', control: 'object' };
  }
  if (kind === 'overview') {
    args.articleTitle = heading;
    argTypes.articleTitle = { name: 'Page title', control: 'text' };
    delete argTypes.layout;
  }
  if (kind === 'ul' || kind === 'ol' || kind === 'hr') delete argTypes.text;
  return {
    args,
    argTypes,
    render: (values) => render(kind, values),
    parameters: {
      docs: { description: { component: `${kind === 'overview' ? 'Review text, headings, images and actions as a complete page composition.' : `Explore ${definitions[kind].toLowerCase()} side by side and in realistic content.`} Controls let you try copy, reading width, surfaces and visual variations. Experiments are preview-only; reset Controls to restore the designed defaults. Links log Actions instead of leaving the preview.` } },
    },
  };
}
