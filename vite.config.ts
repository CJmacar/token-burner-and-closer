import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      '6a3c22db-c576-4694-9caf-dfc9ebd1bec6.lovableproject.com',
      'lovableproject.com'
    ]
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  define: {
    'process.env': {},
    'process.env.NODE_DEBUG': JSON.stringify(''),
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
    'process.nextTick': 'function(cb) { queueMicrotask(cb); }',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      process: 'process/browser',
      util: 'util',
      buffer: 'buffer',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
}));