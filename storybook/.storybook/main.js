import { fileURLToPath } from 'node:url';
import { searchForWorkspaceRoot } from 'vite';

export default {
  framework: '@storybook/html-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-themes', '@storybook/addon-a11y'],
  stories: ['../foundations/**/*.stories.js', '../markup/**/*.stories.js'],
  staticDirs: [
    { from: '../../fonts', to: '/fonts' },
    { from: '../fixtures/widgets', to: '/widgets' },
    { from: '../../design', to: '/design' },
    { from: '../../icons', to: '/icons' },
    // cards.js lazy-loads its variant stylesheets from the code base path
    { from: '../../blocks/cards', to: '/blocks/cards' },
    { from: '../../blocks/columns', to: '/blocks/columns' },
    { from: '../../styles', to: '/styles' },
  ],
  core: { disableTelemetry: true },
  viteFinal: (config) => {
    const aliases = config.resolve?.alias;
    config.resolve = {
      ...config.resolve,
      alias: [
        ...(Array.isArray(aliases)
          ? aliases
          : Object.entries(aliases ?? {}).map(([find, replacement]) => ({ find, replacement }))),
        { find: '@adobe/aem-boilerplate', replacement: fileURLToPath(new URL('../../', import.meta.url)) },
        { find: '../fragment/fragment.js', replacement: fileURLToPath(new URL('../markup/fragment-fixture.js', import.meta.url)) },
      ],
    };
    config.plugins = [
      ...(config.plugins || []),
      {
        // scripts/aem.js is vendored and loads blocks with a computed import() path, which Vite
        // cannot analyze and warns about; the file stays untouched, only its served copy is marked
        name: 'aem-js-vite-ignore',
        enforce: 'pre',
        transform(code, id) {
          if (!/\/scripts\/aem\.js$/.test(id.split('?')[0])) return null;
          return code.replace(/import\(\s*`/g, 'import(/* @vite-ignore */ `');
        },
      },
    ];
    config.server = {
      ...config.server,
      fs: {
        ...config.server?.fs,
        allow: [
          ...(config.server?.fs?.allow || [searchForWorkspaceRoot(config.root || process.cwd())]),
          fileURLToPath(new URL('../../fonts', import.meta.url)),
          fileURLToPath(new URL('../../icons', import.meta.url)),
        ],
      },
    };
    return config;
  },
};
