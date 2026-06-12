# Singular Site — Vite + Vercel Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar o site Singular com Vite, versionar no GitHub em jonathancaminobusiness-dev/jonathancamino-singular e fazer deploy no Vercel.

**Architecture:** Site estático (HTML/CSS/JS) sem framework de UI. Vite é usado apenas como empacotador — processa o `index.html` como entry point, copia `public/assets/` para `dist/assets/`, e gera bundle otimizado. O Vercel detecta Vite automaticamente e serve o `dist/`.

**Tech Stack:** Vite 6, HTML5, CSS3 (brand-v2.css + sections-v2.css), JS vanilla (motion.js, ui-v2.js, image-slot.js), GitHub CLI (gh), Vercel CLI (npx vercel)

**Working directory:** `/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/`

---

## File Map

| Arquivo | Ação | Origem |
|---|---|---|
| `index.html` | Criar (limpo) | `~/Downloads/Singular.html` |
| `brand-v2.css` | Copiar | `~/Downloads/brand-v2.css` |
| `sections-v2.css` | Copiar | `~/Downloads/sections-v2.css` |
| `motion.js` | Copiar | `~/Downloads/motion.js` |
| `ui-v2.js` | Copiar | `~/Downloads/ui-v2.js` |
| `image-slot.js` | Copiar | `~/Downloads/image-slot.js` |
| `public/assets/*` | Extrair | `~/Downloads/MAG (Rodrigo).zip` |
| `vite.config.js` | Criar | — |
| `package.json` | Criar | — |
| `.gitignore` | Criar | — |

---

