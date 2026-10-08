import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const groups = {
  'foundations-overview': ['design-workspace'],
  'foundations-color': ['brand', 'neutral', 'surface', 'text', 'interactive', 'borders', 'feedback'],
  'foundations-typography': ['families', 'sizes', 'line-heights', 'weights', 'letter-spacing'],
  'foundations-spacing-layout': ['spacing', 'grid', 'gaps'],
  'foundations-shape-border': ['radii', 'widths', 'styles'],
  'foundations-depth-elevation': ['shadows', 'layers'],
  'foundations-motion-animation': ['durations', 'delays', 'easing'],
  'default-content-heading-1': ['default'],
  'default-content-overview': ['page-composition'],
  'default-content-heading-2': ['default'],
  'default-content-heading-3': ['default'],
  'default-content-heading-4': ['default'],
  'default-content-heading-5': ['default'],
  'default-content-heading-6': ['default'],
  'default-content-paragraph': ['default'],
  'default-content-strong': ['default'],
  'default-content-emphasis': ['default'],
  'default-content-citation': ['default'],
  'default-content-link': ['default'],
  'default-content-buttons': ['primary', 'secondary', 'accent'],
  'default-content-unordered-list': ['default'],
  'default-content-ordered-list': ['default'],
  'default-content-blockquote': ['default'],
  'default-content-image': ['default', 'without-image'],
  'default-content-table': ['default'],
  'default-content-divider': ['default'],
  'blocks-cards': ['default', 'welcome', 'products', 'related', 'social', 'slider', 'text-only'],
  'blocks-columns': ['feature', 'text-only'],
  'blocks-hero': ['default', 'without-image'],
  'blocks-tabs': ['default', 'text-only'],
  'blocks-page-structure': ['header', 'footer', 'fragment'],
  'blocks-widget-loader': ['default'],
  'widgets-interactive-fixture': ['default', 'without-image'],
};

