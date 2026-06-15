// Escreve um valor num caminho pontilhado, criando objetos/arrays conforme as chaves.
export function setPath(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  keys.forEach((k, i) => {
    const last = i === keys.length - 1
    if (last) { cur[k] = value; return }
    if (cur[k] == null) {
      const nextIsIndex = /^\d+$/.test(keys[i + 1])
      cur[k] = nextIsIndex ? [] : {}
    }
    cur = cur[k]
  })
  return obj
}

const WA_RE = /^https:\/\/wa\.me\/(\d+)\?text=(.*)$/

export function extractContent(doc) {
  const out = {}
  // Mesma seleção do applyContent: qualquer elemento com data-edit ou data-edit-*
  const els = Array.from(doc.querySelectorAll('*')).filter(el =>
    Array.from(el.attributes).some(a => a.name === 'data-edit' || a.name.startsWith('data-edit-'))
  )
  for (const el of els) {
    if (el.hasAttribute('data-edit')) {
      setPath(out, el.getAttribute('data-edit'), el.innerHTML.trim())
    }
    if (el.hasAttribute('data-edit-wa')) {
      const m = (el.getAttribute('href') || '').match(WA_RE)
      if (m) {
        setPath(out, 'contato.whatsapp', m[1])
        setPath(out, el.getAttribute('data-edit-wa'), decodeURIComponent(m[2]))
      }
    }
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('data-edit-') || attr.name === 'data-edit-wa') continue
      const target = attr.name.slice('data-edit-'.length) // ex.: "href", "src", "alt"
      setPath(out, attr.value, el.getAttribute(target) || '')
    }
  }
  return out
}
