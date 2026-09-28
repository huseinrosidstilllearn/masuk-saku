import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Generated browser downloads are not source and can be locked on Windows.
  server: { watch: { ignored: ['**/work/**'] } },
  test: {
    include: ['src/**/*.test.ts', 'tests/*.test.ts'],
    environment: 'node',
    // Keep the embedded PostgreSQL setup from competing with a worker per test file.
    maxWorkers: 2,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
