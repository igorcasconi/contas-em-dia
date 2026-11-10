# MVP Contas em Dia Tasks

**Design**: `.specs/features/mvp-contas-em-dia/design.md`
**Testing**: `.specs/codebase/TESTING.md`
**Status**: Done

Commit por task: Conventional Commits — `<type>(<scope>): <descrição>` (ex: `feat(payments): add pay_card rpc`).

---

## Execution Plan

`[P]` = paralelo (só tasks com testes unit/none; integration e e2e não são parallel-safe).

### Phase 1: Setup — **Est. tokens**: ~67k
```
T1 → T2 → T3
```

### Phase 2: Shared base — **Est. tokens**: ~79k
```
T1 ──→ T4 [P]
T1 ──→ T5 [P]
T3 ──→ T6 [P] ──→ T7
```

### Phase 3: Auth A — **Est. tokens**: ~95k ⚠️
```
T3, T6 ──→ T8
T7 ──────→ T9 ──→ T10 ──→ T11
```

### Phase 4: Auth B + Shell — **Est. tokens**: ~95k ⚠️
```
T7, T8 ──→ T12 ──→ T13 ──→ T14 ──→ T15
T10, T11 ─────────↗
```

### Phase 5: Base UI + DB tipos/bancos — **Est. tokens**: ~79k
```
T3 ──→ T16 [P]
T1 ──→ T17 [P] ─┐
T1 ──→ T18 [P] ─┴→ T19
```

### Phase 6: Tipos e Bancos — **Est. tokens**: ~95k ⚠️
```
T16, T7 ──→ T20 [P] ──→ T22 ──→ T23
T16, T7 ──→ T21 [P] ──────────↗
T19, T14 ─────────────→ T22
```

### Phase 7: Recorrências — dados — **Est. tokens**: ~87k ⚠️
```
T16 ──→ T24 ──→ T26 [P]
            └─→ T27 [P]
T4, T1 ──→ T25 [P]
```

### Phase 8: Recorrências — UI — **Est. tokens**: ~85k ⚠️
```
T25, T26, T19, T14 ──→ T28 ──→ T29
T27 ───────────────────────────↗
```

### Phase 9: Pagamentos — DB — **Est. tokens**: ~90k ⚠️
```
T24 ──→ T30 ──→ T31 ──→ T32
```

### Phase 10: Pagamentos — domínio — **Est. tokens**: ~70k
```
T32, T7 ──→ T33 [P]
T30, T5 ──→ T34 [P]
```

### Phase 11: Pagamentos — modal — **Est. tokens**: ~85k ⚠️
```
T33, T34, T25, T17 ──→ T35 ──→ T36
```

### Phase 12: Pagamentos — lista — **Est. tokens**: ~50k
```
T36 ──→ T37
```

### Phase 13: Salário — **Est. tokens**: ~75k
```
T30 ──→ T38 ──→ T39 ──→ T40
T37 ──────────────────↗
```

### Phase 14: Resumo + dados dos gráficos — **Est. tokens**: ~55k
```
T40 ──→ T41 [P]
T34 ──→ T42 [P]
```

### Phase 15: Gráficos + acabamento — **Est. tokens**: ~70k
```
T41, T42 ──→ T43 ──→ T44
```

---

## Task Breakdown

### Phase 1: Setup

#### T1: Instalar dependências e inicializar shadcn/ui

**What**: Instalar `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`; rodar `npx shadcn@latest init` com alias de componentes em `shared/components/ui`; adicionar `button input label dialog select checkbox tabs badge`.
**Where**: `package.json`, `components.json`, `shared/components/ui/*`, `app/globals.css`
**Depends on**: None
**Reuses**: Tailwind 4 já configurado
**Requirement**: NAV-01 (base de UI)
**Tools**: Skill: `search` (shadcn init com Tailwind 4/Next 16)

**Done when**:
- [x] `components.json` aponta `ui` para `@/shared/components/ui`
- [x] Componentes listados existem em `shared/components/ui`
- [x] `app/layout.tsx` com `lang="pt-BR"`
- [x] Gate: `npm run build` passa

**Tests**: none · **Gate**: build

---

#### T2: Configurar Vitest e Playwright

**What**: Vitest com projects `unit` (`**/*.test.ts`, exclui `*.int.test.ts`) e `integration` (`**/*.int.test.ts`); Playwright com `webServer: next dev`; scripts npm `test`, `test:int`, `test:e2e`.
**Where**: `vitest.config.ts`, `playwright.config.ts`, `package.json`, `e2e/`
**Depends on**: T1
**Requirement**: — (infra)

**Done when**:
- [x] `shared/utils/smoke.test.ts` trivial passa e é removido ao final do T4
- [x] `npx playwright test --list` executa sem erro
- [x] Gate quick passa

**Tests**: none (tooling) · **Gate**: quick

---

#### T3: Inicializar Supabase CLI

