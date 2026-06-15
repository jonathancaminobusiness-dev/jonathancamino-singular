# Painel Admin — Fase 1: Renderização dirigida por conteúdo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o site da Singular ser gerado a partir de um único `content.json`, com renderização visualmente e em SEO **idêntica** à atual — a fundação para o painel administrativo.

**Architecture:** Cada elemento editável do `index.html` recebe atributos `data-edit*`. Uma função pura `applyContent(doc, content)` preenche esses elementos a partir do `content.json`; sua inversa `extractContent(doc)` extrai os valores atuais. Um plugin do Vite roda `applyContent` no build (via jsdom) — então o HTML final continua estático e o SEO/GEO permanecem intactos. A mesma `applyContent` será reutilizada no preview ao vivo do painel (Fase 2).

**Tech Stack:** Vite 6, JavaScript (ESM), jsdom (build + testes), Vitest (testes). Sem framework de UI.

**Spec:** `docs/superpowers/specs/2026-06-15-painel-admin-cms-design.md`

---

## Estrutura de arquivos (Fase 1)

```
src/inject.js              # applyContent(doc, content) — preenche o DOM (novo)
src/extract.js             # extractContent(doc) — extrai valores do DOM (novo)
content.schema.js          # esquema: chave/rótulo/tipo/seção/wa? (novo)
content.json               # fonte da verdade, gerada da extração (novo)
scripts/extract-content.mjs# CLI: lê index.html anotado → escreve content.json (novo)
vite-plugin-content.js     # plugin: transformIndexHtml → applyContent (novo)
vite.config.js             # registra o plugin (alterado)
index.html                 # anotado com data-edit* (alterado)
package.json               # devDeps vitest+jsdom, script de teste (alterado)
test/inject.test.js        # testes do injetor (novo)
test/extract.test.js       # testes do extrator + round-trip (novo)
test/schema.test.js        # consistência schema × index.html (novo)
```

**Convenção de anotação (contrato do injetor):**
- `data-edit="chave"` → define o conteúdo do elemento via **innerHTML sanitizado** (allowlist: `b, strong, em, i, br, span`). Preserva os `<em>`/`<b>` já existentes no design. **Como faz innerHTML, só pode ser usado em elementos cujo conteúdo é só texto** — para elementos com ícone SVG/decoração, embrulhar o texto num `<span data-edit="chave">` (ver Regra Crítica na Task 5).
- `data-edit-<attr>="chave"` → define o atributo `<attr>` do elemento. Ex.: `data-edit-href`, `data-edit-src`, `data-edit-alt`. (Seguro em qualquer elemento — não mexe nos filhos.)
- `data-edit-wa="chave"` → monta um link `https://wa.me/{contato.whatsapp}?text={encode(valor)}` e o coloca no `href`. (Permite trocar o número uma vez em `contato.whatsapp` e propagar para todos os CTAs.)
- Chaves são caminhos pontilhados no `content.json` (ex.: `hero.titulo`, `solucoes.cards.0.titulo`).

---

## Task 1: Infra de testes (Vitest + jsdom)

**Files:**
- Modify: `package.json`
- Create: `test/smoke.test.js`

- [ ] **Step 1: Instalar dependências de teste**

Run:
```bash
npm install -D vitest jsdom
```
Expected: `vitest` e `jsdom` aparecem em `devDependencies`.

- [ ] **Step 2: Adicionar scripts de teste ao `package.json`**

No bloco `"scripts"`, adicionar:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Escrever um smoke test**

`test/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'

describe('infra', () => {
  it('jsdom monta um documento', () => {
    const { document } = new JSDOM('<h1>oi</h1>').window
    expect(document.querySelector('h1').textContent).toBe('oi')
  })
})
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `npm test`
Expected: PASS, 1 teste.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json test/smoke.test.js
git commit -m "test: infra de testes (vitest + jsdom)"
```

---

## Task 2: `applyContent` — texto e innerHTML sanitizado

**Files:**
- Create: `src/inject.js`
- Test: `test/inject.test.js`

- [ ] **Step 1: Escrever os testes que falham**