async function openStory(page, id, theme = 'Hersheyland', extra = '') {
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}${extra}`);
  await expect(page.locator('[data-showcase]')).toBeVisible();
  await expect(page.locator('[data-block-status="loading"]')).toHaveCount(0);
  await expect(page.locator('[data-block-status="error"], [role="alert"]')).toHaveCount(0);
  if (id.startsWith('blocks-widget-loader')) {
    await expect(page.locator('[data-widget-ready] button')).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ['Hersheyland', 'Cocoa']) {
  for (const [group, stories] of Object.entries(groups)) {
    for (const story of stories) {
      const id = `${group}--${story}`;
      test(`${id} / ${theme}: scoped theme, accessibility and responsive specimen`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await openStory(page, id, theme);
        await expect(page.locator('[data-showcase]')).toHaveClass(new RegExp(theme === 'Cocoa' ? 'theme-cocoa-dark' : 'theme-hersheyland'));
        await expect(page.locator('html[class*="theme-"], body[class*="theme-"]')).toHaveCount(0);
        const result = await new AxeBuilder({ page }).include('[data-showcase]').analyze();
        expect(result.violations).toEqual([]);
        for (const width of [1280, 768, 375]) {
          await page.setViewportSize({ width, height: 900 });
          const fits = await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          );
          expect(fits).toBe(true);
        }
        expect(errors).toEqual([]);
      });
    }
  }
}

test('index contains every specimen and Autodocs in the requested top-level order', async ({ request }) => {
  const response = await request.get('/index.json');
  const { entries } = await response.json();
  const sections = [...new Set(Object.values(entries).map((entry) => entry.title.split('/')[0]))];
  expect(sections).toEqual(['Foundations', 'Default Content', 'Blocks', 'Widgets']);
  for (const [group, stories] of Object.entries(groups)) {
    expect(entries[`${group}--docs`].type).toBe('docs');
    if (group.startsWith('default-content-')) {
      expect(entries[`${group}--docs`].title.split('/')).toHaveLength(2);
    }
    stories.forEach((story) => expect(entries[`${group}--${story}`].type).toBe('story'));
  }
});

test('Autodocs themes every canvas without changing documentation chrome', async ({ page }) => {
  const backgrounds = [];
  for (const theme of ['Hersheyland', 'Cocoa']) {
    await page.goto(`/iframe.html?id=blocks-cards--docs&viewMode=docs&globals=theme:${theme}`);
    await expect(page.locator('.sbdocs-content')).toBeVisible();
    await expect(page.locator('[data-showcase]')).toHaveCount(7);
    const expected = theme === 'Cocoa' ? 'theme-cocoa-dark' : 'theme-hersheyland';
    for (const specimen of await page.locator('[data-showcase]').all()) {
      await expect(specimen).toHaveClass(new RegExp(expected));
    }
    backgrounds.push(await page.locator('.sbdocs-content').evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      color: getComputedStyle(node).color,
      body: getComputedStyle(document.body).backgroundColor,
    })));
    await expect(page.locator('html[class*="theme-"], body[class*="theme-"]')).toHaveCount(0);
    await expect(page.getByText('Author-provided heading, including long or empty text.')).toBeVisible();
  }
  expect(backgrounds[0]).toEqual(backgrounds[1]);
});

test('designer controls scale the complete type comparison', async ({ page }) => {
  await openStory(page, 'foundations-typography--sizes', 'Hersheyland', '&args=typeScale:125;text:Live%20type%20specimen');
  await expect(page.locator('.design-type-line')).toHaveCount(6);
  await expect(page.locator('.design-type-line').first()).toHaveText('Live type specimen');
  await expect(page.locator('.design-type-line').first()).toHaveCSS('font-size', '60px');
});

test('tabs support keyboard selection and panel relationships', async ({ page }) => {
  await openStory(page, 'blocks-tabs--default');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
});

test('mock widgets load real assets and announce interactions', async ({ page }) => {
  await openStory(page, 'blocks-widget-loader--default');
  await page.getByRole('button', { name: 'Try the loaded widget' }).click();
  await expect(page.getByRole('status')).toHaveText('The mock widget is ready.');
  await openStory(page, 'widgets-interactive-fixture--default');
  await page.getByLabel('Choose a favorite').selectOption('Baking');
  await page.getByRole('button', { name: 'Show my favorite' }).click();
  await expect(page.getByRole('status')).toHaveText('Your favorite: Baking');
});

test('motion respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(page, 'foundations-motion-animation--durations');
  await page.getByRole('button', { name: 'Play once' }).first().click();
  await expect(page.getByRole('status').first()).toHaveText('Reduced motion: animation disabled');
  expect(await page.locator('.design-motion-dot').first().evaluate((node) => node.getAnimations().length)).toBe(0);
});

test('placehold.co images render successfully', async ({ page }) => {
  await openStory(page, 'default-content-image--default');
  await expect(page.locator('img').first()).toHaveAttribute('src', /^https:\/\/placehold\.co\//);
  await expect.poll(() => page.locator('img').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
});

test('Canvas exposes working Controls, Actions and Accessibility panels', async ({ page }) => {
  await page.goto('/?path=/story/default-content-buttons--primary');
  const canvas = page.frameLocator('#storybook-preview-iframe');
  await expect(canvas.getByRole('link', { name: 'Explore favorites' }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Controls' }).click();
  await page.locator('#control-text').fill('A live controlled action');
  await page.locator('#control-text').blur();
  await expect(canvas.getByRole('link', { name: 'A live controlled action' }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Actions', exact: true }).click();
  await canvas.getByRole('link', { name: 'A live controlled action' }).first().click();
  await expect(page.getByText('navigate', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Accessibility' }).click();
  await expect(page.getByRole('button', { name: /Run test|Rerun/ })).toBeVisible();
});

test('toolbar updates all Autodocs specimens while keeping docs readable', async ({ page }) => {
  await page.goto('/?path=/docs/blocks-cards--docs');
  const canvas = page.frameLocator('#storybook-preview-iframe');
  await expect(canvas.locator('[data-showcase]')).toHaveCount(7);
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Theme', exact: true })).toHaveText('Cocoa theme');
  await expect(canvas.locator('[data-showcase].theme-cocoa-dark')).toHaveCount(7);
  await expect(canvas.locator('html[class*="theme-"], body[class*="theme-"]')).toHaveCount(0);
  await expect(canvas.getByRole('heading', { name: 'Cards', exact: true })).toBeVisible();
});

test('header Autodocs does not duplicate global navigation IDs', async ({ page }) => {
  await page.goto('/iframe.html?id=blocks-page-structure--docs&viewMode=docs');
  await expect(page.locator('[data-block-status="loaded"]')).toHaveCount(2);
  await expect(page.locator('[data-showcase] nav')).toHaveCount(1);
  const menu = page.getByRole('button', { name: 'Chocolate', exact: true });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await menu.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('designer surface comparisons reflect the preview theme', async ({ page }) => {
  await openStory(page, 'foundations-color--text', 'Cocoa');
  await expect(page.locator('.design-text-color').first()).toHaveCSS('color', 'rgb(255, 248, 245)');
  await openStory(page, 'foundations-color--surface', 'Cocoa');
  await expect(page.locator('.design-surface').first()).toHaveCSS('background-color', 'rgb(26, 17, 19)');
  await expect(page.locator('.design-color-value').first()).toContainText('#1A1113');
});

test('Foundations does not expose engineering architecture', async ({ page, request }) => {
  await openStory(page, 'foundations-typography--sizes');
  const { entries } = await (await request.get('/index.json')).json();
  expect(Object.values(entries).filter((entry) => /Architecture|Source Measurements/.test(entry.title))).toEqual([]);
  await expect(page.locator('[data-showcase]')).not.toContainText(/token|provenance|reference\.|system\.|component\./i);
});

test('designer controls change preview surface without editing the design', async ({ page }) => {
  await page.goto('/?path=/story/foundations-typography--sizes');
  const canvas = page.frameLocator('#storybook-preview-iframe');
  await expect(canvas.locator('[data-showcase]')).toBeVisible();
  await page.getByRole('tab', { name: /^Controls/ }).click();
  await page.getByText('Inverse', { exact: true }).click();
  await expect(canvas.locator('[data-showcase]')).toHaveCSS('background-color', 'rgb(63, 0, 11)');
});

test('Foundations reveals complete comparisons without choosing an implementation value', async ({ page }) => {
  for (const [id, selector, count] of [
    ['foundations-color--brand', '.design-swatch', 7],
    ['foundations-color--surface', '.design-surface', 4],
    ['foundations-color--interactive', '.design-state', 5],
    ['foundations-typography--sizes', '.design-type-line', 6],
    ['foundations-typography--weights', '.design-comparison', 5],
  ]) {
    await openStory(page, id);
    await expect(page.locator(selector)).toHaveCount(count);
    await expect(page.locator('details, [data-token]')).toHaveCount(0);
  }
});

test('designer typography exploration changes size, leading, tracking and mobile scale together', async ({ page }) => {
  await openStory(page, 'foundations-typography--sizes', 'Hersheyland', '&args=typeScale:125;typeViewport:Mobile;leading:Relaxed;tracking:1;alignment:center');
  const title = page.locator('.design-type-line').first();
  await expect(title).toHaveCSS('font-size', '45px');
  await expect(title).toHaveCSS('line-height', '81px');
  await expect(title).toHaveCSS('letter-spacing', '1px');
  await expect(title).toHaveCSS('text-align', 'center');
});

test('preview-only action colors do not theme the surrounding documentation', async ({ page }) => {
  await openStory(page, 'foundations-color--interactive', 'Hersheyland', '&args=actionColor:!hex(640010);actionTextColor:!hex(ffffff)');
  await expect(page.locator('.design-state button').first()).toHaveCSS('background-color', 'rgb(100, 0, 16)');
  await expect(page.locator('.design-state button').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('body')).not.toHaveCSS('background-color', 'rgb(100, 0, 16)');
  await openStory(page, 'foundations-color--interactive');
  await expect(page.locator('.design-state button').first()).toHaveCSS('background-color', 'rgb(0, 123, 189)');
});

test('each default-content presentation is a genuine comparison, contextual page or isolated element', async ({ page }) => {
  await openStory(page, 'default-content-heading-1--default');
  await expect(page.locator('.content-variant-grid h1')).toHaveCount(2);
  await page.setViewportSize({ width: 1280, height: 900 });
  const positions = await page.locator('.content-comparison').evaluateAll(
    (nodes) => nodes.map((node) => {
      const { x, y } = node.getBoundingClientRect();
      return { x, y };
    }),
  );
  expect(positions[0].y).toEqual(positions[1].y);
  expect(positions[1].x).toBeGreaterThan(positions[0].x);
  await openStory(page, 'default-content-paragraph--default', 'Hersheyland', '&args=layout:In%20a%20page;measure:44;bodySize:22;leading:Relaxed');
  await expect(page.locator('.content-article h1')).toBeVisible();
  await expect(page.locator('.content-article')).toHaveCSS('font-size', '22px');
  await expect(page.locator('.content-article')).toHaveCSS('line-height', '39.6px');
  await openStory(page, 'default-content-heading-1--default', 'Hersheyland', '&args=layout:Isolated;headingScale:125');
  await expect(page.locator('[data-showcase] h1')).toHaveCount(1);
  await expect(page.locator('[data-showcase] h1')).toHaveCSS('font-size', '60px');
});

test('default-content image exploration controls affect both proportions and rounding', async ({ page }) => {
  await openStory(page, 'default-content-image--default', 'Hersheyland', '&args=imageShape:Portrait;imageRadius:24;showCaption:false');
  await expect(page.locator('img')).toHaveCount(2);
  await expect(page.locator('img').last()).toHaveAttribute('width', '500');
  await expect(page.locator('img').last()).toHaveAttribute('height', '700');
  await expect(page.locator('img').last()).toHaveCSS('border-radius', '24px');
  await expect(page.locator('figcaption')).toHaveCount(0);
});

test('annotations can be removed without leaving an empty label column', async ({ page }) => {
  await openStory(page, 'foundations-typography--sizes', 'Hersheyland', '&args=showLabels:false');
  await expect(page.locator('.design-annotation').first()).toBeHidden();
  const columns = await page.locator('.design-comparison').first()
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(1);
});

test('palette and shape controls let designers compare candidate values', async ({ page }) => {
  await openStory(page, 'foundations-color--brand', 'Hersheyland', '&args=candidateColor:!hex(460e3d)');
  await expect(page.locator('.design-swatch')).toHaveCount(8);
  await expect(page.getByText('Your color', { exact: true })).toBeVisible();
  await expect(page.locator('.design-swatch').last()).toHaveCSS('background-color', 'rgb(70, 14, 61)');
  await openStory(page, 'foundations-shape-border--styles', 'Hersheyland', '&args=borderStyle:dashed');
  await expect(page.locator('.design-shape-sample')).toHaveCSS('border-top-style', 'dashed');
  await openStory(page, 'foundations-shape-border--radii', 'Hersheyland', '&args=rounding:10');
  for (const sample of await page.locator('.design-shape-sample').all()) {
    await expect(sample).toHaveCSS('border-radius', '10px');
  }
});
