# Painel Admin — Fase 2: Painel `/admin` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o painel `/admin` (local, sem login/deploy) que edita os 136 campos do `content.schema.js` num formulário por seção, com preview ao vivo e rascunho local.

**Architecture:** `admin.html` é uma 2ª entrada do Vite. Módulos vanilla em `src/admin/` reutilizam `getPath`/`setPath`/`sanitize`/`applyContent`/`SCHEMA` da Fase 1. Um `state` central guarda o conteúdo de trabalho e notifica assinantes; `form` gera os controles a partir do schema; `preview` aplica o conteúdo direto no `iframe.contentDocument` (mesmo domínio). Persistência em `localStorage` + utilitário de baixar `content.json`.

**Tech Stack:** Vite 6 (multi-page), JavaScript ESM, Vitest + jsdom. Sem framework de UI.

**Spec:** `docs/superpowers/specs/2026-06-15-painel-admin-fase2-design.md`

---

## Estrutura de arquivos

```
admin.html                  # 2ª entrada (shell do painel) — novo
src/admin/state.js          # store do conteúdo de trabalho + onChange — novo
src/admin/richeditor.js     # mini-editor contenteditable (B/Destaque) — novo
src/admin/widgets.js        # cria o controle de UI por tipo de campo — novo
src/admin/form.js           # monta o formulário a partir do SCHEMA — novo
src/admin/draft.js          # localStorage + baixar content.json — novo
src/admin/preview.js        # iframe + applyContent ao vivo — novo
src/admin/main.js           # bootstrap do painel — novo
src/admin/admin.css         # estilo do painel — novo
src/inject.js               # exportar sanitize (hoje privado) — alterado
vite.config.js              # multi-page (index + admin) — alterado
vite-plugin-content.js      # injetar só em index.html — alterado
test/admin-state.test.js    # — novo
test/richeditor.test.js     # — novo
test/admin-widgets.test.js  # — novo
test/admin-form.test.js     # — novo
test/admin-draft.test.js    # — novo
```

**Contratos dos módulos (mantidos idênticos entre tasks):**
- `state.js`: `createState(initial)` → `{ get(), getKey(path), setKey(path, value), subscribe(cb) }`. `subscribe` devolve uma função para cancelar. `setKey` usa `setPath`; dispara os callbacks com o objeto atual.
- `inject.js` (novo export): `export function sanitize(doc, html)` — a mesma sanitização já usada internamente.
- `richeditor.js`: `cleanRich(html)` (pura, testável) e `createRichEditor({ value, onInput })` → `{ el }`.
- `widgets.js`: `createWidget(field, state)` → `HTMLElement` (rótulo + controle), já ligado ao `state`.
- `form.js`: `buildForm(schema, state)` → `HTMLElement` (um grupo por seção, widgets na ordem do schema).
- `draft.js`: `serializeContent(state)`, `saveDraft(state)`, `loadDraft()`, `clearDraft()`.
- `preview.js`: `createPreview(iframe, state)` → liga `applyContent(iframe.contentDocument, state.get())` com debounce.

---

## Task 1: Multi-page Vite + plugin só no index + shell do admin

**Files:**
- Create: `admin.html`
- Modify: `vite.config.js`, `vite-plugin-content.js`

- [ ] **Step 1: Criar `admin.html` (shell mínimo)**

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Painel · Singular</title>
<link rel="stylesheet" href="/src/admin/admin.css" />
</head>
<body>
<div id="admin-root">Carregando painel…</div>
<script type="module" src="/src/admin/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `src/admin/admin.css` (placeholder mínimo)**

```css
:root { --pa-bg:#f5f7fb; --pa-navy:#00052D; --pa-royal:#005DE5; }
body { margin:0; font-family: Figtree, system-ui, sans-serif; background:var(--pa-bg); color:var(--pa-navy); }
#admin-root { padding:16px; }
```

- [ ] **Step 3: Criar `src/admin/main.js` (bootstrap mínimo só pra build passar)**

```js
const root = document.getElementById('admin-root')
root.textContent = 'Painel Singular — em construção'
```

- [ ] **Step 4: Configurar multi-page em `vite.config.js`**

```js
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import contentPlugin from './vite-plugin-content.js'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [contentPlugin()],
  build: {
    rollupOptions: {
      input: { main: r('./index.html'), admin: r('./admin.html') },
    },
  },
})
```

