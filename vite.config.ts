import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths let the same build run on Vercel, Netlify or a GitHub Pages sub-path.
  base: './',
})
