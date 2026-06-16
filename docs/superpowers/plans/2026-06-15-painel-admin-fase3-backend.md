# Painel Admin — Fase 3: Login + Publicar (backend + auth + deploy)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Tornar o `/admin` usável em produção: login por sessão, carregar/salvar conteúdo via API autenticada, Publicar (commit no GitHub → rebuild), upload de imagem — segredos só no servidor, com auditoria de segurança antes do deploy.

**Architecture:** Funções serverless do Vercel em `api/` (Node, `export default (req,res)`), com libs testáveis em `api/_lib/`. O painel deixa de embutir `content.json`: busca via `GET /api/content` (autenticado) e grava via `POST /api/save`. Sessão por cookie assinado (HMAC). Imagens validadas por magic-bytes e commitadas em `public/assets/uploads/`. Sem `sharp` (validação estrita, sem dependência nativa).

**Tech Stack:** Node `crypto` (scrypt, HMAC, timingSafeEqual), `fetch` (GitHub Contents API), Vitest. Sem novas deps de runtime.

**Spec:** `docs/superpowers/specs/2026-06-15-painel-admin-fase3-design.md`

---

## Estrutura de arquivos

```
api/_lib/cookies.js     parse/serialize de cookie (novo)
api/_lib/auth.js        hash/verify senha, sign/verify sessão, requireAuth (novo)
api/_lib/github.js      getFile/putFile (Contents API) (novo)
api/_lib/validate.js    valida payload de conteúdo vs schema + sanitiza (novo)
api/_lib/image.js       valida imagem (magic bytes/tamanho) (novo)
api/login.js  logout.js  content.js  save.js  upload.js   handlers (novo)
src/admin/api.js        cliente fetch das rotas /api (novo)
src/admin/auth-ui.js    tela de login (novo)
src/admin/main.js       gate de login + fetch + Publicar (alterado)
src/admin/widgets.js    imagem → upload (alterado)
scripts/hash-password.mjs  gera ADMIN_PASSWORD_HASH (novo)
vercel.json             headers noindex p/ admin e api (novo)
docs/PAINEL.md          guia de operação do cliente (novo)
test/api-*.test.js      testes das libs e handlers (novo)
```

**Contrato de env (server-only):** `ADMIN_PASSWORD_HASH` (formato `scrypt$<saltHex>$<hashHex>`), `SESSION_SECRET` (hex aleatório), `GITHUB_TOKEN` (fine-grained, Contents:write), `GITHUB_REPO` (`owner/repo`).

---

## Task 1: Libs de cookie + autenticação

**Files:** Create `api/_lib/cookies.js`, `api/_lib/auth.js`; Test `test/api-auth.test.js`.

