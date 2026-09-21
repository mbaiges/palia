import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.SCAFFOLD_API_PROXY_TARGET ?? 'http://localhost:3000'
const apiProxy = { '/api': { target: apiProxyTarget, changeOrigin: true } }

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { 'import.meta.env.VITE_E2E_AUTH_BYPASS': JSON.stringify(mode === 'e2e' ? 'true' : 'false') },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
}))
