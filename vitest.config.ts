import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [
      'node_modules/**',   // ⬅️ this is the big one
      'dist/**',
      'build/**',
      'e2e/**',            // exclude Playwright E2E tests
      'playwright.config.ts',
    ],
  },
})
