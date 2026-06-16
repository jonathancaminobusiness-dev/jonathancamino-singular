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

export function requireAuth(req, secret = process.env.SESSION_SECRET) {
  const cookies = parseCookies(req.headers?.cookie || '')
  return verifySession(secret, cookies.sg_session)
}

export function nowMs() { return Date.now() }
