const KEY = 'singular.draft.v1'

export function serializeContent(state) {
  return JSON.stringify(state.get(), null, 2) + '\n'
}

export function saveDraft(state) {
  localStorage.setItem(KEY, JSON.stringify(state.get()))
}

export function loadDraft() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) }
  catch (e) { localStorage.removeItem(KEY); return null }
}

export function clearDraft() {
  localStorage.removeItem(KEY)
}

// Dispara o download de content.json (uso no browser; não exercitado nos testes).
export function downloadContent(state) {
  const blob = new Blob([serializeContent(state)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'content.json'
  a.click()
  URL.revokeObjectURL(url)
}
