# Painel Administrativo (CMS) — Singular

**Data:** 2026-06-15
**Status:** Aprovado (design) — aguardando revisão do spec
**Autor:** Jonathan (via Claude)

## 1. Objetivo

Permitir que o cliente (não-técnico) edite **todo** o conteúdo da landing page
da Singular — cada texto, cada foto de seção, cada botão (rótulo **e** link),
dados de contato e meta-SEO — através de um painel administrativo próprio,
**sem tocar em código** e **sem quebrar o design nem o SEO/GEO** já implementados.

## 2. Decisões já tomadas (brainstorming)

| Decisão | Escolha | Motivo |
|---|---|---|
| Arquitetura | **Híbrido:** painel custom → grava no GitHub → Vercel republica | Painel com a marca + saída estática (SEO/IA intactos) + grátis + versionado |
| Edição | **Formulário por seção + preview ao vivo** | Simples e robusto para usuário leigo; vê antes de publicar |
| Persistência | `content.json` no repositório (fonte única da verdade) | Versionado no git (histórico/rollback), zero custo |
| Imagens | Upload → otimização → `public/assets/uploads/` no repo | Versionado, grátis, sem dependência externa |
| Publicação | Commit no GitHub dispara rebuild do Vercel (~1 min) | Mantém HTML estático = SEO/GEO preservados |

**Trade-off aceito:** ~1 min entre "Publicar" e o conteúdo no ar. Aceitável
para uma landing page editada esporadicamente. Edição instantânea (SSR) foi
descartada por adicionar complexidade e arriscar o SEO sem ganho real aqui.

## 3. Arquitetura

### 3.1 Fluxo de publicação

```
Cliente edita em /admin
  → clica "Publicar"
  → POST /api/save (autenticado)
      → grava content.json (+ imagens novas) via GitHub Contents API
  → Vercel detecta o commit → rebuild
  → injetor roda no build → preenche index.html estático
  → site no ar (~1 min), SEO/IA preservados, edição versionada no git
```

### 3.2 O injetor de conteúdo (peça central)

Uma única função de injeção, `applyContent(doc, content)`, que percorre os
elementos marcados com `data-edit="<chave>"` e aplica o valor correspondente
do `content.json`:

- texto → `textContent` / `innerHTML` (campos rich limitados a `<b>`,`<em>`,`<br>`)
- imagem → atributo `src` (e `alt` via `data-edit-alt`)
- botão/link → `textContent` + atributo `href` (via `data-edit-href`)

Roda em **dois ambientes**, compartilhando o mesmo código:

1. **Build (Node):** lê `content.json`, parseia `index.html` (template anotado),
   aplica o conteúdo, escreve o HTML final que o Vite empacota. SEO intacto
   porque o conteúdo está no HTML antes de ir ao ar.
2. **Preview (navegador):** o painel envia o conteúdo de trabalho para o
   `<iframe>` de preview via `postMessage`; o injetor aplica ao vivo a cada
   tecla digitada.

> Princípio de isolamento: o injetor não conhece o painel nem o servidor.
> Recebe `(documento, conteúdo)` e devolve o documento preenchido. Testável
> de forma independente.

### 3.3 Anotação do `index.html`

O `index.html` atual vira o **template**: cada elemento editável ganha um
`data-edit="<seção>.<campo>"`. O HTML/CSS/animações permanecem idênticos.
Exemplo:

```html
<h1 data-edit="hero.titulo">Seu seguro foi vendido pra você — ou planejado com você?</h1>
<p  data-edit="hero.subtitulo">Mais de uma década no mercado...</p>
<a  data-edit="hero.cta" data-edit-href="hero.cta_link" href="https://wa.me/...">Quero meu diagnóstico gratuito</a>
<img data-edit="hero.foto" data-edit-alt="hero.foto_alt" src="assets/rodrigo-ai.png" alt="Rodrigo Prevot">
```

O `content.json` inicial é gerado a partir dos valores atuais (nada muda no ar
ao implantar).

## 4. Modelo de conteúdo (`content.json`)

Objeto único, agrupado por seção. Esboço (chaves abreviadas):

