import { loadCSS } from './aem.js';

export default async function loadHersheyTheme() {
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/design/tokens.css`),
    loadCSS(`${window.hlx.codeBasePath}/styles/hershey-home.css`),
  ]);
}

/**
 * Loads only the generated design tokens, for pages that style themselves with blocks
 * and section styles (e.g. stories). Tokens are scoped to the `hershey-story` body class.
 */
export async function loadHersheyTokens() {
  await loadCSS(`${window.hlx.codeBasePath}/design/tokens.css`);
}
