# Review — MVP Contas em Dia

| | |
|---|---|
| **Mode** | Local |
| **Scope** | 164 arquivos (fora `.specs/` e lockfile), 72 commits (`03c4836..HEAD`, branch `main`) |
| **Subagents** | 6 de 6 — Security, Requirements, Tests, Architecture, Regression, Performance |
| **Docs loaded** | `mvp-contas-em-dia/spec.md`, `mvp-contas-em-dia/context.md`, `mvp-contas-em-dia/design.md`, `mvp-contas-em-dia/tasks.md`, `TESTING.md`, `CLAUDE.md`, `AGENTS.md` |
| **Findings** | 0 SECURITY · 0 CRITICAL · 1 PERFORMANCE · 15 WARNING · 22 SUGGESTION |

Requisitos: 73 critérios → 70 ✅, 3 ⚠️, 0 ❌. Edge cases: 6 ✅, 2 ⚠️. Nenhum `SPEC_DEVIATION` no código (desvios documentados no `tasks.md`).

Ignorados como alvo: `shared/components/ui/*` (shadcn), `shared/types/database.ts` (gerado), `package-lock.json`.

---

## SECURITY (0)

Nenhuma vulnerabilidade explorável. Itens de defesa em profundidade estão em WARNING/SUGGESTION.

## CRITICAL (0)

## PERFORMANCE (1)

- **P1** `supabase/migrations/20261109233836_payments.sql:24-25` — `payments` sem índice não parcial em `(user_id, month)`. Os únicos índices são parciais (`where kind = ...`); `getMonthPayables`, `getYearTotals`, `update_salary` e FK de `banks` não filtram por `kind` → seq scan na tabela de todos os usuários, crescendo com a base. **Fix:** `create index payments_user_id_month_idx on public.payments (user_id, month);`

## WARNING (15)

### Correção funcional
- **W1** `supabase/migrations/20261109234400_undo_payment.sql:25-32` — **desfazer ressuscita item removido e sobrescreve edições posteriores.** `pay_card` grava snapshot de todos os itens abertos do banco; `undo_payment` restaura `status`/`remaining_months`/`ended_at` de todos sem condição. Pagar → remover item X em Recorrências → desfazer = X volta ativo (viola CART.6/PAG-03.8). **Fix:** restaurar só itens cujo estado atual ainda é o produzido pelo pagamento; não reabrir itens encerrados após `payments.created_at` que o pagamento não encerrou. Sem teste cobrindo.
- **W2** `domains/profile/services/profile.ts:11-12` — `getProfile` ignora `error` → em falha de rede, usuário já cadastrado é mandado ao onboarding e recebe "Onboarding já concluído." ao enviar. **Fix:** `if (error) throw error;`.
- **W3** `shared/helpers/name-record-actions.ts:14-15`, `domains/bills/services/bills.ts:9-14`, `domains/card-items/services/card-items.ts:9-14` — `data ?? []` engole erro: falha vira "Nenhum … cadastrado" em vez de `error.tsx`. Contradiz o padrão `unwrap` já justificado em `payables.ts:11`. **Fix:** mover `unwrap` para `shared/helpers` e reusar.
- **W4** `shared/hooks/use-record-dialogs.ts:28-44`, `domains/payments/components/CardPaymentForm.tsx:102-109`, `domains/salary/components/UpdateSalaryDialog.tsx:38-44` — falha de rede real (fetch da action rejeita) não tem `try/catch`: erro sobe ao `error.tsx`, modal e dados se perdem. Edge case do spec ("modal permanece aberto com dados preservados") parcial.

### Segurança (defesa em profundidade)
- **W5** `domains/bills/actions/bills.ts:40`, `domains/card-items/actions/card-items.ts:43`, `shared/helpers/name-record-actions.ts:38` — `endBillAction`/`endCardItemAction`/`deleteNameRecord` recebem `id` sem validação Zod (Server Action é endpoint público). RLS protege hoje; destoa de `undoPaymentAction`. **Fix:** `z.uuid().safeParse(id)` antes de `verifySession()`.

### Arquitetura / duplicação
- **W6** `app/(app)/page.tsx:38` — regra "pendente = sem pagamento" (`rows.filter(({ paymentId }) => !paymentId)`) dentro de `app/` (CLAUDE.md: app só view). **Fix:** `pendingOnly(rows)` em `payments/services` ou filtrar dentro do `AddPaymentDialog`.
- **W7** `domains/profile/actions/profile.ts:39-42` — `updateNameAction` reimplementa `mutationResult`. **Fix:** `return mutationResult(error);`.
- **W8** 8 ocorrências do bloco `<p role="alert" className="text-sm text-destructive">` (SignIn/SignUp/Onboarding/ProfileForm, UpdateSalaryDialog, PaymentTotalFooter, FormModal, ConfirmDialog) + derivação `failure` repetida nos 4 forms de auth/profile. **Fix:** `shared/components/FormError.tsx` e reaproveitar a derivação de `useModalFormAction`.
- **W9** `domains/dashboard/components/YearSpendingChart.tsx:8`, `BankSpendingChart.tsx:9` — `MonthTotal`/`BankTotal` redeclarados; `export type MonthTotal` original sem consumidor. **Fix:** importar o type de `payments/services/chart-data` / `ReturnType<typeof toBankTotals>[number]`.

