# Compras avulsas no cartão Tasks

**Design**: `.specs/features/one-off-card-purchases/design.md`
**Testing**: `.specs/codebase/TESTING.md`
**Status**: Approved

Commit por task: Conventional Commits — `<type>(<scope>): <descrição>`.
Node 22.16.0 (`.nvmrc`). Integration e e2e exigem Supabase local (`npx supabase start`).

---

## Execution Plan

`[P]` = paralelo (só tasks com testes unit/none; integration e e2e não são parallel-safe).

### Phase 1: Banco — **Est. tokens**: ~70k
```
T1 → T2
```

### Phase 2: Domínio card-purchases (server) — **Est. tokens**: ~59k
```
T1 ──→ T3 [P] ──→ T4
T1 ──→ T5 [P]
```

### Phase 3: Página /avulsos — **Est. tokens**: ~62k
```
T4, T5 ──→ T6 ──→ T7
```

### Phase 4: Início + pagamento — **Est. tokens**: ~70k
```
T1 ──→ T8 ──→ T9
T2, T6 ──────↗
```

### Phase 5: Bloqueio na UI — **Est. tokens**: ~35k
```
T9 ──→ T10
```

---

## Task Breakdown

### T1: Tabela `card_purchases` + trigger guard

**What**: Migration com tabela, índice, RLS (select/insert/update/delete own), grants e trigger `card_purchases_guard` (mês forçado/imutável, bloqueio mês passado, bloqueio fatura paga com nome do banco, `for share` no banco); regenerar tipos.
**Where**: `supabase/migrations/<ts>_card_purchases.sql`, `shared/types/database.ts` (gerado), `supabase/tests/card-purchases.int.test.ts`
**Depends on**: None
**Reuses**: FKs compostas e policies de `card_items` (`20261109230457_bills_card_items.sql`), `public.current_month()`, `supabase/tests/helpers.ts`, `card-fixtures.ts`
**Requirement**: AVUL-01, LOCK-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `npx supabase db reset` aplica sem erro; `npm run db:types` atualiza `database.ts`
- [x] Insert com `month` explícito grava `current_month()`; update não altera `month`
- [x] Usuário A não lê/edita/exclui avulso de B (RLS)
- [x] Update/delete de avulso de mês passado → "Só é possível alterar avulsos do mês atual."
- [x] Com fatura do banco paga no mês (via `pay_card` com `card_item`): insert, update, delete e mudança para esse banco falham com "A fatura do {banco} deste mês já foi paga. Desfaça o pagamento na Início para alterar."
- [x] Excluir banco/tipo com avulso → erro `23503`
- [x] Gate: `npx vitest run --project integration supabase/tests/card-purchases.int.test.ts` + quick

**Tests**: integration
**Gate**: full (sem build)
**Commit**: `feat(db): add card_purchases table with paid-invoice guard`

---

### T2: `pay_card` soma avulsos

**What**: Migration `create or replace function public.pay_card` — trava banco `for update`, soma/conta avulsos do banco no mês, "Selecione ao menos um item." só se nenhum item incluído e nenhum avulso.
**Where**: `supabase/migrations/<ts>_pay_card_purchases.sql`, `supabase/tests/pay-card.int.test.ts`
**Depends on**: T1
**Reuses**: `pay_card` atual (`20261109234157_pay_card.sql`)
**Requirement**: PAY-02, PAY-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] `total_cents` = recorrentes incluídos + avulsos do banco/mês
- [x] Banco só com avulsos: `pay_card(bank, '[]')` registra pagamento
- [x] Banco sem itens incluídos e sem avulsos → "Selecione ao menos um item."
- [x] Avulsos de outro banco/mês/usuário não entram no total
- [x] Após `undo_payment`, avulso do banco volta a aceitar update/delete
- [x] Testes existentes de `pay-card.int.test.ts` e `undo-payment.int.test.ts` continuam passando
- [x] Gate: `npx vitest run --project integration` + quick

