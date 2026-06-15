// Allowlist de tags inline permitidas nos campos de texto.
const ALLOWED = new Set(['B', 'STRONG', 'EM', 'I', 'BR', 'SPAN'])

// Tags cujo conteúdo é perigoso — remove o elemento inteiro, sem desembrulhar.
const DROP_ENTIRELY = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'])

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
      if (child.nodeType === 1 /* element */) {
        if (DROP_ENTIRELY.has(child.tagName)) {
          // remove completamente (incluindo conteúdo) — nunca desembrulha
          node.removeChild(child)
        } else if (!ALLOWED.has(child.tagName)) {
          // desembrulha: substitui o elemento pelos seus filhos
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
  for (const el of doc.querySelectorAll('[data-edit]')) {
    const key = el.getAttribute('data-edit')
    const val = getPath(content, key)
    if (val == null) continue
    el.innerHTML = sanitize(doc, String(val))
  }
}
