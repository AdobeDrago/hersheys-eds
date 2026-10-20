export {
  createDictionary, dependencyChain, flattenTokens, resolveToken, serializeToken, tokenVariable,
} from '../../design/token-dictionary.mjs';

export const categories = {
  reference: { title: 'Reference Values', layer: 'reference', scope: 'runtime' },
  source: { title: 'Original Source Measurements', scope: 'evidence' },
  system: { title: 'Semantic Roles', layer: 'system', scope: 'runtime' },
  component: { title: 'Component Contracts', layer: 'component', scope: 'runtime' },
  brand: { title: 'Brand Palette', layer: 'reference' },
  neutral: { title: 'Observed Neutral Values', layer: 'reference', origin: 'source' },
  surface: { title: 'Surface Roles', layer: 'system' },
  text: { title: 'Text & Icon Roles', layer: 'system' },
  interactive: { title: 'Action & Selection States', layer: 'system' },
  border: { title: 'Border Colors', layer: 'system', properties: ['border-color'] },
  feedback: { title: 'Validation Error', layer: 'system' },
  family: { title: 'Font Family Roles', layer: 'system' },
  size: { title: 'Type Size Roles', layer: 'system' },
  lineHeight: { title: 'Reading & Heading Line Heights', layer: 'system' },
  weight: { title: 'Font Weight Roles', layer: 'system' },
  tracking: { title: 'Letter Spacing Roles', layer: 'system' },
  spacing: { title: 'Insets & Section Spacing', layer: 'system', properties: ['padding'] },
  layout: { title: 'Containers & Control Dimensions', layer: 'system' },
  gaps: { title: 'Space Between Elements', layer: 'system' },
  radius: { title: 'Shape Roles', layer: 'system' },
  width: { title: 'Border & Focus Widths', layer: 'system', properties: ['border-width', 'outline-width'] },
  style: { title: 'Border Style', layer: 'system' },
  shadow: { title: 'Surface Elevation', layer: 'system' },
  elevation: { title: 'Stacking Roles', layer: 'system' },
  duration: { title: 'Interaction & Reduced Duration', layer: 'system' },
  delay: { title: 'Interaction & Entrance Delay', layer: 'system' },
  easing: { title: 'Interaction Easing', layer: 'system' },
};

export function selectTokens(tokens, category) {
  const definition = categories[category];
  if (!definition) throw new Error(`Unknown foundation category: ${category}`);
  const architecture = ['reference', 'source', 'system', 'component'].includes(category);
  return tokens.filter((token) => (
    (!definition.layer || token.layer === definition.layer)
    && (!definition.origin || token.origin === definition.origin)
    && token.scope === (definition.scope || 'runtime')
    && (architecture || token.category === category || token.categories?.includes(category))
    && (!definition.properties || definition.properties.includes(token.cssProperty))
  ));
}

export function tokenLabel(token) {
  if (token.label) return token.label;
  const words = {
    'tt-norms': 'TT Norms Pro',
    gazpacho: 'Gazpacho',
    'heading-1': 'Heading 1',
    'heading-2': 'Heading 2',
    'card-title': 'Card title',
    typography: 'Type',
    'font-size': 'Size',
    'font-family': 'Family',
    'font-weight': 'Weight',
  };
  return token.path.split('.').slice(1)
    .map((part) => words[part] ?? part.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase()))
    .join(' / ');
}

export function displayCSSValue(token, css) {
  if (token.type === 'color') return css.toUpperCase();
  if (token.type === 'fontFamily') {
    return css.replaceAll('hershey-tt', 'TT Norms Pro').replaceAll('hershey-gazpacho', 'Gazpacho').replaceAll('"', '');
  }
  if (token.type === 'fontWeight') {
    return `${{
      400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black',
    }[css] || 'Weight'} (${css})`;
  }
  if (token.cssProperty === 'line-height') return `${css} times font size`;
  if (token.cssProperty === 'opacity') return `${Math.round(Number(css) * 100)}%`;
  return css;
}
