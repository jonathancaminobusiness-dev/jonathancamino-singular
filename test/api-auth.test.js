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
