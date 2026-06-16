import { createHash } from 'node:crypto'

const SIGS = [
  { type: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]
// 3MB no buffer decodificado: em base64 (+33%) o corpo da request fica ~4MB,
// abaixo do limite de body das funções do Vercel (~4.5MB).
const MAX = 3 * 1024 * 1024

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
