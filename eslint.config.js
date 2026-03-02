/**
 * ESLint Flat Config (ESLint 9+)
 * Clean, disciplined, production-ready setup
 */

import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import globals from 'globals'

export default [

  // Base JS recommended
  js.configs.recommended,

  // React + Hooks + Accessibility
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Hooks (STRICT)
      ...reactHooks.configs.recommended.rules,

      // Accessibility (Balanced Enforcement)
      ...jsxA11y.configs.recommended.rules,

      // Downgrade noisy ones to warnings instead of disabling
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/media-has-caption': 'warn',

      // General code quality
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],

      'no-console': 'warn',
      'no-debugger': 'warn'
    }
  },

  // Security plugin (STRICT)
  {
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules
    }
  },

  // =============================================================
  // ARCHITECTURE GUARD — Viewport logic restricted
  // =============================================================
  {
    files: [
      'src/features/**/*.{js,jsx}',
      'src/pages/**/*.{js,jsx}'
    ],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'innerWidth',
          message: 'ARCHITECTURE: Layout logic belongs in src/layouts/'
        },
        {
          object: 'window',
          property: 'innerHeight',
          message: 'ARCHITECTURE: Layout logic belongs in src/layouts/'
        },
        {
          object: 'window',
          property: 'outerWidth',
          message: 'ARCHITECTURE: Layout logic belongs in src/layouts/'
        },
        {
          object: 'window',
          property: 'outerHeight',
          message: 'ARCHITECTURE: Layout logic belongs in src/layouts/'
        },
        {
          object: 'window',
          property: 'matchMedia',
          message: 'ARCHITECTURE: Layout logic belongs in src/layouts/'
        }
      ]
    }
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'public/**'
    ]
  }
]