`test/inject.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { applyContent } from '../src/inject.js'

function doc(html) { return new JSDOM(html).window.document }

describe('applyContent — texto', () => {
  it('preenche innerHTML preservando tags da allowlist', () => {
    const d = doc('<h1 data-edit="hero.titulo">velho</h1>')
    applyContent(d, { hero: { titulo: 'Novo <em>destaque</em>' } })
    expect(d.querySelector('h1').innerHTML).toBe('Novo <em>destaque</em>')
  })

  it('remove tags fora da allowlist', () => {
    const d = doc('<p data-edit="x">a</p>')
    applyContent(d, { x: 'oi <script>alert(1)</script><b>ok</b>' })
    expect(d.querySelector('p').innerHTML).toBe('oi <b>ok</b>')
  })

  it('ignora chave ausente sem quebrar', () => {
    const d = doc('<p data-edit="nao.existe">mantido</p>')
    applyContent(d, {})
    expect(d.querySelector('p').textContent).toBe('mantido')
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run test/inject.test.js`
Expected: FAIL (`applyContent is not a function` / módulo inexistente).

- [ ] **Step 3: Implementar `applyContent` (texto + sanitização)**

`src/inject.js`:
```js
// Allowlist de tags inline permitidas nos campos de texto.
const ALLOWED = new Set(['B', 'STRONG', 'EM', 'I', 'BR', 'SPAN'])

// Lê um caminho pontilhado ("a.b.0.c") de um objeto. Retorna undefined se faltar.
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
}

// Remove recursivamente tags fora da allowlist, preservando o texto e as tags válidas.
function sanitize(doc, html) {
  const tpl = doc.createElement('template')
  tpl.innerHTML = html
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 1 /* element */) {
        if (!ALLOWED.has(child.tagName)) {
          // desembrulha: substitui o elemento pelos seus filhos
          while (child.firstChild) node.insertBefore(child.firstChild, child)
          node.removeChild(child)
        } else {
          // remove todos os atributos de tags inline (segurança)
          for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name)
          walk(child)
        }
      }
    }
  }
  walk(tpl.content)
  return tpl.innerHTML
}

export function applyContent(doc, content) {
  for (const el of doc.querySelectorAll('[data-edit]')) {
    const key = el.getAttribute('data-edit')
    const val = getPath(content, key)
    if (val == null) continue
    el.innerHTML = sanitize(doc, String(val))
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx vitest run test/inject.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/inject.js test/inject.test.js
git commit -m "feat: applyContent preenche texto com sanitizacao"
```

---

## Task 3: `applyContent` — atributos e link de WhatsApp

**Files:**
- Modify: `src/inject.js`
- Test: `test/inject.test.js`

- [ ] **Step 1: Adicionar testes que falham**

Anexar em `test/inject.test.js`:
```js
describe('applyContent — atributos', () => {
  it('define atributos via data-edit-<attr>', () => {
    const d = doc('<img data-edit-src="foto" data-edit-alt="legenda" src="" alt="">')
    applyContent(d, { foto: 'assets/x.jpg', legenda: 'Foto X' })
    const img = d.querySelector('img')
    expect(img.getAttribute('src')).toBe('assets/x.jpg')
    expect(img.getAttribute('alt')).toBe('Foto X')
  })

  it('define href diretamente via data-edit-href', () => {
    const d = doc('<a data-edit-href="link" href="">x</a>')
    applyContent(d, { link: 'https://ex.com' })
    expect(d.querySelector('a').getAttribute('href')).toBe('https://ex.com')
  })

  it('monta link wa.me a partir de contato.whatsapp + mensagem', () => {
    const d = doc('<a data-edit-wa="hero.msg" href="">x</a>')
    applyContent(d, { contato: { whatsapp: '5521999' }, hero: { msg: 'Olá Rodrigo' } })
    expect(d.querySelector('a').getAttribute('href'))
      .toBe('https://wa.me/5521999?text=Ol%C3%A1%20Rodrigo')
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run test/inject.test.js`
Expected: FAIL nos 3 novos testes (atributos não aplicados).

- [ ] **Step 3: Estender `applyContent`**

