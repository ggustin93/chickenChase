/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}', 'src/**/*.test.{js,ts,tsx}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})