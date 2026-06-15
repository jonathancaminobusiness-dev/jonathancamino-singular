import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { applyContent } from './src/inject.js'

// Plugin: aplica content.json ao index.html no dev e no build.
export default function contentPlugin() {
  return {
    name: 'singular-content',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const content = JSON.parse(readFileSync('content.json', 'utf8'))
        const dom = new JSDOM(html)
        applyContent(dom.window.document, content)
        return dom.serialize()
      },
    },
  }
}
