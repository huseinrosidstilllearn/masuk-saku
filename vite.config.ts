import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Generated browser downloads are not source and can be locked on Windows.
  server: { watch: { ignored: ['**/work/**'] } },
  test: {
    include: ['src/**/*.test.ts', 'tests/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
