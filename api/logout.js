import { serializeCookie } from './_lib/cookies.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  res.setHeader('Set-Cookie', serializeCookie('sg_session', '', { maxAge: 0 }))
  return res.status(200).json({ ok: true })
}
