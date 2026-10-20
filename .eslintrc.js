module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [{
    files: ['design/*.mjs', 'test/*.mjs'],
    env: { node: true },
    rules: { 'import/extensions': ['error', { js: 'always', mjs: 'always' }] },
  }, {
    files: ['design/generate-tokens.mjs'],
    rules: { 'no-restricted-syntax': 'off', 'no-await-in-loop': 'off' },
  }],
};
