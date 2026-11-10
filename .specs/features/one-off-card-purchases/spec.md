# Compras avulsas no cartão Specification

## Problem Statement

A fatura do cartão na Início só considera itens recorrentes e parcelados (`card_items`). Compras à vista no crédito feitas no mês anterior, que vêm na fatura paga no mês atual, não têm onde ser registradas. O resultado: o total da fatura, a sobra do mês e os gráficos ficam abaixo do valor real.

## Proposed Solution

Página **Avulsos** (`/avulsos`) no menu para cadastrar compras avulsas do mês atual: descrição, banco, tipo e valor. Cada avulso entra automaticamente na fatura do banco na Início, soma no total e é pago junto com os recorrentes, travado como as parcelas. A lista começa vazia a cada mês. Avulsos de banco com fatura já paga ficam bloqueados.

Decisões detalhadas: [context.md](./context.md).

## Goals

- [ ] Total da fatura de cada banco na Início = soma dos itens recorrentes/parcelados ativos + avulsos do mês
- [ ] Pagamento registrado da fatura nunca diverge dos itens (avulsos imutáveis após pagamento)
- [ ] Cadastro de um avulso em ≤ 4 campos, a 1 toque do menu

## Out of Scope

| Feature | Reason |
| --- | --- |
| Página de histórico de avulsos por mês | Deferido (context.md) |
| Avulso parcelado | Parcelas são `card_items` com `remaining_months` |
| Avulso fora do cartão (Pix, débito) | Todo avulso pertence a uma fatura de banco |
| Data da compra | Mês atribuído automaticamente |
| Carregar avulsos não pagos para o mês seguinte | Cada mês começa zerado |
| Desmarcar avulso no checklist de pagamento | Avulso é sempre incluído |

---

## User Stories

### P1: Cadastrar e gerenciar avulsos do mês ⭐ MVP

**User Story**: Como usuário, quero registrar as compras à vista no crédito que vieram na fatura deste mês para que o total da fatura fique correto.

**Why P1**: Sem cadastro não há feature.

**Acceptance Criteria**:

1. WHEN o usuário acessa o menu THEN system SHALL exibir o item "Avulsos" (bottom nav e sidebar), entre "Recorrências" e "Configurações", levando a `/avulsos`.
2. WHEN `/avulsos` é renderizado THEN system SHALL exibir o cabeçalho "Avulsos" com o mês atual formatado ao lado.
3. WHEN o usuário abre o formulário de adicionar (Fab) THEN system SHALL pedir Descrição, Banco, Tipo e Valor.
4. WHEN o usuário envia descrição vazia (após trim) ou com mais de 100 caracteres THEN system SHALL exibir erro no campo Descrição e não salvar.
5. WHEN o usuário envia sem banco ou sem tipo THEN system SHALL exibir erro no respectivo campo e não salvar.
6. WHEN o usuário envia valor vazio, zero ou negativo THEN system SHALL exibir erro no campo Valor e não salvar.
7. WHEN o usuário envia dados válidos THEN system SHALL salvar o avulso com o mês atual (`current_month()`, fuso São Paulo), fechar o modal e exibi-lo na lista.
8. WHEN há avulsos no mês atual THEN system SHALL listá-los agrupados por banco (bancos por nome), itens por descrição, cada grupo com subtotal.
9. WHEN não há avulsos no mês atual THEN system SHALL exibir estado vazio.
10. WHEN o usuário edita um avulso (banco com fatura não paga) THEN system SHALL aplicar as mesmas validações e atualizar a lista.
11. WHEN o usuário exclui um avulso (banco com fatura não paga) THEN system SHALL pedir confirmação e removê-lo.
12. WHEN o usuário não tem banco ou tipo cadastrado THEN system SHALL exibir o aviso de configuração necessária existente (`SetupRequired`) em vez do formulário.
13. WHEN avulsos de meses anteriores existem THEN system SHALL não exibi-los em `/avulsos` (permanecem gravados).
14. WHEN o usuário tenta ler ou alterar avulsos de outro usuário THEN system SHALL negar (RLS).

**Independent Test**: Cadastrar "Farmácia / Nubank / Saúde / R$ 45,90" → aparece no grupo Nubank com subtotal R$ 45,90; editar valor; excluir → estado vazio.

---

### P1: Avulsos na fatura da Início ⭐ MVP

**User Story**: Como usuário, quero ver os avulsos dentro da fatura do banco na Início para conferir o valor total a pagar.

**Why P1**: É onde o usuário paga; sem isso o cadastro não tem efeito.

**Acceptance Criteria**:

1. WHEN o banco tem avulsos no mês e fatura não paga THEN system SHALL somar os avulsos ao total da linha da fatura do banco.
2. WHEN o usuário expande a fatura THEN system SHALL listar os avulsos após os itens recorrentes/parcelados (ambos por nome), cada avulso com badge "Avulso".
3. WHEN o banco não tem `card_items` abertos mas tem avulsos no mês THEN system SHALL exibir a linha da fatura do banco com o total dos avulsos.
4. WHEN o banco tem fatura não paga com avulsos THEN system SHALL listá-lo nas opções de cartão do "Adicionar pagamento".
5. WHEN um avulso é criado, editado ou excluído THEN system SHALL refletir o novo total na Início sem recarga manual.

**Independent Test**: Banco sem recorrentes + 1 avulso de R$ 80 → Início mostra "{Banco} R$ 80,00 · Não pago"; expandir mostra o item com badge "Avulso".

---

### P1: Pagar fatura com avulsos ⭐ MVP

**User Story**: Como usuário, quero que os avulsos sejam pagos junto com a fatura, sem poder esquecê-los.

**Why P1**: Fecha o ciclo: total pago = fatura real.

