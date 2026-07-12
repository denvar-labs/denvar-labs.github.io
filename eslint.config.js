// ESLint flat config
// Requires: npm install eslint --save-dev
import eslintRecommended from '@eslint/js';

export default [
  eslintRecommended.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Math: 'readonly',
        URL: 'readonly',
        history: 'readonly',
      },
    },
    ignores: [
      'node_modules/',
      'dist/',
      'tests/',
    ],
    rules: {
      'no-unused-vars': ['warn'],
      'no-console': 'off',
      quotes: ['warn', 'single'],
      semi: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
];
