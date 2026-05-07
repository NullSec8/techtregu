import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['shared/**/*.test.js', 'server/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: [
        'shared/contentModeration.js',
        'shared/locations.js',
        'server/database/bootstrap.js',
        'server/database/initSchema.js',
        'server/seed.js',
      ],
      thresholds: {
        branches: 40,
      },
    },
  },
})
