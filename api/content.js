import { readFileSync } from 'node:fs'
import { requireAuth } from './_lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' })
  if (!requireAuth(req)) return res.status(401).json({ error: 'auth' })
  const json = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'))
  return res.status(200).json(json)
}
