# Scroll no modal de adicionar pagamento Specification

## Problem Statement

No modal "Adicionar pagamento", uma fatura com muitos itens deixa o modal mais alto que a tela. Como o `DialogContent` é centralizado sem altura máxima nem overflow, título e rodapé (total + "Confirmar") ficam fora da tela e não há como rolar.

## Proposed Solution

O modal de adicionar pagamento ganha altura máxima de `100dvh - 60px`. Quando atinge esse limite, só a lista de itens do cartão rola; título, selects, legenda e rodapé continuam visíveis.

Decisões: [context.md](./context.md).

## Goals

- [x] Confirmar o pagamento de uma fatura com qualquer quantidade de itens, em qualquer altura de tela

## Out of Scope

| Feature | Reason |
| --- | --- |
| Scroll em outros modais | Deferido (context.md) |

---

## User Stories

### P1: Rolar itens da fatura ⭐ MVP

**User Story**: Como usuário com muitos itens no cartão, quero rolar a lista no modal de pagamento para conferir os itens e confirmar.

**Acceptance Criteria**:

1. WHEN o modal "Adicionar pagamento" é aberto THEN system SHALL limitar sua altura a `100dvh - 60px`.
2. WHEN o conteúdo cabe nesse limite THEN system SHALL exibir o modal na altura do conteúdo, sem barra de rolagem.
3. WHEN o checklist de itens do cartão faz o modal atingir o limite THEN system SHALL rolar apenas a lista de itens.
4. WHEN a lista rola THEN system SHALL manter visíveis o título, os selects "Tipo de pagamento" e "Banco", a legenda "Itens da fatura", o total e o botão "Confirmar".
5. WHEN os demais modais do app são abertos THEN system SHALL manter o comportamento atual.

**Independent Test**: Fatura com 25 itens em viewport 412×700 → modal com altura ≤ 640px, totalmente dentro da tela; lista com `scrollHeight > clientHeight`; "Confirmar" visível e clicável; rolar a lista até o último item e pagar.

---

## Edge Cases

- WHEN o boleto é selecionado (sem lista) THEN system SHALL manter o modal como hoje.
- WHEN a fatura tem poucos itens THEN system SHALL não exibir barra de rolagem.
- WHEN aparece mensagem de erro no rodapé THEN system SHALL mantê-la visível junto do botão.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MSCROLL-01 | P1: altura máxima + só a lista rola + resto visível | Execute | Done |
| MSCROLL-02 | P1: e2e com fatura longa (mobile) | Execute | Done |

**Coverage:** 2 total, 2 Done (quick mode)

---

## Success Criteria

- [x] E2E: fatura com 25 itens em 412×700 → modal dentro da viewport, lista rolável, "Confirmar" clicável sem rolar o modal
- [x] E2E existentes de pagamento passando