- [ ] **Step 5: Restringir o plugin a `index.html`**

Em `vite-plugin-content.js`, alterar o `handler` para receber o contexto e pular o admin:
```js
      handler(html, ctx) {
        // injeta conteúdo apenas na home; o painel carrega o content.json via fetch
        if (ctx && ctx.path && ctx.path.includes('admin')) return html
        let content
        try { content = JSON.parse(readFileSync('content.json', 'utf8')) }
        catch (e) { throw new Error(`[singular-content] content.json invalido: ${e.message}`) }
        const dom = new JSDOM(html)
        applyContent(dom.window.document, content)
        return dom.serialize()
      },
```

- [ ] **Step 6: Build e verificação**

Run: `npm run build`
Expected: `✓ built`; `dist/index.html` E `dist/admin.html` existem.
```bash
ls dist/index.html dist/admin.html
grep -c 'application/ld+json' dist/index.html   # 1 (home intacta)
grep -c 'admin-root' dist/admin.html            # 1
```
Confirme que a home continua com paridade de texto (o plugin injeta o content.json, que é igual aos valores do template; o admin não deve conter conteúdo injetado):
```bash
python3 - <<'PY'
import re, subprocess
def t(s): return re.sub(r'\s+',' ', re.sub(r'<[^>]+>',' ', s)).strip()
src = subprocess.check_output(['git','show','HEAD:index.html'], text=True)
dist = open('dist/index.html').read()
print('HOME TEXT PARITY:', 'IDENTICO' if t(src)==t(dist) else 'DIFERENCA')
PY
```
Expected: `HOME TEXT PARITY: IDENTICO`.

- [ ] **Step 7: Commit**
```bash
git add admin.html src/admin/admin.css src/admin/main.js vite.config.js vite-plugin-content.js
git commit -m "feat(admin): multi-page vite + shell do painel; plugin so no index"
```

---

## Task 2: `state.js` — store do conteúdo de trabalho

**Files:**
- Create: `src/admin/state.js`
- Test: `test/admin-state.test.js`

- [ ] **Step 1: Teste que falha**
```js
import { describe, it, expect, vi } from 'vitest'
import { createState } from '../src/admin/state.js'

describe('createState', () => {
  it('lê valores por caminho pontilhado', () => {
    const s = createState({ hero: { titulo: 'Olá' } })
    expect(s.getKey('hero.titulo')).toBe('Olá')
    expect(s.get()).toEqual({ hero: { titulo: 'Olá' } })
  })
  it('setKey grava e notifica assinantes', () => {
    const s = createState({ hero: { titulo: 'a' } })
    const cb = vi.fn()
    s.subscribe(cb)
    s.setKey('hero.titulo', 'b')
    expect(s.getKey('hero.titulo')).toBe('b')
    expect(cb).toHaveBeenCalledTimes(1)
  })
  it('setKey cria caminho novo incluindo índices', () => {
    const s = createState({})
    s.setKey('solucoes.cards.0.titulo', 'X')
    expect(s.get()).toEqual({ solucoes: { cards: [{ titulo: 'X' }] } })
  })
  it('subscribe devolve cancelador', () => {
    const s = createState({})
    const cb = vi.fn()
    const off = s.subscribe(cb)
    off()
    s.setKey('a', 1)
    expect(cb).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar — falha**
Run: `npx vitest run test/admin-state.test.js` — FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `src/admin/state.js`**
```js
import { getPath } from '../inject.js'
import { setPath } from '../extract.js'

