# Painel Admin — Fase 2: Painel `/admin` (edição local + preview ao vivo)

**Data:** 2026-06-15
**Status:** Aprovado (design) — pré-plano
**Depende de:** Fase 1 (renderização dirigida por `content.json`) — concluída.

## 1. Objetivo

Construir o painel `/admin` que permite editar **todos os 136 campos** do
`content.schema.js` num formulário agrupado por seção, com **preview ao vivo**, e
guardar um **rascunho local**. Roda **somente em ambiente local** (sem login e
**sem deploy**) nesta fase — autenticação, upload de imagem e o "Publicar" que
grava no GitHub entram na Fase 3.

## 2. Decisões (brainstorming)

| Decisão | Escolha |
|---|---|
| Edição de campos rich (`<em>`/`<b>`) | **Mini-editor visual** (botões Negrito/Destaque), sem código exposto |
| Imagens/vídeo nesta fase | **Somente leitura** (miniatura); troca/upload na Fase 3 |
| Preview ao vivo | `applyContent(iframe.contentDocument, conteúdo)` **direto** (mesmo domínio, sem postMessage) |
| Persistência nesta fase | Rascunho em `localStorage` + utilitário **Baixar `content.json`** |
| Deploy | **Não** nesta fase — `/admin` só vai ao ar na Fase 3 (com login) |

## 3. Arquitetura

### 3.1 Entrada e build
- `admin.html` — segunda entrada do Vite. `vite.config.js` declara
  `build.rollupOptions.input = { main: 'index.html', admin: 'admin.html' }`.
- O plugin `singular-content` (Fase 1) injeta `content.json` em `index.html`;
  **não** deve injetar em `admin.html` (o admin carrega o conteúdo via fetch).
  Ajustar o plugin para agir só em `index.html`.
- `admin.html` recebe `<meta name="robots" content="noindex">`.

### 3.2 Módulos (`src/admin/`)
Unidades pequenas, com responsabilidade única:

- **`state.js`** — guarda o objeto `content` de trabalho; API `get()`,
  `setKey(path, value)` (usa o mesmo `setPath`/`getPath` da Fase 1), e um
  mecanismo de assinatura (`onChange(cb)`) para notificar o preview.
- **`widgets.js`** — dado um campo do schema (`{key,label,type,section}`),
  cria o controle de UI adequado e o conecta ao `state`:
  - `text` → `<input>` / `<textarea>` (textarea quando o valor é longo)
  - `rich` → mini-editor (`richeditor.js`)
  - `link` → `<input type="url">` com validação de esquema (`https?:`/`mailto:`/`tel:`)
  - `wa` → `<textarea>` para a mensagem (o número fica no campo único
    `contato.whatsapp`)
  - `image` / `video` → miniatura/etiqueta **somente leitura** + nota
    "troca disponível na publicação (Fase 3)"
- **`richeditor.js`** — `contenteditable` com botões **Negrito** e **Destaque**;
  produz HTML restrito a `<b>`/`<em>` e passa pelo `sanitize` da Fase 1 antes de
  gravar no `state` (allowlist garante saída limpa).
- **`form.js`** — percorre o `SCHEMA`, agrupa por `section`, monta o acordeão e
  insere os widgets na ordem do schema.
- **`preview.js`** — cria/controla o `<iframe>` apontando para `/` (o site);
  ao `state.onChange`, com *debounce*, chama
  `applyContent(iframe.contentDocument, state.get())`. Reaplica ao `load` do
  iframe (o site recarrega com valores do `content.json` e o preview reescreve
  com o rascunho de trabalho).
- **`draft.js`** — `save()`/`load()`/`clear()` do rascunho em `localStorage`
  (chave única); `download()` serializa o `state` como `content.json`.
- **`main.js`** — bootstrap: `fetch('/content.json')` → semente do `state` (ou
  rascunho salvo, se houver) → `form.build()` → `preview.mount()` → liga os
  botões (Salvar rascunho / Reverter / Baixar content.json).
- **`admin.css`** — estilo do painel, alinhado à marca (reusa variáveis de
  `brand-v2.css` quando fizer sentido).

### 3.3 Preview ao vivo (detalhe)
Mesmo domínio → o admin acessa `iframe.contentDocument` diretamente. A cada
mudança (debounce ~120ms), `applyContent(doc, content)` atualiza só os elementos
anotados (idempotente, não acumula). Imagens não trocam (somente leitura), então
o preview reflete textos, botões e links em tempo real.

