import { element, link } from '../markup/story-helpers.js';
import {
  annotation, applyType, colorValue, comparison, css, dictionary, group, typeStyles, workspace,
} from '../design-system.js';
import { selectTokens } from './catalog.js';

const colorNames = {
  'reference.color.brand.chocolate': 'Chocolate',
  'reference.color.brand.chocolate-deep': 'Deep chocolate',
  'reference.color.brand.purple': 'Seasonal purple',
  'reference.color.brand.blue': 'Blue',
  'reference.color.brand.blue-deep': 'Deep blue',
  'reference.color.alpha.white-27': 'White overlay',
  'reference.color.alpha.black-13': 'Shadow tint',
  'system.color.surface.default': 'Light',
  'system.color.surface.subtle': 'Muted',
  'system.color.surface.inverse': 'Inverse',
  'system.color.surface.seasonal': 'Seasonal',
  'system.color.text.primary': 'Body text',
  'system.color.text.inverse': 'Inverse text',
  'system.color.link.default': 'Inline link',
  'system.color.link.hover': 'Link hover',
  'system.color.icon.primary': 'Icon',
  'system.color.border.subtle': 'Subtle boundary',
  'system.color.border.inverse': 'Inverse divider',
  'system.color.border.card': 'Card boundary',
};

function name(token) {
  return colorNames[token.path] || token.path.split('.').at(-1).replace(/-/g, ' ');
}

function palette(main, category, args, board) {
  const strip = element('div', 'design-palette');
  selectTokens(dictionary.tokens, category).forEach((token) => {
    const item = element('div', 'design-palette-item');
    const swatch = element('div', 'design-swatch');
    swatch.style.backgroundColor = css(token.path);
    if (token.value?.alpha < 1) {
      swatch.style.backgroundImage = `linear-gradient(${css(token.path)}, ${css(token.path)}), conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)`;
      swatch.style.backgroundSize = 'auto, 12px 12px';
    }
    item.append(swatch, annotation(category === 'neutral' ? `Gray ${token.path.split('.').at(-1)}` : name(token), args));
    colorValue(item, token.path, board, args);
    strip.append(item);
  });
  if (args.candidateColor) {
    const candidate = element('div', 'design-palette-item');
    const swatch = element('div', 'design-swatch');
    swatch.style.backgroundColor = args.candidateColor;
    candidate.append(swatch, annotation('Your color', args), annotation(args.candidateColor, args));
    strip.append(candidate);
  }
  main.append(strip);
}

function surfaces(main, args, board) {
  const panels = element('div', 'design-surface-grid');
  selectTokens(dictionary.tokens, 'surface').forEach((token) => {
    const panel = element('section', 'design-surface');
    panel.setAttribute('aria-label', `${name(token)} surface`);
    panel.style.backgroundColor = css(token.path);
    panel.style.color = css(token.pair);
    panel.append(annotation(name(token), args));
    panel.append(element('h3', '', args.text), element('p', '', args.copy));
    const button = element('button', 'button design-action', args.actionLabel || 'Explore favorites');
    button.type = 'button';
    panel.append(button);
    colorValue(panel, token.path, board, args);
    panels.append(panel);
  });
  main.append(panels);
}

function textColors(main, args, board) {
  selectTokens(dictionary.tokens, 'text').forEach((token) => {
    const { row, sample } = comparison(name(token), args);
    sample.classList.add('design-text-color');
    sample.style.backgroundColor = css(token.pair);
    sample.style.color = css(token.path);
    const text = token.path.includes('.link.') ? link(args.text) : element('p', '', args.text);
    text.style.color = 'inherit';
    sample.append(text);
    colorValue(row, token.path, board, args);
    main.append(row);
  });
}

function actions(main, args) {
  const states = [
    ['Default', 'system.color.action.primary.background.default'],
    ['Hover', 'system.color.action.primary.background.hover'],
    ['Focus', 'system.color.action.primary.background.default'],
    ['Disabled', 'system.color.action.primary.background.default'],
    ['Selected', 'system.color.selection.background'],
  ];
  const rail = element('div', 'design-state-rail');
  states.forEach(([label, background]) => {
    const state = element('div', 'design-state');
    const button = element('button', 'button design-action', args.actionLabel || 'Explore favorites');
    button.type = 'button';
    button.style.backgroundColor = css(background);
    button.style.color = css(label === 'Selected' ? 'system.color.selection.foreground' : 'system.color.action.primary.foreground');
    if (label === 'Focus') button.classList.add('design-focus');
    if (label === 'Disabled') {
      button.disabled = true;
      button.style.opacity = css('system.state.disabled.opacity');
    }
    state.append(annotation(label, args), button);
    rail.append(state);
  });
  main.append(rail);
}

