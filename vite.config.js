import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/static',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
})