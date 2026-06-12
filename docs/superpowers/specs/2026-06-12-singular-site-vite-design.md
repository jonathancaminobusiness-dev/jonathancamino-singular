# Singular Site — Vite + Vercel Deploy

**Date:** 2026-06-12  
**Repo:** jonathancaminobusiness-dev/jonathancamino-singular  
**Stack:** Vanilla HTML/CSS/JS · Vite · Vercel

---

## Objetivo

Recriar o site Singular.html com alta fidelidade usando todos os arquivos fornecidos, empacotando com Vite para build otimizado, deploy no Vercel via subdomínio padrão, e versionamento no GitHub.

---

## Fontes de entrada

| Arquivo | Origem |
|---|---|
| `Singular.html` | `/Users/joncarvv/Downloads/` |
| `brand-v2.css` | `/Users/joncarvv/Downloads/` |
| `sections-v2.css` | `/Users/joncarvv/Downloads/` |
| `motion.js` | `/Users/joncarvv/Downloads/` |
| `ui-v2.js` | `/Users/joncarvv/Downloads/` |
| `image-slot.js` | `/Users/joncarvv/Downloads/` |
| `assets/*` (18 arquivos) | `/Users/joncarvv/Downloads/MAG (Rodrigo).zip` |

---

## Estrutura de arquivos

```
jonathancamino-singular/
├── index.html              # Singular.html limpo
├── brand-v2.css
├── sections-v2.css
├── motion.js
├── ui-v2.js
├── image-slot.js
├── public/
│   └── assets/
│       ├── hexfield.svg
│       ├── logo-blue.png
│       ├── logo-white.png
│       ├── mark-blue.png
│       ├── mark-green.png
│       ├── mark-white.png
│       ├── pattern-blue.jpg
│       ├── pattern-white.jpg
│       ├── rodrigo-ai-print.png
│       ├── rodrigo-ai.png
│       ├── rodrigo-bw.jpg
│       ├── rodrigo.png
│       ├── sol-blind.jpg
│       ├── sol-emp.jpg
│       ├── sol-invest.jpg
│       ├── sol-saude.jpg
│       ├── sol-viagem.jpg
│       └── sol-vida.jpg
├── vite.config.js
├── package.json
├── .gitignore
└── docs/
    └── superpowers/specs/
        └── 2026-06-12-singular-site-vite-design.md
```

---

## Limpeza do HTML

Remover do `Singular.html` antes de salvar como `index.html`:

1. Tags `<script>` do React, ReactDOM, Babel (unpkg) — linhas 522-524
2. Tags `<script type="text/babel">` para `tweaks-panel.jsx` e `tweaks-v2.jsx` — linhas 525-526
3. `<div id="tweaks-root"></div>` — linha 517
4. Tag `<template id="__bundler_thumbnail">` — linhas 17-26 (artefato de bundler externo, não necessário em produção)

Manter intacto: `image-slot.js`, `motion.js`, `ui-v2.js`.

---

## Vite config

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  // entry point é index.html na raiz — comportamento padrão do Vite
  // public/assets/ é copiado para dist/assets/ sem processamento
})
```

```json
// package.json
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
```

```
# .gitignore
node_modules/
dist/
.env
.vercel
```

---

## Pipeline de deploy

1. **Estrutura local** — criar arquivos na working directory
2. **Assets** — extrair zip para `public/assets/`
3. **HTML** — copiar e limpar → `index.html`
4. **CSS/JS** — copiar os 5 arquivos na raiz
5. **npm install** — instalar Vite
6. **Git init + commit inicial**
7. **GitHub** — `gh repo create jonathancaminobusiness-dev/jonathancamino-singular --public` + push
8. **Vercel** — `npx vercel --prod` (detecta Vite automaticamente, build command: `vite build`, output: `dist`)

---

## Decisões

| Decisão | Escolha | Razão |
|---|---|---|
| Framework | Vite puro | Build otimizado sem reescrita |
| Assets | `public/` folder | CSS referencia `url("assets/...")` — zero mudança de caminho |
| Tweaks panel | Removido | Não fornecido, não necessário em produção |
| React/Babel unpkg | Removido | Dependia somente dos tweaks |
| Domínio | Subdomínio Vercel | Configuração imediata |

---

## Critérios de sucesso

- Site abre sem erros de console
- Todas as imagens carregam (logos, fotos Rodrigo, soluções, padrões)
- Animações `.reveal` funcionam ao scrollar
- Menu mobile abre/fecha corretamente
- Busca do hero redireciona para WhatsApp
- Carrossel mobile funciona com dots hexagonais
- URL Vercel acessível publicamente
