import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    reporters: process.env.CI ? ['verbose', 'junit'] : ['verbose'],
    outputFile: process.env.CI ? { junit: 'test-results.xml' } : undefined,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/tests/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/types/**',
        'src/**/*.d.ts',
        'src/app/layout.tsx',
        'src/app/**/layout.tsx',
        'src/instrumentation*.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
