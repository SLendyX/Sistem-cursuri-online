import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Folosim variabila de mediu sau fallback la numele serviciului din docker-compose
      "/api": {
        target: "http://localhost:5000", // Aici este schimbarea principală
        changeOrigin: true,
        secure: false,
      },
      "/images": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      }
      // "/api": process.env.VITE_API_URL || "http://localhost:5000"
    },
    host: true // Important pentru Docker
  },
})