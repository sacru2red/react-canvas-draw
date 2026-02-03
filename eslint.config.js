import neostandard from 'neostandard'
import globals from 'globals'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'es/**',
      'lib/**',
      'umd/**',
      'type/**',
      'demo/dist/**',
    ],
  },
  ...neostandard({
    ts: true,
  }),
  {
    files: ['demo/src/**/*.{js,jsx,ts,tsx}', 'type-source/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['tests/**/*.{js,jsx,ts,tsx}', 'vitest.setup.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
  },
  {
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: './tsconfig.json',
        }),
      ],
    },
  },
  eslintPluginPrettierRecommended,
]
