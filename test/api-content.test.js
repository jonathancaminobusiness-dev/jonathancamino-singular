import { describe, it, expect, beforeEach } from 'vitest'
import content from '../api/content.js'
import { signSession } from '../api/_lib/auth.js'

const SECRET = 'a'.repeat(64)
function mockRes(){return {statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(o){this.body=o;return this},end(){return this}}}
beforeEach(() => { process.env.SESSION_SECRET = SECRET })

describe('GET /api/content', () => {
  it('sem sessão → 401', async () => {
    const res = mockRes()
    await content({ method: 'GET', headers: {} }, res)
    expect(res.statusCode).toBe(401)
  })
  it('com sessão → 200 + objeto de conteúdo', async () => {
    const res = mockRes()
    const cookie = `sg_session=${signSession(SECRET)}`
    await content({ method: 'GET', headers: { cookie } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body && typeof res.body).toBe('object')
    expect(res.body.hero).toBeTruthy()
  })
})
