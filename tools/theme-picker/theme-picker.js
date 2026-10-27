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

function findThemeRow(metadata) {
  return [...metadata.children]
    .find((row) => cellText(row.children[0]).toLowerCase() === THEME_KEY);
}

function readTheme(doc) {
  const metadata = doc.querySelector('main .metadata');
  const row = metadata && findThemeRow(metadata);
  return row ? cellText(row.children[1]) : '';
}

function createParagraph(doc, text) {
  const p = doc.createElement('p');
  p.textContent = text;
  return p;
}

function createRow(doc, key, value) {
  const row = doc.createElement('div');
  [key, value].forEach((text) => {
    const cell = doc.createElement('div');
    cell.append(createParagraph(doc, text));
    row.append(cell);
  });
  return row;
}

// updates the existing theme row; adds the row, or a metadata block, when missing
function writeTheme(doc, value) {
  const main = doc.querySelector('main');
  let metadata = main.querySelector('.metadata');
  if (!metadata) {
    metadata = doc.createElement('div');
    metadata.className = 'metadata';
    let section = main.lastElementChild;
    if (!section) {
      section = doc.createElement('div');
      main.append(section);
    }
    section.append(metadata);
  }
  const row = findThemeRow(metadata);
  if (row) {
    row.children[1].replaceChildren(createParagraph(doc, value));
  } else {
    metadata.append(createRow(doc, THEME_KEY, value));
  }
}

async function fetchDoc(url, token) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`DA responded ${resp.status}`);
  return new DOMParser().parseFromString(await resp.text(), 'text/html');
}

async function saveDoc(url, token, doc) {
  const body = new FormData();
  body.append('data', new Blob([doc.body.outerHTML], { type: 'text/html' }));
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!resp.ok) throw new Error(`DA responded ${resp.status}`);
}

function renderChips(list, onApply) {
  list.replaceChildren(...THEMES.map(({ label, value }) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-picker-chip';
    button.textContent = label;
    button.title = `Set theme to ${value}`;
    button.dataset.value = value;
    button.addEventListener('click', () => onApply(value));
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

function setBusy(list, busy) {
  list.querySelectorAll('.theme-picker-chip').forEach((button) => {
    button.disabled = busy;
  });
}

// the editor is cross-origin, so reload() is blocked; navigating top is allowed.
// a fresh query string forces a full load, since a hash-only change would not.
function reloadEditor({ org, repo, path }, ref) {
  const params = new URLSearchParams();
  if (ref) params.set('ref', ref);
  params.set('themed', Date.now());
  const url = `https://da.live/canvas?${params}#/${org}/${repo}${path}`;
  try {
    window.top.location.href = url;
    return true;
  } catch {
    return false;
  }
}

(async function init() {
  const list = document.querySelector('.theme-picker-list');
  const current = document.querySelector('.theme-picker-current-value');
  const status = document.querySelector('.theme-picker-status');

  const { context, token } = await DA_SDK;
  const site = {
    org: context.org,
    repo: context.repo,
    path: normalizePath(context.path),
  };
  const url = sourceUrl(site);

  let theme;
  try {
    theme = readTheme(await fetchDoc(url, token));
  } catch (error) {
    status.textContent = `Could not read page: ${error.message}`;
    return;
  }

  renderChips(list, async (value) => {
    if (value === theme) return;
    setBusy(list, true);
    status.textContent = 'Saving…';
    try {
      // re-read so edits made since the panel opened are kept
      const doc = await fetchDoc(url, token);
      writeTheme(doc, value);
      await saveDoc(url, token, doc);
    } catch (error) {
      status.textContent = `Could not save: ${error.message}`;
      setBusy(list, false);
      return;
    }
    theme = value;
    current.textContent = value;
    markCurrent(list, theme);
    setBusy(list, false);
    status.textContent = reloadEditor(site, context.ref)
      ? 'Saved. Reloading the editor…'
      : 'Saved. Reload the page, then preview to see the theme.';
  });

  current.textContent = theme || 'not set';
  markCurrent(list, theme);
  status.textContent = '';
}());
