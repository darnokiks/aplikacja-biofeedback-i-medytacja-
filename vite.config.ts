import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Ścieżka względna — dzięki temu ta sama paczka działa i pod GitHub Pages
  // (dowolna głębokość ścieżki repo), i lokalnie, i w WebView Capacitora.
  base: './',
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