- [ ] **Step 1: Testes que falham — `test/api-auth.test.js`:**
```js
import { describe, it, expect } from 'vitest'
import { parseCookies, serializeCookie } from '../api/_lib/cookies.js'
import { hashPassword, verifyPassword, signSession, verifySession } from '../api/_lib/auth.js'

const SECRET = 'a'.repeat(64)

describe('cookies', () => {
  it('parseia header de cookie', () => {
    expect(parseCookies('a=1; sg_session=xyz')).toEqual({ a: '1', sg_session: 'xyz' })
  })
  it('serializa com flags de segurança', () => {
    const c = serializeCookie('sg_session', 'v', { maxAge: 60 })
    expect(c).toMatch(/^sg_session=v;/)
    expect(c).toMatch(/HttpOnly/); expect(c).toMatch(/Secure/); expect(c).toMatch(/SameSite=Strict/)
  })
})

describe('password', () => {
  it('hash e verify batem; senha errada falha', () => {
    const h = hashPassword('segredo')
    expect(h).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
    expect(verifyPassword('segredo', h)).toBe(true)
    expect(verifyPassword('errada', h)).toBe(false)
  })
})

describe('session', () => {
  it('assina e verifica; rejeita adulteração e expiração', () => {
    const tok = signSession(SECRET, { ttlMs: 1000 })
    expect(verifySession(SECRET, tok)).toBeTruthy()
    expect(verifySession(SECRET, tok + 'x')).toBeNull()
    expect(verifySession('b'.repeat(64), tok)).toBeNull()
    const expired = signSession(SECRET, { ttlMs: -1 })
    expect(verifySession(SECRET, expired)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — FAIL.** `npx vitest run test/api-auth.test.js`

- [ ] **Step 3: Implementar `api/_lib/cookies.js`:**
```js
export function parseCookies(header) {
  const out = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function serializeCookie(name, value, { maxAge, path = '/' } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Strict`
  if (maxAge != null) c += `; Max-Age=${maxAge}`
  return c
}
```

- [ ] **Step 4: Implementar `api/_lib/auth.js`:**
```js
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from 'node:crypto'
import { parseCookies } from './cookies.js'

export function hashPassword(pw) {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 32)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(pw, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(pw, Buffer.from(saltHex, 'hex'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hmac(secret, data) {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function signSession(secret, { ttlMs = 7 * 24 * 3600 * 1000 } = {}) {
  const payload = Buffer.from(JSON.stringify({ exp: nowMs() + ttlMs })).toString('base64url')
  return `${payload}.${hmac(secret, payload)}`
}

export function verifySession(secret, token) {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expSig = hmac(secret, payload)
  if (sig.length !== expSig.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.exp || data.exp < nowMs()) return null
    return data
  } catch { return null }
}

// Lê o cookie de sessão da request e valida. Retorna o payload ou null.
export function requireAuth(req, secret = process.env.SESSION_SECRET) {
  const cookies = parseCookies(req.headers?.cookie || '')
  return verifySession(secret, cookies.sg_session)
}

// isolável p/ testes que precisem controlar o tempo (sobrescrevível)
export function nowMs() { return Date.now() }
```
> Nota: os testes não dependem de `Date.now` fixo (usam ttl relativo). Não usar `Date.now` dentro de workflow scripts — aqui é runtime de função, ok.

- [ ] **Step 5: Rodar — PASS.** `npx vitest run test/api-auth.test.js` então `npm test`.

- [ ] **Step 6: Commit.** `git add api/_lib/cookies.js api/_lib/auth.js test/api-auth.test.js && git commit -m "feat(api): libs de cookie e autenticacao (scrypt + HMAC de sessao)"`

---

## Task 2: Lib do GitHub (Contents API)

**Files:** Create `api/_lib/github.js`; Test `test/api-github.test.js`.

- [ ] **Step 1: Testes que falham — `test/api-github.test.js`:**
```js
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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: 'old' }) }) // getFileSha
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commit: { sha: 'new' } }) }) // put
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
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `api/_lib/github.js`:**
```js
const API = 'https://api.github.com'

function repo() {
  const r = process.env.GITHUB_REPO
  if (!r) throw new Error('GITHUB_REPO ausente')
  return r
}
function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'singular-admin',
  }
}

export async function getFileSha(path) {
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, { headers: headers() })
  if (!res.ok) { if (res.status === 404) return null; throw new Error(`github get ${res.status}`) }
  const data = await res.json()
  return data.sha || null
}

