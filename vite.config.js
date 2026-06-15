import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // In dev, proxy /api/myfxbook directly to Myfxbook (bypasses CORS)
      '/api/myfxbook': {
        target: 'https://www.myfxbook.com/api',
        changeOrigin: true,
        rewrite: path => {
          // /api/myfxbook?action=login&... → /login.json?...
          const url = new URL(path, 'http://localhost');
          const action = url.searchParams.get('action');
          url.searchParams.delete('action');
          return `/${action}.json${url.search}`;
        },
      },
    },
  },
})
