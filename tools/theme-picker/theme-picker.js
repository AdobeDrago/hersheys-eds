// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

import { DEFAULT_THEME, BRAND_THEMES } from '../../scripts/brand-themes.js';

const THEMES = [DEFAULT_THEME, ...BRAND_THEMES];

const THEME_KEY = 'theme';

function normalizePath(path) {
  const clean = (path || '/index').replace(/\.html$/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function sourceUrl({ org, repo, path }) {
  return `https://admin.da.live/source/${org}/${repo}${path}.html`;
}

function cellText(cell) {
  return (cell?.textContent || '').trim();
}

// read-only: the panel only shows the current theme, the author pastes the new one
async function fetchTheme(url, token) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`DA responded ${resp.status}`);
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const metadata = doc.querySelector('main .metadata');
  const row = metadata && [...metadata.children]
    .find((item) => cellText(item.children[0]).toLowerCase() === THEME_KEY);
  return row ? cellText(row.children[1]) : '';
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // clipboard API can be blocked in the panel iframe; fall back to a selection copy
    const input = document.createElement('textarea');
    input.value = value;
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  }
}

// product pages use the base themes (no `file`), brand pages the ones in brands.css;
// any other page has no matching group, so every theme is shown
function themesForPath(path) {
  if (/^\/products(\/|$)/.test(path)) return THEMES.filter((t) => !t.file);
  if (/^\/brands(\/|$)/.test(path)) return THEMES.filter((t) => t.file === 'brands');
  return THEMES;
}

function renderChips(list, themes, onSelect) {
  list.replaceChildren(...themes.map(({ label, value }) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-picker-chip';
    button.textContent = label;
    button.title = `Copy ${value}`;
    button.dataset.value = value;
    button.addEventListener('click', () => onSelect(value));
    li.append(button);
    return li;
  }));
}

function markCurrent(list, theme) {
  list.querySelectorAll('.theme-picker-chip').forEach((button) => {
    const isCurrent = button.dataset.value === theme;
    button.classList.toggle('is-current', isCurrent);
    button.setAttribute('aria-pressed', isCurrent);
  });
}

(async function init() {
  const list = document.querySelector('.theme-picker-list');
  const current = document.querySelector('.theme-picker-current-value');
  const status = document.querySelector('.theme-picker-status');

  const { context, token } = await DA_SDK;
  const path = normalizePath(context.path);
  const matching = themesForPath(path);
  let showAll = matching.length === THEMES.length;
  let theme = '';

  const onSelect = async (value) => {
    status.textContent = await copyToClipboard(value)
      ? `Copied ${value}. Paste it into Page → Page Metadata → theme.`
      : `Could not copy. Type ${value} into the theme field.`;
  };
  const render = () => {
    renderChips(list, showAll ? THEMES : matching, onSelect);
    markCurrent(list, theme);
  };

  if (!showAll) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-picker-toggle';
    const label = () => { toggle.textContent = showAll ? 'Show matching themes' : 'Show all themes'; };
    toggle.addEventListener('click', () => { showAll = !showAll; label(); render(); });
    label();
    list.before(toggle);
  }

  render();
  status.textContent = 'Click a theme to copy its value.';

  try {
    theme = await fetchTheme(sourceUrl({ org: context.org, repo: context.repo, path }), token);
    current.textContent = theme || 'not set';
    markCurrent(list, theme);
  } catch {
    current.textContent = 'unknown';
  }
}());
