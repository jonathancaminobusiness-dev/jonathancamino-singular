import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sniffImage, safeName } from '../api/_lib/image.js'
import upload from '../api/upload.js'
import { signSession } from '../api/_lib/auth.js'
import * as github from '../api/_lib/github.js'

const SECRET='a'.repeat(64)
function mockRes(){return {statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(o){this.body=o;return this},end(){return this}}}
const PNG = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, 1,2,3])
const JPG = Buffer.from([0xff,0xd8,0xff,0xe0, 1,2,3])
beforeEach(()=>{ vi.restoreAllMocks(); process.env.SESSION_SECRET=SECRET })

describe('sniffImage', () => {
  it('reconhece png e jpg pelos magic bytes', () => {
    expect(sniffImage(PNG)).toBe('png')
    expect(sniffImage(JPG)).toBe('jpg')
  })
  it('rejeita conteúdo não-imagem', () => {
    expect(sniffImage(Buffer.from('not an image'))).toBeNull()
  })
})
describe('safeName', () => {
  it('saneia e adiciona extensão', () => {
    expect(safeName('Minha Foto!.png', 'png')).toMatch(/^minha-foto-[0-9a-f]{8}\.png$/)
  })
})
describe('POST /api/upload', () => {
  it('sem sessão → 401', async () => {
    const res=mockRes()
    await upload({ method:'POST', headers:{}, body:{} }, res)
    expect(res.statusCode).toBe(401)
  })
  it('imagem válida → commita e devolve caminho', async () => {
    const put=vi.spyOn(github,'putFile').mockResolvedValue({ commit:{ sha:'x' } })
    const res=mockRes(); const cookie=`sg_session=${signSession(SECRET)}`
    await upload({ method:'POST', headers:{ cookie }, body:{ filename:'foto.png', dataBase64: PNG.toString('base64') } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.path).toMatch(/^assets\/uploads\/foto-[0-9a-f]{8}\.png$/)
    expect(put).toHaveBeenCalled()
    expect(put.mock.calls[0][0]).toMatch(/^public\/assets\/uploads\//)
  })
  it('conteúdo não-imagem → 400, sem commit', async () => {
    const put=vi.spyOn(github,'putFile').mockResolvedValue({})
    const res=mockRes(); const cookie=`sg_session=${signSession(SECRET)}`
    await upload({ method:'POST', headers:{ cookie }, body:{ filename:'x.png', dataBase64: Buffer.from('nope').toString('base64') } }, res)
    expect(res.statusCode).toBe(400)
    expect(put).not.toHaveBeenCalled()
  })
})
