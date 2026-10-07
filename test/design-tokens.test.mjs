import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const generator = new URL('../design/generate-tokens.mjs', import.meta.url);
const tokenFile = new URL('../design/tokens.json', import.meta.url);

function fixture(t, tokens) {
  const directory = mkdtempSync(join(tmpdir(), 'hershey-tokens-'));
  t.after(() => rmSync(directory, { recursive: true }));
  copyFileSync(generator, join(directory, 'generate-tokens.mjs'));
  writeFileSync(join(directory, 'tokens.json'), JSON.stringify(tokens));
  return {
    run: (...args) => execFileSync(process.execPath, [join(directory, 'generate-tokens.mjs'), ...args], { encoding: 'utf8', stdio: 'pipe' }),
    css: () => readFileSync(join(directory, 'tokens.css'), 'utf8'),
    writeCSS: (css) => writeFileSync(join(directory, 'tokens.css'), css),
  };
}

test('committed token CSS is current', () => {
  assert.match(execFileSync(process.execPath, [generator.pathname, '--check'], { encoding: 'utf8' }), /tokens validated/);
});

test('inherited types and aliases generate scoped variables', (t) => {
  const f = fixture(t, {
    space: { $type: 'dimension', base: { $value: { value: 24, unit: 'px' } }, card: { $value: '{space.base}' } },
  });
  f.run();
  assert.match(f.css(), /:where\(\.hershey-home, \.header\.hershey-nav, \.footer\.hershey-footer\)/);
  assert.match(f.css(), /--hershey-space-base: 24px/);
  assert.match(f.css(), /--hershey-space-card: var\(--hershey-space-base\)/);
  assert.doesNotMatch(f.css(), /:root/);
  f.run('--check');
  f.writeCSS('stale');
  assert.throws(() => f.run('--check'), /tokens.css is stale/);
});

