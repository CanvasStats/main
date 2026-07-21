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
        users: resolve(__dirname, 'users/index.html'),
        user: resolve(__dirname, 'users/user.html'),
        faq: resolve(__dirname, 'faq.html'),
        draw: resolve(__dirname, 'draw.html'),
        colors: resolve(__dirname, 'colors.html'),
        instances: resolve(__dirname, 'instances/index.html'),
        instance: resolve(__dirname, 'instances/instance.html'),
        iUSers: resolve(__dirname, 'instances/users.html'),
        search: resolve(__dirname, 'search.html')
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,

        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
        cleanupOutdatedCaches: true,

        navigateFallback: null,

        ignoreURLParametersMatching: [/^id$/, /^term$/, /^year$/, /^user$/, /^name$/, /^search$/, /^sentFrom$/, /^background$/, /^undo$/, /^color$/, /^isTop$/, /^special$/, /^reverse$/, /^username$/, /^utm_/, /^fbclid$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets-v2',
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