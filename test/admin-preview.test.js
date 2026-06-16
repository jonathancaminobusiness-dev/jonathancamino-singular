import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { createPreview } from '../src/admin/preview.js'
import { createState } from '../src/admin/state.js'

describe('createPreview', () => {
  it('aplica o conteúdo no documento do iframe ao mudar o state', async () => {
    const outer = new JSDOM('<!doctype html><html><body><iframe></iframe></body></html>')
    globalThis.document = outer.window.document
    const iframe = outer.window.document.querySelector('iframe')
    const inner = new JSDOM('<!doctype html><html><body><h1 data-edit="hero.titulo">velho</h1></body></html>')
    Object.defineProperty(iframe, 'contentDocument', { value: inner.window.document })

    const s = createState({ hero: { titulo: 'velho' } })
    createPreview(iframe, s, { debounce: 0 })
    s.setKey('hero.titulo', 'novo')
    await new Promise((r) => setTimeout(r, 5))
    expect(inner.window.document.querySelector('h1').innerHTML).toBe('novo')
  })
})