test('DTCG color alpha, font families and shadow references serialize correctly', (t) => {
  const f = fixture(t, {
    ink: {
      $type: 'color',
      $value: {
        colorSpace: 'srgb', components: [0, 0, 0], alpha: 2 / 15, hex: '#000000',
      },
    },
    family: { $type: 'fontFamily', $value: ['Gazpacho', 'TT Norms Pro', 'sans-serif'] },
    blur: { $type: 'dimension', $value: { value: 12, unit: 'px' } },
    menu: {
      $type: 'shadow',
      $value: {
        color: '{ink}',
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 6, unit: 'px' },
        blur: '{blur}',
        spread: { value: 0, unit: 'px' },
      },
    },
  });
  f.run();
  assert.match(f.css(), /--hershey-ink: #0002/);
  assert.match(f.css(), /--hershey-family: "Gazpacho", "TT Norms Pro", sans-serif/);
  assert.match(f.css(), /--hershey-menu: 0px 6px 12px 0px #0002/);
});

test('DTCG motion and named stroke tokens serialize correctly', (t) => {
  const f = fixture(t, {
    duration: { $type: 'duration', $value: { value: 250, unit: 'ms' } },
    delay: { $type: 'duration', $value: { value: 0, unit: 's' } },
    easing: { $type: 'cubicBezier', $value: [0.25, 0.1, 0.25, 1] },
    border: { $type: 'strokeStyle', $value: 'solid' },
  });
  f.run();
  assert.match(f.css(), /--hershey-duration: 250ms/);
  assert.match(f.css(), /--hershey-delay: 0s/);
  assert.match(f.css(), /--hershey-easing: cubic-bezier\(0.25, 0.1, 0.25, 1\)/);
  assert.match(f.css(), /--hershey-border: solid/);
});

const invalidCases = [
  ['unknown reference', { $type: 'dimension', x: { $value: '{missing}' } }, /Unknown token reference/],
  ['reference cycle', { $type: 'dimension', x: { $value: '{y}' }, y: { $value: '{x}' } }, /Circular token reference/],
  ['mismatched reference type', { x: { $type: 'dimension', $value: '{y}' }, y: { $type: 'number', $value: 24 } }, /Reference type mismatch/],
  ['invalid dimension', { x: { $type: 'dimension', $value: { value: 24, unit: '%' } } }, /Dimensions require/],
  ['invalid color', { x: { $type: 'color', $value: { colorSpace: 'srgb', components: [2, 0, 0] } } }, /normalized sRGB/],
  ['inconsistent hex', { x: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#ffffff' } } }, /Color hex mismatch/],
  ['unsupported type', { x: { $type: 'unrecognized', $value: 1 } }, /Unsupported token type/],
  ['invalid duration', { x: { $type: 'duration', $value: { value: -1, unit: 'ms' } } }, /Durations require/],
  ['invalid easing', { x: { $type: 'cubicBezier', $value: [2, 0, 1, 1] } }, /Easing requires/],
  ['invalid stroke style', { x: { $type: 'strokeStyle', $value: 'invented' } }, /Unsupported named stroke/],
];
invalidCases.forEach(([name, tokens, error]) => {
  test(`rejects ${name}`, (t) => {
    assert.throws(() => fixture(t, tokens).run(), error);
  });
});

test('original-site typography remains distinct from EDS mappings', () => {
  const tokens = JSON.parse(readFileSync(tokenFile, 'utf8'));
  const observations = JSON.parse(readFileSync(new URL('../design/source-observations.json', import.meta.url), 'utf8'));
  assert.equal(observations.source, 'https://www.hersheyland.com/');
  observations.samples.forEach(({ width, styles }) => {
    const suffix = width >= 900 ? 'desktop' : 'mobile';
    assert.equal(`${tokens.reference.source.font.size[`h1-${suffix}`].$value.value}px`, styles.h1['font-size']);
    assert.equal(`${tokens.reference.source.font.size[`h2-${suffix}`].$value.value}px`, styles.h2['font-size']);
    assert.equal(`${tokens.reference.source.font.size.body.$value.value}px`, styles.body['font-size']);
  });
  assert.equal(tokens.system.font.size['h2-mobile'].$value, '{reference.space.30}');
});

test('catalog contains all three architecture layers and requested categories', () => {
  const tokens = JSON.parse(readFileSync(tokenFile, 'utf8'));
  assert.ok(tokens.reference && tokens.system && tokens.component);
  const expected = [
    'reference.palette', 'reference.neutral', 'reference.feedback.error',
    'system.color.surface', 'system.color.icon', 'system.color.action-hover',
    'system.color.feedback.error', 'system.font.family', 'system.font.size',
    'system.font.line-height', 'system.font.weight', 'system.font.letter-spacing',
    'reference.space', 'system.layout', 'system.radius', 'system.border.style',
    'system.border.control', 'system.shadow', 'system.elevation',
    'system.motion.duration', 'system.motion.delay', 'system.motion.easing',
    'component.header', 'component.footer', 'component.cards', 'component.columns', 'component.tabs',
  ];
  expected.forEach((path) => {
    assert.ok(path.split('.').reduce((node, part) => node?.[part], tokens), `Missing category: ${path}`);
  });
  assert.match(tokens.reference.feedback['author-warning'].$description, /authoring-only/);
});

test('all block/theme Hershey variables are declared in the generated catalog', () => {
  const css = readFileSync(new URL('../design/tokens.css', import.meta.url), 'utf8');
  const declared = new Set([...css.matchAll(/(--hershey-[\w-]+):/g)].map((match) => match[1]));
  const paths = [
    'styles/hershey-home.css', 'blocks/cards/cards.css', 'blocks/columns/columns.css',
    'blocks/tabs/tabs.css', 'blocks/header/header.css', 'blocks/footer/footer.css',
  ];
  paths.forEach((path) => {
    const content = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    [...content.matchAll(/var\((--hershey-[\w-]+)/g)].forEach((match) => {
      assert.ok(declared.has(match[1]), `${path}: undeclared ${match[1]}`);
    });
  });
});