## Task 1: Scaffold do projeto (package.json, vite.config.js, .gitignore)

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.gitignore`

- [ ] **Step 1: Criar package.json**

```bash
cat > /Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/package.json << 'EOF'
{
  "name": "jonathancamino-singular",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
EOF
```

- [ ] **Step 2: Criar vite.config.js**

```bash
cat > /Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/vite.config.js << 'EOF'
import { defineConfig } from 'vite'

export default defineConfig({})
EOF
```

- [ ] **Step 3: Criar .gitignore**

```bash
cat > "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/.gitignore" << 'EOF'
node_modules/
dist/
.env
.vercel
EOF
```

- [ ] **Step 4: Verificar arquivos criados**

```bash
ls -la /Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/
```

Esperado: `package.json`, `vite.config.js`, `.gitignore` listados.

---

## Task 2: Extrair assets do zip para public/assets/

**Files:**
- Create: `public/assets/` (18 arquivos)

- [ ] **Step 1: Criar diretório public/assets/**

```bash
mkdir -p "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/public/assets"
```

- [ ] **Step 2: Extrair o zip**

```bash
unzip -o "/Users/joncarvv/Downloads/MAG (Rodrigo).zip" -d "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/public/"
```

- [ ] **Step 3: Verificar extração**

```bash
ls "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/public/assets/"
```

Esperado (18 arquivos):
```
hexfield.svg      logo-blue.png     logo-white.png
mark-blue.png     mark-green.png    mark-white.png
pattern-blue.jpg  pattern-white.jpg rodrigo-ai-print.png
rodrigo-ai.png    rodrigo-bw.jpg    rodrigo.png
sol-blind.jpg     sol-emp.jpg       sol-invest.jpg
sol-saude.jpg     sol-viagem.jpg    sol-vida.jpg
```

---

## Task 3: Copiar CSS e JS para a raiz

**Files:**
- Create: `brand-v2.css`, `sections-v2.css`, `motion.js`, `ui-v2.js`, `image-slot.js`

- [ ] **Step 1: Copiar os 5 arquivos**

```bash
WD="/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular"
DL="/Users/joncarvv/Downloads"

cp "$DL/brand-v2.css"     "$WD/brand-v2.css"
cp "$DL/sections-v2.css"  "$WD/sections-v2.css"
cp "$DL/motion.js"        "$WD/motion.js"
cp "$DL/ui-v2.js"         "$WD/ui-v2.js"
cp "$DL/image-slot.js"    "$WD/image-slot.js"
```

- [ ] **Step 2: Verificar**

```bash
ls /Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/*.css \
   /Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/*.js
```

Esperado: `brand-v2.css`, `sections-v2.css`, `image-slot.js`, `motion.js`, `ui-v2.js` listados.

---

## Task 4: Criar index.html limpo (remover tweaks, React, Babel)

**Files:**
- Create: `index.html`

- [ ] **Step 1: Copiar Singular.html como index.html**

```bash
cp "/Users/joncarvv/Downloads/Singular.html" \
   "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/index.html"
```

- [ ] **Step 2: Remover o bloco `<template id="__bundler_thumbnail">`**

Localizar e remover as linhas 17–26 do index.html — o bloco completo:
```html
<template id="__bundler_thumbnail">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="bgrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#005DE5"/><stop offset="1" stop-color="#00052D"/>
  </linearGradient></defs>
  <rect width="100" height="100" rx="20" fill="url(#bgrad)"/>
  <path d="M50 26 L69 37 L69 63 L50 74 L31 63 L31 37 Z" fill="none" stroke="#11C071" stroke-width="3"/>
  <path d="M57 42 L45 42 Q41 42 41 46 L41 49 Q41 52 45 52 L55 52 Q59 52 59 56 L59 59 Q59 62 55 62 L43 62"
        fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
</svg>
</template>
```

Comando para remover:
```bash
WD="/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular"
# Remove template block (lines with __bundler_thumbnail through closing </template>)
python3 -c "
import re, pathlib
f = pathlib.Path('$WD/index.html')
html = f.read_text()
html = re.sub(r'\n<template id=\"__bundler_thumbnail\">.*?</template>\n', '\n', html, flags=re.DOTALL)
f.write_text(html)
print('template block removed')
"
```

- [ ] **Step 3: Remover `<div id="tweaks-root"></div>`**

```bash
WD="/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular"
python3 -c "
import pathlib
f = pathlib.Path('$WD/index.html')
html = f.read_text()
html = html.replace('\n<!-- Tweaks mount -->\n<div id=\"tweaks-root\"></div>\n', '\n')
f.write_text(html)
print('tweaks-root removed')
"
```

- [ ] **Step 4: Remover scripts React, ReactDOM, Babel e tweaks JSX**

Os 5 scripts a remover são:
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
<script type="text/babel" src="tweaks-panel.jsx"></script>
<script type="text/babel" src="tweaks-v2.jsx"></script>
```

```bash
WD="/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular"
python3 -c "
import re, pathlib
f = pathlib.Path('$WD/index.html')
html = f.read_text()
# Remove React
html = re.sub(r'<script src=\"https://unpkg.com/react@[^>]+></script>\n', '', html)
# Remove ReactDOM
html = re.sub(r'<script src=\"https://unpkg.com/react-dom@[^>]+></script>\n', '', html)
# Remove Babel standalone
html = re.sub(r'<script src=\"https://unpkg.com/@babel/standalone@[^>]+></script>\n', '', html)
# Remove tweaks JSX scripts
html = re.sub(r'<script type=\"text/babel\" src=\"tweaks-panel.jsx\"></script>\n', '', html)
html = re.sub(r'<script type=\"text/babel\" src=\"tweaks-v2.jsx\"></script>\n', '', html)
f.write_text(html)
print('react/babel/tweaks scripts removed')
"
```

- [ ] **Step 5: Verificar que o index.html não contém referências indesejadas**

```bash
grep -n "tweaks\|unpkg\|babel\|react\|__bundler" \
  "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/index.html"
```

Esperado: **nenhuma linha** retornada (saída vazia = OK).

- [ ] **Step 6: Verificar que os scripts corretos ainda estão presentes**

```bash
grep -n "image-slot\|motion\|ui-v2" \
  "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/index.html"
```

Esperado:
```
519:<script src="image-slot.js"></script>
520:<script src="motion.js"></script>
521:<script src="ui-v2.js"></script>
```
(números de linha podem variar ligeiramente)

---

## Task 5: npm install + verificação do servidor local

**Files:** nenhum arquivo novo — instala `node_modules/`

- [ ] **Step 1: Instalar dependências**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && npm install
```

Esperado: `added N packages` sem erros.

- [ ] **Step 2: Verificar build de produção**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && npm run build
```

Esperado: saída terminando com algo como:
```
✓ built in Xs
dist/index.html     X kB
dist/assets/...
```
Sem erros.

- [ ] **Step 3: Verificar que assets foram copiados para dist/**

```bash
ls "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular/dist/assets/" | head -20
```

Esperado: os 18 arquivos de imagem/svg listados em `dist/assets/`.

---

## Task 6: Git init + commit inicial

**Files:** `.git/` criado

- [ ] **Step 1: Inicializar repositório git**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && git init -b main
```

Esperado: `Initialized empty Git repository in .../jonathancamino-singular/.git/`

- [ ] **Step 2: Staging de todos os arquivos (exceto node_modules e dist)**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && \
git add index.html brand-v2.css sections-v2.css motion.js ui-v2.js image-slot.js \
        vite.config.js package.json package-lock.json .gitignore \
        public/ docs/
```

- [ ] **Step 3: Verificar staging**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && git status
```

Esperado: todos os arquivos em verde (staged), `node_modules/` e `dist/` não aparecem.

- [ ] **Step 4: Commit inicial**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && \
git commit -m "$(cat <<'EOF'
feat: site Singular com Vite — landing page completa

HTML limpo (sem tweaks/React/Babel), CSS brand-v2 + sections-v2,
JS motion/ui-v2/image-slot, 18 assets da identidade visual MAG.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Esperado: `[main (root-commit) XXXXXXX] feat: site Singular com Vite — landing page completa`

---

## Task 7: Criar repo no GitHub e fazer push

- [ ] **Step 1: Criar repositório público no GitHub**

```bash
gh repo create jonathancaminobusiness-dev/jonathancamino-singular \
  --public \
  --description "Site da Singular — consultoria estratégica em seguros, investimentos e patrimônio"
```

Esperado: URL do repositório criado impressa no terminal.

- [ ] **Step 2: Adicionar remote origin e fazer push**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && \
git remote add origin https://github.com/jonathancaminobusiness-dev/jonathancamino-singular.git && \
git push -u origin main
```

Esperado: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

- [ ] **Step 3: Verificar repositório no GitHub**

```bash
gh repo view jonathancaminobusiness-dev/jonathancamino-singular
```

Esperado: descrição, visibilidade pública, branch main com commits.

---

## Task 8: Deploy no Vercel

- [ ] **Step 1: Instalar Vercel CLI se necessário**

```bash
npx vercel --version 2>/dev/null || echo "vercel CLI not found, will use npx"
```

- [ ] **Step 2: Fazer deploy de produção**

```bash
cd "/Users/joncarvv/Desktop/Clients/Rodrigo/jonathancamino-singular" && \
npx vercel --prod --yes \
  --build-env NODE_ENV=production
```

O Vercel detecta Vite automaticamente:
- **Build Command:** `vite build`
- **Output Directory:** `dist`
- **Framework:** Vite

Esperado: linha final com `✅ Production: https://jonathancamino-singular-XXXXX.vercel.app`

- [ ] **Step 3: Anotar a URL de produção**

Salvar a URL retornada pelo Vercel. Formatos possíveis:
- `https://jonathancamino-singular.vercel.app`
- `https://jonathancamino-singular-jonathancaminobusiness-dev.vercel.app`

- [ ] **Step 4: Verificar site ao vivo**

```bash
curl -s -o /dev/null -w "%{http_code}" "$(npx vercel ls --prod 2>/dev/null | grep jonathancamino-singular | awk '{print $2}' | head -1)"
```

Esperado: `200`

---

## Critérios de sucesso (checklist final)

- [ ] `npm run build` termina sem erros
- [ ] `dist/assets/` contém os 18 arquivos de imagem
- [ ] `index.html` não contém referências a `tweaks`, `unpkg`, `babel`, `react`
- [ ] `index.html` mantém `image-slot.js`, `motion.js`, `ui-v2.js`
- [ ] Repo visível em `github.com/jonathancaminobusiness-dev/jonathancamino-singular`
- [ ] URL Vercel retorna HTTP 200
- [ ] Site abre no navegador com logo, fotos e seções visíveis
