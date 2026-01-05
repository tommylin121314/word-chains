import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  base: '/word-chains/',
  plugins: [react()],
  build: {
    target: 'es2017',
  }
})
