import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { buildForm } from '../src/admin/form.js'
import { createState } from '../src/admin/state.js'
import { SCHEMA } from '../content.schema.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('buildForm', () => {
  it('um grupo por seção distinta', () => {
    const s = createState({})
    const form = buildForm(SCHEMA, s)
    const sections = new Set(SCHEMA.map((f) => f.section))
    expect(form.querySelectorAll('.pa-group').length).toBe(sections.size)
  })
  it('um widget por campo do schema', () => {
    const s = createState({})
    const form = buildForm(SCHEMA, s)
    expect(form.querySelectorAll('.pa-field').length).toBe(SCHEMA.length)
  })
})