Substituir a função `applyContent` em `src/inject.js` por:
```js
export function applyContent(doc, content) {
  for (const el of doc.querySelectorAll('[data-edit], [data-edit-wa]')) {
    // texto / innerHTML
    if (el.hasAttribute('data-edit')) {
      const val = getPath(content, el.getAttribute('data-edit'))
      if (val != null) el.innerHTML = sanitize(doc, String(val))
    }
    // link wa.me derivado
    if (el.hasAttribute('data-edit-wa')) {
      const msg = getPath(content, el.getAttribute('data-edit-wa'))
      const num = getPath(content, 'contato.whatsapp')
      if (msg != null && num != null) {
        el.setAttribute('href', `https://wa.me/${num}?text=${encodeURIComponent(String(msg))}`)
      }
    }
    // atributos genéricos data-edit-<attr> (exceto o caso especial -wa)
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('data-edit-') || attr.name === 'data-edit-wa') continue
      const target = attr.name.slice('data-edit-'.length) // ex.: "href", "src", "alt"
      const val = getPath(content, attr.value)
      if (val != null) el.setAttribute(target, String(val))
    }
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx vitest run test/inject.test.js`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add src/inject.js test/inject.test.js
git commit -m "feat: applyContent aplica atributos e link wa.me"
```

---

## Task 4: `extractContent` — inverso do injetor + round-trip

**Files:**
- Create: `src/extract.js`
- Test: `test/extract.test.js`

- [ ] **Step 1: Escrever os testes que falham**

`test/extract.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { extractContent, setPath } from '../src/extract.js'
import { applyContent } from '../src/inject.js'

function doc(html) { return new JSDOM(html).window.document }

describe('setPath', () => {
  it('cria caminho pontilhado incluindo arrays', () => {
    const o = {}
    setPath(o, 'a.b.0.c', 'v')
    expect(o).toEqual({ a: { b: [{ c: 'v' }] } })
  })
})

describe('extractContent', () => {
  it('extrai texto e atributos para o content', () => {
    const d = doc(`
      <h1 data-edit="hero.titulo">Olá <em>mundo</em></h1>
      <img data-edit-src="hero.foto" src="assets/a.jpg">
      <a data-edit="hero.cta" data-edit-href="hero.link" href="https://ex.com">Clique</a>
    `)
    const c = extractContent(d)
    expect(c.hero.titulo).toBe('Olá <em>mundo</em>')
    expect(c.hero.foto).toBe('assets/a.jpg')
    expect(c.hero.cta).toBe('Clique')
    expect(c.hero.link).toBe('https://ex.com')
  })

  it('round-trip: extrair e reaplicar mantém o DOM', () => {
    const html = `<h1 data-edit="t">A <b>B</b></h1><img data-edit-src="f" src="x.jpg" alt="">`
    const d1 = doc(html)
    const content = extractContent(d1)
    const d2 = doc(html.replace('A <b>B</b>', 'placeholder').replace('x.jpg', 'placeholder'))
    applyContent(d2, content)
    expect(d2.querySelector('h1').innerHTML).toBe('A <b>B</b>')
    expect(d2.querySelector('img').getAttribute('src')).toBe('x.jpg')
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run test/extract.test.js`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `extractContent`**

