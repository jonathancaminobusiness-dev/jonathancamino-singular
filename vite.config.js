import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import contentPlugin from './vite-plugin-content.js'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [contentPlugin()],
  build: {
    rollupOptions: {
      input: { main: r('./index.html'), admin: r('./admin.html') },
    },
  },
})
