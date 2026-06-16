import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { cleanRich } from '../src/admin/richeditor.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('cleanRich', () => {
  it('mantém <b> e <em>, remove o resto', () => {
    expect(cleanRich('texto <b>negrito</b> e <em>destaque</em>'))
      .toBe('texto <b>negrito</b> e <em>destaque</em>')
  })
  it('mantém <span>/<b> (sem atributos) e remove <script>', () => {
    expect(cleanRich('<span style="x"><b onclick="y">oi</b></span><script>z</script>'))
      .toBe('<span><b>oi</b></span>')
  })
  it('normaliza <i> para <em> (itálico = destaque no design)', () => {
    expect(cleanRich('a <i>b</i> c')).toBe('a <em>b</em> c')
  })
  it('preserva <em> existente e converte <i> aninhado', () => {
    expect(cleanRich('<em>x</em> <i>y</i>')).toBe('<em>x</em> <em>y</em>')
  })
})
