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
    console.error('[upload] erro ao commitar no GitHub:', e.message)
    return res.status(502).json({ error: 'falha no upload' })
  }
}
