import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  plugins: [
    VitePWA({
      // generateSW: Workbox auto-generates the service worker from config.
      // No manual sw.js file needed.
      strategies: 'generateSW',

      // SW updates silently and takes over immediately on new deploys.
      registerType: 'autoUpdate',

      // Auto-inject SW registration script into the built HTML.
      injectRegister: 'auto',

      workbox: {
        // Only precache app shell assets — deliberately excludes .glb model files.
        // Models (~273MB total) are too large to precache on install.
        globPatterns: ['**/*.{html,css,js,svg,ico,woff,woff2}'],

        // Secondary guard: cap individual precache entries at 5MB.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // Runtime caching: intercept .glb fetches and serve from cache after
        // first load. Covers /models/ and /models/environment-models/ paths.
        runtimeCaching: [
          {
            urlPattern: /\/models\/.*\.glb$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'glb-models-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60  // 7 days
              },
              // Handle byte-range requests (used by some GLB parsers and iOS).
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],

        // Take control of all clients immediately on install/update.
        clientsClaim: true,
        skipWaiting: true
      },

      manifest: {
        name: 'Grid Airplane Game',
        short_name: 'Grid Airplane',
        description: 'Grid Airplane Game — Endless runner with depth-based obstacles',
        theme_color: '#000000',
        background_color: '#000000',
        // fullscreen removes all browser chrome — ideal for a game.
        // display_override lets browsers fall back: fullscreen → standalone → minimal-ui.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        id: '/',
        categories: ['games'],
        icons: [
          {
            src: '/icons/icon-512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },

      manifestFilename: 'manifest.webmanifest',

      // Keep SW disabled in dev to avoid confusing cache behaviour during iteration.
      // Run `npm run build && npm run preview` to test the full PWA flow.
      devOptions: { enabled: false }
    })
  ]
});
