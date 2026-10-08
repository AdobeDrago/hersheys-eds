import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  categories, createDictionary, dependencyChain, displayCSSValue, resolveToken,
  selectTokens, serializeToken, tokenLabel,
} from '../foundations/catalog.js';

const catalog = JSON.parse(await readFile(new URL('../../design/tokens.json', import.meta.url)));
const { tokens, byPath } = createDictionary(catalog);

test('shared dictionary supplies typed metadata and source descriptions for all specimens', () => {
  tokens.forEach((token) => {
    assert.ok(token.type);
    assert.ok(token.descriptions.length);
    assert.ok(token.category);
    assert.ok(token.cssProperty);
    assert.ok(token.variable.startsWith('--hershey-'));
    assert.notEqual(resolveToken(token, byPath), undefined);
  });
});

test('all documented foundation categories have explicitly classified entries', () => {
  Object.keys(categories).forEach((category) => {
    assert.ok(selectTokens(tokens, category).length > 0, category);
  });
});

test('architecture separates source evidence, primitive values, semantic roles and component contracts', () => {
  const layers = ['reference', 'source', 'system', 'component'].flatMap((category) => selectTokens(tokens, category));
  assert.equal(layers.length, tokens.length);
  assert.equal(new Set(layers.map((token) => token.path)).size, tokens.length);
  assert.equal(selectTokens(tokens, 'source').length, 29);
  assert.ok(selectTokens(tokens, 'reference').every((token) => token.scope !== 'evidence'));
  ['family', 'size', 'surface', 'text', 'gaps'].forEach((category) => {
    assert.ok(selectTokens(tokens, category).every((token) => token.layer === 'system'));
  });
});

test('validation roles exclude author-only warning and undefined customer states', () => {
  const feedback = selectTokens(tokens, 'feedback');
  assert.deepEqual(feedback.map((token) => token.path), ['system.color.feedback.error']);
  const warning = byPath.get('reference.source.feedback.author-warning');
  assert.equal(warning.audience, 'author');
  assert.equal(warning.scope, 'evidence');
  assert.equal(selectTokens(tokens, 'neutral').length, 7);
});

test('aliases use the shared compiler resolver and expose the semantic dependency chain', () => {
  const action = byPath.get('component.footer.newsletter.action.background');
  assert.deepEqual(dependencyChain(action, byPath), [
    action.path, 'system.color.action.primary.background.default', 'reference.color.brand.blue',
  ]);
  assert.deepEqual(resolveToken(action, byPath), resolveToken(byPath.get('reference.color.brand.blue'), byPath));
  assert.throws(() => resolveToken({ value: '{missing}' }, byPath), /Unknown token reference/);
  assert.throws(() => resolveToken({ value: '{loop}' }, [{ path: 'loop', value: '{loop}' }]), /Circular token reference/);
  assert.throws(() => selectTokens(tokens, 'missing'), /Unknown foundation category/);
});

test('component foreground specimens inherit their semantic color pairing', () => {
  const selected = byPath.get('component.tabs.control.selected.foreground');
  assert.equal(selected.pair, 'system.color.selection.background');
});

test('design-facing labels and values do not expose implementation identifiers', () => {
  tokens.forEach((token) => {
    const label = tokenLabel(token);
    const value = displayCSSValue(token, serializeToken(token, byPath, { resolved: true }));
    assert.ok(label.length);
    assert.ok(!/reference\.|system\.|component\.|--hershey|hershey-/.test(`${label} ${value}`));
    assert.ok(!value.includes('colorSpace'));
  });
  assert.equal(tokenLabel(byPath.get('component.cards.image.border-radius')), 'Cards / Image / Border radius');
  assert.equal(displayCSSValue(byPath.get('reference.color.brand.blue'), '#007bbd'), '#007BBD');
});
