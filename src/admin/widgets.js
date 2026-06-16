import { createRichEditor } from './richeditor.js'
import { isUnsafeUrl } from '../inject.js'
import { uploadImage } from './api.js'

export function createWidget(field, state) {
  const wrap = document.createElement(field.type === 'rich' ? 'div' : 'label')
  wrap.className = 'pa-field'
  const cap = document.createElement('span')
  cap.className = 'pa-field__label'
  cap.textContent = field.label
  wrap.appendChild(cap)

  const value = state.getKey(field.key) ?? ''

  if (field.type === 'image') {
    const cur = document.createElement('div'); cur.className = 'pa-field__ro'
    cur.textContent = String(value) || '(sem imagem)'
    const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Trocar imagem'; btn.className = 'pa-upload'
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/*'; file.style.display = 'none'
    const err = document.createElement('div'); err.className = 'pa-field__err'
    btn.addEventListener('click', () => file.click())
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0]; if (!f) return
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Enviando…'
      try {
        const dataBase64 = await new Promise((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result).replace(/^data:[^;]+;base64,/, ''))
          r.onerror = () => reject(new Error('falha ao ler arquivo'))
          r.readAsDataURL(f)
        })
        const resp = await uploadImage(f.name, dataBase64)
        state.setKey(field.key, resp.path)
        cur.textContent = resp.path
      } catch (e) { err.textContent = e.message === 'NOT_AUTH' ? 'Sessão expirada — recarregue para entrar de novo.' : 'Erro no upload: ' + e.message }
      finally { btn.disabled = false; btn.textContent = 'Trocar imagem' }
    })
    wrap.append(cur, btn, file, err)
    return wrap
  }
  if (field.type === 'video') {
    const ro = document.createElement('div'); ro.className = 'pa-field__ro'
    ro.textContent = String(value) + '  (troca na publicação)'
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
