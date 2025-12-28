/**
 * ESLint Configuration - Flat Config Format (ESLint 9+)
 *
 * ARCHITECTURE GUARD:
 * This configuration enforces the "no viewport logic in features/pages" rule.
 *
 * Layout decisions (viewport detection, media queries in JS) are ONLY allowed
 * in src/layouts/. Feature and page files must be layout-agnostic.
 */

import js from '@eslint/js';
import securityPlugin from 'eslint-plugin-security';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // React plugin with JSX support
  {
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // Security plugin
  {
    plugins: {
      security: securityPlugin
    },
    rules: {
      ...securityPlugin.configs.recommended.rules
    }
  },

  // Global settings for all files
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // PWA/Service Worker globals
        caches: 'readonly',
        clients: 'readonly',
        importScripts: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      // Relaxed rules for this codebase
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off', // We use console for logging
      'no-debugger': 'warn'
    }
  },

  // =============================================================
  // ARCHITECTURE GUARD: No viewport logic in features/pages
  // =============================================================
  // 
  // RULE: Feature and page files must NOT contain viewport or
  // device detection logic. All layout decisions belong in /layouts.
  //
  // This prevents:
  // - window.innerWidth / window.outerWidth
  // - window.matchMedia()
  // - useMediaQuery hooks
  // - Direct viewport measurements
  //
  // Layout-agnostic components are easier to maintain, test, and
  // ensure consistent behavior across desktop/mobile/PWA.
  // =============================================================
  {
    files: ['src/features/**/*.js', 'src/features/**/*.jsx', 'src/pages/**/*.js', 'src/pages/**/*.jsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'innerWidth',
          message: 'ARCHITECTURE VIOLATION: Viewport logic not allowed in features/pages. Use layout components in src/layouts/ instead.'
        },
        {
          name: 'innerHeight',
          message: 'ARCHITECTURE VIOLATION: Viewport logic not allowed in features/pages. Use layout components in src/layouts/ instead.'
        },
        {
          name: 'outerWidth',
          message: 'ARCHITECTURE VIOLATION: Viewport logic not allowed in features/pages. Use layout components in src/layouts/ instead.'
        },
        {
          name: 'outerHeight',
          message: 'ARCHITECTURE VIOLATION: Viewport logic not allowed in features/pages. Use layout components in src/layouts/ instead.'
        }
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'innerWidth',
          message: 'ARCHITECTURE VIOLATION: window.innerWidth not allowed in features/pages. Layout logic belongs in src/layouts/.'
        },
        {
          object: 'window',
          property: 'innerHeight',
          message: 'ARCHITECTURE VIOLATION: window.innerHeight not allowed in features/pages. Layout logic belongs in src/layouts/.'
        },
        {
          object: 'window',
          property: 'outerWidth',
          message: 'ARCHITECTURE VIOLATION: window.outerWidth not allowed in features/pages. Layout logic belongs in src/layouts/.'
        },
        {
          object: 'window',
          property: 'outerHeight',
          message: 'ARCHITECTURE VIOLATION: window.outerHeight not allowed in features/pages. Layout logic belongs in src/layouts/.'
        },
        {
          object: 'window',
          property: 'matchMedia',
          message: 'ARCHITECTURE VIOLATION: window.matchMedia not allowed in features/pages. Layout logic belongs in src/layouts/.'
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
      'public/**',
      '*.config.js',
      'vite.config.js'
    ]
  }
];