## 4. Tipos de campo → controle

| type | controle | observação |
|---|---|---|
| text | input ou textarea | textarea se o texto for longo (>80 chars) |
| rich | mini-editor | botões B / Destaque → `<b>`/`<em>`, sanitizado |
| link | input url | valida esquema; bloqueia `javascript:` |
| wa | textarea (mensagem) | número único em `contato.whatsapp` |
| image | miniatura read-only | troca na Fase 3 |
| video | etiqueta read-only | troca na Fase 3 |

## 5. Botões / ações

- **Salvar rascunho** → `draft.save(state)`; feedback "rascunho salvo".
- **Reverter** → recarrega `content.json`, descarta rascunho, atualiza form+preview.
- **Baixar content.json** → `draft.download()` (utilitário desta fase: permite
  testar o ciclo editar → baixar → substituir o arquivo → `npm run build` →
  conferir paridade). O **Publicar** real é Fase 3.

## 6. Testes

Lógica (Vitest + jsdom):
- `form.js`: dado o `SCHEMA`, gera um grupo por seção e um controle por campo,
  na ordem do schema (conta de campos == `schemaKeys().length`).
- `richeditor.js`: aplicar Negrito a uma seleção → `<b>`; Destaque → `<em>`;
  saída passa pelo `sanitize` (sem tags fora da allowlist).
- `state.js`: `setKey` grava no caminho certo e dispara `onChange`.
- `draft.js`: `save` então `load` devolve o mesmo objeto; `download` gera JSON
  válido com as mesmas chaves do schema.
- Integração: semear `state` do `content.json`, alterar `hero.titulo`,
  `draft.download()` → o JSON resultante, passado pelo build, reflete a mudança
  (reusa a infra da Fase 1).

UI (verificada pelo controlador no preview): formulário renderiza, preview ao
vivo muda ao digitar, acordeão, botões.

## 7. Arquivos (novos/alterados)

```
admin.html                         (novo)
src/admin/state.js                 (novo)
src/admin/widgets.js               (novo)
src/admin/richeditor.js            (novo)
src/admin/form.js                  (novo)
src/admin/preview.js               (novo)
src/admin/draft.js                 (novo)
src/admin/main.js                  (novo)
src/admin/admin.css                (novo)
vite.config.js                     (alterado: multi-page + plugin só no index)
vite-plugin-content.js             (alterado: agir só em index.html)
test/admin-form.test.js            (novo)
test/richeditor.test.js            (novo)
test/admin-state.test.js           (novo)
test/admin-draft.test.js           (novo)
```

## 8. Escopo

**Incluído:** painel `/admin` local; formulário dos 136 campos por seção;
mini-editor rich; preview ao vivo; rascunho local; baixar `content.json`;
validação leve de URL.

**Fora (Fase 3):** login/autenticação; upload e troca de imagem/vídeo; botão
Publicar (commit no GitHub + rebuild); deploy do `/admin`; multiusuário.

## 9. Critérios de sucesso

1. `npm run dev` → abrir `/admin.html` mostra o formulário com as 16 seções e os
   136 campos preenchidos com o conteúdo atual.
2. Editar qualquer campo reflete no preview ao vivo (texto/botão/link).
3. Mini-editor aplica Negrito/Destaque gerando `<b>`/`<em>` limpos.
4. Salvar rascunho + recarregar a página mantém as edições; Reverter volta ao
   `content.json`.
5. Baixar `content.json`, substituir o arquivo, `npm run build` → site reflete
   as edições com paridade (design intacto).
6. `npm test` verde (lógica do painel) e `npm run build` constrói as duas
   páginas (`index.html` + `admin.html`).
7. `/admin` **não** está acessível em produção (não deployado nesta fase).

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| `contenteditable` gera HTML sujo (spans, styles) | Passar sempre pelo `sanitize` da Fase 1 antes de gravar (allowlist b/em/...). |
| Preview desincroniza após reload do iframe | Reaplicar `applyContent` no evento `load` do iframe. |
| Plugin injeta conteúdo em `admin.html` por engano | Restringir o plugin a `index.html` (checar o nome no hook). |
| `/admin` vazar para produção sem login | Não deployar nesta fase; gating de auth na Fase 3. |
| Multi-page quebra o build atual | Verificar que `index.html` continua idêntico após configurar `rollupOptions.input`. |
