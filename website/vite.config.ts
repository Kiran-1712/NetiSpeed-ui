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
    // Shared by the client and the prerender build, so both print the same year.
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
  server: {
    port: 5173,
    // Fixed, because the speed test app links back here (shared/site.ts).
    strictPort: true,
  },
})
