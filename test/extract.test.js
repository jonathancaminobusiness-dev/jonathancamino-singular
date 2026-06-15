import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { extractContent, setPath } from '../src/extract.js'
import { applyContent } from '../src/inject.js'

function doc(html) { return new JSDOM(html).window.document }

describe('setPath', () => {
  it('cria caminho pontilhado incluindo arrays', () => {
    const o = {}
    setPath(o, 'a.b.0.c', 'v')
    expect(o).toEqual({ a: { b: [{ c: 'v' }] } })
  })
})

describe('extractContent', () => {
  it('extrai texto e atributos para o content', () => {
    const d = doc(`
      <h1 data-edit="hero.titulo">Olá <em>mundo</em></h1>
      <img data-edit-src="hero.foto" src="assets/a.jpg">
      <a data-edit="hero.cta" data-edit-href="hero.link" href="https://ex.com">Clique</a>
    `)
    const c = extractContent(d)
    expect(c.hero.titulo).toBe('Olá <em>mundo</em>')
    expect(c.hero.foto).toBe('assets/a.jpg')
    expect(c.hero.cta).toBe('Clique')
    expect(c.hero.link).toBe('https://ex.com')
  })

  it('round-trip: extrair e reaplicar mantém o DOM', () => {
    const html = `<h1 data-edit="t">A <b>B</b></h1><img data-edit-src="f" src="x.jpg" alt="">`
    const d1 = doc(html)
    const content = extractContent(d1)
    const d2 = doc(html.replace('A <b>B</b>', 'placeholder').replace('x.jpg', 'placeholder'))
    applyContent(d2, content)
    expect(d2.querySelector('h1').innerHTML).toBe('A <b>B</b>')
    expect(d2.querySelector('img').getAttribute('src')).toBe('x.jpg')
  })

  it('round-trip cobre data-edit-wa e imagem só com data-edit-src/alt', () => {
    const html = `<a data-edit="b.cta" data-edit-wa="b.msg" href="https://wa.me/5521999?text=Oi%20a">x</a>
                  <img data-edit-src="b.foto" data-edit-alt="b.alt" src="p.jpg" alt="legenda">`
    const d1 = doc(html)
    const c = extractContent(d1)
    expect(c.contato.whatsapp).toBe('5521999')
    expect(c.b.msg).toBe('Oi a')
    expect(c.b.foto).toBe('p.jpg')
    expect(c.b.alt).toBe('legenda')
    const d2 = doc(html.replace('p.jpg', 'z').replace('legenda', 'z'))
    applyContent(d2, c)
    expect(d2.querySelector('img').getAttribute('src')).toBe('p.jpg')
    expect(d2.querySelector('img').getAttribute('alt')).toBe('legenda')
  })
})