**Tests**: integration
**Gate**: full (sem build)
**Commit**: `feat(db): include card purchases in pay_card total`

---

### T3: Schema Zod de avulso [P]

**What**: `cardPurchaseSchema` e `cardPurchaseUpdateSchema` (descrição trim 1–100, `categoryId`, `bankId`, `amount` via `moneyField`).
**Where**: `domains/card-purchases/schemas/card-purchase.ts`, `domains/card-purchases/schemas/card-purchase.test.ts`
**Depends on**: None
**Reuses**: padrão de `domains/card-items/schemas/card-item.ts`, `shared/utils/money.ts`
**Requirement**: AVUL-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Válido: trim na descrição, valor "R$ 0,01" → 1
- [x] Inválidos: descrição vazia, >100, sem banco, sem tipo, valor 0/vazio (mensagens em pt-BR)
- [x] Update exige `id` uuid
- [x] Gate: quick — ~8 testes novos passando

**Tests**: unit
**Gate**: quick
**Commit**: `feat(card-purchases): add card purchase schema`

---

### T4: Actions de avulso

**What**: `createCardPurchaseAction`, `updateCardPurchaseAction`, `deleteCardPurchaseAction` (`"use server"`).
**Where**: `domains/card-purchases/actions/card-purchases.ts`
**Depends on**: T1, T3
**Reuses**: `domains/card-items/actions/card-items.ts` (estrutura), `fromZodError`, `mutationResult`, `isRecordId`, `verifySession`
**Requirement**: AVUL-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Zod/`isRecordId` antes de `verifySession`; `mutationResult` em todas
- [x] Erro P0001 do trigger chega como mensagem (sem mapeamento novo)
- [x] Gate: quick (lint + tsc + unit)

**Tests**: none (matriz: actions = orquestração fina; coberto por schema unit + integration T1 + e2e T6)
**Gate**: quick
**Commit**: `feat(card-purchases): add create, update and delete actions`

---

### T5: Service de avulsos do mês [P]

**What**: `listMonthPurchasesByBank()` — avulsos de `currentMonth()` com `category`/`bank`, agrupados por banco (bancos e itens por nome) com `subtotalCents`.
**Where**: `domains/card-purchases/services/card-purchases.ts`
**Depends on**: T1
**Reuses**: `listCardItemsByBank` (`Map.groupBy`), `unwrap`, `verifySession`, `createClient`, `currentMonth`
**Requirement**: AVUL-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Tipos exportados `CardPurchase`, `CardPurchaseGroup`
- [x] Gate: quick

**Tests**: none (matriz: query Supabase = integration + e2e)
**Gate**: quick
**Commit**: `feat(card-purchases): add month purchases by bank service`

---

### T6: Página `/avulsos` (CRUD)

**What**: Page + `CardPurchaseList` (grupos, subtotal, `RecordActions`, `EmptyState`, `Fab`, `ConfirmDialog`) + `CardPurchaseFormModal` (4 campos, `SetupRequired`).
**Where**: `app/(app)/avulsos/page.tsx`, `domains/card-purchases/components/CardPurchaseList.tsx`, `domains/card-purchases/components/CardPurchaseFormModal.tsx`, `e2e/card-purchases.spec.ts`
**Depends on**: T4, T5
**Reuses**: `app/(app)/recorrencias/page.tsx`, `CardItemList`, `CardItemFormModal`, `PageHeader`, `formatMonth`, `listBanks`, `listCategories`
**Requirement**: AVUL-03, AVUL-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Cabeçalho "Avulsos" + mês atual
- [x] Criar → aparece no grupo do banco com subtotal; erros de validação no campo
- [x] Editar valor → subtotal atualizado; excluir com confirmação → estado vazio
- [x] Sem banco/tipo → `SetupRequired` no modal
- [x] Gate: quick + `npx playwright test e2e/card-purchases.spec.ts` (mobile + desktop)

**Tests**: e2e
**Gate**: full + e2e do arquivo
**Commit**: `feat(card-purchases): add one-off purchases page`

