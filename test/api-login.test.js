import { describe, it, expect, beforeEach } from 'vitest'
import login from '../api/login.js'
import { hashPassword } from '../api/_lib/auth.js'

function mockRes() {
  return {
    statusCode: 200, headers: {}, body: null,
    status(c) { this.statusCode = c; return this },
    setHeader(k, v) { this.headers[k] = v },
    json(o) { this.body = o; return this },
    end() { return this },
  }
}
beforeEach(() => {
  process.env.SESSION_SECRET = 'a'.repeat(64)
  process.env.ADMIN_PASSWORD_HASH = hashPassword('certa')
})

describe('POST /api/login', () => {
  it('senha correta → 200 + cookie de sessão', async () => {
    const res = mockRes()
    await login({ method: 'POST', body: { password: 'certa' }, headers: {} }, res)
    expect(res.statusCode).toBe(200)
    expect(String(res.headers['Set-Cookie'])).toMatch(/sg_session=.*HttpOnly/)
  })
  it('senha errada → 401, sem cookie', async () => {
    const res = mockRes()
    await login({ method: 'POST', body: { password: 'errada' }, headers: {} }, res)
    expect(res.statusCode).toBe(401)
    expect(res.headers['Set-Cookie']).toBeUndefined()
  })
  it('método não-POST → 405', async () => {
    const res = mockRes()
    await login({ method: 'GET', headers: {} }, res)
    expect(res.statusCode).toBe(405)
  })
})
