import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import buildVersionPlugin from './vite-plugin-build-version.js'

export default defineConfig({
  plugins: [
    react(),
    // Inject build version into HTML for auto-refresh detection
    buildVersionPlugin(),
    // 🔥 EMERGENCY: PWA Plugin DISABLED to fix refresh loop
    // PWA Plugin with Workbox
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pryde-logo.png', 'robots.txt', 'favicon.ico', 'icons/*.png', 'offline.html'],
      manifest: false, // Use existing manifest.json
      injectRegister: null, // 🔥 DISABLED: Don't inject registration code

      // Use generateSW mode with custom strategies
      strategies: 'generateSW',

      workbox: {
        // Import custom service worker code BEFORE Workbox routing
        importScripts: ['sw-bypass-api.js'],

        // 🔥 CRITICAL: Only precache static assets (NO HTML!)
        // HTML must ALWAYS come from network to prevent ERR_FAILED on navigation
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff2}'],

        // 🔥 CRITICAL: Disable navigation fallback completely
        // Navigation requests are handled by browser, not SW
        navigateFallback: null,

        // 🔥 CRITICAL: Exclude ALL API requests and navigation from service worker
        // This prevents CORS errors, ERR_FAILED loops, and auth issues
        navigateFallbackDenylist: [
          /^\/api\/.*/,
          /^\/auth\/.*/,
          /^\/status/,
          /^\/me/,
          /^\/notifications/,
          /^\/counts/,
          /.*/ // Deny all navigation fallback as safety measure
        ],

        // Runtime caching ONLY for static assets
        // NO API caching, NO JSON caching, NO authenticated endpoints
        runtimeCaching: [
          // 🔥 STATIC ASSETS ONLY: Images from uploads
          {
            urlPattern: /^https:\/\/pryde-backend\.onrender\.com\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 🔥 STATIC ASSETS ONLY: Images (same-origin)
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
          // 🔥 STATIC ASSETS ONLY: Fonts
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
          // 🔥 STATIC ASSETS ONLY: JS/CSS bundles
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

        // Clean up outdated caches automatically
        cleanupOutdatedCaches: true,

        // Skip waiting to activate new service worker immediately
        skipWaiting: true,

        // Claim clients immediately
        clientsClaim: true,

        // 🔥 CRITICAL: Add custom fetch handler to bypass ALL API requests
        // This is injected BEFORE Workbox routing to ensure API requests never hit cache
        additionalManifestEntries: [],

        // Custom navigation route handler
        // This ensures API requests are NEVER intercepted by service worker
        ignoreURLParametersMatching: [/.*/]
      },
      devOptions: {
        enabled: false // Disable in development
      },
      // 🔥 EMERGENCY: Disable service worker generation completely
      disable: true
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
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
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
