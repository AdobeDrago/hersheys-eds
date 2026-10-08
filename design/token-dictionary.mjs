export const metadataKey = 'com.hersheyland.tokens';

const aliasPattern = /^\{([^{}]+)\}$/;
const shadowTypes = {
  color: 'color', offsetX: 'dimension', offsetY: 'dimension', blur: 'dimension', spread: 'dimension',
};
const specimenContracts = {
  brand: { types: ['color'], properties: ['background-color'] },
  neutral: { types: ['color'], properties: ['background-color'] },
  surface: { types: ['color'], properties: ['background-color'] },
  text: { types: ['color'], properties: ['color'] },
  interactive: {
    types: ['color', 'number', 'dimension'],
    properties: ['color', 'background-color', 'opacity', 'outline-width', 'outline-offset'],
  },
  border: { types: ['color'], properties: ['border-color'] },
  feedback: { types: ['color'], properties: ['background-color', 'border-color'] },
  family: { types: ['fontFamily'], properties: ['font-family'] },
  size: { types: ['dimension'], properties: ['font-size'] },
  lineHeight: { types: ['number'], properties: ['line-height'] },
  weight: { types: ['fontWeight'], properties: ['font-weight'] },
  tracking: { types: ['dimension'], properties: ['letter-spacing'] },
  spacing: { types: ['dimension'], properties: ['padding', 'margin'] },
  layout: { types: ['dimension'], properties: ['width', 'height'] },
  gaps: { types: ['dimension'], properties: ['gap'] },
  radius: { types: ['dimension'], properties: ['border-radius'] },
  width: { types: ['dimension'], properties: ['border-width', 'outline-width', 'outline-offset'] },
  style: { types: ['strokeStyle'], properties: ['border-style'] },
  shadow: { types: ['shadow'], properties: ['box-shadow'] },
  elevation: { types: ['number'], properties: ['z-index'] },
  duration: { types: ['duration'], properties: ['animation-duration'] },
  delay: { types: ['duration'], properties: ['animation-delay'] },
  easing: { types: ['cubicBezier'], properties: ['animation-timing-function'] },
};

export function tokenVariable(path) {
  return `--hershey-${path.replaceAll('.', '-')}`;
}

export function flattenTokens(
  group,
  path = [],
  inheritedType = undefined,
  descriptions = [],
  metadata = {},
) {
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    throw new Error(`Invalid token/group: ${path.join('.')}`);
  }
  const type = group.$type ?? inheritedType;
  const notes = group.$description ? [...descriptions, group.$description] : descriptions;
  const attributes = { ...metadata, ...group.$extensions?.[metadataKey] };
  if (Object.hasOwn(group, '$value')) {
    if (Object.keys(group).some((key) => !key.startsWith('$'))) {
      throw new Error(`Tokens cannot contain child groups: ${path.join('.')}`);
    }
    const name = path.join('.');
    return [{
      path: name,
      variable: tokenVariable(name),
      layer: path[0],
      type,
      value: group.$value,
      descriptions: notes,
      ...attributes,
    }];
  }
  return Object.entries(group).filter(([name]) => !name.startsWith('$')).flatMap(([name, node]) => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new Error(`Invalid token/group name: ${[...path, name].join('.')}`);
    }
    return flattenTokens(node, [...path, name], type, notes, attributes);
  });
}

function tokenMap(tokens) {
  return tokens instanceof Map ? tokens : new Map(tokens.map((token) => [token.path, token]));
}

function resolveValue(value, type, tokens, trail) {
  if (typeof value === 'string' && value.startsWith('{')) {
    const path = value.match(aliasPattern)?.[1];
    const target = tokens.get(path);
    if (!target) throw new Error(`Unknown token reference: ${value}`);
    if (trail.includes(path)) throw new Error(`Circular token reference: ${[...trail, path].join(' -> ')}`);
    if (type && target.type !== type) {
      throw new Error(`Reference type mismatch: ${path} (${target.type}, expected ${type})`);
    }
    return resolveValue(target.value, target.type, tokens, [...trail, path]);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, type === 'shadow' ? type : undefined, tokens, trail));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, resolveValue(item, type === 'shadow' ? shadowTypes[key] : undefined, tokens, trail),
    ]));
  }
  return value;
}

export function resolveToken(token, tokens, trail = token.path ? [token.path] : []) {
  return resolveValue(token.value, token.type, tokenMap(tokens), trail);
}

