import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@types': '/src/types',
    },
  },
  server: {
    port: 3002,
    strictPort: true,
    open: true,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'utils': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
