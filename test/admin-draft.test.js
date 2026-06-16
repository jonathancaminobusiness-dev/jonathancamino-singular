import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { serializeContent, saveDraft, loadDraft, clearDraft } from '../src/admin/draft.js'
import { createState } from '../src/admin/state.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
globalThis.document = dom.window.document
globalThis.localStorage = dom.window.localStorage

describe('draft', () => {
  beforeEach(() => localStorage.clear())
  it('serializeContent gera JSON com nova linha final', () => {
    const s = createState({ a: 1 })
    expect(serializeContent(s)).toBe(JSON.stringify({ a: 1 }, null, 2) + '\n')
  })
  it('save então load devolve o mesmo objeto', () => {
    const s = createState({ hero: { titulo: 'X' } })
    saveDraft(s)
    expect(loadDraft()).toEqual({ hero: { titulo: 'X' } })
  })
  it('clear remove o rascunho', () => {
    const s = createState({ a: 1 })
    saveDraft(s); clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it('rascunho corrompido é descartado (retorna null)', () => {
    localStorage.setItem('singular.draft.v1', '{not valid json')
    expect(loadDraft()).toBeNull()
    expect(localStorage.getItem('singular.draft.v1')).toBeNull()
  })
})
