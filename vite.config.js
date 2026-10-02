import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base dapat diatur lewat env BASE_URL untuk deploy di subpath (mis. GitHub Pages).
export default defineConfig({
  base: process.env.BASE_URL ?? '/',
  plugins: [react()],
})
