import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'no-console': 'off'
    }
  }
];
