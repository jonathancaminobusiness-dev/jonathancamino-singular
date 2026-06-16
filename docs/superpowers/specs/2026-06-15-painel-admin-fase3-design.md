# Painel Admin — Fase 3: Login + Publicar (backend + auth + deploy)

**Data:** 2026-06-15
**Status:** Aprovado (design) — pré-plano
**Depende de:** Fase 1 (render dirigido por content.json) e Fase 2 (painel local) — concluídas (Fase 2 vive na branch).

## 1. Objetivo

Tornar o painel `/admin` **usável pelo cliente em produção**: login por senha,
carregar/salvar conteúdo via API autenticada, **Publicar** (grava `content.json`
no GitHub → Vercel republica), e **upload de imagem**. Tudo com os segredos só no
servidor e auditoria de segurança antes do deploy.

## 2. Decisões (brainstorming)

| Tema | Decisão |
|---|---|
| Proteção do painel | Login próprio + **cookie de sessão assinado**; o bundle do admin **não** embute conteúdo (busca via API). Sem Basic Auth. |
| Persistência | Hybrid da Fase 1: `POST /api/save` grava `content.json` no GitHub → Vercel republica (~1 min). |
| Imagens | `POST /api/upload` re-encoda e commita em `public/assets/uploads/`; o campo recebe o caminho. |
| Segredos | `GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` em env vars do Vercel — nunca no navegador. |
| Sessão | Cookie httpOnly+secure+sameSite=strict, HMAC, expiração (7 dias). |
| Auditoria | `vibe-security` obrigatória antes de qualquer deploy. |

## 3. Arquitetura

### 3.1 Funções serverless (`api/`, Node, Vercel)

| Rota | Auth | Função |
|---|---|---|
| `POST /api/login` | — | Valida senha (hash scrypt, comparação constante), emite cookie de sessão. Rate-limit + atraso. |
| `POST /api/logout` | sessão | Limpa o cookie. |
| `GET /api/content` | sessão | Devolve o `content.json` atual (do deployment). |
| `POST /api/save` | sessão | Valida o conteúdo; commita `content.json` no GitHub (Contents API) → rebuild. |
| `POST /api/upload` | sessão | Recebe imagem; valida tipo/tamanho; re-encoda (remove EXIF); commita em `assets/uploads/`; devolve o caminho. |

Utilidades compartilhadas (`api/_lib/`):
- **`auth.js`** — `hashPassword`/`verifyPassword` (scrypt), `signSession`/`verifySession` (HMAC com `SESSION_SECRET`), `requireAuth(req)` (lê e valida o cookie).
- **`github.js`** — `getFile(path)` (SHA+conteúdo), `putFile(path, contentBase64, message, sha?)` (cria/atualiza via Contents API). Usa `GITHUB_TOKEN` + `GITHUB_REPO`.
- **`image.js`** — valida MIME (jpg/png/webp) + tamanho; re-encoda; gera nome saneado.
- **`cookies.js`** — parse/serialize de cookies (sem dependência pesada).

### 3.2 Sessão / cookie
- Login OK → token = `base64(payload).hmac` onde payload = `{ exp }`.
  Cookie `sg_session`, `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=...`.
- `requireAuth` rejeita (401) se ausente/inválido/expirado.
- Rate-limit do login: contador em memória por IP (best-effort em serverless) +
  atraso fixo por tentativa; trava após N erros numa janela.

### 3.3 Publicar (save)
- Recebe `{ content }` (objeto). Valida: é objeto, tamanho < limite, chaves
  conhecidas (compara com `schemaKeys()`), sanitiza campos de texto rich.
- Lê o SHA atual de `content.json` via GitHub, faz `putFile` com o novo conteúdo
  serializado (2 espaços + `\n`, igual ao build). Mensagem de commit
  "conteúdo atualizado pelo painel".
- O commit dispara o rebuild automático do Vercel (deploy hook nativo do Git).

### 3.4 Upload de imagem
- Recebe a imagem (multipart ou base64). Valida tipo/tamanho (≤ ~4MB).
- Re-encoda para webp/jpg (descarta metadados). Nome:
  `uploads/<slug>-<hash8>.<ext>` saneado.
- `putFile('public/assets/uploads/...', ...)`. Devolve o caminho relativo
  (`assets/uploads/...`) que o painel grava no campo. O `Publicar` seguinte
  commita o `content.json` apontando para a nova imagem.

### 3.5 Refactor do painel (Fase 2 → 3)
- **`main.js`**: remover `import content.json`. Fluxo: tentar `GET /api/content`;
  se 401 → renderizar **tela de login** (`auth-ui.js`); ao logar, recarregar e
  buscar o conteúdo; então montar o form/preview.
- **Login UI** (`src/admin/auth-ui.js`): campo de senha → `POST /api/login` →
  em sucesso, recarrega o painel.
- **Botão Publicar**: novo na barra de ações; `POST /api/save` com o `state`;
  feedback "publicando… no ar em ~1 min" e tratamento de erro.
- **Widget de imagem** (`src/admin/widgets.js`): de somente-leitura para
  **upload** — botão "Trocar" → seletor de arquivo → `POST /api/upload` →
  atualiza o campo e o preview (com a nova URL).
- **`api/content` em dev**: como o painel agora depende das funções, o
  desenvolvimento usa `vercel dev` (roda as funções localmente) **ou** um
  modo de fallback que lê `content.json` direto quando não há backend.

