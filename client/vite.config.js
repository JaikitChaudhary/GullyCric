import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'logo.svg',
        'logo-dark.png',
        'icon-192.png',
        'icon-512.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon.ico',
        'apple-touch-icon.png',
      ],
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'GullyCric',
        short_name: 'GullyCric',
        description: 'Fast live cricket scoring app for gully matches',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