**Acceptance Criteria**:

1. WHEN o checklist de pagamento do cartão é aberto THEN system SHALL exibir os avulsos do banco travados como incluídos (cadeado + badge "Avulso"), sem opção de desmarcar ou pausar.
2. WHEN o usuário confirma o pagamento THEN system SHALL incluir no total todos os avulsos do banco no mês corrente, com valores lidos do banco de dados (não do cliente).
3. WHEN o pagamento é registrado THEN system SHALL manter os avulsos do banco/mês imutáveis enquanto a fatura estiver paga (eles são o registro do que foi pago; `payments.total_cents` guarda o total). _(Revisado no design: sem snapshot separado — ver design.md, Tech Decisions.)_
4. WHEN o banco tem apenas avulsos (nenhum `card_item` aberto) THEN system SHALL permitir pagar a fatura (os avulsos satisfazem "ao menos um item").
5. WHEN a fatura paga é expandida na Início THEN system SHALL listar os avulsos pagos (avulsos do banco no mês) com badge "Avulso".
6. WHEN o usuário desfaz o pagamento THEN system SHALL voltar a fatura para "Não pago" com os avulsos novamente abertos e editáveis.
7. WHEN a fatura com avulsos é paga THEN system SHALL refletir o total (incluindo avulsos) na sobra do mês e nos gráficos (anual e por cartão).

**Independent Test**: Fatura com 1 recorrente R$ 50 + 1 avulso R$ 30 → checklist mostra avulso travado, total R$ 80 → pagar → sobra cai R$ 80 → desfazer → avulso editável de novo.

---

### P1: Bloqueio após fatura paga ⭐ MVP

**User Story**: Como usuário, quero que avulsos de fatura já paga não mudem, para que o pagamento registrado continue correto.

**Why P1**: Integridade do pagamento registrado.

**Acceptance Criteria**:

1. WHEN o banco tem fatura paga no mês corrente THEN system SHALL exibir badge "Fatura paga" no grupo do banco em `/avulsos` e ocultar editar/excluir dos seus avulsos.
2. WHEN o usuário tenta adicionar avulso em banco com fatura paga no mês THEN system SHALL recusar com a mensagem "A fatura do {banco} deste mês já foi paga. Desfaça o pagamento na Início para alterar."
3. WHEN qualquer escrita (inserir, alterar, excluir, mudar banco) atinge avulso de banco com fatura paga no mês — inclusive chamada direta à API — THEN system SHALL recusar no banco de dados.
4. WHEN o usuário edita um avulso mudando para um banco com fatura paga THEN system SHALL recusar com a mesma mensagem.

**Independent Test**: Pagar fatura do Nubank → `/avulsos` mostra "Fatura paga" sem ações → tentar adicionar avulso no Nubank → mensagem de bloqueio; integration test chamando a escrita direto → erro.

---

## Edge Cases

- WHEN a fatura do mês anterior não foi paga e o mês vira THEN system SHALL não exibir os avulsos antigos na Início nem em `/avulsos`.
- WHEN o usuário tenta excluir banco ou tipo usado por avulso THEN system SHALL recusar com a mensagem existente "Este registro está em uso e não pode ser excluído."
- WHEN o pagamento é desfeito THEN system SHALL apenas permitir desfazer pagamento do mês atual (regra existente de `undo_payment`).
- WHEN dois pagamentos da mesma fatura são enviados em paralelo THEN system SHALL manter a regra existente de pagamento único por banco/mês ("Este pagamento já foi registrado.").
- WHEN um avulso é adicionado em outra aba depois de o checklist ter sido aberto THEN system SHALL pagar com os avulsos lidos do banco no momento do pagamento (valores do servidor).
- WHEN o valor tem centavos (ex. "R$ 0,01") THEN system SHALL aceitar e armazenar em centavos inteiros.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AVUL-01 | P1: Cadastro — tabela, RLS, mês automático, FKs compostas | In Tasks | Done |
| AVUL-02 | P1: Cadastro — schema Zod (descrição, banco, tipo, valor) | In Tasks | Done |
| AVUL-03 | P1: Cadastro — página `/avulsos`, item no menu, lista por banco, vazio, SetupRequired | In Tasks | Done |
| AVUL-04 | P1: Cadastro — criar/editar/excluir (actions + modais) | In Tasks | Done |
| HOME-01 | P1: Início — avulsos na fatura, badge, ordem, banco só com avulsos | In Tasks | Implementing |
| HOME-02 | P1: Início — banco só com avulsos no "Adicionar pagamento" | In Tasks | Done |
| PAY-01 | P1: Pagar — checklist com avulsos travados | In Tasks | In Tasks |
| PAY-02 | P1: Pagar — `pay_card` soma avulsos (imutáveis enquanto pago) | In Tasks | Implementing |
| PAY-03 | P1: Pagar — `undo_payment` reabre avulsos | In Tasks | Implementing |
| LOCK-01 | P1: Bloqueio — regra no banco (insert/update/delete) | In Tasks | Done |
| LOCK-02 | P1: Bloqueio — UI "Fatura paga" + mensagem | In Tasks | In Tasks |

**Coverage:** 11 total, 11 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Integration: RLS isola avulsos por usuário; escrita em banco com fatura paga falha; `pay_card` inclui avulsos no total; `undo_payment` reabre
- [ ] Unit: schema Zod; `buildPayableRows` com avulsos (soma, ordem, banco só com avulsos, fatura paga lista itens do snapshot + avulsos do banco)
- [ ] E2E (mobile + desktop): cadastrar → ver na fatura → pagar com avulso travado → bloqueio em `/avulsos` → desfazer → editar/excluir
- [ ] `npm run lint`, typecheck, unit, integration, build e e2e passando
