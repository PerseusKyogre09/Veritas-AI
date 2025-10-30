import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        minify: 'esbuild',
        rollupOptions: {
          external: []
        }
      },
      optimizeDeps: {
        exclude: ['@rollup/rollup-win32-x64-msvc']
      },
      esbuild: {
        // Use esbuild for faster builds and to avoid rollup issues
        target: 'esnext'
      }
    };
});
