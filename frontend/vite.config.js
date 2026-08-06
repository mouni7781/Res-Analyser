import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/evaluate': 'https://res-analyser-jksg.onrender.com/evaluate',
      '/health': 'https://res-analyser-jksg.onrender.com/health',
    },
  },
})
