import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  globalIgnores(['dist/**', 'public/**', 'node_modules/**', '.vercel/**']),
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // Pre-existing legacy widgets in src/projects rely on setState-in-effect
      // patterns; this rule is new in react-hooks v7 and too disruptive to fix here.
      'react-hooks/set-state-in-effect': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // .jsx files aren't covered by tsconfig.json's type-checking (only
    // **/*.ts/.tsx are included), so typescript-eslint's recommended config
    // disabling no-undef in favor of tsc leaves them with zero check for
    // undefined-identifier bugs (e.g. a used-but-unimported global). Re-enable
    // it for .jsx only — .ts/.tsx keep relying on tsc.
    files: ['**/*.jsx'],
    rules: {
      'no-undef': 'error',
    },
  },
);
