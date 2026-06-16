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
