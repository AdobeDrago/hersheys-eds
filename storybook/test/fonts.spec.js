import { expect, test } from '@playwright/test';

const specimens = [
  ['foundations-typography--sizes', '.design-type-line', 'Gazpacho-Black'],
  ['foundations-color--text', '.design-text-color p', 'TTNormsPro-Normal'],
  ['foundations-typography--families', '.design-comparison-sample p', 'TTNormsPro-Normal'],
  ...[1, 2, 3, 4, 5, 6].map((level) => [`default-content-heading-${level}--default`, `h${level}`, 'Gazpacho-Black']),
  ['default-content-paragraph--default', '.content-fragment p', 'TTNormsPro-Normal'],
  ['default-content-strong--default', 'strong', 'TTNormsPro-Bd'],
  ['default-content-emphasis--default', 'em', 'TTNormsPro-NormalIt'],
  ['default-content-buttons--primary', 'a', 'TTNormsPro-Bd'],
  ['blocks-cards--welcome', 'h3', 'Gazpacho-Black'],
  ['blocks-cards--products', 'h3', 'TTNormsPro-Blk'],
  ['blocks-cards--welcome', '.cards-card-body p', 'TTNormsPro-Normal'],
  ['blocks-columns--feature', 'h2', 'Gazpacho-Black'],
  ['blocks-hero--default', 'h1', 'Gazpacho-Black'],
  ['blocks-tabs--default', '[role="tab"]', 'TTNormsPro-Bd'],
  ['blocks-tabs--default', 'h3', 'Gazpacho-Black'],
  ['blocks-page-structure--header', '.nav-brand a', 'TTNormsPro-Bd'],
  ['blocks-page-structure--header', '.nav-drop button', 'TTNormsPro-Normal'],
  ['blocks-page-structure--footer', 'h2', 'Gazpacho-Black'],
  ['blocks-page-structure--footer', '.footer-brand p', 'TTNormsPro-Normal'],
  ['blocks-page-structure--fragment', 'h2', 'Gazpacho-Black'],
  ['blocks-widget-loader--default', '[data-widget-ready] h2', 'Gazpacho-Black'],
  ['widgets-interactive-fixture--default', 'h2', 'Gazpacho-Black'],
  ['widgets-interactive-fixture--default', 'label', 'TTNormsPro-Normal'],
  ['widgets-interactive-fixture--default', 'button', 'TTNormsPro-Normal'],
];

for (const [id, selector, postScriptName] of specimens) {
  test(`${id} ${selector} renders ${postScriptName}, not a system fallback`, async ({ page }) => {
    const failures = [];
    page.on('response', (response) => {
      if (response.url().includes('.woff') && !response.ok()) {
        failures.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    const target = `[data-showcase] ${selector}`;
    await expect(page.locator(target).first()).toBeVisible();
    const font = await page.locator(target).first().evaluate((node) => getComputedStyle(node).font);
    await page.evaluate((value) => document.fonts.load(value, 'Sweet'), font);
    await page.evaluate(() => document.fonts.ready);
    const session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector: target });
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    const matched = fonts.some(
      (face) => face.isCustomFont && face.postScriptName === postScriptName,
    );
    expect(matched).toBe(true);
    expect(fonts.filter((face) => !face.isCustomFont && face.glyphCount > 0)).toEqual([]);
    expect(failures).toEqual([]);
  });
}
