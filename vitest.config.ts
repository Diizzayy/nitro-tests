import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        isolate: false,
        singleFork: true
      }
    },

    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'clover', 'json']
    },
    globalSetup: './test/setup/global.ts',
  }
})
