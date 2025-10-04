const globals = require('globals');

module.exports = {
  root: true,
  ignorePatterns: ['dist/**', 'node_modules/**', 'src/content/index.js'],
  env: {
    browser: true,
    node: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  globals: {
    ...globals.browser,
    ...globals.node,
    chrome: 'readonly',
    globalThis: 'readonly',
  },
  rules: {
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'no-await-in-loop': 'off',
    'no-param-reassign': [
      'error',
      {
        props: false,
      },
    ],
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-empty': [
      'error',
      {
        allowEmptyCatch: true,
      },
    ],
    'import/extensions': [
      'error',
      'always',
      {
        js: 'always',
        mjs: 'always',
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'scripts/**/*.js',
          'tests/**/*.js',
          'vitest.setup.js',
        ],
      },
    ],
    'id-length': [
      'error',
      {
        min: 3,
        properties: 'never',
        exceptions: ['id', 'URL', 'uri', 'db', 'api', 'DOM'],
      },
    ],
  },
};