function typography(main, args, category) {
  if (category === 'family') {
    ['body', 'heading'].forEach((family) => {
      const { row, sample } = comparison(family === 'body' ? 'TT Norms Pro' : 'Gazpacho', args);
      sample.style.fontFamily = css(`system.typography.${family}.font-family`);
      sample.style.fontWeight = css(`system.typography.${family}.font-weight`);
      sample.style.fontSize = `${32 * ((args.typeScale || 100) / 100)}px`;
      sample.style.letterSpacing = `${args.tracking || 0}px`;
      sample.style.textAlign = args.alignment || 'left';
      sample.append(element('p', '', args.text), element('p', 'design-glyphs', 'Aa Bb Cc Dd Ee Ff Gg 0123456789'));
      main.append(row);
    });
  } else if (category === 'weight') {
    [['Regular', 'body', 400], ['Bold', 'body', 700], ['Black', 'body', 900], ['Heading bold', 'heading', 700], ['Heading black', 'heading', 900]].forEach(([label, family, weight]) => {
      const { row, sample } = comparison(`${label} · ${weight}`, args);
      sample.style.fontFamily = css(`system.typography.${family}.font-family`);
      sample.style.fontWeight = String(weight);
      sample.style.fontSize = `${24 * ((args.typeScale || 100) / 100)}px`;
      sample.style.letterSpacing = `${args.tracking || 0}px`;
      sample.style.textAlign = args.alignment || 'left';
      sample.textContent = args.text;
      main.append(row);
    });
  } else if (category === 'lineHeight') {
    [['Compact', 1.2], ['Reading', 1.5], ['Relaxed', 1.8]].forEach(([label, leading]) => {
      const { row, sample } = comparison(`${label} · ${leading}`, args);
      applyType(sample, typeStyles[3], args);
      sample.style.lineHeight = String(leading);
      sample.classList.add('design-reading-sample');
      sample.append(element('p', '', `${args.copy} ${args.copy}`));
      main.append(row);
    });
  } else if (category === 'tracking') {
    [['Tight', -0.5], ['Normal', 0], ['Open', 0.5], ['Wide', 1]].forEach(([label, tracking]) => {
      const { row, sample } = comparison(`${label} · ${tracking}px`, args);
      applyType(sample, typeStyles[2], args);
      sample.style.letterSpacing = `${tracking + (args.tracking || 0)}px`;
      sample.textContent = args.text;
      main.append(row);
    });
  } else {
    typeStyles.forEach((style) => {
      const { row, sample } = comparison(style.name, args);
      applyType(sample, style, args);
      sample.classList.add('design-type-line');
      sample.textContent = args.text;
      main.append(row);
    });
  }
}

function spacing(main, args, category) {
  const choices = category === 'gaps'
    ? ['small', 'default', 'comfortable', 'large']
    : ['compact', 'small', 'default', 'comfortable', 'large'];
  choices.forEach((choice) => {
    const { row, sample } = comparison(choice.replace(/^./, (letter) => letter.toUpperCase()), args);
    const path = `system.spacing.${category === 'gaps' ? 'gap' : 'inset'}.${choice}`;
    sample.classList.add(category === 'gaps' ? 'design-gap-sample' : 'design-inset-sample');
    sample.style.setProperty(category === 'gaps' ? 'gap' : 'padding', `calc(${css(path)} * ${(args.spacingScale || 100) / 100})`);
    if (category === 'gaps') {
      ['Chocolate', 'Candy', 'Baking'].forEach((label) => sample.append(element('span', 'design-spacing-item', label)));
    } else sample.append(element('div', 'design-spacing-item', args.text));
    main.append(row);
  });
}

function layouts(main, args) {
  [['Intro', 'system.layout.container.intro'], ['Page', 'system.layout.container.page'], ['Popover', 'system.layout.container.popover']].forEach(([label, width]) => {
    const { row, sample } = comparison(label, args);
    const container = element('div', 'design-container-sample');
    container.style.maxWidth = `calc(${css(width)} * ${(args.widthScale || 100) / 100})`;
    container.append(element('h3', '', args.text), element('p', '', args.copy));
    sample.append(container);
    main.append(row);
  });
}

function shapes(main, args, category) {
  const tokens = selectTokens(dictionary.tokens, category);
  const rail = element('div', 'design-shape-rail');
  tokens.forEach((token) => {
    const item = element('div', 'design-shape-item');
    item.append(annotation(name(token), args));
    const sample = element('button', 'design-shape-sample', args.actionLabel || 'Explore');
    sample.type = 'button';
    sample.style.setProperty(token.cssProperty, css(token.path));
    if (args.rounding !== undefined && category === 'radius') {
      sample.style.borderRadius = `${args.rounding}px`;
    }
    if (args.strokeWidth !== undefined && category === 'width') {
      sample.style.setProperty(token.cssProperty, `${args.strokeWidth}px`);
    }
    if (category === 'style' && args.borderStyle !== 'Designed') {
      sample.style.borderStyle = args.borderStyle;
    }
    if (token.cssProperty === 'outline-width') sample.classList.add('design-focus');
    rail.append(item);
    item.append(sample);
  });
  main.append(rail);
}

