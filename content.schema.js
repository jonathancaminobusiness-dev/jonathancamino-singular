// Esquema de conteúdo editável do site Singular.
// Cada entrada: { key, label, type, section }
// type: 'text' | 'rich' | 'image' | 'link' | 'wa'

export const SCHEMA = [
  // ─── SEO ───────────────────────────────────────────────────────────────────
  { section: 'SEO', key: 'seo.titulo',    label: 'Título da aba / Google',    type: 'text' },
  { section: 'SEO', key: 'seo.descricao', label: 'Descrição para buscadores', type: 'text' },

  // ─── Contato ───────────────────────────────────────────────────────────────
  { section: 'Contato', key: 'contato.instagram_label', label: 'Rótulo do Instagram (cabeçalho)',    type: 'text' },
  { section: 'Contato', key: 'contato.telefone_label',  label: 'Rótulo do telefone (cabeçalho)',     type: 'text' },
  { section: 'Contato', key: 'contato.whatsapp',        label: 'Número WhatsApp (só dígitos)',       type: 'text' },

  // ─── Navegação ─────────────────────────────────────────────────────────────
  { section: 'Navegação', key: 'nav.solucoes',   label: 'Menu — Soluções',      type: 'text' },
  { section: 'Navegação', key: 'nav.sobre',      label: 'Menu — Quem somos',    type: 'text' },
  { section: 'Navegação', key: 'nav.fundador',   label: 'Menu — Fundador',      type: 'text' },
  { section: 'Navegação', key: 'nav.metodologia',label: 'Menu — Metodologia',   type: 'text' },
  { section: 'Navegação', key: 'nav.contato',    label: 'Menu — Contato',       type: 'text' },

  // ─── Cabeçalho ─────────────────────────────────────────────────────────────
  { section: 'Cabeçalho', key: 'header.cta_ghost', label: 'Botão secundário (cabeçalho)',    type: 'text' },
  { section: 'Cabeçalho', key: 'header.cta_wa',    label: 'Botão WhatsApp (cabeçalho)',      type: 'text' },

  // ─── Menu Mobile ───────────────────────────────────────────────────────────
  { section: 'Menu mobile', key: 'mnav.cta_msg', label: 'Mensagem WhatsApp (menu mobile)', type: 'wa'   },
  { section: 'Menu mobile', key: 'mnav.cta',     label: 'Texto do botão (menu mobile)',    type: 'text' },

  // ─── Hero ──────────────────────────────────────────────────────────────────
  { section: 'Hero', key: 'hero.titulo',    label: 'Título principal',              type: 'rich'  },
  { section: 'Hero', key: 'hero.subtitulo', label: 'Subtítulo / lead',              type: 'rich'  },
  { section: 'Hero', key: 'hero.cta_msg',   label: 'Mensagem WhatsApp (hero CTA)',  type: 'wa'    },
  { section: 'Hero', key: 'hero.cta',       label: 'Texto do botão (hero)',         type: 'text'  },
  { section: 'Hero', key: 'hero.hint',      label: 'Linha de credenciais (hero)',   type: 'rich'  },
  { section: 'Hero', key: 'hero.foto',      label: 'Foto do fundador (hero)',       type: 'image' },
  { section: 'Hero', key: 'hero.foto_alt',  label: 'Alt da foto do fundador',      type: 'text'  },

  // ─── Carta ─────────────────────────────────────────────────────────────────
  { section: 'Carta', key: 'carta.titulo',           label: 'Título da carta',                    type: 'rich'  },
  { section: 'Carta', key: 'carta.p1',               label: 'Parágrafo 1 da carta',               type: 'rich'  },
  { section: 'Carta', key: 'carta.p2',               label: 'Parágrafo 2 da carta',               type: 'rich'  },
  { section: 'Carta', key: 'carta.p3',               label: 'Parágrafo 3 da carta',               type: 'rich'  },
  { section: 'Carta', key: 'carta.crenca',           label: 'Frase de crença (destaque)',         type: 'rich'  },
  { section: 'Carta', key: 'carta.prova1',           label: 'Prova social 1',                     type: 'text'  },
  { section: 'Carta', key: 'carta.prova2',           label: 'Prova social 2',                     type: 'text'  },
  { section: 'Carta', key: 'carta.prova3',           label: 'Prova social 3',                     type: 'text'  },
  { section: 'Carta', key: 'carta.assinatura_nome',  label: 'Nome na assinatura',                 type: 'text'  },
  { section: 'Carta', key: 'carta.assinatura_cargo', label: 'Cargo na assinatura',                type: 'text'  },
  { section: 'Carta', key: 'carta.cta_msg',          label: 'Mensagem WhatsApp (carta)',          type: 'wa'    },
  { section: 'Carta', key: 'carta.cta',              label: 'Texto do botão (carta)',             type: 'text'  },
  { section: 'Carta', key: 'carta.cta_ghost',        label: 'Botão secundário (carta)',           type: 'text'  },

  // ─── Vídeo ─────────────────────────────────────────────────────────────────
  { section: 'Vídeo', key: 'video.titulo',    label: 'Título da seção de vídeo',        type: 'rich'  },
  { section: 'Vídeo', key: 'video.subtitulo', label: 'Subtítulo da seção de vídeo',     type: 'text'  },
  { section: 'Vídeo', key: 'video.poster',    label: 'Imagem de capa do vídeo',         type: 'image' },
  { section: 'Vídeo', key: 'video.arquivo',   label: 'Arquivo de vídeo (MP4)',          type: 'image' },
  { section: 'Vídeo', key: 'video.cta_msg',   label: 'Mensagem WhatsApp (vídeo CTA)',   type: 'wa'    },
  { section: 'Vídeo', key: 'video.cta',       label: 'Texto do botão (vídeo)',          type: 'text'  },
  { section: 'Vídeo', key: 'video.micro1',    label: 'Micro-cópia 1 (vídeo)',           type: 'text'  },
  { section: 'Vídeo', key: 'video.micro2',    label: 'Micro-cópia 2 (vídeo)',           type: 'text'  },
  { section: 'Vídeo', key: 'video.micro3',    label: 'Micro-cópia 3 (vídeo)',           type: 'text'  },

  // ─── Frentes ───────────────────────────────────────────────────────────────
  { section: 'Frentes', key: 'frentes.titulo',            label: 'Título da seção Frentes',                  type: 'text' },
  { section: 'Frentes', key: 'frentes.subtitulo',         label: 'Subtítulo da seção Frentes',               type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.0.tag',       label: 'Tag do card 1 (Pessoal)',                  type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.0.titulo',    label: 'Título do card 1 (Pessoal)',               type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.0.texto',     label: 'Texto do card 1 (Pessoal)',                type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.0.botao',     label: 'Botão do card 1 (Pessoal)',                type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.1.tag',       label: 'Tag do card 2 (Patrimônio)',               type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.1.titulo',    label: 'Título do card 2 (Patrimônio)',            type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.1.texto',     label: 'Texto do card 2 (Patrimônio)',             type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.1.botao',     label: 'Botão do card 2 (Patrimônio)',             type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.2.tag',       label: 'Tag do card 3 (Empresarial)',              type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.2.titulo',    label: 'Título do card 3 (Empresarial)',           type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.2.texto',     label: 'Texto do card 3 (Empresarial)',            type: 'text' },
  { section: 'Frentes', key: 'frentes.cards.2.botao_msg', label: 'Mensagem WhatsApp (card Empresarial)',     type: 'wa'   },
  { section: 'Frentes', key: 'frentes.cards.2.botao',     label: 'Botão do card 3 (Empresarial)',            type: 'text' },

  // ─── Soluções ──────────────────────────────────────────────────────────────
  { section: 'Soluções', key: 'solucoes.titulo',         label: 'Título da seção Soluções',              type: 'text'  },
  { section: 'Soluções', key: 'solucoes.subtitulo',      label: 'Subtítulo da seção Soluções',           type: 'text'  },

  { section: 'Soluções', key: 'solucoes.cards.0.foto',     label: 'Foto — Seguro de Vida',               type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.0.foto_alt', label: 'Alt da foto — Seguro de Vida',        type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.0.titulo',   label: 'Título — Seguro de Vida',             type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.0.texto',    label: 'Texto — Seguro de Vida',              type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.0.msg',      label: 'Mensagem WhatsApp — Seguro de Vida',  type: 'wa'    },

  { section: 'Soluções', key: 'solucoes.cards.1.foto',     label: 'Foto — Plano de Saúde',               type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.1.foto_alt', label: 'Alt da foto — Plano de Saúde',        type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.1.titulo',   label: 'Título — Plano de Saúde',             type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.1.texto',    label: 'Texto — Plano de Saúde',              type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.1.msg',      label: 'Mensagem WhatsApp — Plano de Saúde',  type: 'wa'    },

  { section: 'Soluções', key: 'solucoes.cards.2.foto',     label: 'Foto — Seguro Viagem',                type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.2.foto_alt', label: 'Alt da foto — Seguro Viagem',         type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.2.titulo',   label: 'Título — Seguro Viagem',              type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.2.texto',    label: 'Texto — Seguro Viagem',               type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.2.msg',      label: 'Mensagem WhatsApp — Seguro Viagem',   type: 'wa'    },

  { section: 'Soluções', key: 'solucoes.cards.3.foto',     label: 'Foto — Investimentos',                type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.3.foto_alt', label: 'Alt da foto — Investimentos',         type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.3.titulo',   label: 'Título — Investimentos',              type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.3.texto',    label: 'Texto — Investimentos',               type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.3.msg',      label: 'Mensagem WhatsApp — Investimentos',   type: 'wa'    },

  { section: 'Soluções', key: 'solucoes.cards.4.foto',     label: 'Foto — Blindagem Jurídica',           type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.4.foto_alt', label: 'Alt da foto — Blindagem Jurídica',    type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.4.titulo',   label: 'Título — Blindagem Jurídica',         type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.4.texto',    label: 'Texto — Blindagem Jurídica',          type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.4.msg',      label: 'Mensagem WhatsApp — Blindagem Jurídica', type: 'wa' },

  { section: 'Soluções', key: 'solucoes.cards.5.foto',     label: 'Foto — Riscos Empresariais',          type: 'image' },
  { section: 'Soluções', key: 'solucoes.cards.5.foto_alt', label: 'Alt da foto — Riscos Empresariais',   type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.5.titulo',   label: 'Título — Riscos Empresariais',        type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.5.texto',    label: 'Texto — Riscos Empresariais',         type: 'text'  },
  { section: 'Soluções', key: 'solucoes.cards.5.msg',      label: 'Mensagem WhatsApp — Riscos Empresariais', type: 'wa' },

  // ─── Diferenciais ──────────────────────────────────────────────────────────
  { section: 'Diferenciais', key: 'diferenciais.titulo',           label: 'Título da seção Diferenciais',           type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.0.titulo',   label: 'Título do diferencial 1',                type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.0.itens.0',  label: 'Item 1.1 — Humanidade Técnica',          type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.0.itens.1',  label: 'Item 1.2 — Humanidade Técnica',          type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.0.itens.2',  label: 'Item 1.3 — Humanidade Técnica',          type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.1.titulo',   label: 'Título do diferencial 2',                type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.1.itens.0',  label: 'Item 2.1 — Personalização Extrema',      type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.1.itens.1',  label: 'Item 2.2 — Personalização Extrema',      type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.1.itens.2',  label: 'Item 2.3 — Personalização Extrema',      type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.2.titulo',   label: 'Título do diferencial 3',                type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.2.itens.0',  label: 'Item 3.1 — Transparência Total',         type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.2.itens.1',  label: 'Item 3.2 — Transparência Total',         type: 'text' },
  { section: 'Diferenciais', key: 'diferenciais.cards.2.itens.2',  label: 'Item 3.3 — Transparência Total',         type: 'text' },

  // ─── Metodologia ───────────────────────────────────────────────────────────
  { section: 'Metodologia', key: 'metodologia.titulo',           label: 'Título da seção Metodologia',         type: 'text' },
  { section: 'Metodologia', key: 'metodologia.subtitulo',        label: 'Subtítulo da seção Metodologia',      type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.0.titulo',  label: 'Etapa 1 — título (Diagnóstico)',      type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.0.texto',   label: 'Etapa 1 — descrição (Diagnóstico)',   type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.1.titulo',  label: 'Etapa 2 — título (Planejamento)',     type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.1.texto',   label: 'Etapa 2 — descrição (Planejamento)',  type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.2.titulo',  label: 'Etapa 3 — título (Implementação)',    type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.2.texto',   label: 'Etapa 3 — descrição (Implementação)', type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.3.titulo',  label: 'Etapa 4 — título (Monitoramento)',    type: 'text' },
  { section: 'Metodologia', key: 'metodologia.passos.3.texto',   label: 'Etapa 4 — descrição (Monitoramento)', type: 'text' },

  // ─── Fundador ──────────────────────────────────────────────────────────────
  { section: 'Fundador', key: 'fundador.foto',               label: 'Foto do fundador',                     type: 'image' },
  { section: 'Fundador', key: 'fundador.foto_alt',           label: 'Alt da foto do fundador',              type: 'text'  },
  { section: 'Fundador', key: 'fundador.titulo',             label: 'Nome do fundador',                     type: 'text'  },
  { section: 'Fundador', key: 'fundador.cargo',              label: 'Cargo do fundador',                    type: 'text'  },
  { section: 'Fundador', key: 'fundador.texto',              label: 'Biografia do fundador',                type: 'text'  },
  { section: 'Fundador', key: 'fundador.citacao',            label: 'Citação do fundador',                  type: 'text'  },
  { section: 'Fundador', key: 'fundador.citacao_assinatura', label: 'Assinatura da citação',                type: 'text'  },
  { section: 'Fundador', key: 'fundador.cta_msg',            label: 'Mensagem WhatsApp (fundador)',         type: 'wa'    },
  { section: 'Fundador', key: 'fundador.cta',                label: 'Texto do botão (fundador)',            type: 'text'  },

  // ─── CTA final ─────────────────────────────────────────────────────────────
  { section: 'CTA final', key: 'cta_final.titulo',          label: 'Título do CTA final',                   type: 'rich'  },
  { section: 'CTA final', key: 'cta_final.subtitulo',       label: 'Subtítulo do CTA final',                type: 'text'  },
  { section: 'CTA final', key: 'cta_final.cta_msg',         label: 'Mensagem WhatsApp (CTA final)',         type: 'wa'    },
  { section: 'CTA final', key: 'cta_final.cta',             label: 'Texto do botão principal (CTA final)',  type: 'text'  },
  { section: 'CTA final', key: 'cta_final.instagram_link',  label: 'Link do Instagram',                     type: 'link'  },
  { section: 'CTA final', key: 'cta_final.instagram_label', label: 'Rótulo do botão Instagram',             type: 'text'  },
  { section: 'CTA final', key: 'cta_final.nota',            label: 'Nota de rodapé do CTA (prefixo)',       type: 'text'  },
  { section: 'CTA final', key: 'cta_final.nota_link',       label: 'Link do WhatsApp (nota de rodapé)',     type: 'link'  },
  { section: 'CTA final', key: 'cta_final.nota_tel',        label: 'Número exibido (nota de rodapé)',       type: 'text'  },

  // ─── Rodapé ────────────────────────────────────────────────────────────────
  { section: 'Rodapé', key: 'rodape.bio',       label: 'Descrição da empresa (rodapé)',   type: 'text' },
  { section: 'Rodapé', key: 'rodape.local',     label: 'Localização (rodapé)',            type: 'text' },
  { section: 'Rodapé', key: 'rodape.copyright', label: 'Texto de copyright',             type: 'text' },
  { section: 'Rodapé', key: 'rodape.tagline',   label: 'Tagline (rodapé)',               type: 'text' },

  // ─── Flutuante ─────────────────────────────────────────────────────────────
  { section: 'Flutuante', key: 'float.msg', label: 'Mensagem WhatsApp (botão flutuante)', type: 'wa' },
]

/**
 * Retorna a lista plana de chaves do schema, incluindo 'contato.whatsapp'
 * se houver pelo menos um campo do tipo 'wa' (comportamento determinístico).
 */
export function schemaKeys() {
  const keys = SCHEMA.map(f => f.key)
  if (SCHEMA.some(f => f.type === 'wa')) keys.push('contato.whatsapp')
  return [...new Set(keys)]
}
