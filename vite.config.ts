import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tetris-game/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
  },
})
