import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginTailwindcss from 'eslint-plugin-tailwindcss';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'], // Target TypeScript files
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
      tailwindcss: eslintPluginTailwindcss,
    },
    rules: {
      'prettier/prettier': 'error',

      'tailwindcss/no-custom-classname': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'no-console': 'warn',
    },
    settings: {
      tailwindcss: {
        callees: ['clsx', 'classnames'], // Include if using utilities like clsx
      },
    },
  },
  {
    ignores: ['node_modules', 'dist'], // Ignore unnecessary folders
  },
];