**What**: `npx supabase init`, link ao projeto remoto, `.env.local` + `.env.example` com `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; script `db:types` (`supabase gen types typescript --local > shared/types/database.ts`); gerar types iniciais.
**Where**: `supabase/config.toml`, `.env.example`, `package.json`, `shared/types/database.ts`
**Depends on**: T2
**Requirement**: — (infra)

**Done when**:
- [x] `npx supabase start` sobe local; `npx supabase status` OK
- [x] Confirmação de email desabilitada em `config.toml` (`enable_confirmations = false`) e no projeto remoto
- [x] `.env.local` no `.gitignore`
- [x] Gate: `npm run build` passa

**Tests**: none · **Gate**: build

---

### Phase 2: Shared base

#### T4: `shared/utils/money.ts` [P]

**What**: `formatBRL(cents)`, `parseBRL(input) → cents | null`.
**Where**: `shared/utils/money.ts`, `shared/utils/money.test.ts`
**Depends on**: T1
**Requirement**: HOME-01, PAG-01

**Done when**:
- [x] Casos: `0`, `12345 → "R$ 123,45"`, negativos, `"1.234,56" → 123456`, entrada inválida → `null`
- [x] Gate quick; 16 tests pass

**Tests**: unit · **Gate**: quick

---

#### T5: `shared/utils/month.ts` [P]

**What**: `currentMonth(now?)` → `YYYY-MM-01` em `America/Sao_Paulo`; `formatMonth(month)` → `Nov/2026`.
**Where**: `shared/utils/month.ts`, `shared/utils/month.test.ts`
**Depends on**: T1
**Requirement**: HOME-02, SAL-01

**Done when**:
- [x] Caso de borda: `2026-12-01T02:00Z` → `2026-11-01` (ainda novembro em SP)
- [x] Gate quick; 6 tests pass

**Tests**: unit · **Gate**: quick

---

#### T6: Clients Supabase [P]

**What**: `server.ts` (`createClient` async com `getAll/setAll`), `client.ts` (`createBrowserClient`), `proxy.ts` (`updateSession` base: `getClaims()` + repasse de cookies).
**Where**: `shared/helpers/supabase/{server,client,proxy}.ts`
**Depends on**: T3
**Reuses**: exemplo oficial `with-supabase`
**Requirement**: AUTH-03
**Tools**: Skill: `search` (assinatura atual de `setAll` em `@supabase/ssr` 0.12)

**Done when**:
- [x] Tipados com `Database` — `client.ts` (browser) não criado: sem uso no MVP (design §8); `env.ts` compartilhado adicionado
- [x] Gate quick passa

**Tests**: none (wrapper de lib) · **Gate**: quick

---

#### T7: DAL de sessão e ActionResult

**What**: `verifySession()` (React `cache` + `server-only`, redirect `/login`); `ActionResult<T>`; `mapDbError(error)` → mensagem PT-BR para `23505`, `23503`, `P0001` (raise das RPCs).
**Where**: `shared/helpers/session.ts`, `shared/helpers/action-result.ts`, `shared/helpers/action-result.test.ts`
**Depends on**: T6
**Requirement**: AUTH-04

**Done when**:
- [x] `mapDbError` cobre os 3 códigos + fallback genérico
- [x] Gate quick; 4 tests pass

**Tests**: unit · **Gate**: quick

---

### Phase 3: Auth A

#### T8: Migration `profiles` + `salaries` + `complete_onboarding`

**What**: Tabelas, RLS (`user_id = auth.uid()`), RPC `complete_onboarding(name, amount_cents)` (security invoker); regenerar types.
**Where**: `supabase/migrations/*_profiles_salaries.sql`, `supabase/tests/profiles.int.test.ts`, `shared/types/database.ts`
**Depends on**: T3, T6
**Requirement**: ONB-01

**Done when**:
- [x] Integration: onboarding cria profile + salary do mês atual; 2ª chamada falha; usuário B não lê dados de A
- [x] Gate full; 4 tests pass

**Tests**: integration · **Gate**: full

---

#### T9: Domínio `auth` — schemas e actions

**What**: `signInSchema`, `signUpSchema` (email, senha ≥ 8, confirmação igual); `signUpAction`, `signInAction`, `signOutAction`; erro de credencial → mensagem genérica.
**Where**: `domains/auth/schemas/*.ts`, `domains/auth/schemas/*.test.ts`, `domains/auth/actions/*.ts`
**Depends on**: T7
**Requirement**: AUTH-01, AUTH-02

**Done when**:
- [x] Unit dos schemas: válidos, email inválido, senha curta, confirmação divergente
- [x] Gate quick; 6 tests pass (+1 `fromZodError`)

**Tests**: unit · **Gate**: quick

---

#### T10: Telas de login e cadastro

**What**: `SignInForm`, `SignUpForm` (client, `useActionState`); `app/(auth)/login/page.tsx`, `app/(auth)/cadastro/page.tsx` (wireframes 1.1, 1.2).
**Where**: `domains/auth/components/*`, `app/(auth)/**`, `e2e/auth.spec.ts`
**Depends on**: T1, T9
**Requirement**: AUTH-01, AUTH-02

**Done when**:
- [x] e2e: cadastro novo sai de `/cadastro`; email duplicado mostra erro; login com senha errada mostra "Email ou senha inválidos"
- [x] Gate e2e; 6 tests pass (mobile + desktop)

**Tests**: e2e · **Gate**: e2e

---

#### T11: `proxy.ts` — refresh, limite 30 dias, redirects

**What**: Root `proxy.ts` chamando `updateSession`; `isSessionExpired(startedAt, now)` (30 dias); origem de `startedAt`: claim `amr[].timestamp`, fallback cookie httpOnly `session_started_at` (setado no `signInAction`/`signUpAction`, ausente = expirado); sem sessão em rota protegida → `/login`; logado em `/login|/cadastro` → `/`.
**Where**: `proxy.ts`, `shared/helpers/supabase/proxy.ts`, `shared/helpers/session-expiry.ts`, `shared/helpers/session-expiry.test.ts`, `e2e/auth.spec.ts`
**Depends on**: T10
**Requirement**: AUTH-03, AUTH-04
**Tools**: MCP: claude-in-chrome (inspecionar claims/cookies)

**Done when**:
- [x] Verificado se `amr[].timestamp` existe; confirmado: timestamp estável entre refreshes (só `iat` muda) → sem fallback por cookie
- [x] Unit: 29d23h → válido; 30d+1s → expirado; ausente → expirado
- [x] e2e: anônimo em `/` → `/login`
- [x] Gate quick + e2e

**Tests**: unit + e2e · **Gate**: e2e

---

### Phase 4: Auth B + Shell

#### T12: Domínio `profile` — schema, action, service

**What**: `onboardingSchema` (nome não vazio, salário > 0 via `parseBRL`); `completeOnboardingAction` → `rpc('complete_onboarding')`; `getProfile(userId)`; `requireOnboarded()` em `shared/helpers/session.ts`.
**Where**: `domains/profile/{schemas,actions,services}/*`, `shared/helpers/session.ts`
**Depends on**: T7, T8
**Requirement**: ONB-01

**Done when**:
- [x] Unit do schema (vazio, 0, negativo, válido) + `moneyField` compartilhado (6); `requireOnboarded` em `domains/profile/services` (shared não importa domains)
- [x] Gate quick; 9 tests pass

**Tests**: unit · **Gate**: quick

---

#### T13: Tela de onboarding

**What**: `OnboardingForm` + `app/onboarding/page.tsx` (wireframe 1.3); onboarded em `/onboarding` → `/`; cadastro redireciona para `/onboarding`.
**Where**: `domains/profile/components/OnboardingForm.tsx`, `app/onboarding/page.tsx`, `e2e/onboarding.spec.ts`
**Depends on**: T10, T11, T12
**Requirement**: ONB-01, AUTH-01

**Done when**:
- [x] e2e: cadastro → `/onboarding` → envia → `/` (login sem onboarding coberto no e2e da T14)
- [x] Gate e2e; 2 tests pass

**Tests**: e2e · **Gate**: e2e

---

#### T14: AppShell, layout protegido, Configurações

**What**: `AppShell`, `BottomNav` (< 1024px), `Sidebar` (≥ 1024px); `app/(app)/layout.tsx` com `requireOnboarded()` em `<Suspense>`; placeholder `app/(app)/page.tsx` ("Olá, {nome}"); `app/(app)/configuracoes/page.tsx` (wireframe 1.11).
**Where**: `shared/components/{AppShell,BottomNav,Sidebar}.tsx`, `app/(app)/**`, `e2e/nav.spec.ts`
**Depends on**: T13
**Requirement**: NAV-01, AUTH-04

**Done when**:
- [x] e2e em 375px e 1280px: 3 entradas navegam; auth/onboarding sem nav; login sem onboarding → `/onboarding` sem nav
- [x] Gate e2e; 4 tests pass

**Tests**: e2e · **Gate**: e2e

---

#### T15: Perfil + logout

**What**: `profileSchema`, `updateNameAction`, `ProfileForm`, `SignOutButton`; `app/(app)/configuracoes/perfil/page.tsx`.
**Where**: `domains/profile/**`, `app/(app)/configuracoes/perfil/page.tsx`, `e2e/profile.spec.ts`
**Depends on**: T14
**Requirement**: AUTH-04, NAV-01

**Done when**:
- [x] Unit do `profileSchema` — `SignOutButton` em `domains/auth/components`
- [x] e2e: alterar nome reflete no header; Sair → `/login` e `/` redireciona
- [x] Gate quick + e2e

**Tests**: unit + e2e · **Gate**: e2e

---

### Phase 5: Base UI + DB tipos/bancos

#### T16: Migration `categories` + `banks` [P]

**What**: Tabelas, RLS, índices únicos `(user_id, lower(name))`; regenerar types.
**Where**: `supabase/migrations/*_categories_banks.sql`, `supabase/tests/categories-banks.int.test.ts`
**Depends on**: T3
**Requirement**: TIPO-01, BANCO-01

**Done when**:
- [x] Integration: duplicado case-insensitive falha (23505); RLS isola usuários
- [x] Gate full; 8 tests pass (4 × 2 tabelas)

**Tests**: integration · **Gate**: full

---

#### T17: `FormModal` + `ConfirmDialog` [P]

**What**: Wrappers de Dialog: `FormModal` (título, form, Cancelar/Salvar, pending, erro geral); `ConfirmDialog` (título, descrição, ação destrutiva/primária).
**Where**: `shared/components/FormModal.tsx`, `shared/components/ConfirmDialog.tsx`
**Depends on**: T1
**Requirement**: BOL-02, UNDO-01, SAL-01

**Done when**:
- [x] Gate quick passa — `ConfirmDialog` sobre shadcn `alert-dialog`

**Tests**: none (shared UI) · **Gate**: quick

---

#### T18: `EmptyState` + `Fab` [P]

**What**: `EmptyState` (texto + CTA opcional), `Fab` (botão "+" fixo acima da bottom nav).
**Where**: `shared/components/EmptyState.tsx`, `shared/components/Fab.tsx`
**Depends on**: T1
**Requirement**: HOME-02

**Done when**:
- [x] Gate quick passa

**Tests**: none (shared UI) · **Gate**: quick

---

#### T19: `SimpleNameCrud`

**What**: Lista de itens com nome + menu editar/excluir + `Fab` + `FormModal` de nome; recebe `items` e actions `create/update/delete` via props.
**Where**: `shared/components/SimpleNameCrud.tsx`
**Depends on**: T17, T18
**Requirement**: TIPO-01, BANCO-01

**Done when**:
- [x] Gate quick passa — editar/excluir como botões de ícone (no lugar do menu ⋮)

**Tests**: none (shared UI) · **Gate**: quick

---

### Phase 6: Tipos e Bancos

#### T20: Domínio `categories` [P]

**What**: `categorySchema`; `listCategories`; `create/update/deleteCategoryAction` (erros via `mapDbError`).
**Where**: `domains/categories/{schemas,services,actions}/*`
**Depends on**: T16, T7
**Requirement**: TIPO-01

**Done when**:
- [x] Unit do schema (vazio, espaços, válido) — schema e CRUD compartilhados em `shared/helpers/name-record*` (categories e banks idênticos); domínio expõe actions/services finos
- [x] Gate quick; 4 tests pass

**Tests**: unit · **Gate**: quick

---

#### T21: Domínio `banks` [P]

**What**: Igual a T20 para bancos.
**Where**: `domains/banks/{schemas,services,actions}/*`
**Depends on**: T16, T7
**Requirement**: BANCO-01

**Done when**:
- [x] Unit do schema — reutiliza `name-record` (sem schema próprio)
- [x] Gate quick; sem novos testes

**Tests**: unit · **Gate**: quick

---

#### T22: Tela Tipos

**What**: `app/(app)/configuracoes/tipos/page.tsx` compondo `SimpleNameCrud` + actions de categories.
**Where**: `app/(app)/configuracoes/tipos/page.tsx`, `e2e/categories.spec.ts`
**Depends on**: T19, T20, T14
**Requirement**: TIPO-01

**Done when**:
- [x] e2e: criar, editar, duplicado mostra erro, estado vazio, excluir
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

#### T23: Tela Bancos

**What**: `app/(app)/configuracoes/bancos/page.tsx` compondo `SimpleNameCrud` + actions de banks.
**Where**: `app/(app)/configuracoes/bancos/page.tsx`, `e2e/banks.spec.ts`
**Depends on**: T21, T22
**Requirement**: BANCO-01

**Done when**:
- [x] e2e: criar, editar, duplicado mostra erro
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

### Phase 7: Recorrências — dados

#### T24: Migration `bills` + `card_items`

**What**: Tabelas conforme design §6 (checks fixo/variável, parcelado não pausa, `ended_at`), FKs `restrict`, RLS; regenerar types.
**Where**: `supabase/migrations/*_bills_card_items.sql`, `supabase/tests/recurrences.int.test.ts`
**Depends on**: T16
**Requirement**: BOL-01, CART-01, TIPO-01, BANCO-01

**Done when**:
- [x] Integration: fixo sem valor falha; variável com valor falha; parcelado pausado falha; excluir tipo/banco em uso → 23503; RLS; FKs compostas (id, user_id) impedem referenciar tipo/banco de outro usuário
- [x] Gate full; 8 tests pass

**Tests**: integration · **Gate**: full

---

#### T25: `MoneyInput` + `MoneyText` [P]

**What**: Input com máscara BRL que expõe centavos (hidden input p/ form); texto formatado com variante negativa.
**Where**: `shared/components/MoneyInput.tsx`, `shared/components/MoneyText.tsx`
**Depends on**: T4, T1
**Requirement**: PAG-01, HOME-01

**Done when**:
- [x] Gate quick passa — `MoneyField` + `FieldShell` (casca comum com `FormField`); onboarding passou a usar `MoneyField`

**Tests**: none (shared UI) · **Gate**: quick

---

#### T26: Domínio `bills` [P]

**What**: `billSchema` (discriminated union `valueMode`); `listActiveBills`; `createBillAction`, `updateBillAction`, `endBillAction`.
**Where**: `domains/bills/{schemas,services,actions}/*`
**Depends on**: T24, T7
**Requirement**: BOL-01, BOL-02

**Done when**:
- [x] Unit: fixo sem valor inválido; variável ignora valor; tipo obrigatório
- [x] Gate quick; 6 tests pass

**Tests**: unit · **Gate**: quick

---

#### T27: Domínio `card-items` [P]

**What**: `cardItemSchema` (`alwaysRecurring` | `remainingMonths ≥ 1`); `listCardItemsByBank`; `create/update/endCardItemAction`.
**Where**: `domains/card-items/{schemas,services,actions}/*`
**Depends on**: T24, T7
**Requirement**: CART-01, CART-02

**Done when**:
- [x] Unit: parcelado sem meses inválido; 0 meses inválido; recorrente ignora meses
- [x] Gate quick; 8 tests pass

**Tests**: unit · **Gate**: quick

---

### Phase 8: Recorrências — UI

#### T28: Recorrências — aba Boletos

**What**: `BillList`, `BillFormModal` (cria/edita; aviso sem tipo); `app/(app)/recorrencias/page.tsx` com `Tabs` (`?aba=`) e aba Boletos (wireframes 1.9, 1.10).
**Where**: `domains/bills/components/*`, `app/(app)/recorrencias/page.tsx`, `e2e/bills.spec.ts`
**Depends on**: T25, T26, T19, T14
**Requirement**: BOL-01, BOL-02

**Done when**:
- [x] e2e: criar fixo e variável (campo some), editar, remover com confirmação, aviso sem tipo — hooks `useRecordDialogs`/`useModalFormAction`, `RecordActions`, `SelectField`, `UrlTabs`, `SetupRequired` compartilhados
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

#### T29: Recorrências — aba Cartão

**What**: `CardItemList` (agrupado por banco), `CardItemFormModal`, `CardItemStatusBadge`; aba Cartão na página.
**Where**: `domains/card-items/components/*`, `app/(app)/recorrencias/page.tsx`, `e2e/card-items.spec.ts`
**Depends on**: T27, T28
**Requirement**: CART-01, CART-02

**Done when**:
- [x] e2e: criar recorrente e parcelado (campo meses condicional), badges corretos, remover, aviso sem banco, link direto `?aba=cartao`, erro preserva dados digitados
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

### Phase 9: Pagamentos — DB

#### T30: Migration `payments` + `payment_items` + `pay_bill`

**What**: Tabelas, uniques parciais, RLS, função `current_month()` (SP), RPC `pay_bill(bill_id, amount_cents)`.
**Where**: `supabase/migrations/*_payments.sql`, `supabase/tests/pay-bill.int.test.ts`
**Depends on**: T24
**Requirement**: PAG-01

**Done when**:
- [x] Integration: fixo usa valor do cadastro (ignora input); variável exige > 0; 2º pagamento no mês falha; RLS; escrita direta em `payments` bloqueada (42501); boleto encerrado não pode ser pago
- [x] Gate full; 6 tests pass

**Tests**: integration · **Gate**: full

---

#### T31: RPC `pay_card`

**What**: `pay_card(bank_id, items jsonb)` — valores lidos do banco, parcelados forçados `included`, ≥ 1 incluído, snapshot `prev_*`, pausa/reativa, decrementa, `ended_at` em 0.
**Where**: `supabase/migrations/*_pay_card.sql`, `supabase/tests/pay-card.int.test.ts`
**Depends on**: T30
**Requirement**: PAG-02, PAG-03, PAG-04

**Done when**:
- [x] Integration: exemplo do spec (30+50+100/3m, desmarca 30 → total 150, parcelado 2m); pausar; reativar pausado; parcelado 1m → encerra; tentar excluir parcelado ignorado; 2º pagamento falha; nenhum incluído falha
- [x] Gate full; 8 tests pass

**Tests**: integration · **Gate**: full

---

#### T32: RPC `undo_payment`

**What**: `undo_payment(payment_id)` — só mês atual; restaura `prev_status`, `prev_remaining_months`, `prev_ended_at`; apaga payment.
**Where**: `supabase/migrations/*_undo_payment.sql`, `supabase/tests/undo-payment.int.test.ts`
**Depends on**: T31
**Requirement**: UNDO-01

**Done when**:
- [x] Integration: desfazer boleto; desfazer cartão restaura parcelas e reabre encerrado; restaura pausado; mês anterior falha; pagamento de outro usuário
- [x] Gate full; 6 tests pass

**Tests**: integration · **Gate**: full

---

### Phase 10: Pagamentos — domínio

#### T33: Payments — schemas e actions [P]

**What**: `payBillSchema`, `payCardSchema`; `payBillAction`, `payCardAction`, `undoPaymentAction` (rpc + `mapDbError` + `refresh()`).
**Where**: `domains/payments/{schemas,actions}/*`
**Depends on**: T32, T7
**Requirement**: PAG-01, PAG-02, UNDO-01

**Done when**:
- [x] Unit dos schemas (ids uuid, itens não vazios, amount opcional); ao menos um item incluído
- [x] Gate quick; 6 tests pass

**Tests**: unit · **Gate**: quick

---

#### T34: Payments — services

**What**: `buildPayableRows(bills, cardItems, payments)` (puro: regras de exibição + ordenação não-pagos → valor desc); `getMonthPayables`, `getPendingBills`, `getPendingBanks`, `getPaidTotal`.
**Where**: `domains/payments/services/*`, `domains/payments/services/build-payable-rows.test.ts`
**Depends on**: T30, T5
**Requirement**: HOME-02, PAG-01, PAG-02

**Done when**:
- [x] Unit: ordenação; banco pago usa total/itens do pagamento; boleto encerrado pago no mês aparece; variável não pago sem valor; banco só com pausados aparece — `getPendingBills`/`getPendingBanks`/`getPaidTotal` substituídos por filtro das linhas + `sumPaid` puro (uma única query `getMonthPayables`, com `cache()`)
- [x] Gate quick; 6 tests pass

**Tests**: unit · **Gate**: quick

---

### Phase 11: Pagamentos — modal

#### T35: Modal de pagamento — boleto

**What**: `AddPaymentDialog` (select Boleto/Cartão), `BillPaymentFields`, `PaymentTotalFooter`; botão "+ Adicionar pagamento" na Início (wireframe 1.5).
**Where**: `domains/payments/components/*`, `app/(app)/page.tsx`, `e2e/pay-bill.spec.ts`
**Depends on**: T33, T34, T25, T17
**Requirement**: PAG-01

**Done when**:
- [x] e2e: fixo sem campo e total em texto; variável total acompanha digitação; após pagar, boleto some do select; sem pendentes → "Nenhum boleto pendente neste mês."
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

#### T36: Modal de pagamento — cartão

**What**: `CardPaymentChecklist` (marcado padrão, parcelado travado, pausado desmarcado com badge, ⏸ pausar, 🗑 remover via `ConfirmDialog` + `endCardItemAction` passado por `app/`), total dos marcados, confirmar desabilitado com 0 itens (wireframe 1.6).
**Where**: `domains/payments/components/CardPaymentChecklist.tsx`, `app/(app)/page.tsx`, `e2e/pay-card.spec.ts`
**Depends on**: T35
**Requirement**: PAG-02, PAG-03, PAG-04

**Done when**:
- [x] e2e: total atualiza ao desmarcar; parcelado não desmarca; pausado (seed) vem desmarcado com badge; pausar marca "Será pausado" e persiste `paused`; marcar pausado reativa; remover some
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop) — estado final validado no banco

*Simulação de mês: seed direto no banco local.

**Tests**: e2e · **Gate**: e2e

---

### Phase 12: Pagamentos — lista

#### T37: Lista do mês + desfazer

**What**: `MonthPayablesList` (server, em `<Suspense>`), `PayableRow` (client: expandir banco, ↶ desfazer com `ConfirmDialog`); estado vazio com CTA; compor na Início (wireframe 1.4, 1.8).
**Where**: `domains/payments/components/{MonthPayablesList,PayableRow}.tsx`, `app/(app)/page.tsx`, `e2e/payables.spec.ts`
**Depends on**: T36
**Requirement**: HOME-02, UNDO-01

**Done when**:
- [x] e2e: não-pagos primeiro; linha paga vai para o fim; expandir banco; desfazer volta a "Não pago"; estado vazio; confirmação mostra nome e valor
- [x] Gate e2e; 4 tests pass (2 fluxos × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

### Phase 13: Salário

#### T38: RPC `update_salary`

**What**: `update_salary(amount_cents)` — falha se existe payment no mês atual; upsert em `salaries` do mês atual.
**Where**: `supabase/migrations/*_update_salary.sql`, `supabase/tests/update-salary.int.test.ts`
**Depends on**: T30
**Requirement**: SAL-01

**Done when**:
- [x] Integration: sem pagamento atualiza; com pagamento falha; meses anteriores preservados; escrita direta em `salaries` bloqueada (policies removidas; `complete_onboarding` recriada como security definer)
- [x] Gate full; 4 tests pass

**Tests**: integration · **Gate**: full

---

#### T39: Domínio `salary`

**What**: `salarySchema`; `getSalaryForMonth(userId, month)`; `updateSalaryAction`.
**Where**: `domains/salary/{schemas,services,actions}/*`
**Depends on**: T38, T7
**Requirement**: SAL-01, HOME-01

**Done when**:
- [x] Unit do schema — `getSalaryForMonth(month)` virou `getCurrentSalary()` (mês calculado após validar sessão, exigência do prerender); `hasAnyPayment` em payments
- [x] Gate quick; 4 tests pass (+1 `hasAnyPayment`)

**Tests**: unit · **Gate**: quick

---

#### T40: `SalaryCard` + `UpdateSalaryDialog`

**What**: Card com valor + ✏; dialog 2 passos (valor → aviso de/para); ✏ desabilitado com texto quando há pagamento no mês; compor na Início (wireframe 1.7).
**Where**: `domains/salary/components/*`, `app/(app)/page.tsx`, `e2e/salary.spec.ts`
**Depends on**: T39, T37
**Requirement**: SAL-01, HOME-01

**Done when**:
- [x] e2e: alterar sem pagamento; voltar preserva valor; fechar no aviso mantém; após pagar ✏ desabilita; após desfazer reabilita
- [x] Gate e2e; 2 tests pass (1 fluxo × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

### Phase 14: Resumo + dados dos gráficos

#### T41: Dashboard — sobra [P]

**What**: `computeLeftover(salaryCents, paidCents)` puro; `getMonthSummary`; `LeftoverCard` (negativo em vermelho) compondo na Início.
**Where**: `domains/dashboard/{services,components}/*`, `domains/dashboard/services/compute-leftover.test.ts`, `app/(app)/page.tsx`
**Depends on**: T40
**Requirement**: HOME-01

**Done when**:
- [x] Unit: positivo, zero, negativo — `getMonthSummary` também expõe `hasPayments` (Início não chama mais `hasAnyPayment` direto)
- [x] Gate quick; 3 tests pass

**Tests**: unit · **Gate**: quick

---

#### T42: Dados dos gráficos [P]

**What**: `fillYearMonths(rows, year)` puro (12 meses, futuros `null`); `getYearTotals`, `getBankTotals` em `domains/payments/services`.
**Where**: `domains/payments/services/*`, `domains/payments/services/fill-year-months.test.ts`
**Depends on**: T34
**Requirement**: GRAF-01, GRAF-02

**Done when**:
- [x] Unit: ano sem dados; meses intercalados; meses futuros `null`; `getBankTotals` substituído por `toBankTotals(rows)` puro (reusa `getMonthPayables`); `formatMonthShort` em shared
- [x] Gate quick; 4 tests pass (+1 `formatMonthShort`)

**Tests**: unit · **Gate**: quick

---

### Phase 15: Gráficos + acabamento

#### T43: Gráficos na Início

**What**: `npx shadcn@latest add chart`; `YearSpendingChart` (barras verticais), `BankSpendingChart` (barras horizontais, estado vazio); compor na Início; grid desktop (wireframe 1.12).
**Where**: `domains/dashboard/components/*`, `shared/components/ui/chart.tsx`, `app/(app)/page.tsx`, `e2e/dashboard.spec.ts`
**Depends on**: T41, T42
**Requirement**: GRAF-01, GRAF-02, HOME-01
**Tools**: MCP: claude-in-chrome (checagem visual 375/1280)

**Done when**:
- [x] e2e: após pagar boleto 100 + banco 200, sobra = salário − 300; gráficos renderizam; estado vazio de cartões; sobra negativa em destaque; barras conferidas por screenshot 375/1280 (Playwright no lugar do Chrome MCP)
- [x] Gate e2e; 4 tests pass (2 fluxos × mobile/desktop)

**Tests**: e2e · **Gate**: e2e

---

#### T44: Erros, loading e regressão final

**What**: `app/(app)/error.tsx`, `loading.tsx`/fallbacks de `<Suspense>`; e2e de jornada completa (cadastro → onboarding → tipos/bancos → recorrências → pagar → desfazer → salário).
**Where**: `app/(app)/error.tsx`, `app/(app)/loading.tsx`, `e2e/journey.spec.ts`
**Depends on**: T43
**Requirement**: todas (regressão)

**Done when**:
- [x] e2e jornada passa em 375px — `loading.tsx` dispensado (Suspense por página); jornada expôs 2 bugs corrigidos: modal aberto ao navegar pelo aviso de cadastro e ids de campo duplicados entre rotas preservadas
- [x] Gate full + e2e (suite completa) — 135 unit/integration + 39 e2e (+1 skip: jornada só no mobile) + build

**Tests**: e2e · **Gate**: full + e2e

---

## Validation

### Check 1: Granularidade

| Task | Escopo | Status |
| --- | --- | --- |
| T1, T2, T3 | setup de 1 ferramenta cada | ✅ |
| T4, T5, T7 | 1–2 funções coesas | ✅ |
| T6 | 3 wrappers do mesmo client | ⚠️ coeso (mesma pasta, mesmo propósito) |
| T8, T16, T24, T30–32, T38 | 1 migration | ✅ |
| T9, T12, T20, T21, T26, T27, T33, T39 | schema + actions + service de 1 domínio | ⚠️ coeso — fatia de lógica de 1 domínio, sem UI |
| T10, T13, T15, T22, T23, T28, T29 | 1 tela + seus componentes | ⚠️ coeso — fatia de UI |
| T11 | proxy + 1 função pura | ✅ |
| T14 | shell de navegação | ⚠️ 3 componentes de nav + layout |
| T17, T18, T25 | 2 componentes pequenos relacionados | ⚠️ OK |
| T19, T35, T36, T37, T40, T41, T42, T43 | 1 componente/feature | ✅ |
| T34 | 1 builder puro + queries | ✅ |
| T44 | acabamento | ✅ |

Nenhum ❌. ⚠️ aceitos: dividir mais geraria tasks sem teste próprio (violaria Check 3).

### Check 2: Diagrama × Depends on

| Task | Depends on | Diagrama | Status |
| --- | --- | --- | --- |
| T1 | — | — | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T1 | T1→T4 | ✅ |
| T5 | T1 | T1→T5 | ✅ |
| T6 | T3 | T3→T6 | ✅ |
| T7 | T6 | T6→T7 | ✅ |
| T8 | T3, T6 | T3,T6→T8 | ✅ |
| T9 | T7 | T7→T9 | ✅ |
| T10 | T1, T9 | T9→T10 (T1 fase anterior) | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12 | T7, T8 | T7,T8→T12 | ✅ |
| T13 | T10, T11, T12 | T12→T13, T10,T11↗T13 | ✅ |
| T14 | T13 | T13→T14 | ✅ |
| T15 | T14 | T14→T15 | ✅ |
| T16 | T3 | T3→T16 | ✅ |
| T17 | T1 | T1→T17 | ✅ |
| T18 | T1 | T1→T18 | ✅ |
| T19 | T17, T18 | T17,T18→T19 | ✅ |
| T20 | T16, T7 | T16,T7→T20 | ✅ |
| T21 | T16, T7 | T16,T7→T21 | ✅ |
| T22 | T19, T20, T14 | T20→T22, T19,T14→T22 | ✅ |
| T23 | T21, T22 | T22→T23, T21↗T23 | ✅ |
| T24 | T16 | T16→T24 | ✅ |
| T25 | T4, T1 | T4,T1→T25 | ✅ |
| T26 | T24, T7 | T24→T26 (T7 fase anterior) | ✅ |
| T27 | T24, T7 | T24→T27 (T7 fase anterior) | ✅ |
| T28 | T25, T26, T19, T14 | T25,T26,T19,T14→T28 | ✅ |
| T29 | T27, T28 | T28→T29, T27↗T29 | ✅ |
| T30 | T24 | T24→T30 | ✅ |
| T31 | T30 | T30→T31 | ✅ |
| T32 | T31 | T31→T32 | ✅ |
| T33 | T32, T7 | T32,T7→T33 | ✅ |
| T34 | T30, T5 | T30,T5→T34 | ✅ |
| T35 | T33, T34, T25, T17 | T33,T34,T25,T17→T35 | ✅ |
| T36 | T35 | T35→T36 | ✅ |
| T37 | T36 | T36→T37 | ✅ |
| T38 | T30 | T30→T38 | ✅ |
| T39 | T38, T7 | T38→T39 (T7 fase anterior) | ✅ |
| T40 | T39, T37 | T39→T40, T37↗T40 | ✅ |
| T41 | T40 | T40→T41 | ✅ |
| T42 | T34 | T34→T42 | ✅ |
| T43 | T41, T42 | T41,T42→T43 | ✅ |
| T44 | T43 | T43→T44 | ✅ |

Pares `[P]` sem dependência mútua: T4/T5/T6, T16/T17/T18, T20/T21, T25/T26/T27, T33/T34, T41/T42 ✅. Cada grupo `[P]` tem no máximo 1 task integration/e2e (T16) ✅.

### Check 3: Testes co-localizados

| Task | Camada | Matriz exige | Task diz | Status |
| --- | --- | --- | --- | --- |
| T1, T3 | config | none | none | ✅ |
| T2 | tooling | none | none | ✅ |
| T4, T5 | shared/utils | unit | unit | ✅ |
| T6 | helpers/supabase (wrapper) | none | none | ✅ |
| T7 | helpers puros | unit | unit | ✅ |
| T8, T16, T24, T30, T31, T32, T38 | migrations | integration | integration | ✅ |
| T9, T12, T20, T21, T26, T27, T33, T39 | schemas (+actions/services queries: none) | unit | unit | ✅ |
| T10, T13, T14, T22, T23, T28, T29, T35, T36, T37, T40, T43, T44 | telas | e2e | e2e | ✅ |
| T11 | helper puro + tela (redirect) | unit + e2e | unit + e2e | ✅ |
| T15 | schema + tela | unit + e2e | unit + e2e | ✅ |
| T17, T18, T19, T25 | shared/components | none | none | ✅ |
| T34, T41, T42 | services lógica pura | unit | unit | ✅ |

### Check 4: Orçamento de tokens

| Phase | Tasks | Estimativa | Status |
| --- | --- | --- | --- |
| 1 | 12+20+20 | 67k | ✅ |
| 2 | 12+12+20+20 | 79k | ✅ |
| 3 | 20×4 | 95k | ⚠️ |
| 4 | 20×4 | 95k | ⚠️ |
| 5 | 20+12+12+20 | 79k | ✅ |
| 6 | 20×4 | 95k | ⚠️ |
| 7 | 20+12+20+20 | 87k | ⚠️ |
| 8 | 35+35 | 85k | ⚠️ |
| 9 | 20+35+20 | 90k | ⚠️ |
| 10 | 20+35 | 70k | ✅ |
| 11 | 35+35 | 85k | ⚠️ |
| 12 | 35 | 50k | ✅ |
| 13 | 20+20+20 | 75k | ✅ |
| 14 | 20+20 | 55k | ✅ |
| 15 | 35+20 | 70k | ✅ |

(+15k overhead por fase incluído.) Nenhuma fase > 100k.
