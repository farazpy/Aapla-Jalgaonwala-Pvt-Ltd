import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/image': path.resolve(__dirname, './src/components/ui/Image.tsx'),
      'next/link': path.resolve(__dirname, './src/lib/linkCompat.tsx'),
      'next/navigation': path.resolve(__dirname, './src/lib/navCompat.tsx'),
      'next/dynamic': path.resolve(__dirname, './src/lib/dynamicCompat.tsx'),
      'next/script': path.resolve(__dirname, './src/lib/scriptCompat.tsx')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: [
        '**/server/data/**',
        '**/server/repositories/**',
        '**/uploads/**',
        '**/public/favicons/**'
      ]
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});
