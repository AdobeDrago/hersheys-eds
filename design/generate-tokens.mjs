import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createDictionary, generateCSS, mergeTheme } from './token-dictionary.mjs';

const document = JSON.parse(await readFile(new URL('./tokens.json', import.meta.url), 'utf8'));
const scope = ':where(.hershey-home, .header.hershey-nav, .footer.hershey-footer)';
const header = '/* Generated from DTCG 2025.10 tokens. Do not edit directly. */\n';
const artifacts = [[new URL('./tokens.css', import.meta.url), header + generateCSS(document, scope)]];
artifacts.push([
  new URL('./source-tokens.css', import.meta.url),
  header + generateCSS(document, ':where(.foundations.hershey-home)', { evidenceOnly: true }),
]);
const themeFiles = (await readdir(new URL('./themes/', import.meta.url))).filter((name) => name.endsWith('.tokens.json')).sort();
for (const name of themeFiles) {
  const theme = JSON.parse(await readFile(new URL(`./themes/${name}`, import.meta.url), 'utf8'));
  const { className, previewOnly } = theme.$extensions['com.hersheyland.theme'];
  if (!/^[a-z][a-z0-9-]*$/.test(className) || previewOnly !== true) {
    throw new Error(`Invalid preview theme contract: ${name}`);
  }
  const selector = `:where(.hershey-home.${className}, .${className} .header.hershey-nav, .${className} .footer.hershey-footer)`;
  artifacts.push([
    new URL(`./themes/${name.replace('.tokens.json', '.css')}`, import.meta.url),
    header + generateCSS(mergeTheme(document, theme), selector),
  ]);
}
for (const [output, css] of artifacts) {
  if (process.argv.includes('--check')) {
    if (await readFile(output, 'utf8') !== css) {
      throw new Error(`Generated ${fileURLToPath(output)} is stale. Run node design/generate-tokens.mjs`);
    }
  } else {
    await writeFile(output, css);
  }
}
// eslint-disable-next-line no-console
console.log(`${createDictionary(document).tokens.length} tokens validated; ${artifacts.length} CSS dictionaries ${process.argv.includes('--check') ? 'are current' : 'generated'}.`);
