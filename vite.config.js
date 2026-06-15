import { defineConfig } from 'vite'
import contentPlugin from './vite-plugin-content.js'

export default defineConfig({
  plugins: [contentPlugin()],
})
