# Scroll no modal de adicionar pagamento — Interview Decisions

**Date:** 2026-11-11
**Scope:** Quando o checklist de itens do cartão no modal "Adicionar pagamento" não cabe na tela, permitir rolar a lista de itens sem perder o restante do modal.
**Source:** informal discussion

---

## Decisions

### Causa (código)

- `shared/components/ui/dialog.tsx` — `DialogContent` é `fixed` centralizado (`top-1/2 -translate-y-1/2`) sem `max-height` nem `overflow` → conteúdo alto vaza para fora da tela, sem scroll.

### Comportamento

- **Só a lista de itens do cartão rola** (checklist do `CardPaymentForm`). Título, select "Tipo de pagamento", select "Banco", legenda "Itens da fatura" e rodapé (total + "Confirmar", erro) permanecem fixos/visíveis.
- **Altura máxima do modal:** `100dvh - 60px` (30px de folga no topo e 30px embaixo).
- Scroll aparece **apenas** quando o modal atinge essa altura máxima; abaixo disso o modal cresce com o conteúdo, sem barra de rolagem.
- Escopo restrito ao modal "Adicionar pagamento" (`AddPaymentDialog` + `CardPaymentForm`); `DialogContent` compartilhado mantém o default para os demais modais (sobrescrita via `className`).
- **Rationale:** escolha do usuário — cabeçalho e rodapé de pagamento sempre visíveis; ajuste localizado.

---

## Agent's Discretion

- Técnica de layout: `DialogContent` do `AddPaymentDialog` como coluna flex com `max-h-[calc(100dvh-60px)]`; `form` com `min-h-0`; `ul` dos itens `min-h-0 overflow-y-auto`.
- Implementação: `fieldset`/`legend` trocados por `div role="group" aria-labelledby` — no Chrome o `fieldset` não aplica `min-height`/`overflow` no layout flex (conteúdo vai para caixa anônima) e a lista não rolava.

---

## Deferred Ideas

- Scroll global para todos os modais (`DialogContent` compartilhado) — outros modais longos continuam sem limite de altura.

---

## Open Questions

- Nenhuma.
