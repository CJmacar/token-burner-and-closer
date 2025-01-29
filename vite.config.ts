import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ].filter(Boolean),
  define: {
    'process.env': {},
    'process.env.NODE_DEBUG': JSON.stringify(''),
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify(''),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      process: 'process/browser',
      buffer: 'buffer',
      stream: 'stream-browserify',
      path: 'path-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      zlib: 'browserify-zlib',
      url: 'url/',
      util: 'util',
      crypto: 'crypto-browserify',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    commonjsOptions: {
      include: ['node_modules/**'],
      transformMixedEsModules: true
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
      external: ['path', 'fs', 'http', 'https', 'zlib', 'url'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }        
      }
    }
  }
}));