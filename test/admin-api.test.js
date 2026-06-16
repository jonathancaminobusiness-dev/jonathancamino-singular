import { describe, it, expect, vi } from 'vitest'
import { fetchContent, login, save, uploadImage } from '../src/admin/api.js'

describe('api client', () => {
  it('fetchContent: 200 devolve json; 401 lança NOT_AUTH', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ hero: {} }) })
    expect(await fetchContent()).toEqual({ hero: {} })
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    await expect(fetchContent()).rejects.toThrow('NOT_AUTH')
  })
  it('save posta o conteúdo', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })
    await save({ hero: { titulo: 'x' } })
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('/api/save'); expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ content: { hero: { titulo: 'x' } } })
  })
})