export function createState(initial) {
  let content = initial
  const subs = new Set()
  return {
    get() { return content },
    getKey(path) { return getPath(content, path) },
    setKey(path, value) {
      setPath(content, path, value)
      subs.forEach((cb) => cb(content))
    },
    subscribe(cb) { subs.add(cb); return () => subs.delete(cb) },
  }
}
```

- [ ] **Step 4: Rodar — passa**
Run: `npx vitest run test/admin-state.test.js` — PASS (4).

- [ ] **Step 5: Commit**
```bash
git add src/admin/state.js test/admin-state.test.js
git commit -m "feat(admin): state store com getKey/setKey/subscribe"
```

---

## Task 3: Exportar `sanitize` + `richeditor.js` (mini-editor)

**Files:**
- Modify: `src/inject.js`
- Create: `src/admin/richeditor.js`
- Test: `test/richeditor.test.js`

- [ ] **Step 1: Exportar `sanitize` em `src/inject.js`**
Trocar a declaração `function sanitize(doc, html) {` por `export function sanitize(doc, html) {`. (Sem outras mudanças — `applyContent` continua usando a mesma função.) Rodar `npm test` para confirmar que nada quebrou.

- [ ] **Step 2: Teste que falha — `cleanRich`**
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { cleanRich } from '../src/admin/richeditor.js'

// jsdom global para o editor usar `document`
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('cleanRich', () => {
  it('mantém <b> e <em>, remove o resto', () => {
    expect(cleanRich('texto <b>negrito</b> e <em>destaque</em>'))
      .toBe('texto <b>negrito</b> e <em>destaque</em>')
  })
  it('mantém <span>/<b> (sem atributos) e remove <script>', () => {
    // sanitize: span está na allowlist (atributos removidos), b idem, script é dropado
    expect(cleanRich('<span style="x"><b onclick="y">oi</b></span><script>z</script>'))
      .toBe('<span><b>oi</b></span>')
  })
})
```

- [ ] **Step 3: Rodar — falha**
Run: `npx vitest run test/richeditor.test.js` — FAIL (módulo inexistente).

- [ ] **Step 4: Implementar `src/admin/richeditor.js`**
```js
import { sanitize } from '../inject.js'

// Limpa o HTML do contenteditable para a allowlist (reusa o sanitizador da Fase 1).
export function cleanRich(html) {
  return sanitize(document, html)
}

// Cria um mini-editor: toolbar (Negrito/Destaque) + área contenteditable.
// onInput recebe o HTML já limpo a cada edição.
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
  // Negrito → <b>; Destaque → <em> (styleWithCSS off para gerar tags, não styles)
  document.execCommand?.('styleWithCSS', false, false)
  bar.appendChild(mkBtn('N', 'bold'))
  bar.appendChild(mkBtn('Destaque', 'italic')) // italic gera <em>; CSS do site pinta <em> como destaque

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
```
> Nota de implementação: `document.execCommand('italic')` gera `<i>`/`<em>` conforme o browser; a allowlist aceita ambos e o CSS do site estiliza `<em>`. Se o browser gerar `<i>`, troque para envolver a seleção manualmente em `<em>` (Range API). O controlador valida no preview.

- [ ] **Step 5: Rodar — passa**
Run: `npx vitest run test/richeditor.test.js` — PASS. E `npm test` (toda a suíte) verde.

- [ ] **Step 6: Commit**
```bash
git add src/inject.js src/admin/richeditor.js test/richeditor.test.js
git commit -m "feat(admin): mini-editor rich (cleanRich + toolbar) reusando sanitize"
```

---

## Task 4: `widgets.js` — controle por tipo de campo

**Files:**
- Create: `src/admin/widgets.js`
- Test: `test/admin-widgets.test.js`

- [ ] **Step 1: Teste que falha**
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { createWidget } from '../src/admin/widgets.js'
import { createState } from '../src/admin/state.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('createWidget', () => {
  it('campo text: input com valor atual; digitar atualiza o state', () => {
    const s = createState({ hero: { cta: 'Quero' } })
    const el = createWidget({ key: 'hero.cta', label: 'Botão', type: 'text' }, s)
    const input = el.querySelector('input, textarea')
    expect(input.value).toBe('Quero')
    input.value = 'Novo'
    input.dispatchEvent(new dom.window.Event('input'))
    expect(s.getKey('hero.cta')).toBe('Novo')
  })
  it('campo link: input url; valor inválido javascript: é bloqueado', () => {
    const s = createState({ x: { link: 'https://a' } })
    const el = createWidget({ key: 'x.link', label: 'Link', type: 'link' }, s)
    const input = el.querySelector('input')
    input.value = 'javascript:alert(1)'
    input.dispatchEvent(new dom.window.Event('input'))
    expect(s.getKey('x.link')).toBe('https://a') // não atualizou (bloqueado)
  })
  it('campo image: somente leitura, mostra o caminho atual', () => {
    const s = createState({ hero: { foto: 'assets/r.png' } })
    const el = createWidget({ key: 'hero.foto', label: 'Foto', type: 'image' }, s)
    expect(el.textContent).toContain('assets/r.png')
    expect(el.querySelector('input')).toBeNull() // sem edição nesta fase
  })
  it('campo label aparece', () => {
    const s = createState({ hero: { cta: 'a' } })
    const el = createWidget({ key: 'hero.cta', label: 'Texto do botão', type: 'text' }, s)
    expect(el.textContent).toContain('Texto do botão')
  })
})
```

- [ ] **Step 2: Rodar — falha**
Run: `npx vitest run test/admin-widgets.test.js` — FAIL.

- [ ] **Step 3: Implementar `src/admin/widgets.js`**
```js
import { createRichEditor } from './richeditor.js'