### 3.6 Config Vercel
- `api/` detectado automaticamente como funções serverless.
- `vercel.json` se necessário (headers `noindex` para `/admin` e `/api`,
  e garantir que o build estático continua).
- Variáveis (definidas pelo cliente no painel do Vercel):
  `GITHUB_TOKEN` (fine-grained, Contents:write neste repo),
  `GITHUB_REPO` (ex.: `jonathancaminobusiness-dev/jonathancamino-singular`),
  `ADMIN_PASSWORD_HASH` (gerado por nós a partir da senha escolhida),
  `SESSION_SECRET` (aleatório).

## 4. Segurança (auditoria `vibe-security` antes do deploy)

- Senha: hash scrypt em env var; `timingSafeEqual`; rate-limit + atraso.
- Cookie: HMAC, httpOnly, secure, sameSite=strict, expiração; segredo em env.
- **Todas** as rotas de escrita (`save`, `upload`, `logout`) e `content` exigem
  sessão válida.
- Token do GitHub: fine-grained, escopo mínimo, só no servidor.
- Upload: allowlist MIME, limite de tamanho, **re-encode** (descarta payload
  malicioso/EXIF), nome saneado, caminho fixo `assets/uploads/`.
- Save: limite de tamanho do payload; chaves validadas contra o schema;
  sanitização do HTML rich (reusa `sanitize`); recusa caminhos fora de
  `content.json`.
- Sem segredos no bundle do cliente; sem conteúdo embutido.
- `/admin` e `/api`: `noindex`.

## 5. Arquivos (novos/alterados)

```
api/login.js, logout.js, content.js, save.js, upload.js     (novo)
api/_lib/auth.js, github.js, image.js, cookies.js           (novo)
src/admin/auth-ui.js                                         (novo)
src/admin/api.js          (cliente das rotas /api)          (novo)
src/admin/main.js         (login gate + fetch + publicar)   (alterado)
src/admin/widgets.js      (imagem → upload)                 (alterado)
package.json              (deps do backend: sharp?)         (alterado)
vercel.json               (headers/config)                  (novo)
scripts/hash-password.mjs (gera ADMIN_PASSWORD_HASH)        (novo)
docs/PAINEL.md            (guia de operação do cliente)      (novo)
test/api-auth.test.js, test/api-github.test.js, test/api-save.test.js  (novo)
```

## 6. Testes

Lógica (Vitest, mockando GitHub e env):
- `auth.js`: hash/verify de senha; sign/verify de sessão (válida, expirada,
  adulterada); `requireAuth` aceita/recusa.
- `github.js`: `putFile` monta a chamada correta (mock fetch); usa o SHA;
  base64 do conteúdo correto.
- `save` (handler): sem sessão → 401; com sessão → chama `putFile` com o
  `content.json` serializado certo; rejeita payload inválido/chave desconhecida.
- `image.js`: rejeita MIME inválido/arquivo grande; aceita válido; nome saneado.
- `upload`/`login`/`content` handlers: caminhos de auth (401 sem sessão).

Integração local (controlador): `vercel dev` → login → editar → upload →
publicar (em um repo/branch de teste, ou dry-run sem commit real até o cliente
fornecer o token). UI verificada no preview.

## 7. Escopo

**Incluído:** login/sessão; `/api/{login,logout,content,save,upload}`; refactor
do painel (gate + fetch + publicar + upload); hash de senha; config Vercel;
auditoria de segurança; guia de operação; deploy gated.

**Fora:** múltiplos usuários/papéis; histórico/rollback visual no painel (o git
já versiona); agendamento de publicação; edição de design/layout.

## 8. Critérios de sucesso

1. `/admin` sem sessão mostra **login**; senha correta abre o painel; o bundle
   público não contém `content.json` nem segredos.
2. Editar + **Publicar** grava `content.json` no GitHub e o site republica
   (~1 min) com a edição, design e SEO intactos.
3. **Upload** de imagem troca a foto de uma seção (commit em `assets/uploads/`),
   refletido após publicar.
4. Todas as rotas de escrita recusam acesso sem sessão (401).
5. `npm test` verde (lógica de auth/github/save/image/handlers).
6. `vibe-security` sem achados críticos/altos abertos.
7. Deploy em produção com o painel **gated**; o site público segue idêntico.

## 9. Dependência operacional (cliente)

Antes do deploy final, o cliente precisa: criar o token fine-grained do GitHub e
definir as 4 env vars no Vercel (geramos o `ADMIN_PASSWORD_HASH`). Até lá, o
código é construído e testado com mocks/`vercel dev` e env local de teste.

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Segredo vazar no bundle | Painel sem conteúdo embutido; segredos só em funções server. Auditoria. |
| Rate-limit fraco em serverless (memória efêmera) | Atraso fixo por tentativa + contador best-effort; documentar limitação; suficiente para um painel de baixo tráfego. |
| `sharp` pesado/incompatível no Vercel | Vercel suporta sharp; se inviável, usar validação estrita + re-encode mínimo via outra lib leve. Decidir no plano. |
| Commit concorrente (SHA desatualizado) | `putFile` busca o SHA imediatamente antes; em conflito, refazer com o novo SHA. Um editor só → risco baixo. |
| `/admin.html` acessível publicamente | Aceitável: sem sessão só mostra login; APIs 401; nenhum segredo/conteúdo no bundle. `noindex`. |
| Deploy quebrar o site público | Save só altera `content.json`; build com paridade já provado nas Fases 1-2. |