`src/extract.js`:
```js
// Escreve um valor num caminho pontilhado, criando objetos/arrays conforme as chaves.
export function setPath(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  keys.forEach((k, i) => {
    const last = i === keys.length - 1
    if (last) { cur[k] = value; return }
    if (cur[k] == null) {
      const nextIsIndex = /^\d+$/.test(keys[i + 1])
      cur[k] = nextIsIndex ? [] : {}
    }
    cur = cur[k]
  })
  return obj
}

const WA_RE = /^https:\/\/wa\.me\/(\d+)\?text=(.*)$/

export function extractContent(doc) {
  const out = {}
  for (const el of doc.querySelectorAll('[data-edit], [data-edit-wa]')) {
    if (el.hasAttribute('data-edit')) {
      setPath(out, el.getAttribute('data-edit'), el.innerHTML.trim())
    }
    if (el.hasAttribute('data-edit-wa')) {
      const m = (el.getAttribute('href') || '').match(WA_RE)
      if (m) {
        setPath(out, 'contato.whatsapp', m[1])
        setPath(out, el.getAttribute('data-edit-wa'), decodeURIComponent(m[2]))
      }
    }
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('data-edit-') || attr.name === 'data-edit-wa') continue
      const target = attr.name.slice('data-edit-'.length)
      setPath(out, attr.value, el.getAttribute(target) || '')
    }
  }
  return out
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx vitest run test/extract.test.js`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/extract.js test/extract.test.js
git commit -m "feat: extractContent (inverso do injetor) + round-trip"
```

---

## Task 5: Anotar o `index.html` com `data-edit*`

**Files:**
- Modify: `index.html`

Adicionar as anotações abaixo aos elementos correspondentes. **Não alterar o texto visível, classes ou CSS.** Tabela de mapeamento (seção → elemento → atributo).

### REGRA CRÍTICA — texto com ícone/decoração (ler antes de tudo)

O injetor faz `el.innerHTML = ...` no elemento que tem `data-edit`. Isso **apaga os filhos** do elemento. Portanto:

- **Elemento só com texto** (e tags inline `em/b/i/strong/span/br`) — ex.: `<h1>`, `<p>`, `<h3>`, `<li>`, `.hero__lead`, `.letter__hl`: colocar `data-edit="chave"` **direto no elemento**. As tags inline existentes (`<em>`, `<b>`) são preservadas pela allowlist do sanitizador.
- **Elemento com filhos decorativos** (SVG de ícone, seta `→`, etc.) — ex.: botões `<a class="btn">`, links da topbar/rodapé, itens do `.mnav`: **NÃO** colocar `data-edit` no elemento. Em vez disso, **embrulhar apenas o texto do rótulo num `<span data-edit="chave">…</span>`**, deixando o SVG/seta como irmão.
  - Atributos (`data-edit-href`, `data-edit-src`, `data-edit-alt`, `data-edit-wa`) **continuam no elemento original** (eles trocam atributos, não mexem nos filhos).
  - Exemplo (botão WhatsApp do hero):
    ```html
    <!-- ANTES -->
    <a class="btn btn--wa btn--lg" href="https://wa.me/5521964135156?text=...">
      <svg ...>...</svg>
      Quero meu diagnóstico gratuito
    </a>
    <!-- DEPOIS (wa no <a>; texto embrulhado em span) -->
    <a class="btn btn--wa btn--lg" data-edit-wa="hero.cta_msg" href="https://wa.me/5521964135156?text=...">
      <svg ...>...</svg>
      <span data-edit="hero.cta">Quero meu diagnóstico gratuito</span>
    </a>
    ```
  - Exemplo (link do menu mobile com seta):
    ```html
    <!-- ANTES --> <a href="#solucoes">Soluções <span class="go">→</span></a>
    <!-- DEPOIS --> <a href="#solucoes"><span data-edit="nav.solucoes">Soluções</span> <span class="go">→</span></a>
    ```

Quando a tabela disser `botão X → data-edit="k" + data-edit-wa="k_msg"`, **interprete** como: `data-edit-wa` no `<a>` e o rótulo num `<span data-edit="k">`. Para links de navegação que são texto puro (no `.hdr__nav`), `data-edit` direto basta; no `.mnav` (têm a seta) use o span. Header e menu mobile compartilham as mesmas chaves `nav.*` (mesmo rótulo nos dois).

### Tabela de mapeamento (seção → elemento → atributo):

**SEO / contato (topbar + head):**
- `<title>` → `data-edit="seo.titulo"`
- `meta[name=description]` → `data-edit-content="seo.descricao"`
- topbar telefone (texto `(21) 96413-5156`) → `data-edit="contato.telefone_label"`
- topbar Instagram (texto `@singularcorretora`) → `data-edit="contato.instagram_label"`

**Header / menu mobile:**
- cada link do `.hdr__nav` e `.mnav` → `data-edit="nav.<slug>"` (ex.: `nav.solucoes`, `nav.sobre`, `nav.fundador`, `nav.metodologia`, `nav.contato`)
- botão "Como funciona" → `data-edit="header.cta_ghost"`
- botão WhatsApp (header) → `data-edit="header.cta_wa"`
- CTA do menu mobile → `data-edit="mnav.cta"` + `data-edit-wa="mnav.cta_msg"`

**Hero:**
- `h1` → `data-edit="hero.titulo"`
- `.hero__lead` → `data-edit="hero.subtitulo"`
- CTA → `data-edit="hero.cta"` + `data-edit-wa="hero.cta_msg"`
- `.hero__hint` → `data-edit="hero.hint"`
- `.hero__cut` (img) → `data-edit-src="hero.foto"` + `data-edit-alt="hero.foto_alt"`

**Carta (`#sobre`):**
- `.letter__hl` → `data-edit="carta.titulo"`
- os 3 `<p>` de `.letter__text` → `data-edit="carta.p1"`, `carta.p2`, `carta.p3`
- `.letter__belief` → `data-edit="carta.crenca"`
- os 3 `<li>` de `.letter__proof` → `data-edit="carta.prova1"`, `carta.prova2`, `carta.prova3`
- `.letter__signName` → `data-edit="carta.assinatura_nome"`
- `.letter__signRole` → `data-edit="carta.assinatura_cargo"`
- CTA wa → `data-edit="carta.cta"` + `data-edit-wa="carta.cta_msg"`
- "Conheça o Rodrigo" → `data-edit="carta.cta_ghost"`

