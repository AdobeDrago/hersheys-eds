import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const widgetModule = `/@fs${new URL('../../blocks/widget/widget.js', import.meta.url).pathname}`;
const columnsModule = `/@fs${new URL('../../blocks/columns/columns.js', import.meta.url).pathname}`;

async function open(page, id) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator('[data-showcase]')).toBeVisible();
}

test('multiple headers use instance-local IDs and Escape handlers', async ({ page }) => {
  await open(page, 'blocks-page-structure--header');
  await expect(page.locator('[data-block-status="loaded"]')).toHaveCount(1);
  await page.evaluate(async () => {
    const { Header } = await import('../../../../../../../markup/page-structure.stories.js');
    document.querySelector('.story-shell').append(Header.render());
  });
  await expect(page.locator('[data-block-status="loaded"]')).toHaveCount(2);
  const navs = page.getByRole('navigation');
  await expect(navs).toHaveCount(2);
  const ids = await page.locator('[data-showcase] [id]').evaluateAll(
    (nodes) => nodes.map((node) => node.id),
  );
  expect(new Set(ids).size).toBe(ids.length);
  const menu = navs.nth(1).getByRole('button', { name: 'Chocolate', exact: true });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await menu.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('widget loader rejects missing links and HTTP errors instead of successful error HTML', async ({ page }) => {
  await open(page, 'blocks-widget-loader--default');
  await expect(page.locator('[data-widget-ready]')).toBeVisible();
  await page.route('**/widgets/missing.html', (route) => route.fulfill({ status: 404, body: 'Not found' }));
  const errors = await page.evaluate(async (url) => {
    const { default: decorate } = await import(url);
    const failures = [];
    for (const href of [null, '/widgets/missing.html', '/outside/name.html']) {
      const block = document.createElement('div');
      block.className = 'widget block';
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        block.append(link);
      }
      try {
        await decorate(block);
        failures.push({ succeeded: true });
      } catch (error) {
        failures.push({
          message: error.message,
          cause: error.cause?.message,
          text: block.textContent,
        });
      }
    }
    return failures;
  }, widgetModule);
  expect(errors[0].message).toContain('authored source link');
  expect(errors[1].cause).toContain('HTTP 404');
  expect(errors[1].text).not.toContain('Not found');
  expect(errors[2].message).toContain('/widgets/');
});

test('widget query parameters support kebab-case and camelCase metadata', async ({ page }) => {
  await open(page, 'blocks-widget-loader--default');
  await expect(page.locator('[data-widget-ready]')).toBeVisible();
  const data = await page.evaluate(async (url) => {
    const { default: decorate } = await import(url);
    const block = document.createElement('div');
    block.className = 'widget block';
    const link = document.createElement('a');
    link.href = '/widgets/storybook-demo.html?heading=Configured&font-size=18&maxItems=4';
    block.append(link);
    document.querySelector('[data-showcase]').append(block);
    await decorate(block);
    return { ...block.dataset };
  }, widgetModule);
  expect(data.fontSize).toBe('18');
  expect(data.maxItems).toBe('4');
  expect(data.heading).toBe('Configured');
});

test('concurrent widget instances await the same stylesheet completion', async ({ page }) => {
  await open(page, 'widgets-interactive-fixture--default');
  await page.route('**/widgets/concurrent.html', (route) => route.fulfill({
    body: '<p>Concurrent fixture</p>', contentType: 'text/html',
  }));
  await page.route('**/widgets/concurrent.css', async (route) => {
    await new Promise((resolve) => { setTimeout(resolve, 150); });
    await route.fulfill({ body: '.concurrent { color: inherit; }', contentType: 'text/css' });
  });
  await page.route('**/widgets/concurrent.js*', (route) => route.fulfill({
    body: 'export default function decorate(widget) { widget.dataset.ready = "true"; }',
    contentType: 'text/javascript',
  }));
  const loaded = await page.evaluate(async (url) => {
    const { default: decorate } = await import(url);
    const instances = [1, 2].map(() => {
      const block = document.createElement('div');
      block.className = 'widget block';
      const link = document.createElement('a');
      link.href = '/widgets/concurrent.html';
      block.append(link);
      document.querySelector('[data-showcase]').append(block);
      return block;
    });
    await Promise.all(instances.map(decorate));
    return {
      ready: instances.every((block) => block.dataset.ready === 'true'),
      styled: [...document.styleSheets].some((sheet) => sheet.href?.endsWith('/widgets/concurrent.css')),
    };
  }, widgetModule);
  expect(loaded).toEqual({ ready: true, styled: true });
});

test('responsive Columns retains a mobile fallback when the desktop picture has no img', async ({ page }) => {
  await open(page, 'blocks-columns--feature');
  const result = await page.evaluate(async (url) => {
    const { default: decorate } = await import(url);
    const block = document.createElement('div');
    block.className = 'columns homepage-hero block';
    block.innerHTML = '<div><div><h1>Headline</h1></div><div><picture><source srcset="desktop.png"></picture><picture><img src="mobile.png" alt="Mobile fallback"></picture></div></div>';
    decorate(block);
    return {
      alt: block.querySelector('img').alt,
      eager: block.querySelector('img').loading,
      sourceCount: block.querySelectorAll('picture source').length,
    };
  }, columnsModule);
  expect(result).toEqual({ alt: 'Mobile fallback', eager: 'eager', sourceCount: 2 });
});

test('Hero uses production foreground and has a readable image-omitted state', async ({ page }) => {
  await open(page, 'blocks-hero--default');
  await expect(page.locator('.hero')).toHaveCSS('isolation', 'isolate');
  await expect(page.locator('.hero h1')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.hero p')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await open(page, 'blocks-hero--without-image');
  await expect(page.locator('.hero h1')).toHaveCSS('color', 'rgb(63, 0, 11)');
});

test('real Fragment decorator accepts an absolute authored branch URL', async ({ page }) => {
  const head = await readFile(new URL('../../head.html', import.meta.url), 'utf8');
  await page.route('http://localhost:3000/block-fragment-check', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html><head>${head}<meta name="template" content="hershey-home"></head><body><header></header><main><div><div class="fragment"><div><div><a href="https://migrate-hersheyland-homepage--hersheys-eds--adobedrago.aem.page/nav">Navigation fragment</a></div></div></div></div></main><footer></footer></body></html>`,
  }));
  await page.goto('http://localhost:3000/block-fragment-check');
  await expect(page.locator('main > .section')).toHaveCount(3);
  await expect(page.locator('main .fragment')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('Hershey');
});
