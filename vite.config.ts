import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Shared by the client and the prerender build, so both print the same year.
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
})