// Cria ou atualiza um arquivo. content é string (texto) ou Buffer (binário).
export async function putFile(path, content, message) {
  const sha = await getFileSha(path)
  const base64 = Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64')
  const body = { message, content: base64 }
  if (sha) body.sha = sha
  const res = await fetch(`${API}/repos/${repo()}/contents/${path}`, {
    method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`github put ${res.status}: ${await res.text()}`)
  return res.json()
}
```

- [ ] **Step 4: Rodar — PASS.** Então `npm test`.

- [ ] **Step 5: Commit.** `git add api/_lib/github.js test/api-github.test.js && git commit -m "feat(api): cliente do GitHub Contents API (getFileSha/putFile)"`

---

## Task 3: Handlers de login/logout

**Files:** Create `api/login.js`, `api/logout.js`; Test `test/api-login.test.js`.

- [ ] **Step 1: Testes que falham — `test/api-login.test.js`:**
```js
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
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `api/login.js`:**
```js
import { verifyPassword, signSession } from './_lib/auth.js'
import { serializeCookie } from './_lib/cookies.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const pw = req.body && req.body.password
  const hash = process.env.ADMIN_PASSWORD_HASH
  // atraso fixo para suavizar brute force
  await new Promise((r) => setTimeout(r, 300))
  if (!pw || !hash || !verifyPassword(String(pw), hash)) {
    return res.status(401).json({ error: 'credenciais' })
  }
  const token = signSession(process.env.SESSION_SECRET)
  res.setHeader('Set-Cookie', serializeCookie('sg_session', token, { maxAge: 7 * 24 * 3600 }))
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 4: Implementar `api/logout.js`:**
```js
import { serializeCookie } from './_lib/cookies.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  res.setHeader('Set-Cookie', serializeCookie('sg_session', '', { maxAge: 0 }))
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 5: Rodar — PASS.** `npm test`.

- [ ] **Step 6: Commit.** `git add api/login.js api/logout.js test/api-login.test.js && git commit -m "feat(api): handlers de login/logout"`

---

## Task 4: `GET /api/content` (autenticado)

**Files:** Create `api/content.js`; Test `test/api-content.test.js`.

- [ ] **Step 1: Teste que falha — `test/api-content.test.js`:** (mockRes igual ao da Task 3; copie o helper)
```js
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
    expect(res.body.hero).toBeTruthy() // veio do content.json do projeto
  })
})
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `api/content.js`:**
```js
import { readFileSync } from 'node:fs'
import { requireAuth } from './_lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' })
  if (!requireAuth(req)) return res.status(401).json({ error: 'auth' })
  // content.json está na raiz do deployment (incluído no repo)
  const json = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'))
  return res.status(200).json(json)
}
```
> Atenção: o caminho relativo de `import.meta.url` para `api/content.js` é `../content.json` (raiz). Se o Vercel empacotar a função sem o arquivo, ajustar para incluir `content.json` via `includeFiles` no `vercel.json` (ver Task 9). O teste roda com o cwd do projeto, então `new URL('../content.json', import.meta.url)` resolve a partir de `api/`.

- [ ] **Step 4: Rodar — PASS.** `npm test`.

- [ ] **Step 5: Commit.** `git add api/content.js test/api-content.test.js && git commit -m "feat(api): GET /api/content autenticado"`

---

## Task 5: Validação + `POST /api/save`

**Files:** Create `api/_lib/validate.js`, `api/save.js`; Test `test/api-save.test.js`.

- [ ] **Step 1: Testes que falham — `test/api-save.test.js`:**
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateContent, serializeForCommit } from '../api/_lib/validate.js'
import save from '../api/save.js'
import { signSession } from '../api/_lib/auth.js'
import * as github from '../api/_lib/github.js'

const SECRET='a'.repeat(64)
function mockRes(){return {statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(o){this.body=o;return this},end(){return this}}}
beforeEach(()=>{ process.env.SESSION_SECRET=SECRET })

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
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `api/_lib/validate.js`:**
```js
import { schemaKeys } from '../../content.schema.js'

const TOP = new Set(schemaKeys().map((k) => k.split('.')[0]))
const MAX_BYTES = 256 * 1024

// Valida que content é um objeto cujas seções de topo são conhecidas e cabe no limite.
export function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return { ok: false, error: 'não-objeto' }
  for (const k of Object.keys(content)) {
    if (!TOP.has(k)) return { ok: false, error: `seção desconhecida: ${k}` }
  }
  const size = Buffer.byteLength(JSON.stringify(content))
  if (size > MAX_BYTES) return { ok: false, error: 'muito grande' }
  return { ok: true }
}

export function serializeForCommit(content) {
  return JSON.stringify(content, null, 2) + '\n'
}
```

- [ ] **Step 4: Implementar `api/save.js`:**
```js
import { requireAuth } from './_lib/auth.js'
import { validateContent, serializeForCommit } from './_lib/validate.js'
import { putFile } from './_lib/github.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  if (!requireAuth(req)) return res.status(401).json({ error: 'auth' })
  const content = req.body && req.body.content
  const v = validateContent(content)
  if (!v.ok) return res.status(400).json({ error: v.error })
  try {
    await putFile('content.json', serializeForCommit(content), 'conteúdo atualizado pelo painel')
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(502).json({ error: 'falha ao publicar: ' + e.message })
  }
}
```

- [ ] **Step 5: Rodar — PASS.** `npm test`.

- [ ] **Step 6: Commit.** `git add api/_lib/validate.js api/save.js test/api-save.test.js && git commit -m "feat(api): POST /api/save valida e commita content.json"`

---

## Task 6: Validação de imagem + `POST /api/upload`

**Files:** Create `api/_lib/image.js`, `api/upload.js`; Test `test/api-upload.test.js`.

- [ ] **Step 1: Testes que falham — `test/api-upload.test.js`:**
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { sniffImage, safeName } from '../api/_lib/image.js'
import upload from '../api/upload.js'
import { signSession } from '../api/_lib/auth.js'
import * as github from '../api/_lib/github.js'

const SECRET='a'.repeat(64)
function mockRes(){return {statusCode:200,headers:{},body:null,status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v},json(o){this.body=o;return this},end(){return this}}}
const PNG = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a, 1,2,3])
const JPG = Buffer.from([0xff,0xd8,0xff,0xe0, 1,2,3])
beforeEach(()=>{ process.env.SESSION_SECRET=SECRET })

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
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `api/_lib/image.js`:**
```js
import { createHash } from 'node:crypto'