function isUnsafeUrl(val) {
  const s = String(val).trim().toLowerCase().replace(/[\s-]/g, '')
  return /^(javascript|vbscript):/.test(s) || /^data:text\/html/.test(s)
}

export function createWidget(field, state) {
  const wrap = document.createElement('label')
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
```

- [ ] **Step 4: Rodar — passa**
Run: `npx vitest run test/admin-widgets.test.js` — PASS (4). `npm test` verde.

- [ ] **Step 5: Commit**
```bash
git add src/admin/widgets.js test/admin-widgets.test.js
git commit -m "feat(admin): widgets por tipo (text/link/wa/rich/image readonly)"
```

---

## Task 5: `form.js` — formulário a partir do schema

**Files:**
- Create: `src/admin/form.js`
- Test: `test/admin-form.test.js`

- [ ] **Step 1: Teste que falha**
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { buildForm } from '../src/admin/form.js'
import { createState } from '../src/admin/state.js'
import { SCHEMA, schemaKeys } from '../content.schema.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.document = dom.window.document

describe('buildForm', () => {
  it('um grupo por seção distinta', () => {
    const s = createState({})
    const form = buildForm(SCHEMA, s)
    const sections = new Set(SCHEMA.map((f) => f.section))
    expect(form.querySelectorAll('.pa-group').length).toBe(sections.size)
  })
  it('um widget por campo do schema', () => {
    const s = createState({})
    const form = buildForm(SCHEMA, s)
    expect(form.querySelectorAll('.pa-field').length).toBe(SCHEMA.length)
  })
})
```

- [ ] **Step 2: Rodar — falha**
Run: `npx vitest run test/admin-form.test.js` — FAIL.

- [ ] **Step 3: Implementar `src/admin/form.js`**
```js
import { createWidget } from './widgets.js'

export function buildForm(schema, state) {
  const root = document.createElement('div')
  root.className = 'pa-form'
  const groups = new Map()
  for (const field of schema) {
    let g = groups.get(field.section)
    if (!g) {
      g = document.createElement('details')
      g.className = 'pa-group'
      g.open = true
      const sum = document.createElement('summary')
      sum.className = 'pa-group__title'
      sum.textContent = field.section
      g.appendChild(sum)
      groups.set(field.section, g)
      root.appendChild(g)
    }
    g.appendChild(createWidget(field, state))
  }
  return root
}
```

- [ ] **Step 4: Rodar — passa**
Run: `npx vitest run test/admin-form.test.js` — PASS (2). `npm test` verde.

- [ ] **Step 5: Commit**
```bash
git add src/admin/form.js test/admin-form.test.js
git commit -m "feat(admin): buildForm agrupa widgets por secao (acordeao)"
```

---

## Task 6: `draft.js` — rascunho local + baixar content.json

**Files:**
- Create: `src/admin/draft.js`
- Test: `test/admin-draft.test.js`

- [ ] **Step 1: Teste que falha**
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { serializeContent, saveDraft, loadDraft, clearDraft } from '../src/admin/draft.js'
import { createState } from '../src/admin/state.js'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
globalThis.document = dom.window.document
globalThis.localStorage = dom.window.localStorage

describe('draft', () => {
  beforeEach(() => localStorage.clear())
  it('serializeContent gera JSON com nova linha final', () => {
    const s = createState({ a: 1 })
    expect(serializeContent(s)).toBe(JSON.stringify({ a: 1 }, null, 2) + '\n')
  })
  it('save então load devolve o mesmo objeto', () => {
    const s = createState({ hero: { titulo: 'X' } })
    saveDraft(s)
    expect(loadDraft()).toEqual({ hero: { titulo: 'X' } })
  })
  it('clear remove o rascunho', () => {
    const s = createState({ a: 1 })
    saveDraft(s); clearDraft()
    expect(loadDraft()).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar — falha**
Run: `npx vitest run test/admin-draft.test.js` — FAIL.

- [ ] **Step 3: Implementar `src/admin/draft.js`**
```js
const KEY = 'singular.draft.v1'

export function serializeContent(state) {
  return JSON.stringify(state.get(), null, 2) + '\n'
}

export function saveDraft(state) {
  localStorage.setItem(KEY, JSON.stringify(state.get()))
}

export function loadDraft() {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : null
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
```

- [ ] **Step 4: Rodar — passa**
Run: `npx vitest run test/admin-draft.test.js` — PASS (3). `npm test` verde.

- [ ] **Step 5: Commit**
```bash
git add src/admin/draft.js test/admin-draft.test.js
git commit -m "feat(admin): rascunho em localStorage + baixar content.json"
```

---

## Task 7: `preview.js` — iframe + applyContent ao vivo

**Files:**
- Create: `src/admin/preview.js`
- Test: `test/admin-preview.test.js`

- [ ] **Step 1: Teste que falha (a lógica testável: aplicar no doc do iframe)**
```js
import { describe, it, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { createPreview } from '../src/admin/preview.js'
import { createState } from '../src/admin/state.js'

describe('createPreview', () => {
  it('aplica o conteúdo no documento do iframe ao mudar o state', async () => {
    const outer = new JSDOM('<!doctype html><html><body><iframe></iframe></body></html>')
    globalThis.document = outer.window.document
    const iframe = outer.window.document.querySelector('iframe')
    // documento interno com um elemento anotado
    const inner = new JSDOM('<!doctype html><html><body><h1 data-edit="hero.titulo">velho</h1></body></html>')
    Object.defineProperty(iframe, 'contentDocument', { value: inner.window.document })

    const s = createState({ hero: { titulo: 'velho' } })
    createPreview(iframe, s, { debounce: 0 })
    s.setKey('hero.titulo', 'novo')
    await new Promise((r) => setTimeout(r, 5))
    expect(inner.window.document.querySelector('h1').innerHTML).toBe('novo')
  })
})
```

- [ ] **Step 2: Rodar — falha**
Run: `npx vitest run test/admin-preview.test.js` — FAIL.

- [ ] **Step 3: Implementar `src/admin/preview.js`**
```js
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
```

- [ ] **Step 4: Rodar — passa**
Run: `npx vitest run test/admin-preview.test.js` — PASS. `npm test` verde.

- [ ] **Step 5: Commit**
```bash
git add src/admin/preview.js test/admin-preview.test.js
git commit -m "feat(admin): preview ao vivo via applyContent no iframe"
```

---

## Task 8: `main.js` + `admin.css` — montar o painel

**Files:**
- Modify: `src/admin/main.js`, `src/admin/admin.css`, `admin.html`

- [ ] **Step 1: Implementar `src/admin/main.js` (bootstrap real)**
```js
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

  // coluna de campos
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

  // coluna de preview
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
```

- [ ] **Step 2: Implementar `src/admin/admin.css` (layout 2 colunas + componentes)**
```css
:root { --pa-bg:#f5f7fb; --pa-navy:#00052D; --pa-royal:#005DE5; --pa-line:#e2e8f5; }
* { box-sizing:border-box; }
body { margin:0; font-family: Figtree, system-ui, sans-serif; color:var(--pa-navy); background:var(--pa-bg); }
.pa { display:grid; grid-template-columns: 420px 1fr; height:100vh; }
.pa-left { overflow-y:auto; border-right:1px solid var(--pa-line); padding:16px; }
.pa-right { background:#fff; }
.pa-preview { width:100%; height:100%; border:0; }
.pa-actions { position:sticky; top:0; background:var(--pa-bg); display:flex; gap:8px; padding-bottom:12px; flex-wrap:wrap; }
.pa-actions button { background:var(--pa-royal); color:#fff; border:0; border-radius:8px; padding:8px 12px; font-weight:600; cursor:pointer; }
.pa-group { border:1px solid var(--pa-line); border-radius:10px; margin:10px 0; padding:6px 12px; background:#fff; }
.pa-group__title { font-weight:700; cursor:pointer; padding:6px 0; }
.pa-field { display:block; margin:10px 0; }
.pa-field__label { display:block; font-size:13px; font-weight:600; margin-bottom:4px; }
.pa-field__input { width:100%; padding:8px; border:1px solid var(--pa-line); border-radius:8px; font:inherit; }
textarea.pa-field__input { min-height:64px; resize:vertical; }
.pa-field__ro { font-size:13px; color:#667; background:#f0f3fa; padding:8px; border-radius:8px; }
.pa-rich__bar { display:flex; gap:6px; margin-bottom:4px; }
.pa-rich__bar button { border:1px solid var(--pa-line); background:#fff; border-radius:6px; padding:4px 10px; cursor:pointer; font-weight:700; }
.pa-rich__area { min-height:48px; padding:8px; border:1px solid var(--pa-line); border-radius:8px; background:#fff; }
.pa-rich__area em { color:var(--pa-royal); font-style:normal; font-weight:700; }
.pa-flash { position:fixed; bottom:16px; left:50%; transform:translateX(-50%) translateY(20px); background:var(--pa-navy); color:#fff; padding:10px 16px; border-radius:10px; opacity:0; transition:.2s; }
.pa-flash.on { opacity:1; transform:translateX(-50%) translateY(0); }
```

- [ ] **Step 3: Build + verificação funcional (controlador)**
Run: `npm run build` (deve construir as 2 páginas). Depois `npm run dev` e abrir `/admin.html`:
- O formulário mostra 16 seções e 136 campos preenchidos.
- Digitar em `hero.titulo` muda o preview ao vivo.
- Mini-editor: selecionar palavra + Destaque → vira destaque azul no preview.
- Salvar rascunho → recarregar → edições mantidas; Reverter → volta ao original.
- Baixar content.json → arquivo válido.

> O controlador valida via preview tools (screenshot + eval). Se algo falhar, corrigir antes do commit.

- [ ] **Step 4: Commit**
```bash
git add src/admin/main.js src/admin/admin.css admin.html
git commit -m "feat(admin): bootstrap do painel (form + preview + acoes)"
```

---

## Task 9: Verificação de integração (editar → baixar → build com paridade)

**Files:** nenhum (verificação).

- [ ] **Step 1: Suíte completa verde**
Run: `npm test` — todos passam (Fase 1 + state/rich/widgets/form/draft/preview).

- [ ] **Step 2: Build das 2 páginas**
Run: `npm run build` — `dist/index.html` e `dist/admin.html` presentes; home com JSON-LD intacto.

- [ ] **Step 3: Ciclo de ponta a ponta (controlador)**
- `npm run dev`, abrir `/admin.html`, editar `hero.titulo` para um texto de teste.
- Baixar `content.json`, substituir o arquivo do projeto por ele.
- `npm run build` → conferir que `dist/index.html` reflete o novo `hero.titulo`.
- Reverter o `content.json` (`git checkout content.json`) e rebuildar.

- [ ] **Step 4: Confirmar que `/admin` NÃO é deployado**
A Fase 2 não roda `vercel --prod`. O `admin.html` fica no build local, mas não publicamos nesta fase (sem login). Anotar isso no relatório.

- [ ] **Step 5: Commit final + finishing-a-development-branch**
```bash
git add -A && git commit -m "chore: fase 2 — painel /admin local com preview ao vivo" --allow-empty
```
Depois usar `superpowers:finishing-a-development-branch` (merge para main SEM deploy, por decisão da fase).

---

## Critérios de conclusão da Fase 2

1. `npm test` verde (lógica do painel coberta).
2. `npm run build` constrói `index.html` + `admin.html`; home idêntica (SEO/visual).
3. Painel local mostra os 136 campos por seção, edita com preview ao vivo, mini-editor gera `<b>`/`<em>`.
4. Rascunho persiste; Reverter funciona; Baixar content.json gera arquivo válido que constrói com paridade.
5. `/admin` não está em produção.

**Próximo:** Fase 3 (login + upload de imagem + Publicar via GitHub + deploy do `/admin`).
