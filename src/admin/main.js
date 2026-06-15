import baseContent from '../../content.json' // Vite resolve o import de JSON nativamente
import { SCHEMA } from '../../content.schema.js'
import { createState } from './state.js'
import { buildForm } from './form.js'
import { createPreview } from './preview.js'
import { saveDraft, loadDraft, clearDraft, downloadContent } from './draft.js'

const root = document.getElementById('admin-root')

function boot() {
  // semeia do rascunho salvo (se houver) ou do content.json importado.
  // structuredClone evita mutar o objeto importado/o rascunho original.
  const draft = loadDraft()
  const state = createState(structuredClone(draft || baseContent))

  root.innerHTML = ''
  root.className = 'pa'

  const left = document.createElement('div')
  left.className = 'pa-left'
  const bar = document.createElement('div')
  bar.className = 'pa-actions'
  const mk = (txt, fn) => { const b = document.createElement('button'); b.type='button'; b.textContent=txt; b.addEventListener('click', fn); return b }
  bar.appendChild(mk('Salvar rascunho', () => { saveDraft(state); flash('Rascunho salvo') }))
  bar.appendChild(mk('Reverter', () => { clearDraft(); location.reload() }))
  bar.appendChild(mk('Baixar content.json', () => downloadContent(state)))
  left.appendChild(bar)
  left.appendChild(buildForm(SCHEMA, state))

  const right = document.createElement('div')
  right.className = 'pa-right'
  const iframe = document.createElement('iframe')
  iframe.className = 'pa-preview'
  iframe.src = '/'
  right.appendChild(iframe)

  root.appendChild(left)
  root.appendChild(right)

  createPreview(iframe, state)
}

let flashT
function flash(msg) {
  let el = document.getElementById('pa-flash')
  if (!el) { el = document.createElement('div'); el.id='pa-flash'; el.className='pa-flash'; document.body.appendChild(el) }
  el.textContent = msg; el.classList.add('on')
  clearTimeout(flashT); flashT = setTimeout(() => el.classList.remove('on'), 1600)
}

try { boot() } catch (e) { root.textContent = 'Erro ao carregar o painel: ' + e.message }
