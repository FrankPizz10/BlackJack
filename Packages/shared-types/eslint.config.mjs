import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import tseslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
      parser: tseslintParser,
    },
  },
  // ESLint recommended config
  pluginJs.configs.recommended,
  // TypeScript recommended config
  ...tseslint.configs.recommended,
  {
    ignores: ['dist'], // Ignore the "dist" directory
  },
  {
    plugins: {
      prettier: eslintPluginPrettier, // Explicitly provide the Prettier plugin
    },
    rules: {
      'prettier/prettier': 'error', // Enable Prettier rules
      ...eslintConfigPrettier.rules, // Disable conflicting ESLint rules
    },
  },
];
