import { verifyPassword, signSession } from './_lib/auth.js'
import { serializeCookie } from './_lib/cookies.js'
import { checkRate, recordFailure, clearFailures, clientIp } from './_lib/ratelimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const ip = clientIp(req)
  if (!checkRate(ip)) return res.status(429).json({ error: 'muitas tentativas, tente mais tarde' })
  const pw = req.body && req.body.password
  const hash = process.env.ADMIN_PASSWORD_HASH
  await new Promise((r) => setTimeout(r, 300))
  if (!pw || !hash || !verifyPassword(String(pw), hash)) {
    recordFailure(ip)
    return res.status(401).json({ error: 'credenciais' })
  }
  clearFailures(ip)
  const token = signSession(process.env.SESSION_SECRET)
  res.setHeader('Set-Cookie', serializeCookie('sg_session', token, { maxAge: 7 * 24 * 3600 }))
  return res.status(200).json({ ok: true })
}
