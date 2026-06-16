import { SCHEMA } from '../../content.schema.js'
import { createState } from './state.js'
import { buildForm } from './form.js'
import { createPreview } from './preview.js'
import { saveDraft, loadDraft, clearDraft } from './draft.js'
import { fetchContent, save, logout } from './api.js'
import { renderLogin } from './auth-ui.js'

const root = document.getElementById('admin-root')

async function boot() {
  let base
  try { base = await fetchContent() }
  catch (e) { if (String(e.message) === 'NOT_AUTH') return renderLogin(root, boot); throw e }

  const state = createState(structuredClone(loadDraft() || base))
  root.innerHTML = ''; root.className = 'pa'

  const left = document.createElement('div'); left.className = 'pa-left'
  const bar = document.createElement('div'); bar.className = 'pa-actions'
  const mk = (t, fn, cls) => { const b = document.createElement('button'); b.type='button'; b.textContent=t; if(cls)b.className=cls; b.addEventListener('click', fn); return b }
  const publicar = mk('Publicar', async () => {
    publicar.disabled = true; flash('Publicando…')
    try { await save(state.get()); clearDraft(); flash('Publicado! No ar em ~1 min.') }
    catch (e) { flash('Erro: ' + e.message) } finally { publicar.disabled = false }
  }, 'pa-pub')
  bar.append(publicar,
    mk('Salvar rascunho', () => { saveDraft(state); flash('Rascunho salvo') }),
    mk('Reverter', () => { clearDraft(); location.reload() }),
    mk('Sair', async () => { try { await logout() } finally { location.reload() } }))
  left.append(bar, buildForm(SCHEMA, state))

  const right = document.createElement('div'); right.className = 'pa-right'
  const iframe = document.createElement('iframe'); iframe.className = 'pa-preview'; iframe.src = '/'
  right.appendChild(iframe)
  root.append(left, right)
  createPreview(iframe, state)
}

let flashT
function flash(msg) {
  let el = document.getElementById('pa-flash')
  if (!el) { el = document.createElement('div'); el.id='pa-flash'; el.className='pa-flash'; document.body.appendChild(el) }
  el.textContent = msg; el.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => el.classList.remove('on'), 2200)
}

boot().catch((e) => { root.textContent = 'Erro ao carregar o painel: ' + e.message })
