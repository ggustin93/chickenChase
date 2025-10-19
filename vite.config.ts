/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    proxy: {
      // Proxy OpenStreetMap Nominatim API to avoid CORS issues
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        headers: {
          'User-Agent': 'ChickenChaseApp/1.0'
        }
      },
      // Proxy Overpass API for bar search
      '/api/overpass': {
        target: 'https://overpass-api.de/api/interpreter',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/overpass/, ''),
        headers: {
          'User-Agent': 'ChickenChaseApp/1.0'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}', 'src/**/*.test.{js,ts,tsx}'],
    exclude: ['tests/e2e/**/*'],
  }
})