**Vídeo (`#video`):**
- `.vcta__title` → `data-edit="video.titulo"`
- `.vcta__sub` → `data-edit="video.subtitulo"`
- `<video>` → `data-edit-poster="video.poster"`; `<source>` → `data-edit-src="video.arquivo"`
- CTA wa → `data-edit="video.cta"` + `data-edit-wa="video.cta_msg"`
- os 3 `.vcta__micro span` → `data-edit="video.micro1"`, `micro2`, `micro3`

**Frentes:**
- `h2` e `.sh-sub` da seção → `data-edit="frentes.titulo"`, `frentes.subtitulo`
- card 1 (royal): tag/h3/p/botão → `frentes.cards.0.tag`, `.titulo`, `.texto`, `.botao` (o botão usa `data-edit-href="frentes.cards.0.botao_link"`)
- card 2 (green): idem → `frentes.cards.1.*`
- card 3 (wide): tag/h3/p → `frentes.cards.2.*`; botão "Falar sobre minha empresa" → `frentes.cards.2.botao` + `data-edit-wa="frentes.cards.2.botao_msg"`

**Soluções (`#solucoes`):** `h2`/`.sh-sub` → `solucoes.titulo`, `solucoes.subtitulo`. Para cada um dos 6 cards (índices 0–5): `h3` → `solucoes.cards.N.titulo`; `<p>` → `solucoes.cards.N.texto`; `img` → `data-edit-src="solucoes.cards.N.foto"` + `data-edit-alt="solucoes.cards.N.foto_alt"`; link `.solucard__arrow` → `data-edit-wa="solucoes.cards.N.msg"`.

**Diferenciais (`#diferenciais`):** `h2` → `diferenciais.titulo`. Para cada um dos 3 cards (0–2): `h3` → `diferenciais.cards.N.titulo`; os 3 `<li>` → `diferenciais.cards.N.itens.0/1/2`.

**Metodologia (`#metodologia`):** `h2`/`.sh-sub` → `metodologia.titulo`, `metodologia.subtitulo`. Para cada um dos 4 passos (0–3): `h3` → `metodologia.passos.N.titulo`; `<p>` → `metodologia.passos.N.texto`.

**Fundador (`#fundador`):** `h2` → `fundador.titulo`; `.rodrigo__role` → `fundador.cargo`; `<p>` descritivo → `fundador.texto`; `.rquote p` → `fundador.citacao`; `.rquote__sign` → `fundador.citacao_assinatura`; img `.rstage__hex img` → `data-edit-src="fundador.foto"` + `data-edit-alt="fundador.foto_alt"`; CTA wa → `fundador.cta` + `data-edit-wa="fundador.cta_msg"`.

**CTA final (`#contato`):** `h2` → `cta_final.titulo`; `.cta__sub` → `cta_final.subtitulo`; CTA wa → `cta_final.cta` + `data-edit-wa="cta_final.cta_msg"`; botão Instagram → `cta_final.instagram_label` + `data-edit-href="cta_final.instagram_link"`; `.cta__note` → `cta_final.nota`.

**Rodapé:** `.ft__bl` → `rodape.bio`; texto de localização (`Rio de Janeiro · RJ`) → `rodape.local`; copyright → `rodape.copyright`; tagline (`Método claro...`) → `rodape.tagline`.

