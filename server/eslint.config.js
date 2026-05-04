import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    name: 'server/files-to-ignore',
    ignores: ['**/node_modules/**', '**/coverage/**', '**/data/**']
  },
  js.configs.recommended,
  {
    name: 'server/rules',
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-process-exit': 'off'
    }
  },
  {
    name: 'server/language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  }
]
