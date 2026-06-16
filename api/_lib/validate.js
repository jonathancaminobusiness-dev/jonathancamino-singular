import { schemaKeys } from '../../content.schema.js'

const TOP = new Set(schemaKeys().map((k) => k.split('.')[0]))
const MAX_BYTES = 256 * 1024

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
