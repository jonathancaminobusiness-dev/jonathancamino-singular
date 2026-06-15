import { describe, it, expect, vi } from 'vitest'
import { createState } from '../src/admin/state.js'

describe('createState', () => {
  it('lê valores por caminho pontilhado', () => {
    const s = createState({ hero: { titulo: 'Olá' } })
    expect(s.getKey('hero.titulo')).toBe('Olá')
    expect(s.get()).toEqual({ hero: { titulo: 'Olá' } })
  })
  it('setKey grava e notifica assinantes', () => {
    const s = createState({ hero: { titulo: 'a' } })
    const cb = vi.fn()
    s.subscribe(cb)
    s.setKey('hero.titulo', 'b')
    expect(s.getKey('hero.titulo')).toBe('b')
    expect(cb).toHaveBeenCalledTimes(1)
  })
  it('setKey cria caminho novo incluindo índices', () => {
    const s = createState({})
    s.setKey('solucoes.cards.0.titulo', 'X')
    expect(s.get()).toEqual({ solucoes: { cards: [{ titulo: 'X' }] } })
  })
  it('subscribe devolve cancelador', () => {
    const s = createState({})
    const cb = vi.fn()
    const off = s.subscribe(cb)
    off()
    s.setKey('a', 1)
    expect(cb).not.toHaveBeenCalled()
  })
})
