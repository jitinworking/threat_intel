import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/threatfox': {
        target: 'https://threatfox-api.abuse.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/threatfox/, '/api/v1/')
      },
      '/api/cisa': {
        target: 'https://www.cisa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cisa/, '/sites/default/files/feeds/known_exploited_vulnerabilities.json')
      },
      '/api/rss': {
        target: 'https://api.rss2json.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss/, '/v1/api.json')
      }
    }
  }
})
