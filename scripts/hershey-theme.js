import { loadCSS } from './aem.js';

export default async function loadHersheyTheme() {
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/design/tokens.css`),
    loadCSS(`${window.hlx.codeBasePath}/styles/hershey-home.css`),
  ]);
}
