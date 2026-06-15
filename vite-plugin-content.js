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
        let content
        try { content = JSON.parse(readFileSync('content.json', 'utf8')) }
        catch (e) { throw new Error(`[singular-content] content.json invalido: ${e.message}`) }
        const dom = new JSDOM(html)
        applyContent(dom.window.document, content)
        return dom.serialize()
      },
    },
  }
}
