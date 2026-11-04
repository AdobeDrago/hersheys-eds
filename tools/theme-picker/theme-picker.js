// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

import { DEFAULT_THEME, BRAND_THEMES } from '../../scripts/brand-themes.js';

const GROUPS = [
  { label: 'Product pages', themes: [DEFAULT_THEME, ...BRAND_THEMES.filter((t) => !t.file)] },
  { label: 'Brand pages', themes: BRAND_THEMES.filter((t) => t.file) },
];
const THEMES = GROUPS.flatMap((group) => group.themes);

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

function createSwatches(colors = []) {
  const swatches = document.createElement('span');
  swatches.className = 'theme-picker-swatches';
  swatches.setAttribute('aria-hidden', 'true');
  swatches.append(...colors.map((color) => {
    const dot = document.createElement('span');
    dot.style.background = color;
    return dot;
  }));
  return swatches;
}

function fillLabel(target, theme, empty = 'Not set') {
  const text = document.createElement('span');
  text.className = 'theme-picker-name';
  text.textContent = theme ? theme.label : empty;
  target.replaceChildren(createSwatches(theme?.colors), text);
}

function createDropdown(onSelect) {
  const root = document.querySelector('.theme-picker-dropdown');
  const trigger = root.querySelector('.theme-picker-trigger');
  const menu = root.querySelector('.theme-picker-menu');
  const options = [];

  menu.replaceChildren(...GROUPS.flatMap((group) => {
    const heading = document.createElement('li');
    heading.className = 'theme-picker-group';
    heading.setAttribute('role', 'presentation');
    heading.textContent = group.label;
    return [heading, ...group.themes.map((theme) => {
      const li = document.createElement('li');
      li.className = 'theme-picker-option';
      li.setAttribute('role', 'option');
      li.dataset.value = theme.value;
      li.tabIndex = -1;
      li.title = theme.value;
      fillLabel(li, theme);
      options.push(li);
      return li;
    })];
  }));

  const close = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    (options.find((o) => o.getAttribute('aria-selected') === 'true') || options[0]).focus();
  };

  trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', (event) => {
    const option = event.target.closest('.theme-picker-option');
    if (!option) return;
    close();
    trigger.focus();
    onSelect(option.dataset.value);
  });
  menu.addEventListener('keydown', (event) => {
    const index = options.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') options[Math.min(index + 1, options.length - 1)].focus();
    else if (event.key === 'ArrowUp') options[Math.max(index - 1, 0)].focus();
    else if (event.key === 'Home') options[0].focus();
    else if (event.key === 'End') options[options.length - 1].focus();
    else if (event.key === 'Enter' || event.key === ' ') document.activeElement.click();
    else if (event.key === 'Escape') {
      close();
      trigger.focus();
    } else return;
    event.preventDefault();
  });
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) close();
  });

  return {
    setValue(value, empty) {
      const theme = THEMES.find((t) => t.value === value);
      // a value outside the list (typo, retired theme) is shown as-is so authors can spot it
      fillLabel(trigger, theme || (value ? { label: `Unknown: ${value}` } : null), empty);
      options.forEach((option) => {
        option.setAttribute('aria-selected', option.dataset.value === value);
      });
    },
    setBusy(busy) {
      trigger.disabled = busy;
    },
  };
}

// DA_SDK only resolves when DA opens the panel in its iframe; elsewhere it never settles
const SDK_TIMEOUT = 3000;

function whenInDA() {
  return Promise.race([
    DA_SDK,
    new Promise((resolve) => { setTimeout(() => resolve(null), SDK_TIMEOUT); }),
  ]);
}

(async function init() {
  const current = document.querySelector('.theme-picker-current-value');
  const status = document.querySelector('.theme-picker-status');

  let site;
  let url;
  let token;
  let theme;
  let ref;

  // built before DA answers, so the list can be browsed outside DA too
  const dropdown = createDropdown(async (value) => {
    if (!site || value === theme) return;
    dropdown.setBusy(true);
    status.textContent = 'Saving…';
    try {
      // re-read so edits made since the panel opened are kept
      const doc = await fetchDoc(url, token);
      writeTheme(doc, value);
      await saveDoc(url, token, doc);
    } catch (error) {
      status.textContent = `Could not save: ${error.message}`;
      dropdown.setBusy(false);
      return;
    }
    theme = value;
    current.textContent = value;
    dropdown.setValue(theme);
    dropdown.setBusy(false);
    status.textContent = reloadEditor(site, ref)
      ? 'Saved. Reloading the editor…'
      : 'Saved. Reload the page, then preview to see the theme.';
  });

  const sdk = await whenInDA();
  if (!sdk) {
    dropdown.setValue('', 'Select a theme');
    current.textContent = 'unavailable';
    status.textContent = 'Preview only. Open this from the Themes panel in DA to read or save the page theme.';
    return;
  }

  const { context } = sdk;
  ({ token } = sdk);
  ref = context.ref;
  site = {
    org: context.org,
    repo: context.repo,
    path: normalizePath(context.path),
  };
  url = sourceUrl(site);

  try {
    theme = readTheme(await fetchDoc(url, token));
  } catch (error) {
    status.textContent = `Could not read page: ${error.message}`;
    dropdown.setBusy(true);
    return;
  }
  current.textContent = theme || 'not set';
  dropdown.setValue(theme);
}());