```json
{
  "seo":   { "titulo": "...", "descricao": "..." },
  "contato": { "whatsapp": "5521964135156", "telefone_label": "(21) 96413-5156", "instagram": "singularcorretora" },
  "hero":  { "titulo": "...", "subtitulo": "...", "cta": "...", "cta_link": "...", "hint": "...", "foto": "assets/rodrigo-ai.png", "foto_alt": "..." },
  "carta": { "titulo": "...", "paragrafos": ["...","..."], "crenca": "...", "provas": ["...","...","..."], "assinatura_nome": "...", "assinatura_cargo": "...", "cta": "...", "cta_link": "..." },
  "video": { "titulo": "...", "subtitulo": "...", "video": "assets/vsl-rodrigo.mp4", "poster": "assets/rodrigo-bw.jpg", "cta": "...", "cta_link": "...", "micro": ["...","...","..."] },
  "frentes": { "titulo": "...", "subtitulo": "...", "cards": [ { "tag":"...","titulo":"...","texto":"...","botao":"...","botao_link":"..." } ] },
  "solucoes": { "titulo": "...", "subtitulo": "...", "cards": [ { "titulo":"...","texto":"...","foto":"...","foto_alt":"...","botao_link":"..." } ] },
  "diferenciais": { "titulo": "...", "cards": [ { "titulo":"...","itens":["...","...","..."] } ] },
  "metodologia": { "titulo": "...", "subtitulo": "...", "passos": [ { "titulo":"...","texto":"..." } ] },
  "fundador": { "titulo":"...", "cargo":"...", "texto":"...", "citacao":"...", "foto":"assets/rodrigo-bw.jpg", "foto_alt":"...", "cta":"...", "cta_link":"..." },
  "cta_final": { "titulo":"...", "subtitulo":"...", "cta":"...", "cta_link":"...", "instagram_label":"...", "nota":"..." },
  "rodape": { "bio":"...", "local":"...", "copyright":"..." }
}
```

Uma **definição de esquema** (`content.schema.js`) descreve cada campo (chave,
rótulo em PT-BR, tipo: texto/textarea/rich/imagem/link, seção). O painel gera o
formulário a partir desse esquema; o injetor usa as mesmas chaves. Fonte única,
sem duplicação.

> Os links de WhatsApp espalhados pela página são derivados de
> `contato.whatsapp` + a mensagem de cada CTA, para o cliente não precisar
> montar URL codificada na mão. O painel mostra só "número" e "mensagem".

## 5. Painel `/admin`

- Entry `admin.html` no mesmo projeto Vite (não vai pro sitemap, `noindex`).
- **Tela de login** (senha única). Sessão via cookie assinado.
- **Layout:** lista de seções (acordeão) à esquerda com campos rotulados;
  `<iframe>` de preview do site à direita, atualizando ao vivo.
- **Campos** gerados do `content.schema.js`: input, textarea, editor rich
  limitado, uploader de imagem (com preview/otimização), par rótulo+link p/ botões.
- **Ações:**
  - *Salvar rascunho* — persiste localmente (localStorage) sem publicar.
  - *Publicar* — envia ao `/api/save`, confirma, mostra "no ar em ~1 min".
  - *Reverter* — recarrega o `content.json` publicado, descartando o rascunho.
- **UX leigo:** validação suave (link inválido, imagem muito grande), textos de
  ajuda, sem jargão técnico.

## 6. Backend — funções serverless (`/api`, Vercel)

| Rota | Auth | Função |
|---|---|---|
| `POST /api/login` | — | Valida senha (hash, comparação constante), emite cookie de sessão assinado. Rate-limited. |
| `GET /api/content` | sessão | Devolve o `content.json` atual (para o painel carregar). |
| `POST /api/save` | sessão | Recebe `content.json` + imagens novas; valida; commita no GitHub via Contents API (dispara rebuild). |
| `POST /api/upload` | sessão | Recebe imagem; valida tipo/tamanho; otimiza; inclui no commit como `assets/uploads/...`. |
| `POST /api/logout` | sessão | Limpa o cookie. |

**Segredos (env vars do Vercel, só servidor):** `GITHUB_TOKEN`
(fine-grained, escopo Contents:write só neste repo), `ADMIN_PASSWORD_HASH`,
`SESSION_SECRET`. Nenhum chega ao navegador.

