import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import buildVersionPlugin from './vite-plugin-build-version.js'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/components/**', 'src/utils/**', 'src/hooks/**'],
      exclude: ['src/**/*.test.*', 'src/test-setup.js'],
      thresholds: { lines: 50, functions: 50, branches: 40 },
    },
  },
  plugins: [
    react(),
    // Inject build version into HTML for auto-refresh detection
    buildVersionPlugin(),
    // PWA Plugin with Workbox
    // registerType: 'prompt' prevents auto-reload loops caused by autoUpdate +
    // skipWaiting + clientsClaim activating a new SW mid-session.
    // sw-bypass-api.js handles skipWaiting/clientsClaim in its own install/activate events.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['pryde-logo.png', 'robots.txt', 'favicon.ico', 'icons/*.png', 'offline.html'],
      manifest: false, // Use existing manifest.json
      injectRegister: 'auto',

      // Use generateSW mode with custom strategies
      strategies: 'generateSW',

      workbox: {
        // Import custom service worker code BEFORE Workbox routing.
        // sw-bypass-api.js handles skipWaiting + clientsClaim — do NOT set them here.
        importScripts: ['sw-bypass-api.js'],

        // Increase maximum file size to cache large assets like background images
        // Default is 2 MiB, midnight-sanctuary.webp is 3.46 MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

        // Only precache static assets (NO HTML!)
        // HTML must always come from network to prevent ERR_FAILED on navigation.
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff2}'],

        // Disable navigation fallback completely — browser handles navigation.
        navigateFallback: null,

        navigateFallbackDenylist: [
          /^\/api\/.*/,
          /^\/auth\/.*/,
          /^\/status/,
          /^\/me/,
          /^\/notifications/,
          /^\/counts/,
          /.*/
        ],

        // Runtime caching for static assets only.
        // CDN images (cross-origin) are bypassed by sw-bypass-api.js rule 5.
        runtimeCaching: [
          // Same-origin images (local uploads served through API)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Fonts
          {
            urlPattern: /\.(?:woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // JS/CSS bundles
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],

        cleanupOutdatedCaches: true,
        // skipWaiting and clientsClaim intentionally omitted — handled by sw-bypass-api.js
        additionalManifestEntries: [],
        ignoreURLParametersMatching: [/.*/]
      },
      devOptions: {
        enabled: false
      }
    }),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  server: {
    port: 3000,
    historyApiFallback: true // Ensure SPA routing works in development
  },
  publicDir: 'public',
  build: {
    // Output directory
    outDir: 'dist',

    // Disable sourcemaps in production for smaller bundle
    sourcemap: false,

    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket': ['socket.io-client']
        },
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },

    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000,

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false, // Remove comments
      }
    },

    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,

    // Reporting
    reportCompressedSize: true,

    // Target modern browsers for smaller bundle
    target: 'es2020'
  }
})
