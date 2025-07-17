import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // intercetta tutte le chiamate che iniziano con /api
      '/api': {
        // indirizza al tuo endpoint AWS
        target: 'https://3qpkphed39.execute-api.us-east-1.amazonaws.com/dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // mantiene /api/inference/…
      },
    },
  },
})