## 7. Segurança (auditoria `vibe-security` antes do deploy)

- Senha guardada como **hash** (bcrypt/scrypt) em env var; comparação em tempo
  constante; rate-limit + atraso progressivo no login.
- Cookie de sessão: assinado (HMAC), `httpOnly`, `secure`, `sameSite=strict`,
  expiração; segredo em env var.
- **Todas** as rotas de escrita verificam a sessão antes de qualquer ação.
- Token do GitHub é fine-grained, limitado a Contents:write **deste** repo,
  nunca exposto ao cliente.
- Upload: allowlist de MIME (jpg/png/webp), limite de tamanho, re-encode da
  imagem (descarta metadata/conteúdo malicioso), nome de arquivo saneado.
- Limite de tamanho do payload de conteúdo; sanitização do HTML rich
  (allowlist de tags) para evitar injeção.
- `/admin` e `/api` com `noindex`; `/admin` fora do sitemap e do robots.

## 8. Integração com o build

- `content.json` versionado no repo.
- Script de build (pré-Vite ou plugin) roda o injetor: `index.html` (template)
  + `content.json` → HTML preenchido → Vite empacota.
- `data-edit` são removidos/ignorados na saída final (não afetam o site público).
- O JSON-LD e os metas de SEO passam a ler de `content.json` (título/descrição,
  telefone, etc.) para ficarem em sincronia com o que o cliente edita.

## 9. Estrutura de arquivos (novos/alterados)

```
content.json                 # fonte da verdade (novo)
content.schema.js            # esquema dos campos: chave/rótulo/tipo/seção (novo)
src/inject.js                # applyContent(doc, content) — build + preview (novo)
scripts/build-content.mjs    # roda o injetor no build (novo)
index.html                   # anotado com data-edit (alterado)
admin.html                   # painel (novo)
src/admin/*.js, *.css        # UI do painel + preview (novo)
api/login.js, save.js, upload.js, content.js, logout.js   # serverless (novo)
api/_lib/{auth,github,image}.js   # utilidades compartilhadas (novo)
vite.config.js               # 2º entry (admin.html) + hook de build (alterado)
vercel.json                  # rotas/headers noindex p/ admin e api (novo/alterado)
docs/PAINEL.md               # guia de operação para o cliente (novo)
```

## 10. Escopo

**Incluído (editável):** todos os textos das seções (hero, carta, vídeo,
frentes, 6 soluções, diferenciais, metodologia, fundador, CTA final, rodapé);
todas as fotos de seção; todos os botões (texto + link); WhatsApp/telefone/
Instagram; vídeo VSL + poster; SEO (título/descrição) em aba "Avançado".

**Fora de escopo (proposital):** design/cores/layout, ícones SVG decorativos,
estrutura dos carrosséis, animações — para o cliente não conseguir quebrar o
visual. (Pode virar escopo futuro se desejado.)

**Fora de escopo (agora):** múltiplos usuários/papéis (um login só), agendamento
de publicação, multi-idioma, analytics no painel.

## 11. Critérios de sucesso

1. Cliente faz login com senha, sem conhecer GitHub.
2. Edita qualquer texto/foto/botão listado no escopo e vê no preview ao vivo.
3. "Publicar" → conteúdo no ar em ~1 min, design idêntico.
4. SEO/GEO preservados: HTML final contém o conteúdo renderizado, JSON-LD e
   metas em sincronia com o `content.json`.
5. Rollback possível pelo histórico do git.
6. Auditoria `vibe-security` sem achados críticos/altos abertos.
7. Implantar o sistema **não altera** nada visível no site (paridade com o atual).

## 12. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Extração de todo o conteúdo introduz divergência visual | Critério #7: gerar `content.json` dos valores atuais e comparar HTML antes/depois (diff vazio no render). |
| Segurança da auth/escrita | Skill `vibe-security` obrigatória antes do deploy; checklist da seção 7. |
| Limites do plano grátis (Vercel/Blob) | Imagens no repo (não Blob); payloads pequenos; landing de 1 página cabe no Hobby. |
| Cliente publica conteúdo quebrado | Preview ao vivo + validação suave + rollback via git. |
| Rebuild de ~1 min confunde o cliente | Mensagem clara no "Publicar" ("no ar em ~1 min"). |
