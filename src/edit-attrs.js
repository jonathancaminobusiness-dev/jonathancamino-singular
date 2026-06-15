// Seleção única de elementos editáveis (data-edit ou data-edit-*).
// Fonte da verdade compartilhada por inject, extract e testes — evita drift.
export function isEditEl(el) {
  return Array.from(el.attributes).some(
    (a) => a.name === 'data-edit' || a.name.startsWith('data-edit-')
  )
}
export function collectEditEls(doc) {
  return Array.from(doc.querySelectorAll('*')).filter(isEditEl)
}