const SIGS = [
  { type: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (....WEBP)
]
const MAX = 4 * 1024 * 1024

// Detecta o tipo pela assinatura de bytes; retorna 'png'|'jpg'|'webp' ou null.
export function sniffImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length > MAX) return null
  for (const s of SIGS) {
    if (s.bytes.every((b, i) => buf[i] === b)) {
      if (s.type === 'webp' && buf.slice(8, 12).toString() !== 'WEBP') continue
      return s.type
    }
  }
  return null
}

export function safeName(filename, ext) {
  const base = String(filename).replace(/\.[^.]*$/, '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'img'
  const h = createHash('sha1').update(filename + ext).digest('hex').slice(0, 8)
  return `${base}-${h}.${ext === 'jpg' ? 'jpg' : ext}`
}
```

- [ ] **Step 4: Implementar `api/upload.js`:**
```js
import { requireAuth } from './_lib/auth.js'
import { sniffImage, safeName } from './_lib/image.js'
import { putFile } from './_lib/github.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  if (!requireAuth(req)) return res.status(401).json({ error: 'auth' })
  const { filename, dataBase64 } = req.body || {}
  if (!dataBase64) return res.status(400).json({ error: 'sem arquivo' })
  const buf = Buffer.from(String(dataBase64), 'base64')
  const type = sniffImage(buf)
  if (!type) return res.status(400).json({ error: 'imagem inválida ou muito grande' })
  const name = safeName(filename || 'img', type)
  const path = `assets/uploads/${name}`
  try {
    await putFile(`public/${path}`, buf, `upload de imagem: ${name}`)
    return res.status(200).json({ path })
  } catch (e) {
    return res.status(502).json({ error: 'falha no upload: ' + e.message })
  }
}
```

- [ ] **Step 5: Rodar — PASS.** `npm test`.

- [ ] **Step 6: Commit.** `git add api/_lib/image.js api/upload.js test/api-upload.test.js && git commit -m "feat(api): POST /api/upload com validacao por magic bytes"`

---

## Task 7: Cliente de API + tela de login

**Files:** Create `src/admin/api.js`, `src/admin/auth-ui.js`; Test `test/admin-api.test.js`.

- [ ] **Step 1: Teste que falha — `test/admin-api.test.js`:**
```js
import { describe, it, expect, vi } from 'vitest'
import { fetchContent, login, save, uploadImage } from '../src/admin/api.js'

