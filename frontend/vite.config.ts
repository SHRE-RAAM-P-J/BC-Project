import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ethers': ['ethers'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'qrcode.react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
