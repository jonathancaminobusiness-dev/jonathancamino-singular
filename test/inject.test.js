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

describe('applyContent — segurança do sanitizador', () => {
  // C1 — tagName case bypass: svg/math subtrees use lowercase tagName
  it('C1: bloqueia <svg><script> (bypass de case)', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<svg><script>alert(1)</script></svg>' })
    const html = d.querySelector('p').innerHTML
    expect(html).not.toContain('alert')
    expect(html).not.toContain('<script')
  })

  it('C1: bloqueia <math><script> (bypass de case)', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<math><script>alert(1)</script></math>' })
    const html = d.querySelector('p').innerHTML
    expect(html).not.toContain('alert')
    expect(html).not.toContain('<script')
  })

  // C2 — unwrapped children not re-walked
  it('C2: desembrulha <div> mas sanitiza filhos (<script> não sobrevive)', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<div><script>alert(1)</script>texto</div>' })
    const html = d.querySelector('p').innerHTML
    expect(html).not.toContain('alert')
    expect(html).not.toContain('<script')
    expect(html).toContain('texto')
  })

  it('C2: desembrulha <article> e remove <iframe> filho', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<article><iframe src="x"></iframe>oi</article>' })
    const html = d.querySelector('p').innerHTML
    expect(html).not.toContain('<iframe')
    expect(html).toContain('oi')
  })

  // I1 — comment nodes pass through
  it('I1: remove nós de comentário', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<!--comentario-->ola' })
    const html = d.querySelector('p').innerHTML
    expect(html).toBe('ola')
  })

  // Baseline: allowed tags are preserved correctly
  it('preserva tags da allowlist aninhadas', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<b><em>preserva</em></b>' })
    expect(d.querySelector('p').innerHTML).toBe('<b><em>preserva</em></b>')
  })

  // Attributes on allowed tags are stripped
  it('remove atributos de tags permitidas', () => {
    const d = doc('<p data-edit="x"></p>')
    applyContent(d, { x: '<b class="x" onclick="y()">t</b>' })
    expect(d.querySelector('p').innerHTML).toBe('<b>t</b>')
  })
})

describe('applyContent — atributos', () => {
  it('define atributos via data-edit-<attr>', () => {
    const d = doc('<img data-edit-src="foto" data-edit-alt="legenda" src="" alt="">')
    applyContent(d, { foto: 'assets/x.jpg', legenda: 'Foto X' })
    const img = d.querySelector('img')
    expect(img.getAttribute('src')).toBe('assets/x.jpg')
    expect(img.getAttribute('alt')).toBe('Foto X')
  })

  it('define href diretamente via data-edit-href', () => {
    const d = doc('<a data-edit-href="link" href="">x</a>')
    applyContent(d, { link: 'https://ex.com' })
    expect(d.querySelector('a').getAttribute('href')).toBe('https://ex.com')
  })

  it('monta link wa.me a partir de contato.whatsapp + mensagem', () => {
    const d = doc('<a data-edit-wa="hero.msg" href="">x</a>')
    applyContent(d, { contato: { whatsapp: '5521999' }, hero: { msg: 'Olá Rodrigo' } })
    expect(d.querySelector('a').getAttribute('href'))
      .toBe('https://wa.me/5521999?text=Ol%C3%A1%20Rodrigo')
  })
})
