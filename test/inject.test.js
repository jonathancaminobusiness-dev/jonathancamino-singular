import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { applyContent } from '../src/inject.js'

function doc(html) { return new JSDOM(html).window.document }

describe('applyContent — texto', () => {
  it('preenche innerHTML preservando tags da allowlist', () => {
    const d = doc('<h1 data-edit="hero.titulo">velho</h1>')
    applyContent(d, { hero: { titulo: 'Novo <em>destaque</em>' } })
    expect(d.querySelector('h1').innerHTML).toBe('Novo <em>destaque</em>')
  })

  it('remove tags fora da allowlist', () => {
    const d = doc('<p data-edit="x">a</p>')
    applyContent(d, { x: 'oi <script>alert(1)</script><b>ok</b>' })
    expect(d.querySelector('p').innerHTML).toBe('oi <b>ok</b>')
  })

  it('ignora chave ausente sem quebrar', () => {
    const d = doc('<p data-edit="nao.existe">mantido</p>')
    applyContent(d, {})
    expect(d.querySelector('p').textContent).toBe('mantido')
  })
})
