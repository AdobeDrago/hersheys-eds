// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const GITHUB_REPO = 'AdobeDrago/hersheys-eds';
const DEFAULT_BRANCH = 'main';

function toRef(branch) {
  return branch.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function buildCanvasUrl({ org, repo, path }, ref) {
  const query = ref === DEFAULT_BRANCH ? '' : `?ref=${ref}`;
  return `https://da.live/canvas${query}#/${org}/${repo}${path}`;
}

function buildPreviewUrl({ org, repo, path }, ref) {
  const pagePath = path.replace(/\/index$/, '/');
  return `https://${ref}--${repo}--${org}.aem.page${pagePath}`;
}

function normalizePath(path) {
  const clean = (path || '/index').replace(/\.html$/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function sortBranches(names) {
  return [...names].sort((a, b) => {
    if (a === DEFAULT_BRANCH) return -1;
    if (b === DEFAULT_BRANCH) return 1;
    return a.localeCompare(b);
  });
}

async function fetchBranches() {
  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches?per_page=100`);
  if (!resp.ok) throw new Error(`GitHub responded ${resp.status}`);
  const json = await resp.json();
  if (!Array.isArray(json)) throw new Error('Unexpected GitHub response');
  return json.map((item) => item?.name).filter((name) => typeof name === 'string');
}

function navigateTop(url) {
  try {
    window.top.location.href = url;
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

function renderBranch(branch, site, currentRef) {
  const ref = toRef(branch);
  const li = document.createElement('li');
  li.className = 'branch-switcher-item';
  li.dataset.branch = branch.toLowerCase();
  if (ref === currentRef) li.classList.add('is-current');

  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'branch-switcher-open';
  open.textContent = branch;
  open.title = `Open this page with ?ref=${ref}`;
  open.addEventListener('click', () => navigateTop(buildCanvasUrl(site, ref)));

  const preview = document.createElement('a');
  preview.className = 'branch-switcher-preview';
  preview.href = buildPreviewUrl(site, ref);
  preview.target = '_blank';
  preview.rel = 'noopener';
  preview.textContent = 'Preview';

  li.append(open, preview);
  return li;
}

function filterList(list, term) {
  const needle = term.trim().toLowerCase();
  list.querySelectorAll('.branch-switcher-item').forEach((li) => {
    li.hidden = !li.dataset.branch.includes(needle);
  });
}

(async function init() {
  const list = document.querySelector('.branch-switcher-list');
  const status = document.querySelector('.branch-switcher-status');
  const search = document.querySelector('.branch-switcher-search');

  const { context } = await DA_SDK;
  const site = {
    org: context.org,
    repo: context.repo,
    path: normalizePath(context.path),
  };
  const currentRef = context.ref ? toRef(context.ref) : '';

  try {
    const branches = sortBranches(await fetchBranches());
    list.append(...branches.map((branch) => renderBranch(branch, site, currentRef)));
    status.textContent = `${branches.length} branches`;
  } catch (error) {
    status.textContent = `Could not load branches: ${error.message}`;
    return;
  }

  search.addEventListener('input', () => filterList(list, search.value));
}());