### Testes
- **W10** `supabase/migrations/20261109233836_payments.sql:86`, `20261109234157_pay_card.sql:38` — revoke de `insert_payment`/`card_selection` (definer que recebem `p_user_id`) sem teste: se removido, nenhum teste falha. **Fix:** chamar como `authenticated` e esperar erro.
- **W11** `supabase/tests/pay-card.int.test.ts:110` — sem caso de `card_item_id` de outro banco/usuário/encerrado em `p_items`.
- **W12** `supabase/tests/recurrences.int.test.ts:93` — RLS de escrita cruzada em `bills`/`card_items` (update/`ended_at`) e leitura cruzada de `payment_items` sem teste.
- **W13** `domains/payments/services/build-payable-rows.test.ts:34-36` — caso "pago" usa `amount_cents == total_cents`; não prova que a linha usa o valor pago (edge case "editar após pagar mantém valor pago").
- **W14** `e2e/pay-bill.spec.ts`, `e2e/pay-card.spec.ts` — sem e2e de erro de action no modal (duplicado em 2 abas, falha de rede).
- **W15** `e2e/helpers.ts:14` (padrão em todos os specs) — `user.remove()` no fim do teste não roda em falha; usuários criados pela UI (auth/onboarding/journey) nunca são removidos. **Fix:** fixture `test.extend` com teardown.

## SUGGESTION (22)

### Requisitos / design
- **S1** Excluir tipo/banco bloqueia também por recorrências encerradas e pagamentos históricos (FK `restrict`), com mensagem genérica — spec diz "ativa"/"ativos". Ajustar spec ou mensagem (`action-result.ts:17`).
- **S2** `design.md` desatualizado: §5 (nomes de componentes/services), §7 (mensagens específicas, "lista atualiza" no duplicado), `:608` (`complete_onboarding` invoker), §9 checkboxes abertos, status "Draft". Desvios só no `tasks.md`.
- **S3** `shared/helpers/mutation-result.ts:9` — pagamento duplicado não chama `refresh()`; modal fica com opção já paga.

### Segurança
- **S4** `20261109223013_profiles_salaries.sql:23,31` — policy/grant de insert em `profiles` permite criar perfil sem salário pela API. Dropar como feito em `salaries`.
- **S5** Campos `name` sem limite de tamanho (schemas Zod e checks no banco). `.max(100)` + `check (length(name) <= 100)`.
- **S6** `supabase/config.toml:184` — `minimum_password_length = 6` < 8 da app; `auth.signUp` direto aceita 6. Ajustar local e remoto.

### Performance
- **S7** `domains/payments/services/payables.ts:23` — busca todos os boletos (incl. encerrados, que se acumulam). Filtro seguro: `.or(\`ended_at.is.null,ended_at.gte.${currentMonth()}\`)`.
- **S8** `app/(app)/layout.tsx:10` — `OnboardedGuard` serializa getClaims + query de profile antes dos dados da página (+1 round-trip). Aceitável no MVP.

### Arquitetura / limpeza
- **S9** Label "N meses restantes" duplicado (`PayableList.tsx:19`, `CardItemStatusBadge.tsx:8`) → `shared/utils`.
- **S10** ConfirmDialog "Remover item do cartão?" duplicado (`CardPaymentForm.tsx:145-155`, `CardItemList.tsx:72-82`).
- **S11** `CardItemFormModal.tsx:35-37` — ternário + `&&` aninhados em `missingSetup` → função com early return.
- **S12** `domains/dashboard/services/summary.ts:15` — `paidCents` retornado e nunca lido.
- **S13** `domains/profile/services/profile.ts:9` — `getProfile` exportado sem consumidor externo.
- **S14** `shared/hooks/use-record-dialogs.ts` — `"use client"` sem efeito; `useModalFormAction` em arquivo com nome do outro hook.
- **S15** `domains/payments/actions/payments.ts:39` — validação ad hoc de `paymentId`; mover para `schemas/payment.ts`.
- **S16** `app/onboarding/page.tsx:13-14` duplica wrapper de `app/(auth)/layout.tsx`.
- **S17** `app/layout.tsx:15-18` — metadata ainda "Create Next App".
- **S18** `app/globals.css` — modo escuro automático do template removido; bloco `.dark` do shadcn nunca ativado. Decidir: ativar via `prefers-color-scheme` ou remover.
- **S19** `public/file.svg`, `globe.svg`, `window.svg` — restos do template sem uso.

