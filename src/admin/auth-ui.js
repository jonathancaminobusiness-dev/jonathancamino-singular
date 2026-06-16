import { login } from './api.js'

export function renderLogin(root, onSuccess) {
  root.innerHTML = ''
  root.className = 'pa-login'
  const box = document.createElement('form')
  box.className = 'pa-login__box'
  box.innerHTML = '<h1>Painel Singular</h1><p>Digite a senha para editar o site.</p>'
  const inp = document.createElement('input')
  inp.type = 'password'; inp.placeholder = 'Senha'; inp.className = 'pa-login__input'; inp.required = true
  const btn = document.createElement('button'); btn.type = 'submit'; btn.textContent = 'Entrar'
  const err = document.createElement('div'); err.className = 'pa-login__err'
  box.append(inp, btn, err)
  box.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true
    try { await login(inp.value); onSuccess() }
    catch { err.textContent = 'Senha incorreta.'; btn.disabled = false; inp.select() }
  })
  root.appendChild(box)
  inp.focus()
}