**Float WhatsApp:** `.wa-float` → `data-edit-wa="float.msg"`.

- [ ] **Step 1: Adicionar todos os atributos acima**

Editar `index.html` conforme a tabela. Não tocar em SVGs decorativos, ícones, nem em elementos `aria-hidden`.

- [ ] **Step 2: Verificar que o build ainda funciona (sem plugin ainda)**

Run: `npm run build`
Expected: `✓ built`. O site renderiza igual (os `data-edit*` são atributos inertes).

- [ ] **Step 3: Verificar que o texto visível não mudou (paridade de texto)**

Compara o texto visível (todas as tags removidas — então `data-edit`, spans-wrapper e atributos somem) entre o `index.html` commitado antes desta task e o atual:
```bash
python3 - <<'PY'
import re, subprocess
def texts(s):
    return re.sub(r'\s+',' ', re.sub(r'<[^>]+>',' ', s)).strip()
antes = subprocess.check_output(['git','show','HEAD:index.html'], text=True)
atual = open('index.html').read()
a, b = texts(antes), texts(atual)
if a==b:
    print('IDÊNTICO')
else:
    import difflib
    print('DIFERENÇA DETECTADA:')
    for line in difflib.unified_diff(a.split('. '), b.split('. '), lineterm='')[:40]:
        print(line)
PY
```
Expected: `IDÊNTICO`. Os `<span>` que embrulham rótulos somem ao remover tags, então o texto visível deve bater exatamente. Se acusar diferença, há um rótulo alterado/duplicado/perdido — corrigir antes de commitar.

> **Verificação visual (feita pelo controlador após esta task):** como embrulhar texto em `<span>` pode, em tese, afetar layout (flex/gap em botões), o controlador roda o preview e compara um screenshot 1280×900 com o site atual antes de aprovar. O implementador não precisa rodar o preview, mas deve garantir que nenhum `<span>` foi inserido em elemento cujo CSS dependa do filho ser nó de texto direto (na dúvida, reportar como DONE_WITH_CONCERNS listando os elementos embrulhados).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: anota index.html com data-edit (sem mudanca visual)"
```

---

## Task 6: Gerar `content.json` a partir da extração

**Files:**
- Create: `scripts/extract-content.mjs`
- Create: `content.json` (gerado)

- [ ] **Step 1: Escrever o script de extração**

`scripts/extract-content.mjs`:
```js
import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { extractContent } from '../src/extract.js'

const html = readFileSync('index.html', 'utf8')
const { document } = new JSDOM(html).window
const content = extractContent(document)
writeFileSync('content.json', JSON.stringify(content, null, 2) + '\n')
console.log('content.json gerado com', document.querySelectorAll('[data-edit],[data-edit-wa]').length, 'elementos anotados')
```

- [ ] **Step 2: Rodar e inspecionar**

Run: `node scripts/extract-content.mjs`
Expected: imprime a contagem; `content.json` criado. Abrir e conferir que `hero.titulo`, `solucoes.cards[0].titulo`, `contato.whatsapp`, etc. têm os valores atuais.

- [ ] **Step 3: Commit**

```bash
git add scripts/extract-content.mjs content.json
git commit -m "feat: gera content.json da extracao do index.html"
```

---

## Task 7: Plugin do Vite que injeta no build

**Files:**
- Create: `vite-plugin-content.js`
- Modify: `vite.config.js`

- [ ] **Step 1: Escrever o plugin**

`vite-plugin-content.js`:
```js
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { applyContent } from './src/inject.js'

// Plugin: aplica content.json ao index.html no dev e no build.
export default function contentPlugin() {
  return {
    name: 'singular-content',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const content = JSON.parse(readFileSync('content.json', 'utf8'))
        const dom = new JSDOM(html)
        applyContent(dom.window.document, content)
        return dom.serialize()
      },
    },
  }
}
```

- [ ] **Step 2: Registrar no `vite.config.js`**

```js
import { defineConfig } from 'vite'
import contentPlugin from './vite-plugin-content.js'

