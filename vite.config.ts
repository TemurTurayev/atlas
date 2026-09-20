/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Updates must land by themselves: 'prompt' leaves the new worker waiting for a dialog the
      // app never shows, and the published version stays frozen on the old bundle.
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'mathlive-fonts/**/*'],
      manifest: {
        name: 'Атлас — математика и физика',
        short_name: 'Атлас',
        description: 'Ежедневная практика по математике и физике',
        lang: 'ru',
        start_url: './',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,svg,json}'], maximumFileSizeToCacheInBytes: 6_000_000 },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/data/**'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
})
