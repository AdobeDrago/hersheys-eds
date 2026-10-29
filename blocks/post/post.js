const DEFAULT_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts/1';

/**
 * Reads the endpoint from the authored link or text, falling back to the default.
 * @param {Element} block
 * @returns {string}
 */
function readEndpoint(block) {
  const authored = block.querySelector('a[href]')?.href || block.textContent.trim();
  return authored || DEFAULT_ENDPOINT;
}

/**
 * Returns the post if the payload has the expected shape, otherwise null.
 * @param {unknown} data
 * @returns {{ id: number, userId: number, title: string, body: string } | null}
 */
function parsePost(data) {
  if (!data || typeof data !== 'object') return null;
  const {
    id, userId, title, body,
  } = data;
  const valid = Number.isInteger(id) && Number.isInteger(userId)
    && typeof title === 'string' && typeof body === 'string';
  return valid ? {
    id, userId, title, body,
  } : null;
}

async function fetchPost(endpoint) {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const post = parsePost(await response.json());
  if (!post) throw new Error('Unexpected response shape');
  return post;
}

function renderPost(post) {
  const article = document.createElement('article');

  const meta = document.createElement('p');
  meta.className = 'post-meta';
  meta.textContent = `Post #${post.id} · User ${post.userId}`;

  const title = document.createElement('h2');
  title.className = 'post-title';
  title.textContent = post.title;

  const body = document.createElement('div');
  body.className = 'post-body';
  body.append(...post.body.split('\n').map((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    return p;
  }));
  
  article.append(meta, title, body);
  return article;
}

function renderMessage(text, className) {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
}

export default async function decorate(block) {
  const endpoint = readEndpoint(block);
  block.setAttribute('aria-busy', 'true');
  block.replaceChildren(renderMessage('Loading…', 'post-loading'));

  try {
    const post = await fetchPost(endpoint);
    block.replaceChildren(renderPost(post));
  } catch (error) {
    block.replaceChildren(renderMessage('Sorry, this content could not be loaded.', 'post-error'));
    // eslint-disable-next-line no-console
    console.error(`post: failed to load ${endpoint}`, error);
  } finally {
    block.removeAttribute('aria-busy');
  }
}
