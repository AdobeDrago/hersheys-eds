module.exports = {
  overrides: [{
    files: ['design-system.js', 'foundations/stories.js', 'foundations/catalog.js', '.storybook/preview.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-relative-packages': 'off',
      'import/extensions': ['error', { js: 'always', mjs: 'always', json: 'always' }],
    },
  }, {
    files: ['.storybook/docs.js', '.storybook/main.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  }, {
    files: ['playwright.config.js', 'test/*.spec.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
    },
  }, {
    files: ['markup/**/*.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/extensions': ['error', { js: 'always', css: 'always' }],
    },
  }, {
    files: ['markup/fragment-fixture.js'],
    rules: { 'import/prefer-default-export': 'off' },
  }, {
    files: ['.storybook/manager.js'],
    rules: { 'import/no-unresolved': 'off' },
  }],
};
