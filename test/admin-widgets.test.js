import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { createWidget } from '../src/admin/widgets.js'
import { createState } from '../src/admin/state.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('createWidget', () => {
  it('campo text: input com valor atual; digitar atualiza o state', () => {
    const s = createState({ hero: { cta: 'Quero' } })
    const el = createWidget({ key: 'hero.cta', label: 'Botão', type: 'text' }, s)
    const input = el.querySelector('input, textarea')
    expect(input.value).toBe('Quero')
    input.value = 'Novo'
    input.dispatchEvent(new dom.window.Event('input'))
    expect(s.getKey('hero.cta')).toBe('Novo')
  })
  it('campo link: input url; valor inválido javascript: é bloqueado', () => {
    const s = createState({ x: { link: 'https://a' } })
    const el = createWidget({ key: 'x.link', label: 'Link', type: 'link' }, s)
    const input = el.querySelector('input')
    input.value = 'javascript:alert(1)'
    input.dispatchEvent(new dom.window.Event('input'))
    expect(s.getKey('x.link')).toBe('https://a') // não atualizou (bloqueado)
  })
  it('campo image: somente leitura, mostra o caminho atual', () => {
    const s = createState({ hero: { foto: 'assets/r.png' } })
    const el = createWidget({ key: 'hero.foto', label: 'Foto', type: 'image' }, s)
    expect(el.textContent).toContain('assets/r.png')
    expect(el.querySelector('input')).toBeNull() // sem edição nesta fase
  })
  it('campo label aparece', () => {
    const s = createState({ hero: { cta: 'a' } })
    const el = createWidget({ key: 'hero.cta', label: 'Texto do botão', type: 'text' }, s)
    expect(el.textContent).toContain('Texto do botão')
  })
})
