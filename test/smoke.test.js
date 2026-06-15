import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

describe('infra', () => {
  it('jsdom monta um documento', () => {
    const { document } = new JSDOM('<h1>oi</h1>').window
    expect(document.querySelector('h1').textContent).toBe('oi')
  })
})