function serializeValue(value, type) {
  switch (type) {
    case 'dimension':
      if (!Number.isFinite(value?.value) || !['px', 'rem'].includes(value.unit)) {
        throw new Error('Dimensions require a finite value and px/rem unit');
      }
      return `${value.value}${value.unit}`;
    case 'color': {
      const { colorSpace, components, alpha = 1 } = value ?? {};
      const normalized = (number) => Number.isFinite(number) && number >= 0 && number <= 1;
      if (colorSpace !== 'srgb' || !Array.isArray(components) || components.length !== 3
        || ![...components, alpha].every(normalized)) {
        throw new Error('Colors require normalized sRGB components and alpha');
      }
      const channels = components.map((number) => Math.round(number * 255).toString(16).padStart(2, '0'));
      const hex = `#${channels.join('')}`;
      if (value.hex && value.hex.toLowerCase() !== hex) throw new Error(`Color hex mismatch: ${value.hex}`);
      const cssHex = alpha === 1 ? hex : `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
      return /^#(?:([0-9a-f])\1)(?:([0-9a-f])\2)(?:([0-9a-f])\3)(?:([0-9a-f])\4)?$/.test(cssHex)
        ? `#${cssHex.slice(1).match(/../g).map((pair) => pair[0]).join('')}` : cssHex;
    }
    case 'fontFamily': {
      const families = Array.isArray(value) ? value : [value];
      if (!families.length || families.some((name) => typeof name !== 'string' || !name.trim())) {
        throw new Error('Font families must be non-empty strings');
      }
      return families.map((name) => (/^[a-z][a-z0-9-]*$/.test(name) ? name : JSON.stringify(name))).join(', ');
    }
    case 'fontWeight':
      if (!Number.isInteger(value) || value < 1 || value > 1000) throw new Error('Invalid numeric font weight');
      return String(value);
    case 'number':
      if (!Number.isFinite(value)) throw new Error('Number tokens must be finite');
      return String(value);
    case 'duration':
      if (!Number.isFinite(value?.value) || value.value < 0 || !['ms', 's'].includes(value.unit)) {
        throw new Error('Durations require a non-negative value and ms/s unit');
      }
      return `${value.value}${value.unit}`;
    case 'cubicBezier':
      if (!Array.isArray(value) || value.length !== 4
        || value.some((number) => !Number.isFinite(number))
        || value[0] < 0 || value[0] > 1 || value[2] < 0 || value[2] > 1) {
        throw new Error('Easing requires four finite cubic Bezier coordinates with x in [0, 1]');
      }
      return `cubic-bezier(${value.join(', ')})`;
    case 'strokeStyle':
      if (!['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'outset', 'inset'].includes(value)) {
        throw new Error('Unsupported named stroke style');
      }
      return value;
    case 'shadow': {
      const shadows = Array.isArray(value) ? value : [value];
      if (!shadows.length) throw new Error('Shadows must contain at least one layer');
      return shadows.map((shadow) => {
        if (!shadow || typeof shadow !== 'object') throw new Error('Shadows require structured layers');
        if (shadow.inset !== undefined && typeof shadow.inset !== 'boolean') {
          throw new Error('Shadow inset must be boolean');
        }
        if (shadow.blur?.value < 0) throw new Error('Shadow blur must be non-negative');
        return [
          ...['offsetX', 'offsetY', 'blur', 'spread'].map((key) => serializeValue(shadow[key], 'dimension')),
          serializeValue(shadow.color, 'color'),
          ...(shadow.inset === true ? ['inset'] : []),
        ].join(' ');
      }).join(', ');
    }
    default:
      throw new Error(`Unsupported token type: ${type}`);
  }
}

function cssValue(value, type, tokens) {
  if (typeof value === 'string' && aliasPattern.test(value)) {
    return `var(${tokenVariable(value.match(aliasPattern)[1])})`;
  }
  if (type === 'shadow') {
    return (Array.isArray(value) ? value : [value]).map((shadow) => [
      ...['offsetX', 'offsetY', 'blur', 'spread'].map((key) => cssValue(shadow[key], 'dimension', tokens)),
      cssValue(shadow.color, 'color', tokens),
      ...(shadow.inset === true ? ['inset'] : []),
    ].join(' ')).join(', ');
  }
  return serializeValue(resolveValue(value, type, tokens, []), type);
}

export function serializeToken(token, tokens, { resolved = false } = {}) {
  const dictionary = tokenMap(tokens);
  const value = resolveToken(token, dictionary);
  const css = serializeValue(value, token.type);
  return resolved ? css : cssValue(token.value, token.type, dictionary);
}

export function tokenReferences(value) {
  if (typeof value === 'string') return value.match(aliasPattern) ? [value.slice(1, -1)] : [];
  if (Array.isArray(value)) return value.flatMap(tokenReferences);
  if (value && typeof value === 'object') return Object.values(value).flatMap(tokenReferences);
  return [];
}

export function dependencyChain(token, tokens) {
  const dictionary = tokenMap(tokens);
  resolveToken(token, dictionary);
  const paths = new Set([token.path]);
  const visit = (value) => {
    tokenReferences(value).forEach((path) => {
      if (!paths.has(path)) {
        paths.add(path);
        visit(dictionary.get(path).value);
      }
    });
  };
  visit(token.value);
  return [...paths];
}

function validateLayers(tokens, requireMetadata) {
  const dictionary = tokenMap(tokens);
  tokens.forEach((token) => {
    const references = tokenReferences(token.value);
    if (token.pair && dictionary.get(token.pair)?.type !== 'color') {
      throw new Error(`${token.path}: invalid paired color role ${token.pair}`);
    }
    if (['system', 'component'].includes(token.layer) && !aliasPattern.test(token.value)) {
      throw new Error(`${token.path}: ${token.layer} tokens must alias a lower-level role`);
    }
    references.forEach((path) => {
      const target = dictionary.get(path);
      if (token.layer === 'component' && target.layer !== 'system') {
        throw new Error(`${token.path}: component tokens must alias system roles`);
      }
      if (token.layer === 'system' && (!['reference', 'system'].includes(target.layer) || target.scope === 'evidence')) {
        throw new Error(`${token.path}: system roles cannot depend on components or source evidence`);
      }
      if (token.layer === 'reference' && target.layer !== 'reference') {
        throw new Error(`${token.path}: reference tokens cannot depend on higher layers`);
      }
      if (token.scope === 'runtime' && target.scope === 'evidence') {
        throw new Error(`${token.path}: runtime values cannot depend on source evidence`);
      }
    });
    if (requireMetadata && (!token.category || !token.cssProperty || !token.scope)) {
      throw new Error(`${token.path}: category, cssProperty and scope metadata are required`);
    }
    if (requireMetadata) {
      const contract = specimenContracts[token.category];
      if (!contract?.types.includes(token.type)
        || !contract.properties.includes(token.cssProperty)) {
        throw new Error(`${token.path}: invalid category/type/CSS-property contract`);
      }
      if (!['runtime', 'evidence', 'preview'].includes(token.scope)) {
        throw new Error(`${token.path}: invalid token scope ${token.scope}`);
      }
      if (token.audience === 'author' && token.scope !== 'evidence') {
        throw new Error(`${token.path}: authoring-only values must remain evidence`);
      }
    }
  });
}

export function createDictionary(document) {
  const tokens = flattenTokens(document);
  const names = new Set();
  tokens.forEach((token) => {
    if (names.has(token.variable)) throw new Error(`CSS variable collision: ${token.variable}`);
    names.add(token.variable);
  });
  const byPath = tokenMap(tokens);
  tokens.forEach((token) => serializeToken(token, byPath));
  tokens.filter((token) => token.type === 'color' && !token.pair).forEach((token) => {
    const paired = dependencyChain(token, byPath).map((path) => byPath.get(path))
      .find((target) => target.pair);
    if (paired) token.pair = paired.pair;
  });
  validateLayers(tokens, document.$extensions?.[metadataKey]?.version === 1);
  return { tokens, byPath };
}

export function mergeTheme(base, override) {
  const baseTokens = tokenMap(flattenTokens(base));
  flattenTokens(override).forEach((token) => {
    if (token.layer === 'reference') {
      if (!token.path.startsWith('reference.color.preview.')) {
        throw new Error(`Theme primitives must use the preview color namespace: ${token.path}`);
      }
    } else if (token.layer !== 'system' || !baseTokens.has(token.path)) {
      throw new Error(`Theme overrides must target existing system roles: ${token.path}`);
    } else if (token.type !== baseTokens.get(token.path).type) {
      throw new Error(`Theme override type mismatch: ${token.path}`);
    }
  });
  const merge = (original, addition) => {
    if (Array.isArray(addition)) return structuredClone(addition);
    if (!addition || typeof addition !== 'object') return addition;
    if (!original || Object.hasOwn(addition, '$value')) return { ...original, ...addition };
    const keys = [...new Set([...Object.keys(original), ...Object.keys(addition)])];
    return Object.fromEntries(keys.map((key) => [
      key,
      key in addition && key in original && typeof addition[key] === 'object'
        ? merge(original[key], addition[key])
        : addition[key] ?? original[key],
    ]));
  };
  const document = merge(base, override);
  createDictionary(document);
  return document;
}

export function generateCSS(document, selector, { evidenceOnly = false } = {}) {
  const { tokens, byPath } = createDictionary(document);
  const selected = tokens.filter((token) => (evidenceOnly
    ? token.scope === 'evidence' : token.scope !== 'evidence'));
  return `${selector} {\n${selected.map((token) => `  ${token.variable}: ${serializeToken(token, byPath)};`).join('\n')}\n}\n`;
}
