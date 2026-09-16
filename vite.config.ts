import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import codeHighlight from './vite/codeHighlight.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    codeHighlight(),
    VitePWA({
      // A new deployment's worker skips waiting and claims open pages, so a
      // redeploy reaches a visitor without them clearing anything. What the
      // page does once that happens is decided in src/utils/serviceWorker.ts.
      registerType: 'autoUpdate',

      // That same file registers the worker, so the plugin must not also
      // inject a registration script into index.html.
      injectRegister: null,

      // public/site.webmanifest is hand-written and linked from index.html;
      // see docs/icon.md for how its icons are produced.
      manifest: false,

      workbox: {
        // The build output plus everything copied from public/. The manifest
        // is listed because it is not one of Workbox's default extensions.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],

        // Every route is served by the one document, so an offline visit to
        // /array-linear-search has to resolve to it.
        navigateFallback: '/index.html',

        // Without this, the precache from every previous deployment is kept.
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              // Font files come back as opaque cross-origin responses.
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