describe('api client', () => {
  it('fetchContent: 200 devolve json; 401 lança NotAuth', async () => {
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
```

- [ ] **Step 2: Rodar — FAIL.**

- [ ] **Step 3: Implementar `src/admin/api.js`:**
```js
async function call(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (res.status === 401) throw new Error('NOT_AUTH')
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || ('erro ' + res.status))
  return res.json()
}
export function fetchContent() { return call('/api/content') }
export function login(password) { return call('/api/login', { method: 'POST', body: JSON.stringify({ password }) }) }
export function logout() { return call('/api/logout', { method: 'POST' }) }
export function save(content) { return call('/api/save', { method: 'POST', body: JSON.stringify({ content }) }) }
export function uploadImage(filename, dataBase64) {
  return call('/api/upload', { method: 'POST', body: JSON.stringify({ filename, dataBase64 }) })
}
```

- [ ] **Step 4: Implementar `src/admin/auth-ui.js`:**
```js
import { login } from './api.js'

// Renderiza a tela de login no root; chama onSuccess ao autenticar.
export function renderLogin(root, onSuccess) {
  root.innerHTML = ''
  root.className = 'pa-login'
  const box = document.createElement('form')
  box.className = 'pa-login__box'
  box.innerHTML = '<h1>Painel Singular</h1><p>Digite a senha para editar o site.</p>'
  const inp = document.createElement('input')
  inp.type = 'password'; inp.placeholder = 'Senha'; inp.className = 'pa-login__input'; inp.required = true
  const btn = document.createElement('button'); btn.type = 'submit'; btn.textContent = 'Entrar'
  const err = document.createElement('div'); err.className = 'pa-login__err'
  box.append(inp, btn, err)
  box.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true
    try { await login(inp.value); onSuccess() }
    catch { err.textContent = 'Senha incorreta.'; btn.disabled = false; inp.select() }
  })
  root.appendChild(box)
  inp.focus()
}
```

- [ ] **Step 5: Rodar — PASS.** `npm test`.

- [ ] **Step 6: Commit.** `git add src/admin/api.js src/admin/auth-ui.js test/admin-api.test.js && git commit -m "feat(admin): cliente de API + tela de login"`

---

## Task 8: Refactor do `main.js` (gate + fetch + Publicar) + widget de upload

**Files:** Modify `src/admin/main.js`, `src/admin/widgets.js`, `src/admin/admin.css`. (Verificação pelo controlador no browser.)

- [ ] **Step 1: Refazer o boot do `src/admin/main.js`** para:
  1. NÃO importar `content.json`.
  2. Tentar `fetchContent()`. Se lançar `NOT_AUTH` → `renderLogin(root, () => boot())`.
  3. Com o conteúdo, semear o `state` (rascunho local continua válido como overlay opcional).
  4. Barra de ações: **Publicar** (`save(state.get())` → feedback "no ar em ~1 min"), Salvar rascunho, Reverter, Sair (`logout`).

Código:
```js
import { SCHEMA } from '../../content.schema.js'
import { createState } from './state.js'
import { buildForm } from './form.js'
import { createPreview } from './preview.js'
import { saveDraft, loadDraft, clearDraft } from './draft.js'
import { fetchContent, save, logout } from './api.js'
import { renderLogin } from './auth-ui.js'

const root = document.getElementById('admin-root')

async function boot() {
  let base
  try { base = await fetchContent() }
  catch (e) { if (String(e.message) === 'NOT_AUTH') return renderLogin(root, boot); throw e }

  const state = createState(structuredClone(loadDraft() || base))
  root.innerHTML = ''; root.className = 'pa'

  const left = document.createElement('div'); left.className = 'pa-left'
  const bar = document.createElement('div'); bar.className = 'pa-actions'
  const mk = (t, fn, cls) => { const b = document.createElement('button'); b.type='button'; b.textContent=t; if(cls)b.className=cls; b.addEventListener('click', fn); return b }
  const publicar = mk('Publicar', async () => {
    publicar.disabled = true; flash('Publicando…')
    try { await save(state.get()); clearDraft(); flash('Publicado! No ar em ~1 min.') }
    catch (e) { flash('Erro: ' + e.message) } finally { publicar.disabled = false }
  }, 'pa-pub')
  bar.append(publicar,
    mk('Salvar rascunho', () => { saveDraft(state); flash('Rascunho salvo') }),
    mk('Reverter', () => { clearDraft(); location.reload() }),
    mk('Sair', async () => { await logout(); location.reload() }))
  left.append(bar, buildForm(SCHEMA, state))

  const right = document.createElement('div'); right.className = 'pa-right'
  const iframe = document.createElement('iframe'); iframe.className = 'pa-preview'; iframe.src = '/'
  right.appendChild(iframe)
  root.append(left, right)
  createPreview(iframe, state)
}

let flashT
function flash(msg) {
  let el = document.getElementById('pa-flash')
  if (!el) { el = document.createElement('div'); el.id='pa-flash'; el.className='pa-flash'; document.body.appendChild(el) }
  el.textContent = msg; el.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => el.classList.remove('on'), 2200)
}

boot().catch((e) => { root.textContent = 'Erro ao carregar o painel: ' + e.message })
```

- [ ] **Step 2: Widget de imagem com upload** em `src/admin/widgets.js`: trocar o ramo `image` (hoje read-only) por: miniatura + botão "Trocar imagem" → `<input type=file accept="image/*">` → lê como base64 → `uploadImage(filename, base64)` → `state.setKey(field.key, resp.path)` → atualiza a miniatura. `video` segue read-only. Importar `uploadImage` de `./api.js`. Tratar erro com alerta inline. (Manter os outros tipos idênticos.)

- [ ] **Step 3: CSS** em `admin.css`: estilos `.pa-login`, `.pa-login__box`, `.pa-login__input`, `.pa-login__err`, `.pa-pub` (botão verde de destaque), e a miniatura do upload.

- [ ] **Step 4: Build + testes.** `npm run build` (2 páginas) e `npm test` verdes. O `main.js` não importa mais `content.json` (confirmar que o bundle do admin não contém strings do conteúdo: `grep -c "Rodrigo Prevot" dist/assets/admin-*.js` deve ser 0).

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat(admin): gate de login + Publicar + upload de imagem"`

