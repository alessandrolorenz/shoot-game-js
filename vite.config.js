import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
