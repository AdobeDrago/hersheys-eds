/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget-pricespider. Base: widget (existing local block, blocks/widget/widget.js).
 * Source: https://www.hersheyland.com/where-to-buy.html
 * Block contract: 1 row, 1 cell with a single link to /widgets/{path}/{name}.html; query params
 * become data-* attributes on the block. Here: /widgets/pricespider/where-to-buy.html?config={id}.
 * Source DOM: div.where-to-buy > div.ps-widget#{configId} (empty; PriceSpider injects at runtime).
 * The config id is read from ps-config / data-ps-widget-id / id, in that order.
 */
export default function parse(element, { document }) {
  const configId = (element.getAttribute('ps-config')
    || element.getAttribute('data-ps-widget-id')
    || element.id
    || '').trim();

  const href = configId
    ? `/widgets/pricespider/where-to-buy.html?config=${encodeURIComponent(configId)}`
    : '/widgets/pricespider/where-to-buy.html';
  const link = document.createElement('a');
  link.href = href;
  link.textContent = href;

  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  element.replaceWith(block);
}
