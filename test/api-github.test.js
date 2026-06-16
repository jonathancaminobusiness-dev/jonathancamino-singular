import { describe, it, expect, vi, beforeEach } from 'vitest'
import { putFile, getFileSha } from '../api/_lib/github.js'

const env = { GITHUB_TOKEN: 'tok', GITHUB_REPO: 'owner/repo' }
beforeEach(() => { vi.restoreAllMocks(); Object.assign(process.env, env) })

describe('github', () => {
  it('getFileSha devolve o sha quando existe', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sha: 'abc' }) })
    expect(await getFileSha('content.json')).toBe('abc')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/contents/content.json',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) })
    )
  })
  it('getFileSha devolve null em 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    expect(await getFileSha('nao.existe')).toBeNull()
  })
  it('putFile envia conteúdo base64, mensagem e sha', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'old' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commit: { sha: 'new' } }) })
    const r = await putFile('content.json', 'oi', 'msg')
    const [url, opts] = fetch.mock.calls[1]
    expect(url).toBe('https://api.github.com/repos/owner/repo/contents/content.json')
    expect(opts.method).toBe('PUT')
    const body = JSON.parse(opts.body)
    expect(Buffer.from(body.content, 'base64').toString()).toBe('oi')
    expect(body.message).toBe('msg'); expect(body.sha).toBe('old')
    expect(r.commit.sha).toBe('new')
  })
})
