import { defineConfig } from 'vitest/config';

// Pure-function / schema-level test harness for BeatForge. No React render
// tests, no real Web Audio — happy-dom covers the incidental globals
// (localStorage, window) our modules touch.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/audio/engine.ts',
        'src/lib/db.ts',
        'src/lib/storage.ts',
        'src/patterns/types.ts',
        'src/patterns/seed/index.ts',
      ],
      reporter: ['text', 'html'],
    },
  },
});
