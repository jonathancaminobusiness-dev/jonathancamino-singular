import { applyContent } from '../inject.js'

// Liga o state ao iframe: a cada mudança (com debounce), reescreve o conteúdo
// anotado direto no documento do iframe (mesmo domínio). Reaplica no load.
export function createPreview(iframe, state, { debounce = 120 } = {}) {
  let t = null
  const apply = () => {
    const doc = iframe.contentDocument
    if (doc) applyContent(doc, state.get())
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
