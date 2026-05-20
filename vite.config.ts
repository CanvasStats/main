import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        users: resolve(__dirname, 'users.html'),
        user: resolve(__dirname, 'user.html'),
        faq: resolve(__dirname, 'faq.html'),
        draw: resolve(__dirname, 'draw.html'),
      },
    },
  },
  plugins: [
    VitePWA({
      //Web App Manifest configuration
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      //Workbox configuration
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
        cleanupOutdatedCaches: true,
        ignoreURLParametersMatching: [/^id$/, /^year$/, /^user$/, /^search$/, /^sentFrom$/, /^background$/, /^undo$/, /^color$/, /^isTop$/, /^special$/, /^reverse$/, /^username$/, /^utm_/, /^fbclid$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
});