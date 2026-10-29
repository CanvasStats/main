import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Canvas Stats',
        short_name: 'CanvasStats',
        description: 'Analyze data and statistics from Fediverse Canvas events',
        theme_color: '#c851e1',
        background_color: '#c851e1',
        display: 'standalone',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon.svg',
            sizes: '512x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});