import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '.agents/**',
      '.claude/**',
      '.codebuddy/**',
      '.workbuddy/**',
      '.trae/**',
      '.worktrees/**',
      '.vs/**',
      '.vscode/**',
      'screenshots/**',
      'test-results/**',
      'playwright-report/**',
      'patches/**',
      'scripts/**'
    ]
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-console': isProduction ? 'error' : 'warn',
      'no-debugger': isProduction ? 'error' : 'warn'
    }
  },
  {
    name: 'app/logger-allowed',
    files: ['src/utils/logger.js', 'src/services/errorReporting.js'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    name: 'app/parser-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        parser: {
          vue: 'vue-eslint-parser',
          js: 'espree'
        }
      }
    }
  }
]
