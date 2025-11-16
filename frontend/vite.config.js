import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url' // <-- ADD THIS LINE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // v- ADD THIS ENTIRE 'resolve' BLOCK v
  resolve: {
    alias: {
      // This forces Vite to always use the same copy of React
      'react': fileURLToPath(new URL('./node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('./node_modules/react-dom', import.meta.url))
    }
  }
  // ^- ADD THIS ENTIRE 'resolve' BLOCK -^
})