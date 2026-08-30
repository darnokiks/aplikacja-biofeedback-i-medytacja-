import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Jeden plik JS zamiast dzielenia na chunk'i — apka jest mała, a to upraszcza
    // ładowanie w natywnym WebView (Capacitor) i pakowanie w podgląd Artifact.
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
