import catalog from '../design/tokens.json';
import { createDictionary, tokenVariable } from '../design/token-dictionary.mjs';
import {
  createPage, element, showcase, trackInteractions,
} from './markup/story-helpers.js';

export const dictionary = createDictionary(catalog);

export function css(path) {
  if (!dictionary.byPath.has(path)) throw new Error(`Unknown design value: ${path}`);
  return `var(${tokenVariable(path)})`;
}

export const surfaces = {
  Light: ['system.color.surface.default', 'system.color.text.primary'],
  Muted: ['system.color.surface.subtle', 'system.color.text.primary'],
  Inverse: ['system.color.surface.inverse', 'system.color.text.inverse'],
  Seasonal: ['system.color.surface.seasonal', 'system.color.text.inverse'],
};

export const workspaceArgs = {
  surface: 'Light',
  showLabels: true,
};

export const workspaceControls = {
  surface: {
    name: 'Preview surface',
    control: 'inline-radio',
    options: Object.keys(surfaces),
    description: 'Compare the composition on light, muted, inverse or seasonal backgrounds.',
  },
  showLabels: {
    name: 'Show annotations',
    control: 'boolean',
    description: 'Hide labels for a clean visual review.',
  },
};

export function workspace(title, args, className = '') {
  const root = createPage('Design workspace', title);
  const main = showcase(root);
  const board = main.parentElement;
  board.classList.add('design-workspace');
  if (args.showLabels === false) board.classList.add('design-hide-labels');
  main.className = `design-board ${className}`.trim();
  const palette = surfaces[args.surface || 'Light'];
  if (!palette) throw new Error(`Unknown preview surface: ${args.surface}`);
  const [background, foreground] = palette.map(css);
  board.style.backgroundColor = background;
  main.style.color = foreground;
  main.style.setProperty('--text-color', foreground);
  main.style.setProperty('--background-color', background);
  main.style.setProperty('--link-color', foreground);
  main.style.setProperty('--link-hover-color', foreground);
  if (args.actionColor) {
    board.style.setProperty('--hershey-system-color-action-primary-background-default', args.actionColor);
  }
  if (args.actionTextColor) {
    board.style.setProperty('--hershey-system-color-action-primary-foreground', args.actionTextColor);
  }
  if (args.headingColor) board.style.setProperty('--design-heading-color', args.headingColor);
  if (args.textColor) main.style.color = args.textColor;
  trackInteractions(main);
  return { root, board, main };
}

export function annotation(label, args, className = '') {
  const note = element('p', `design-annotation ${className}`.trim(), label);
  note.hidden = args.showLabels === false;
  return note;
}

export function comparison(label, args, className = '') {
  const row = element('div', `design-comparison ${className}`.trim());
  row.dataset.designLabel = label;
  row.append(annotation(label, args));
  const sample = element('div', 'design-comparison-sample');
  row.append(sample);
  return { row, sample };
}

export function group(main, title, description) {
  const section = element('section', 'design-group');
  section.setAttribute('aria-label', title);
  const label = element('h2', 'design-group-title', title);
  section.append(label);
  if (description) section.append(element('p', 'design-group-description', description));
  main.append(section);
  return section;
}

export function colorValue(node, path, board, args) {
  const label = annotation('', args, 'design-color-value');
  node.append(label);
  requestAnimationFrame(() => {
    if (!board.isConnected) return;
    const value = getComputedStyle(board).getPropertyValue(tokenVariable(path)).trim();
    if (!value) throw new Error(`Preview color is unresolved: ${path}`);
    label.textContent = value.toUpperCase();
  });
}

export const explorationControls = {
  text: {
    name: 'Sample text',
    control: 'text',
    description: 'Try campaign copy, long words or different character combinations.',
  },
  copy: {
    name: 'Supporting copy',
    control: 'text',
    description: 'Explore wrapping, rhythm and content density.',
  },
  actionColor: {
    name: 'Try an action color',
    control: 'color',
    description: 'Optional preview-only color experiment. Reset Controls to restore the design.',
  },
  actionTextColor: {
    name: 'Try an action label color',
    control: 'color',
    description: 'Explore foreground/background combinations and check Accessibility.',
  },
};

export const typeStyles = [
  {
    name: 'Display title', size: ['system.typography.heading-1.font-size.mobile', 'system.typography.heading-1.font-size.desktop'], family: 'heading', weight: 'heading', leading: 'heading',
  },
  {
    name: 'Section title', size: ['system.typography.heading-2.font-size.mobile', 'system.typography.heading-2.font-size.desktop'], family: 'heading', weight: 'heading', leading: 'heading',
  },
  {
    name: 'Card title', size: ['system.typography.card-title.font-size'], family: 'heading', weight: 'heading', leading: 'heading',
  },
  {
    name: 'Body', size: ['system.typography.body.font-size'], family: 'body', weight: 'body', leading: 'body',
  },
  {
    name: 'Compact body', size: ['system.typography.body.compact.font-size'], family: 'body', weight: 'body', leading: 'body',
  },
  {
    name: 'Caption', size: ['system.typography.caption.font-size'], family: 'body', weight: 'body', leading: 'body',
  },
];

export const leadingChoices = {
  Designed: null, Compact: 1.2, Comfortable: 1.5, Relaxed: 1.8,
};

export function applyType(node, style, args) {
  const index = args.typeViewport === 'Mobile' ? 0 : style.size.length - 1;
  const size = css(style.size[index]);
  node.style.fontSize = `calc(${size} * ${(args.typeScale || 100) / 100})`;
  node.style.fontFamily = css(`system.typography.${style.family}.font-family`);
  node.style.fontWeight = css(`system.typography.${style.weight}.font-weight`);
  const leading = leadingChoices[args.leading || 'Designed'];
  if (leading === undefined) throw new Error(`Unknown leading: ${args.leading}`);
  node.style.lineHeight = leading || css(`system.typography.${style.leading}.line-height`);
  node.style.letterSpacing = `${args.tracking || 0}px`;
  node.style.textAlign = args.alignment || 'left';
}
