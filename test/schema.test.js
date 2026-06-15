import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { SCHEMA, schemaKeys } from '../content.schema.js'
import { collectEditEls } from '../src/edit-attrs.js'

function annotatedKeys() {
  const html = readFileSync('index.html', 'utf8')
  const { document } = new JSDOM(html).window
  const keys = new Set()
  const els = collectEditEls(document)
  for (const el of els) {
    if (el.hasAttribute('data-edit')) keys.add(el.getAttribute('data-edit'))
    if (el.hasAttribute('data-edit-wa')) { keys.add(el.getAttribute('data-edit-wa')); keys.add('contato.whatsapp') }
    for (const a of el.attributes) {
      if (a.name.startsWith('data-edit-') && a.name !== 'data-edit-wa') keys.add(a.value)
    }
  }
  return keys
}

describe('schema × index.html', () => {
  it('toda chave anotada existe no schema', () => {
    const sk = new Set(schemaKeys())
    const missing = [...annotatedKeys()].filter(k => !sk.has(k))
    expect(missing).toEqual([])
  })
  it('toda chave do schema está anotada no html', () => {
    const ak = annotatedKeys()
    const orphan = schemaKeys().filter(k => !ak.has(k))
    expect(orphan).toEqual([])
  })
})