- [ ] **Step 6: Verificação do controlador (browser, com vercel dev):** ver Task 11.

---

## Task 9: Script de hash, vercel.json, guia do cliente

**Files:** Create `scripts/hash-password.mjs`, `vercel.json`, `docs/PAINEL.md`.

- [ ] **Step 1: `scripts/hash-password.mjs`:**
```js
import { hashPassword } from '../api/_lib/auth.js'
const pw = process.argv[2]
if (!pw) { console.error('uso: node scripts/hash-password.mjs <senha>'); process.exit(1) }
console.log(hashPassword(pw))
```

- [ ] **Step 2: `vercel.json`** — `noindex` para `/admin` e `/api`, e garantir o `content.json` disponível à função:
```json
{
  "functions": { "api/content.js": { "includeFiles": "content.json" } },
  "headers": [
    { "source": "/admin(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] },
    { "source": "/api/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] }
  ]
}
```

- [ ] **Step 3: `docs/PAINEL.md`** — guia do cliente: como acessar `/admin`, login, editar, trocar imagem, Publicar (e o ~1 min), Salvar rascunho vs Publicar, e a seção de setup (token GitHub + 4 env vars) com passo a passo.

- [ ] **Step 4: Commit.** `git add scripts/hash-password.mjs vercel.json docs/PAINEL.md && git commit -m "chore(admin): script de hash, vercel.json e guia do cliente"`

---

## Task 10: Auditoria de segurança (`vibe-security`)

- [ ] **Step 1:** Rodar a skill **`vibe-security`** sobre o diff da Fase 3 (`api/`, `src/admin/`, `vercel.json`). Focar: auth (hash/sessão/constante), todas as rotas de escrita exigindo sessão, token só no servidor, validação de upload/save, ausência de segredos/conteúdo no bundle, headers.
- [ ] **Step 2:** Corrigir achados críticos/altos (cada um com teste quando aplicável). Re-rodar até zerar.
- [ ] **Step 3:** Commit das correções.

---

## Task 11: Integração local + setup do cliente + deploy

- [ ] **Step 1: `vercel dev` local** com env de teste (`.env` local NÃO commitado): gerar hash de teste, `SESSION_SECRET` aleatório, e um `GITHUB_TOKEN`/`GITHUB_REPO` apontando para um branch/repo de teste (ou pular o commit real). Controlador verifica no browser: `/admin` mostra login → senha → painel carrega via API → editar → preview → (upload e publicar em modo de teste).
- [ ] **Step 2:** Verificar 401 sem sessão em `save`/`upload`/`content` (curl/preview).
- [ ] **Step 3: Setup do cliente (guiado):** o cliente cria o token fine-grained do GitHub (Contents: read/write neste repo) e define no Vercel: `GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_PASSWORD_HASH` (gerado por `hash-password.mjs` a partir da senha escolhida), `SESSION_SECRET` (hex aleatório). **Claude não insere segredos — o cliente faz isso no painel do Vercel.**
- [ ] **Step 4: Deploy** (`vercel --prod`) após o setup. Verificar em produção: site público idêntico; `/admin` mostra login; publicar uma edição de teste real e confirmar o rebuild + a mudança no ar.
- [ ] **Step 5:** Finalizar a branch (merge para `main`) — agora seguro, pois o painel é gated.

---

## Critérios de conclusão da Fase 3

1. `npm test` verde (auth, github, login, content, save, image, upload, api client).
2. `/admin` sem sessão → login; com sessão → painel via API; bundle sem conteúdo/segredos.
3. Publicar grava `content.json` no GitHub → rebuild → mudança no ar (~1 min), design/SEO intactos.
4. Upload troca imagem (commit em `assets/uploads/`).
5. Rotas de escrita recusam sem sessão (401).
6. `vibe-security` sem achados críticos/altos abertos.
7. Deploy em produção com painel gated; site público idêntico.
