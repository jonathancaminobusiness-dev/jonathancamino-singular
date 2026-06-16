import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateContent, serializeForCommit } from '../api/_lib/validate.js'
import save from '../api/save.js'
import { signSession } from '../api/_lib/auth.js'
import * as github from '../api/_lib/github.js'

const SECRET='a'.repeat(64)
function mockRes(){return {statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(o){this.body=o;return this},end(){return this}}}
beforeEach(()=>{ vi.restoreAllMocks(); process.env.SESSION_SECRET=SECRET })

describe('validateContent', () => {
  it('aceita objeto com chaves conhecidas', () => {
    expect(validateContent({ hero: { titulo: 'x' } }).ok).toBe(true)
  })
  it('rejeita chave desconhecida', () => {
    expect(validateContent({ hacker: { x: 1 } }).ok).toBe(false)
  })
  it('rejeita não-objeto', () => {
    expect(validateContent('texto').ok).toBe(false)
  })
})

describe('serializeForCommit', () => {
  it('formata 2 espaços + newline final (igual ao build)', () => {
    expect(serializeForCommit({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2) + '\n')
  })
})

describe('POST /api/save', () => {
  it('sem sessão → 401', async () => {
    const res=mockRes()
    await save({ method:'POST', headers:{}, body:{ content:{ hero:{titulo:'x'} } } }, res)
    expect(res.statusCode).toBe(401)
  })
  it('com sessão e conteúdo válido → commita e 200', async () => {
    const put = vi.spyOn(github, 'putFile').mockResolvedValue({ commit: { sha: 'new' } })
    const res=mockRes()
    const cookie=`sg_session=${signSession(SECRET)}`
    await save({ method:'POST', headers:{ cookie }, body:{ content:{ hero:{titulo:'novo'} } } }, res)
    expect(res.statusCode).toBe(200)
    expect(put).toHaveBeenCalledWith('content.json', JSON.stringify({ hero:{titulo:'novo'} }, null, 2)+'\n', expect.any(String))
  })
  it('conteúdo inválido → 400, sem commit', async () => {
    const put = vi.spyOn(github, 'putFile').mockResolvedValue({})
    const res=mockRes()
    const cookie=`sg_session=${signSession(SECRET)}`
    await save({ method:'POST', headers:{ cookie }, body:{ content:{ hacker:1 } } }, res)
    expect(res.statusCode).toBe(400)
    expect(put).not.toHaveBeenCalled()
  })
})