export default defineConfig({
  plugins: [contentPlugin()],
})
```

- [ ] **Step 3: Build e verificar injeção**

Run: `npm run build`
Expected: `✓ built`. Em `dist/index.html`, o conteúdo dos elementos `data-edit` veio do `content.json`.

- [ ] **Step 4: Teste de paridade — alterar content.json reflete no build**

Run:
```bash
node -e "const c=require('./content.json'); c.hero.titulo='PARIDADE_OK'; require('fs').writeFileSync('content.json',JSON.stringify(c,null,2))"
npm run build
grep -q "PARIDADE_OK" dist/index.html && echo "INJETOU" || echo "FALHOU"
git checkout content.json   # reverte a alteração de teste
npm run build
```
Expected: `INJETOU`.

- [ ] **Step 5: Commit**

```bash
git add vite-plugin-content.js vite.config.js
git commit -m "feat: plugin do vite injeta content.json no build"
```

---

## Task 8: `content.schema.js` + teste de consistência

**Files:**
- Create: `content.schema.js`
- Test: `test/schema.test.js`

O schema descreve cada campo para o painel (Fase 2) e garante que toda chave do `index.html` é conhecida (e vice-versa), evitando campos órfãos.

- [ ] **Step 1: Escrever o teste de consistência que falha**

`test/schema.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { SCHEMA, schemaKeys } from '../content.schema.js'

function annotatedKeys() {
  const html = readFileSync('index.html', 'utf8')
  const { document } = new JSDOM(html).window
  const keys = new Set()
  for (const el of document.querySelectorAll('[data-edit],[data-edit-wa]')) {
    if (el.hasAttribute('data-edit')) keys.add(el.getAttribute('data-edit'))
    if (el.hasAttribute('data-edit-wa')) { keys.add(el.getAttribute('data-edit-wa')); keys.add('contato.whatsapp') }
    for (const a of el.attributes) {
      if (a.name.startsWith('data-edit-') && a.name !== 'data-edit-wa') keys.add(a.value)
    }
  }
  return keys
}

