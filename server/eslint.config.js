import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  {
    name: 'server/files-to-ignore',
    ignores: ['**/node_modules/**', '**/coverage/**', '**/data/**', '**/dist/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'server/rules',
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-process-exit': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  {
    name: 'server/language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest
      }
    }
  },
  {
    name: 'server/database-scripts',
    files: ['src/database/**/*.ts', 'src/config/index.ts'],
    rules: {
      'no-console': 'off'
    }
  }
]