### Testes
- **S20** `update_salary` "Onboarding não concluído." sem caso; `profiles.int.test.ts:40` asserção fraca (`not.toBeNull`).
- **S21** Testes de integração dependem da ordem (seed em teste anterior); seeds de e2e/integration sem checagem de erro; `previousMonth`/`TestUser`/`openPayment` duplicados entre arquivos de teste.
- **S22** Sem caso de virada de ano em `fillYearMonths`; sem e2e de `error.tsx`, edição de item do cartão e "todos desmarcados → Confirmar desabilitado".

---

## Files With No Findings

Migrations `categories_banks`, `bills_card_items` (exceto S1), `pay_card` (exceto W10/W11); `proxy.ts`, `shared/helpers/{session,session-expiry,action-result,supabase/*}`, `shared/utils/{money,month,form}`, `domains/{auth,banks,categories,bills,card-items,salary}/{actions,schemas}` (exceto W5), `domains/payments/{schemas,services/build-payable-rows,services/chart-data,services/year-totals}`, `domains/dashboard/services/{chart-data,compute-leftover}`, telas de configurações e recorrências, `vitest.config.mts`, `playwright.config.ts`.

---

## Highlights

- **Security:** RLS em todas as tabelas com `(select auth.uid())`; FKs compostas `(id, user_id)` fecham o furo de FK ignorando RLS; funções definer com `search_path = ''`, usuário sempre de `auth.uid()`; nenhum segredo versionado no histórico.
- **Requirements:** integridade financeira toda no banco — escrita de pagamentos/salário só via RPC, valores lidos do cadastro, índices únicos contra duplicidade, mês no fuso de SP nos dois lados.
- **Tests:** integration confere `code` e mensagem exata das RPCs; e2e com seletores acessíveis e verificação do estado final no banco.
- **Architecture:** fronteira entre domínios respeitada (`removeCardItemAction` injetado pela página); lógica pura extraída e testada; pages server finas com Suspense por seção.
- **Regression:** nenhuma API inventada — todas as APIs não óbvias (`refresh`, `connection`, `retry`, `getClaims`, `setAll` com headers, Zod 4) conferidas no `node_modules`.
- **Performance:** `cache()` deduplica `getMonthPayables` (4 consumidores → 1 query); `Promise.all` em todas as leituras múltiplas; recharts só no bundle da Início.

---

## Status das correções

| Grupo | Achados | Commit |
|---|---|---|
| 1. Banco | W1, P1, S4, S5 (banco), W10, W11, W12, S20, S21 (integração) | `008834e` |
| 2. Services/actions | W2, W3, W5, S15, W7, S3, S7, S12, S13 | `7f8b915` |
| 3. Formulários | W4, W8, S14 + e2e de W14 | `b0b13e9` |
| 4. Arquitetura | W6, W9, S9, S10, S11, S16 | `d7ac045` |
| 5. Guarda em paralelo | S8 | `c0ccde6` |
| 6. UI/config | S17, S18, S19, S6 (local), S5 (Zod) | `c4238e3` |
| 7. Testes | W13, W15, S21 (e2e), S22 (exceto `error.tsx`) | `ae49f74` |

Gate após as correções: 163 unit/integration, 45 e2e (+1 skip intencional), build verde.

### Pendências fora do código

- **S6 remoto:** ajustar a senha mínima para 8 no dashboard do Supabase (Authentication › Policies).
- **S22 `error.tsx`:** sem e2e. Exige injetar falha no render do servidor; falha de rede no navegador faz o Next recarregar a página inteira em vez de acionar o boundary.

## Backlog

- **S1** — mensagem de exclusão bloqueada (`shared/helpers/action-result.ts:17`) explicar que recorrências encerradas e pagamentos também bloqueiam; ajustar critérios TIPO.4 e BANCO.4 do `spec.md` ("recorrência ativa"/"itens ativos" → qualquer recorrência ou pagamento).
- **S2** — atualizar `design.md`: §5 (nomes reais: `BillPaymentForm`, `CardPaymentForm`, `PayableList`, `AppNav`, `getCurrentSalary`, `toBankTotals`, `pendingOnly`, `useFormAction`, `callAction`), §6 (`complete_onboarding` security definer; `profiles`/`salaries` sem escrita direta), §7 (mensagens reais; refresh no duplicado), §9 (checkboxes resolvidos), status; registrar `SetupRequired`, `useId`, guarda de onboarding em paralelo.