---

### T7: Item "Avulsos" no menu

**What**: `NAV_ITEMS` += Avulsos (`ShoppingBagIcon`) antes de Configurações; bottom nav `grid-cols-4`.
**Where**: `shared/components/AppNav.tsx`, `e2e/nav.spec.ts`
**Depends on**: T6
**Reuses**: `NAV_ITEMS` existente
**Requirement**: AVUL-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Navegação até `/avulsos` pelo menu do dispositivo (mobile e desktop), `aria-current` correto
- [x] Gate: quick + `npx playwright test e2e/nav.spec.ts`

**Tests**: e2e
**Gate**: quick + e2e do arquivo
**Commit**: `feat(nav): add one-off purchases menu item`

---

### T8: Avulsos em `buildPayableRows`

**What**: `getMonthPayables` busca `card_purchases` do mês; `buildPayableRows` soma avulsos no total não pago, ordena recorrentes → avulsos, gera linha de banco só com avulsos, inclui avulsos na fatura paga; `PayableItem.purchase`.
**Where**: `domains/payments/services/payables.ts`, `domains/payments/services/build-payable-rows.ts`, `domains/payments/services/build-payable-rows.test.ts`
**Depends on**: T1
**Reuses**: `toCardRows`, `byName`
**Requirement**: HOME-01, HOME-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: total = ativos + avulsos; ordem; banco só com avulsos; fatura paga = snapshot + avulsos; avulsos de outro banco não entram; `purchase` false em `card_items`
- [x] `pendingOnly` inclui banco só com avulsos (opção do "Adicionar pagamento")
- [x] Testes existentes continuam passando
- [x] Gate: quick

**Tests**: unit
**Gate**: quick
**Commit**: `feat(payments): include card purchases in month payables`

---

### T9: Avulsos na Início e no checklist

**What**: Badge "Avulso" em `PayableList`; `CardPaymentForm` com avulso travado (cadeado `aria-label="Avulso"` + badge), total inclui avulsos, envia só itens `!purchase`; remover `refine` de `payCardSchema` e ajustar teste.
**Where**: `domains/payments/components/PayableList.tsx`, `domains/payments/components/CardPaymentForm.tsx`, `domains/payments/schemas/payment.ts`, `domains/payments/schemas/payment.test.ts`, `e2e/card-purchases.spec.ts`
**Depends on**: T2, T6, T8
**Reuses**: padrão de parcela travada em `ChecklistItem`
**Requirement**: HOME-01, PAY-01, PAY-02, PAY-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: `payCardSchema` aceita `items: []`
- [x] E2E: avulso aparece na fatura com badge; banco só com avulso mostra linha; checklist com avulso travado e total correto; pagar → sobra reflete; desfazer → "Não pago"
- [x] E2E existentes `pay-card.spec.ts`, `payables.spec.ts`, `dashboard.spec.ts` passando
- [x] Gate: full + `npx playwright test`

**Tests**: unit + e2e
**Gate**: full + e2e completo
**Commit**: `feat(payments): show and pay card purchases in invoice`

---

### T10: "Fatura paga" em `/avulsos`

**What**: Service marca `invoicePaid` por grupo (query paralela em `payments`); `CardPurchaseList` mostra badge "Fatura paga" e oculta editar/excluir.
**Where**: `domains/card-purchases/services/card-purchases.ts`, `domains/card-purchases/components/CardPurchaseList.tsx`, `e2e/card-purchases.spec.ts`
**Depends on**: T9
**Reuses**: `Badge`, `RecordActions`
**Requirement**: LOCK-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] E2E: pagar fatura → `/avulsos` mostra "Fatura paga" sem ações; adicionar avulso no banco pago → mensagem de bloqueio; desfazer → ações voltam
- [ ] Gate: full + `npx playwright test e2e/card-purchases.spec.ts`

**Tests**: e2e
**Gate**: full + e2e do arquivo
**Commit**: `feat(card-purchases): lock purchases of paid invoices`