function elevation(main, args, category) {
  const rail = element('div', 'design-elevation-rail');
  if (category === 'shadow') {
    ['Flat', 'Raised'].forEach((label) => {
      const panel = element('div', 'design-elevation-sample');
      if (label === 'Raised') panel.style.boxShadow = css('system.elevation.shadow.popover');
      panel.append(annotation(label, args), element('h3', '', args.text), element('p', '', args.copy));
      rail.append(panel);
    });
  } else {
    const scene = element('div', 'design-layer-scene');
    ['Content', 'Floating navigation'].forEach((label, index) => {
      const panel = element('div', 'design-layer-panel', label);
      panel.style.zIndex = css(index ? 'system.elevation.layer.navigation' : 'system.elevation.layer.base');
      scene.append(panel);
    });
    rail.append(scene);
  }
  main.append(rail);
}

function motion(main, args, category) {
  const rows = selectTokens(dictionary.tokens, category);
  rows.forEach((token) => {
    const { row, sample } = comparison(token.path.split('.').slice(2).join(' ').replace(/\bduration\b|\bdelay\b|\beasing\b/g, '')
      .trim(), args);
    const track = element('div', 'design-motion-track');
    const dot = element('span', 'design-motion-dot');
    track.append(dot);
    const button = element('button', 'button design-action', 'Play once');
    button.type = 'button';
    const status = element('span', 'design-motion-status');
    status.setAttribute('role', 'status');
    button.addEventListener('click', () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        status.textContent = 'Reduced motion: animation disabled';
        return;
      }
      const value = getComputedStyle(main.parentElement).getPropertyValue(token.variable).trim();
      const milliseconds = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
      const animation = dot.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(144px)' }], {
        duration: (category === 'duration' ? milliseconds : 750) * ((args.motionScale || 100) / 100),
        delay: category === 'delay' ? milliseconds : 0,
        easing: category === 'easing' ? value : 'ease',
      });
      button.disabled = true;
      status.textContent = 'Playing';
      animation.addEventListener('finish', () => {
        button.disabled = false;
        status.textContent = 'Ready';
      });
    });
    sample.append(track, button, status);
    main.append(row);
  });
}

function borders(main, args, board) {
  selectTokens(dictionary.tokens, 'border').forEach((token) => {
    const { row, sample } = comparison(name(token), args);
    sample.classList.add('design-boundary');
    sample.style.borderColor = css(token.path);
    if (token.path.endsWith('inverse')) {
      sample.style.backgroundColor = css('system.color.surface.inverse');
      sample.style.color = css('system.color.text.inverse');
    }
    sample.append(element('p', '', args.copy));
    colorValue(row, token.path, board, args);
    main.append(row);
  });
}

export default function renderGallery(category, args) {
  const { root, board, main } = workspace(`Foundations ${category}`, args, 'foundation-board');
  board.classList.add('foundations');
  if (category === 'overview') {
    const color = group(main, 'Color', 'Compare the palette, then try it on light or inverse surfaces.');
    palette(color, 'brand', args, board);
    const type = group(main, 'Typography', 'Explore size, leading and tracking with your own copy.');
    typography(type, args, 'size');
    const state = group(main, 'Actions', 'Review default, hover, focus and disabled treatments together.');
    actions(state, args);
  } else if (['brand', 'neutral'].includes(category)) palette(main, category, args, board);
  else if (category === 'surface') surfaces(main, args, board);
  else if (category === 'text') textColors(main, args, board);
  else if (category === 'interactive') actions(main, args);
  else if (category === 'border') borders(main, args, board);
  else if (category === 'feedback') {
    const label = element('label', 'design-error-field', 'Email address');
    const input = element('input');
    input.type = 'email';
    input.value = 'not-an-email';
    input.setAttribute('aria-invalid', 'true');
    label.append(input, element('span', 'design-error-message', 'Enter a valid email address.'));
    main.append(label);
  } else if (['family', 'size', 'weight', 'lineHeight', 'tracking'].includes(category)) typography(main, args, category);
  else if (['spacing', 'gaps'].includes(category)) spacing(main, args, category);
  else if (category === 'layout') layouts(main, args);
  else if (['radius', 'width', 'style'].includes(category)) shapes(main, args, category);
  else if (['shadow', 'elevation'].includes(category)) elevation(main, args, category);
  else if (['duration', 'delay', 'easing'].includes(category)) motion(main, args, category);
  else throw new Error(`Unknown designer showcase: ${category}`);
  return root;
}
