import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/static',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'src/static/index.html',
        login: 'src/static/login.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    open: '/login.html'
  },
  preview: {
    port: 4173,
    host: true,
    open: '/login.html'
  }
})