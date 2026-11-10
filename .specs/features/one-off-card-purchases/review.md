# Review — one-off-card-purchases

| | |
|---|---|
| **Mode** | Local (`b9d174e..HEAD`) |
| **Scope** | 27 arquivos, 10 commits |
| **Subagents** | 6 of 6 — Security, Requirements, Tests, Architecture, Regression, Performance |
| **Docs loaded** | `one-off-card-purchases/context.md`, `one-off-card-purchases/spec.md`, `one-off-card-purchases/design.md`, `one-off-card-purchases/tasks.md`, `CLAUDE.md`, `AGENTS.md`, `TESTING.md` |
| **Findings** | 9 em 6 arquivos (1 SECURITY, 0 CRITICAL, 0 PERFORMANCE, 2 WARNING, 6 SUGGESTION) |

**Requirements:** 30/30 critérios de aceite ✅, 6/6 edge cases ✅, 10/10 tasks. SPEC_DEVIATION PAY-02 AC3 aprovado e documentado.

---

## SECURITY (1)

- ✅ **Corrigido** (`20261110212326_card_purchases_insert_owner.sql` + teste) — **`supabase/migrations/20261110203215_card_purchases.sql:105` (+ `assert_card_invoice_open` 48-61) — trigger `security definer` roda antes do `WITH CHECK` da RLS.** INSERT com `user_id`/`bank_id` de outro usuário: P0001 com nome do banco (fatura paga) vs 42501 (não paga) → oráculo de status de pagamento + vazamento do nome do banco; `for share` trava banco alheio. Exige 2 UUIDs da vítima. UPDATE/DELETE não afetados. *(Security)*
  Fix: no ramo INSERT (não `service_role`), `if new.user_id is distinct from (select auth.uid()) then raise exception 'Acesso negado.' using errcode = '42501'; end if;` antes de consultas privilegiadas + teste de integração (B insere com `user_id` de A com fatura paga → 42501 sem nome do banco).

## WARNING (2)

- ✅ **Corrigido** — **`supabase/tests/pay-card.int.test.ts:160` — `assert_card_invoice_open` fora do teste "internal security definer helpers are not callable by users".** Revoke correto, mas sem regressão. *(Tests, Regression)*
  Fix: `other.client.rpc("assert_card_invoice_open", { p_user_id, p_bank_id })` → `42501`.
- ✅ **Corrigido** (`shared/utils/select-options.ts`, `shared/helpers/missing-setup.ts`; aplicado em card-items, card-purchases, bills, payments) — **`domains/card-purchases/components/CardPurchaseFormModal.tsx:13-32`, `CardPurchaseList.tsx:15` — `Option`, `toOptions`, `missingSetupFor` copiados de `card-items`.** `{id,name}→{value,label}` repetido em 4 domínios. CLAUDE.md: repetição em 2+ domínios → `shared/`. *(Architecture)*
  Fix: `shared/utils/select-options.ts` (`NamedRecord`, `toSelectOptions`); opcional helper de setup faltante.

## SUGGESTION (6)

- **`domains/card-purchases/services/card-purchases.ts:26-35` — agrupamento/subtotal/`invoicePaid`/ordenação presos na query, sem unit.** TESTING.md: extrair lógica pura. Extrair `buildPurchaseGroups` + teste (2+ bancos com acento, subtotal de vários itens, `invoicePaid`). *(Tests, Architecture)*
- **mesmo arquivo — `Map.groupBy` + sort por banco duplicado de `card-items`.** Candidato a `shared/utils/group-by-bank.ts`. *(Architecture)*
- **`supabase/migrations/20261110203215_card_purchases.sql:13` — FK `(category_id, user_id)` sem índice.** Exclusão de tipo varre avulsos do usuário de todos os meses. `create index … (category_id, user_id)`. *(Performance)*
- **`card_purchases.sql:98-99` — imutabilidade de `user_id` no UPDATE sem teste.** RLS `with check` já cobre; defesa em profundidade. *(Tests)*
- **`app/(app)/avulsos/page.tsx:13-21` — cabeçalho replicado para contornar `PageHeader` (shared importa `domains/` — pré-existente, fora do diff).** Follow-up: `PageHeader.aside` puro; Início compõe `AddPaymentDialog`. *(Architecture, Requirements)*
- **Desvios de implementação só em comentários:** (1) `service_role` grava outro mês; (2) DELETE liberado sem `auth.users` (cascade); (3) cabeçalho fora do `aside`; (4) `next.config.ts` `devIndicators`. Registrar em `design.md`. *(Requirements)*

---

## Files With No Findings

- `supabase/migrations/20261110203554_pay_card_purchases.sql` (lógica anterior 100% preservada), `domains/card-purchases/actions/card-purchases.ts`, `domains/card-purchases/schemas/*`, `domains/payments/*` (CardPaymentForm, PayableList, schemas, build-payable-rows, payables), `shared/components/AppNav.tsx`, `e2e/*`

---

## Highlights

- **Security:** defesa em profundidade (Zod + RLS + FKs compostas + trigger + `for update`/`for share`); `search_path = ''` e revokes nos helpers.
- **Requirements:** 30/30 ACs com evidência; `pay_card` lê avulsos do banco — cliente nem envia.
- **Tests:** Test Plan do design 100% cumprido; trigger com 5 caminhos + controle negativo; nenhum teste enfraquecido.
- **Architecture:** domínio autocontido; `connection()` correto (doc Next 16); page só-view; client boundary baixa.
- **Regression:** zero imports fantasmas; `pay_card` só aditivo; parcelas/pausa/remover intactos.
- **Performance:** índice `(user_id, month, bank_id)` cobre `pay_card`/services; queries em `Promise.all`; Suspense independentes.