describe('schema × index.html', () => {
  it('toda chave anotada existe no schema', () => {
    const sk = new Set(schemaKeys())
    const missing = [...annotatedKeys()].filter(k => !sk.has(k))
    expect(missing).toEqual([])
  })
  it('toda chave do schema está anotada no html', () => {
    const ak = annotatedKeys()
    const orphan = schemaKeys().filter(k => !ak.has(k))
    expect(orphan).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx vitest run test/schema.test.js`
Expected: FAIL (schema inexistente).

- [ ] **Step 3: Implementar o schema**

`content.schema.js` — declarar cada campo. Estrutura (declarar todos os campos anotados na Task 5; tipos: `text`, `rich`, `image`, `link`, `wa`):
```js
// Cada entrada: { key, label, type, section }
// type: 'text' | 'rich' | 'image' | 'link' | 'wa'
export const SCHEMA = [
  { section: 'SEO',     key: 'seo.titulo',    label: 'Título da aba/Google', type: 'text' },
  { section: 'SEO',     key: 'seo.descricao', label: 'Descrição (Google)',   type: 'text' },
  { section: 'Contato', key: 'contato.whatsapp',        label: 'Número WhatsApp (só dígitos)', type: 'text' },
  { section: 'Contato', key: 'contato.telefone_label',  label: 'Telefone (exibido)',           type: 'text' },
  { section: 'Contato', key: 'contato.instagram_label', label: 'Instagram (exibido)',          type: 'text' },
  // Hero
  { section: 'Hero', key: 'hero.titulo',    label: 'Título',    type: 'rich' },
  { section: 'Hero', key: 'hero.subtitulo', label: 'Subtítulo', type: 'rich' },
  { section: 'Hero', key: 'hero.cta',       label: 'Texto do botão',     type: 'text' },
  { section: 'Hero', key: 'hero.cta_msg',   label: 'Mensagem WhatsApp',  type: 'wa' },
  { section: 'Hero', key: 'hero.hint',      label: 'Linha de prova',     type: 'rich' },
  { section: 'Hero', key: 'hero.foto',      label: 'Foto',     type: 'image' },
  { section: 'Hero', key: 'hero.foto_alt',  label: 'Descrição da foto (alt)', type: 'text' },
  // ... continuar para TODAS as chaves anotadas na Task 5:
  //   nav.*, header.*, mnav.*, carta.*, video.*,
  //   frentes.titulo/subtitulo/cards.0..2.*, solucoes.titulo/subtitulo/cards.0..5.*,
  //   diferenciais.titulo/cards.0..2.{titulo,itens.0..2},
  //   metodologia.titulo/subtitulo/passos.0..3.*, fundador.*,
  //   cta_final.*, rodape.*, float.msg
]

// Lista achatada de chaves (inclui contato.whatsapp implícito dos campos 'wa').
export function schemaKeys() {
  const keys = SCHEMA.map(f => f.key)
  if (SCHEMA.some(f => f.type === 'wa')) keys.push('contato.whatsapp')
  return [...new Set(keys)]
}
```

**Regra determinística de tipo** (aplicar a cada chave da Task 5 — sem julgamento):
- chave termina em `.foto`, `.poster`, `.arquivo` → `image`
- chave termina em `_link` (ex.: `*.botao_link`, `cta_final.instagram_link`) → `link`
- chave é alvo de `data-edit-wa` (ex.: `*.cta_msg`, `*.msg`, `*.botao_msg`) → `wa`
- chave termina em `_alt` → `text`
- chave de título/subtítulo/parágrafo/citação que no HTML contém `<em>/<b>/<i>` (hero.titulo, hero.subtitulo, hero.hint, carta.titulo, carta.p1..p3, carta.crenca, video.titulo, cta_final.titulo) → `rich`
- todas as demais → `text`

> A lista completa de chaves é a Task 5 (mapeamento integral). Aplicar a regra acima a cada uma produz o `SCHEMA` sem ambiguidade. O teste do Step 1 falha enquanto faltar ou sobrar qualquer chave — cobertura total garantida por construção. Útil: `node scripts/extract-content.mjs` imprime o `content.json`, cujas chaves são exatamente as esperadas.

- [ ] **Step 4: Rodar até passar (iterar até zerar `missing` e `orphan`)**

Run: `npx vitest run test/schema.test.js`
Expected: PASS (2 testes). Ajustar `SCHEMA` até não haver chaves faltando nem órfãs.

- [ ] **Step 5: Commit**

```bash
git add content.schema.js test/schema.test.js
git commit -m "feat: content.schema.js com consistencia garantida por teste"
```

---

## Task 9: Verificação final de paridade (visual + SEO) e deploy

**Files:** nenhum (verificação).

- [ ] **Step 1: Suíte completa verde**

Run: `npm test`
Expected: PASS em todos (smoke, inject ×6, extract ×3, schema ×2).

- [ ] **Step 2: Build limpo**

Run: `npm run build`
Expected: `✓ built`, sem erros.

- [ ] **Step 3: Paridade de SEO no HTML final**

Run:
```bash
grep -c 'application/ld+json' dist/index.html
grep -o '<title>[^<]*</title>' dist/index.html
grep -c 'data-edit' dist/index.html
```
Expected: JSON-LD presente (1); `<title>` com o valor do `content.json`; `data-edit` ainda presentes (são inertes e podem permanecer — não afetam SEO).

- [ ] **Step 4: Paridade visual no preview**

Iniciar o preview (`preview_start` → server `preview`), recarregar, tirar `preview_screenshot` em 1280×900 e comparar com o site atual — deve estar **idêntico**.

- [ ] **Step 5: Commit e deploy**

```bash
git add -A && git commit -m "chore: fase 1 — site dirigido por content.json (paridade)" --allow-empty
git push origin main
npx vercel --prod
```
Expected: deploy `READY`; `https://www.protecaosingular.com.br/` idêntico ao atual, agora alimentado pelo `content.json`.

---

## Critérios de conclusão da Fase 1

1. `npm test` verde (injetor, extrator, schema, round-trip, consistência).
2. `npm run build` gera `dist/index.html` a partir do `content.json`.
3. Site em produção **visualmente e em SEO idêntico** ao atual.
4. Alterar um valor no `content.json` e rebuildar reflete no site (provado na Task 7).
5. `content.schema.js` cobre 100% das chaves anotadas (provado por teste).

**Próximo:** Plano da Fase 2 (painel `/admin`: formulário gerado do `SCHEMA` + preview ao vivo reusando `applyContent`, rascunho em localStorage).
