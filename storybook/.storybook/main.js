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
    config.server = {
      ...config.server,
      fs: {
        ...config.server?.fs,
        allow: [
          ...(config.server?.fs?.allow || [searchForWorkspaceRoot(config.root || process.cwd())]),
          fileURLToPath(new URL('../../fonts', import.meta.url)),
        ],
      },
    };
    return config;
  },
};
