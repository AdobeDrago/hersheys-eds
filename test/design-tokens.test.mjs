import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createDictionary, mergeTheme, metadataKey, resolveToken, serializeToken,
} from '../design/token-dictionary.mjs';

const generator = new URL('../design/generate-tokens.mjs', import.meta.url);
const tokenFile = new URL('../design/tokens.json', import.meta.url);

function fixture(t, tokens) {
  const directory = mkdtempSync(join(tmpdir(), 'hershey-tokens-'));
  t.after(() => rmSync(directory, { recursive: true }));
  copyFileSync(generator, join(directory, 'generate-tokens.mjs'));
  copyFileSync(new URL('../design/token-dictionary.mjs', import.meta.url), join(directory, 'token-dictionary.mjs'));
  mkdirSync(join(directory, 'themes'));
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
  assert.match(f.css(), /--hershey-menu: 0px 6px var\(--hershey-blur\) 0px var\(--hershey-ink\)/);
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
  ['mixed token and group', { x: { $type: 'number', $value: 1, child: { $type: 'number', $value: 2 } } }, /Tokens cannot contain child groups/],
  ['CSS variable collision', {
    'a-b': { c: { $type: 'number', $value: 1 } },
    a: { 'b-c': { $type: 'number', $value: 2 } },
  }, /CSS variable collision/],
  ['literal semantic value', { system: { size: { $type: 'dimension', $value: { value: 24, unit: 'px' } } } }, /system tokens must alias/],
  ['literal component value', { component: { size: { $type: 'number', $value: 1 } } }, /component tokens must alias/],
  ['component bypassing semantics', {
    reference: { value: { $type: 'number', $value: 1 } },
    component: { value: { $type: 'number', $value: '{reference.value}' } },
  }, /component tokens must alias system/],
  ['semantic coupling to source evidence', {
    reference: { source: { $extensions: { [metadataKey]: { scope: 'evidence' } }, value: { $type: 'number', $value: 1 } } },
    system: { value: { $type: 'number', $value: '{reference.source.value}' } },
  }, /cannot depend on components or source evidence/],
  ['upward reference dependency', {
    reference: { a: { $type: 'number', $value: 1 }, b: { $type: 'number', $value: '{system.value}' } },
    system: { value: { $type: 'number', $value: '{reference.a}' } },
  }, /reference tokens cannot depend on higher layers/],
  ['missing catalog metadata', {
    $extensions: { [metadataKey]: { version: 1 } },
    reference: { value: { $type: 'number', $value: 1 } },
  }, /metadata are required/],
  ['fractional font weight', { weight: { $type: 'fontWeight', $value: 400.5 } }, /Invalid numeric font weight/],
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
  assert.equal(tokens.system.typography['heading-2']['font-size'].mobile.$value, '{reference.typography.size.30}');
  const foundations = JSON.parse(readFileSync(new URL('../design/source-clientlib-foundations.json', import.meta.url), 'utf8'));
  assert.equal(foundations.animationLibrary.computedRoot['--animate-delay'], '1s');
  assert.equal(tokens.reference.motion.delay['1000'].$value.value, 1000);
  assert.equal(tokens.reference.motion.delay['5000'].$value.value, 5000);
});

test('catalog contains all three architecture layers and requested categories', () => {
  const tokens = JSON.parse(readFileSync(tokenFile, 'utf8'));
  assert.ok(tokens.reference && tokens.system && tokens.component);
  const expected = [
    'reference.source', 'reference.color.brand', 'reference.color.neutral', 'reference.color.feedback.red',
    'system.color.surface', 'system.color.icon', 'system.color.action.primary.background.hover',
    'system.color.feedback.error', 'system.typography.body.font-family', 'system.typography.body.font-size',
    'system.typography.body.line-height', 'system.typography.heading.font-weight', 'system.typography.label.letter-spacing',
    'reference.spacing', 'system.layout', 'system.shape.radius', 'system.border.style',
    'system.border.width.control', 'system.elevation.shadow', 'system.elevation.layer',
    'system.motion.interaction.duration', 'system.motion.interaction.delay', 'system.motion.interaction.easing',
    'component.header', 'component.footer', 'component.cards', 'component.columns', 'component.tabs',
  ];
  expected.forEach((path) => {
    assert.ok(path.split('.').reduce((node, part) => node?.[part], tokens), `Missing category: ${path}`);
  });
  assert.equal(tokens.reference.source.feedback['author-warning'].$extensions[metadataKey].audience, 'author');
});

