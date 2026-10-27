import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Screens must go through src/api, never import mock JSON directly.
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/mocks/*', '@/mocks/*'], message: 'Import data via src/api, not mock JSON.' }] },
      ],
    },
  },
  {
    files: ['src/api/mock/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Route table and test files are not hot-reloaded component modules.
    files: ['src/routes.tsx', 'src/main.tsx', '**/*.test.{ts,tsx}', 'e2e/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
