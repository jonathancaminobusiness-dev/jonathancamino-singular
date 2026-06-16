# Guia de Operação do Painel Administrativo

## O que é o painel

O painel administrativo permite editar os textos, botões, links e fotos do site **protecaosingular.com.br** diretamente pelo navegador, sem precisar mexer em código ou entrar em contato com o desenvolvedor para alterações de conteúdo.

Com ele você pode:

- Alterar títulos, parágrafos e chamadas para ação em qualquer seção do site
- Trocar os links dos botões
- Definir o número de WhatsApp que aparece nos botões de contato
- Dar destaque a palavras ou trechos de texto (ficam em azul)
- Trocar imagens de qualquer seção
- Ver uma prévia ao vivo de como o site vai ficar antes de publicar

---

## Como acessar

1. Abra o navegador e acesse: **https://www.protecaosingular.com.br/admin.html**
2. Digite a senha e clique em **Entrar**.
3. O painel abre com a prévia do site à direita e os campos de edição à esquerda.

> Se a senha não funcionar, entre em contato com o desenvolvedor para redefini-la.

---

## Como editar

### Seções em acordeão

O painel organiza o site em seções (Hero, Sobre, Serviços, Contato etc.). Clique no nome de uma seção para expandi-la e ver seus campos.

### Campos de texto

Cada campo de texto editável aparece como uma caixa. Digite diretamente nela para alterar o conteúdo. A prévia ao vivo (à direita) atualiza enquanto você digita.

### Destaque azul

Para dar destaque a uma palavra ou trecho:

1. Selecione o texto desejado dentro do campo.
2. Clique no botão **Destaque** (ícone de estrela ou "D" na barra de formatação).
3. O texto selecionado fica em azul no site.

Para remover o destaque, selecione o trecho e clique em **Destaque** novamente.

### Número de WhatsApp

O número de telefone do WhatsApp é configurado **uma única vez** na seção **Contato**. Todos os botões de "Falar no WhatsApp" do site usam esse número automaticamente.

Cada botão tem apenas o campo da **mensagem pré-preenchida** — o número em si não precisa ser repetido.

---

## Trocar uma foto

1. Expanda a seção que contém a imagem que deseja trocar.
2. Clique no botão **Trocar imagem** abaixo da foto atual.
3. Selecione o arquivo no seu computador. Formatos aceitos: **jpg, png, webp**. Tamanho máximo: **4 MB**.
4. A nova imagem aparece na prévia ao vivo imediatamente.
5. Clique em **Publicar** para tornar a troca permanente no site.

---

## Salvar rascunho vs Publicar

| Ação | O que faz |
|------|-----------|
| **Salvar rascunho** | Salva as edições no navegador. Se fechar e abrir novamente a página do painel, as edições ainda estão lá. O site público **não muda**. |
| **Publicar** | Envia as edições para o site ao vivo. As mudanças aparecem em **aproximadamente 1 minuto**. |
| **Reverter** | Descarta o rascunho salvo no navegador e volta ao conteúdo que está no ar no momento. |
| **Sair** | Encerra a sessão. Você precisará digitar a senha novamente para acessar o painel. |

> **Atenção:** o rascunho fica salvo apenas no navegador do seu dispositivo. Se você editar em um computador e abrir o painel em outro, o rascunho não aparece lá.

---

## Configuração inicial (feita uma vez pelo desenvolvedor)

Esta seção é para o desenvolvedor responsável pela configuração do ambiente de produção. O cliente não precisa realizar estes passos.

### 1. Criar o token do GitHub

1. Acesse **github.com** e faça login na conta `jonathancaminobusiness-dev`.
2. Vá em **Settings → Developer settings → Fine-grained personal access tokens**.
3. Clique em **Generate new token**.
4. Preencha:
   - **Token name:** `vercel-painel-admin` (ou similar)
   - **Expiration:** escolha o prazo desejado (recomendado: sem expiração para produção, ou renovação anual)
   - **Repository access:** selecione **Only select repositories** e escolha `jonathancaminobusiness-dev/jonathancamino-singular`
   - **Permissions → Contents:** marque **Read and write**
5. Clique em **Generate token** e copie o token gerado (ele só é mostrado uma vez).

### 2. Definir as variáveis de ambiente no Vercel

No painel do Vercel, vá em **Project Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `GITHUB_TOKEN` | O token gerado no passo anterior |
| `GITHUB_REPO` | `jonathancaminobusiness-dev/jonathancamino-singular` |
| `SESSION_SECRET` | Gerar com: `openssl rand -hex 32` |
| `ADMIN_PASSWORD_HASH` | Gerar com: `node scripts/hash-password.mjs "a-senha-escolhida"` |

**Como gerar o hash da senha:**

```bash
node scripts/hash-password.mjs "a-senha-escolhida"
```

O comando imprime uma linha no formato `scrypt$<salt>$<hash>`. Copie essa linha inteira e cole como valor de `ADMIN_PASSWORD_HASH`.

**Como gerar o segredo de sessão:**

```bash
openssl rand -hex 32
```

### 3. Fazer redeploy

Após salvar todas as variáveis de ambiente, acesse a aba **Deployments** no Vercel e clique em **Redeploy** no deploy mais recente. Aguarde finalizar.

Pronto: ao acessar `/admin.html`, o sistema pedirá a senha configurada.

---

## Observacoes de seguranca

- **Use uma senha forte** (16+ caracteres ou uma frase-senha). O login tem um atraso por tentativa para dificultar ataques de força bruta, mas a proteção real vem de uma senha difícil de adivinhar.
- A senha nunca fica armazenada em texto simples — apenas o hash é guardado na variável de ambiente.
- O token do GitHub fica exclusivamente nas variáveis de ambiente do Vercel, nunca no código do repositório.
- **Para trocar a senha:** gere um novo hash com `node scripts/hash-password.mjs "nova-senha"` e atualize o valor de `ADMIN_PASSWORD_HASH` no Vercel, depois faça redeploy.
- Não compartilhe o valor de `SESSION_SECRET` ou `GITHUB_TOKEN` — se forem expostos, gere novos valores e atualize no Vercel.