test('runtime role aliases do not couple typography, radius or border decisions to the spacing scale', () => {
  const { tokens } = createDictionary(JSON.parse(readFileSync(tokenFile, 'utf8')));
  tokens.filter((token) => token.layer === 'system'
    && ['size', 'family', 'weight', 'lineHeight', 'radius'].includes(token.category))
    .forEach((token) => assert.doesNotMatch(token.value, /^\{reference\.spacing\./, token.path));
  tokens.filter((token) => token.layer === 'component')
    .forEach((token) => assert.match(token.value, /^\{system\./, token.path));
});

test('multi-layer shadows preserve composite aliases and validate their child types', () => {
  const document = {
    ink: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 } },
    shadow: {
      $type: 'shadow',
      $value: [false, true].map((inset) => ({
        color: '{ink}',
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 1, unit: 'px' },
        blur: { value: 2, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        inset,
      })),
    },
  };
  const dictionary = createDictionary(document);
  const shadow = dictionary.byPath.get('shadow');
  assert.equal(resolveToken(shadow, dictionary.byPath).length, 2);
  assert.match(serializeToken(shadow, dictionary.byPath), /var\(--hershey-ink\),.*var\(--hershey-ink\) inset/);
  document.shadow.$value[0].blur = '{ink}';
  assert.throws(() => createDictionary(document), /Reference type mismatch/);
});

test('Cocoa is a typed preview overlay and updates semantic-to-component chains', () => {
  const base = JSON.parse(readFileSync(tokenFile, 'utf8'));
  const theme = JSON.parse(readFileSync(new URL('../design/themes/cocoa.tokens.json', import.meta.url), 'utf8'));
  const dictionary = createDictionary(mergeTheme(base, theme));
  const text = dictionary.byPath.get('system.color.text.primary');
  const header = dictionary.byPath.get('component.header.color.text');
  assert.deepEqual(resolveToken(text, dictionary.byPath), resolveToken(header, dictionary.byPath));
  assert.equal(resolveToken(header, dictionary.byPath).hex, '#fff8f5');
  assert.equal(resolveToken(dictionary.byPath.get('reference.color.brand.chocolate'), dictionary.byPath).hex, '#3f000b');
  assert.throws(() => mergeTheme(base, { system: { invented: { $type: 'color', $value: '{reference.color.brand.blue}' } } }), /existing system roles/);
  assert.throws(() => mergeTheme(base, { reference: { source: { bad: { $type: 'number', $value: 1 } } } }), /preview color namespace/);
  assert.throws(() => mergeTheme(base, { system: { color: { text: { primary: { $type: 'number', $value: 1 } } } } }), /Theme override type mismatch/);
});

test('source and authoring evidence is not emitted as a customer runtime API', () => {
  const document = JSON.parse(readFileSync(tokenFile, 'utf8'));
  const { tokens } = createDictionary(document);
  const css = readFileSync(new URL('../design/tokens.css', import.meta.url), 'utf8');
  const sourceCSS = readFileSync(new URL('../design/source-tokens.css', import.meta.url), 'utf8');
  tokens.filter((token) => token.scope === 'evidence').forEach((token) => {
    assert.ok(!css.includes(`${token.variable}:`), token.path);
    assert.ok(sourceCSS.includes(`${token.variable}:`), token.path);
  });
  const authoring = tokens.filter((token) => token.audience === 'author');
  assert.equal(authoring.length, 4);
  assert.ok(authoring.every((token) => token.scope === 'evidence'));
});

test('catalog metadata validates semantic specimen contracts instead of guessing from token names', () => {
  const document = {
    $extensions: { [metadataKey]: { version: 1, scope: 'runtime' } },
    reference: {
      value: {
        $type: 'dimension',
        $value: { value: 24, unit: 'px' },
        $extensions: { [metadataKey]: { category: 'size', cssProperty: 'padding' } },
      },
    },
  };
  assert.throws(() => createDictionary(document), /invalid category\/type\/CSS-property contract/);
  document.reference.value.$extensions[metadataKey].cssProperty = 'font-size';
  assert.doesNotThrow(() => createDictionary(document));
  document.reference.value.$extensions[metadataKey].audience = 'author';
  assert.throws(() => createDictionary(document), /authoring-only values must remain evidence/);
});

test('all block/theme Hershey variables are declared in the generated catalog', () => {
  const css = readFileSync(new URL('../design/tokens.css', import.meta.url), 'utf8');
  const declared = new Set([...css.matchAll(/(--hershey-[\w-]+):/g)].map((match) => match[1]));
  const paths = [
    'styles/hershey-home.css', 'blocks/cards/cards.css', 'blocks/columns/columns.css',
    'blocks/tabs/tabs.css', 'blocks/header/header.css', 'blocks/footer/footer.css', 'blocks/hero/hero.css',
  ];
  paths.forEach((path) => {
    const content = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    [...content.matchAll(/var\((--hershey-[\w-]+)/g)].forEach((match) => {
      assert.ok(declared.has(match[1]), `${path}: undeclared ${match[1]}`);
    });
  });
});
