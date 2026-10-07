import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const input = new URL('./tokens.json', import.meta.url);
const output = new URL('./tokens.css', import.meta.url);
const tokens = new Map();

function collect(group, inheritedType, path = []) {
  const type = group.$type ?? inheritedType;
  Object.entries(group).filter(([name]) => !name.startsWith('$')).forEach(([name, node]) => {
    if (/[.{}]/.test(name) || !node || typeof node !== 'object' || Array.isArray(node)) {
      throw new Error(`Invalid token/group: ${[...path, name].join('.')}`);
    }
    const tokenPath = [...path, name];
    if (Object.hasOwn(node, '$value')) {
      tokens.set(tokenPath.join('.'), { type: node.$type ?? type, value: node.$value });
    } else {
      collect(node, type, tokenPath);
    }
  });
}

function resolve(value, type, chain = []) {
  if (typeof value === 'string' && value.startsWith('{')) {
    const match = value.match(/^\{([^{}]+)\}$/);
    const name = match?.[1];
    const token = tokens.get(name);
    if (!token) throw new Error(`Unknown token reference: ${value}`);
    if (chain.includes(name)) throw new Error(`Circular token reference: ${[...chain, name].join(' -> ')}`);
    if (token.type !== type) throw new Error(`Reference type mismatch: ${name} (${token.type}, expected ${type})`);
    return resolve(token.value, type, [...chain, name]);
  }
  return value;
}

function serialize(value, type, chain) {
  const resolved = resolve(value, type, chain);
  switch (type) {
    case 'dimension':
      if (!Number.isFinite(resolved.value) || !['px', 'rem'].includes(resolved.unit)) {
        throw new Error('Dimensions require a finite value and px/rem unit');
      }
      return `${resolved.value}${resolved.unit}`;
    case 'color': {
      const { colorSpace, components, alpha = 1 } = resolved;
      if (colorSpace !== 'srgb' || !Array.isArray(components) || components.length !== 3
        || [...components, alpha].some((n) => !Number.isFinite(n) || n < 0 || n > 1)) {
        throw new Error('Colors require normalized sRGB components and alpha');
      }
      const hex = `#${components.map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('')}`;
      if (resolved.hex && resolved.hex.toLowerCase() !== hex) throw new Error(`Color hex mismatch: ${resolved.hex}`);
      const cssHex = alpha === 1 ? hex : `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
      return /^#(?:([0-9a-f])\1)(?:([0-9a-f])\2)(?:([0-9a-f])\3)(?:([0-9a-f])\4)?$/.test(cssHex)
        ? `#${cssHex.slice(1).match(/../g).map((pair) => pair[0]).join('')}` : cssHex;
    }
    case 'fontFamily': {
      const families = Array.isArray(resolved) ? resolved : [resolved];
      if (!families.length || families.some((name) => typeof name !== 'string' || !name.trim())) {
        throw new Error('Font families must be non-empty strings');
      }
      return families.map((name) => (/^[a-z][a-z0-9-]*$/.test(name) ? name : JSON.stringify(name))).join(', ');
    }
    case 'fontWeight':
      if (!Number.isFinite(resolved) || resolved < 1 || resolved > 1000) throw new Error('Invalid numeric font weight');
      return String(resolved);
    case 'number':
      if (!Number.isFinite(resolved)) throw new Error('Number tokens must be finite');
      return String(resolved);
    case 'duration':
      if (!Number.isFinite(resolved.value) || resolved.value < 0 || !['ms', 's'].includes(resolved.unit)) {
        throw new Error('Durations require a non-negative value and ms/s unit');
      }
      return `${resolved.value}${resolved.unit}`;
    case 'cubicBezier':
      if (!Array.isArray(resolved) || resolved.length !== 4
        || resolved.some((n) => !Number.isFinite(n))
        || resolved[0] < 0 || resolved[0] > 1 || resolved[2] < 0 || resolved[2] > 1) {
        throw new Error('Easing requires four finite cubic Bezier coordinates with x in [0, 1]');
      }
      return `cubic-bezier(${resolved.join(', ')})`;
    case 'strokeStyle':
      if (!['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'outset', 'inset'].includes(resolved)) {
        throw new Error('Unsupported named stroke style');
      }
      return resolved;
    case 'shadow':
      return [
        serialize(resolved.offsetX, 'dimension', chain),
        serialize(resolved.offsetY, 'dimension', chain),
        serialize(resolved.blur, 'dimension', chain),
        serialize(resolved.spread, 'dimension', chain),
        serialize(resolved.color, 'color', chain),
      ].join(' ');
    default:
      throw new Error(`Unsupported token type: ${type}`);
  }
}

const document = JSON.parse(await readFile(input, 'utf8'));
collect(document);
const declarations = [...tokens].map(([name, token]) => {
  const value = serialize(token.value, token.type, [name]);
  const reference = typeof token.value === 'string' && token.value.match(/^\{([^{}]+)\}$/);
  return `  --hershey-${name.replaceAll('.', '-')}: ${reference ? `var(--hershey-${reference[1].replaceAll('.', '-')})` : value};`;
});
const css = `/* Generated from design/tokens.json (DTCG 2025.10). Do not edit directly. */
:where(.hershey-home, .header.hershey-nav, .footer.hershey-footer) {
${declarations.join('\n')}
}
`;

if (process.argv.includes('--check')) {
  if (await readFile(output, 'utf8') !== css) {
    throw new Error('Generated tokens.css is stale. Run node design/generate-tokens.mjs');
  }
} else {
  await writeFile(output, css);
}
// eslint-disable-next-line no-console
console.log(`${tokens.size} tokens validated; ${fileURLToPath(output)} ${process.argv.includes('--check') ? 'is current' : 'generated'}.`);
