import { sanitize } from '../inject.js'

// Limpa o HTML do contenteditable para a allowlist (reusa o sanitizador da Fase 1).
export function cleanRich(html) {
  return sanitize(document, html)
}

// Cria um mini-editor: toolbar (Negrito/Destaque) + área contenteditable.
// onInput recebe o HTML já limpo a cada edição.
// Nota: execCommand('italic') pode gerar <i> ou <em> conforme o browser — ambos
// estão na allowlist, então cleanRich preserva os dois. CSS do site estiliza <em>
// como o destaque azul. Verificar comportamento real em browser pelo controlador.
export function createRichEditor({ value = '', onInput }) {
  const wrap = document.createElement('div')
  wrap.className = 'pa-rich'

  const bar = document.createElement('div')
  bar.className = 'pa-rich__bar'
  const mkBtn = (label, cmd) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.addEventListener('mousedown', (e) => {
      e.preventDefault() // não perde a seleção
      document.execCommand(cmd, false)
      emit()
    })
    return b
  }
  document.execCommand && document.execCommand('styleWithCSS', false, false)
  bar.appendChild(mkBtn('N', 'bold'))
  bar.appendChild(mkBtn('Destaque', 'italic')) // italic gera <em>/<i>; CSS do site pinta <em> como destaque

  const area = document.createElement('div')
  area.className = 'pa-rich__area'
  area.contentEditable = 'true'
  area.innerHTML = cleanRich(value)

  function emit() {
    const clean = cleanRich(area.innerHTML)
    if (clean !== area.innerHTML) area.innerHTML = clean
    onInput && onInput(clean)
  }
  area.addEventListener('input', emit)

  wrap.appendChild(bar)
  wrap.appendChild(area)
  return { el: wrap }
}
