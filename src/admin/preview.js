import { applyContent } from '../inject.js'

// Liga o state ao iframe: a cada mudança (com debounce), reescreve o conteúdo
// anotado direto no documento do iframe (mesmo domínio). Reaplica no load.
export function createPreview(iframe, state, { debounce = 120 } = {}) {
  let t = null
  const apply = () => {
    try {
      const doc = iframe.contentDocument
      if (doc) applyContent(doc, state.get())
    } catch (e) {
      // iframe navegou para outra origem (ex.: clique em link externo) — restaura
      try { iframe.src = '/' } catch (_) {}
    }
  }
  const schedule = () => {
    if (debounce === 0) return apply()
    clearTimeout(t)
    t = setTimeout(apply, debounce)
  }
  state.subscribe(schedule)
  iframe.addEventListener?.('load', apply)
  apply()
  return { apply }
}
