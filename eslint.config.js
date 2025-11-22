import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 100],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.js', '*.mjs', 'tests/fixtures/'],
  },
  {
    files: ['tests/**/*.ts'],
    ...tseslint.configs.recommended,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Tests may use any
    },
  }
);

