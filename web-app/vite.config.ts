import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  define: {
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
  server: {
    port: 5174,
    // Fixed, because the website links here (shared/site.ts).
    strictPort: true,
  },
})
