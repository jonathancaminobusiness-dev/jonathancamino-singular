// Allowlist de tags inline permitidas nos campos de texto.
const ALLOWED = new Set(['B', 'STRONG', 'EM', 'I', 'BR', 'SPAN'])

// Tags cujo conteúdo é perigoso — remove o elemento inteiro, sem desembrulhar.
// Inclui svg/math (evitam comparação case-insensitive) e link/base/meta (injeção de recursos).
const DROP_ENTIRELY = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED',
  'SVG', 'MATH',
  'LINK', 'BASE', 'META',
])

// Lê um caminho pontilhado ("a.b.0.c") de um objeto. Retorna undefined se faltar.
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
}

// Remove recursivamente tags fora da allowlist, preservando o texto e as tags válidas.
function sanitize(doc, html) {
  const tpl = doc.createElement('template')
  tpl.innerHTML = html
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 8 /* comment */) {
        // I1: remove nós de comentário — podem conter conteúdo sensível
        node.removeChild(child)
      } else if (child.nodeType === 1 /* element */) {
        // C1: normaliza para maiúsculas para cobrir svg/math (tagName é lowercase nesses contextos)
        const tag = child.tagName.toUpperCase()
        if (DROP_ENTIRELY.has(tag)) {
          // remove completamente (incluindo conteúdo) — nunca desembrulha
          node.removeChild(child)
        } else if (!ALLOWED.has(tag)) {
          // C2: sanitiza os filhos ANTES de desembrulhar, evitando que netos maliciosos escapem
          walk(child)
          // desembrulha: substitui o elemento pelos seus filhos já sanitizados
          while (child.firstChild) node.insertBefore(child.firstChild, child)
          node.removeChild(child)
        } else {
          // remove todos os atributos de tags inline (segurança)
          for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name)
          walk(child)
        }
      }
    }
  }
  walk(tpl.content)
  return tpl.innerHTML
}

export function applyContent(doc, content) {
  const candidates = Array.from(doc.querySelectorAll('*')).filter(
    el => Array.from(el.attributes).some(a => a.name === 'data-edit' || a.name.startsWith('data-edit-'))
  )
  for (const el of candidates) {
    // texto / innerHTML
    if (el.hasAttribute('data-edit')) {
      const val = getPath(content, el.getAttribute('data-edit'))
      if (val != null) el.innerHTML = sanitize(doc, String(val))
    }
    // link wa.me derivado
    if (el.hasAttribute('data-edit-wa')) {
      const msg = getPath(content, el.getAttribute('data-edit-wa'))
      const num = getPath(content, 'contato.whatsapp')
      if (msg != null && num != null) {
        el.setAttribute('href', `https://wa.me/${num}?text=${encodeURIComponent(String(msg))}`)
      }
    }
    // atributos genéricos data-edit-<attr> (exceto o caso especial -wa)
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('data-edit-') || attr.name === 'data-edit-wa') continue
      const target = attr.name.slice('data-edit-'.length) // ex.: "href", "src", "alt"
      const val = getPath(content, attr.value)
      if (val != null) el.setAttribute(target, String(val))
    }
  }
}
