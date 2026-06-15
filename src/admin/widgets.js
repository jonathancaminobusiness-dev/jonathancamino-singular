import { createRichEditor } from './richeditor.js'
import { isUnsafeUrl } from '../inject.js'

export function createWidget(field, state) {
  const wrap = document.createElement(field.type === 'rich' ? 'div' : 'label')
  wrap.className = 'pa-field'
  const cap = document.createElement('span')
  cap.className = 'pa-field__label'
  cap.textContent = field.label
  wrap.appendChild(cap)

  const value = state.getKey(field.key) ?? ''

  if (field.type === 'image' || field.type === 'video') {
    const ro = document.createElement('div')
    ro.className = 'pa-field__ro'
    ro.textContent = String(value) + '  (troca na publicação — Fase 3)'
    wrap.appendChild(ro)
    return wrap
  }

  if (field.type === 'rich') {
    const ed = createRichEditor({ value: String(value), onInput: (html) => state.setKey(field.key, html) })
    wrap.appendChild(ed.el)
    return wrap
  }

  const long = field.type === 'wa' || String(value).length > 80
  const input = document.createElement(long ? 'textarea' : 'input')
  if (!long) input.type = field.type === 'link' ? 'url' : 'text'
  input.className = 'pa-field__input'
  input.value = String(value)
  input.addEventListener('input', () => {
    if (field.type === 'link' && isUnsafeUrl(input.value)) return // bloqueia esquema perigoso
    state.setKey(field.key, input.value)
  })
  wrap.appendChild(input)
  return wrap
}
