import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dnd-card-maker-v2/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'konva': ['konva', 'react-konva'],
          'utils': ['immer', 'idb', 'i18next', 'react-i18next'],
          'ai': ['@google/generative-ai']
        }
      }
    }
  },
})
