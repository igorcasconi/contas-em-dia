# Review — single-theme-landing

| | |
|---|---|
| **Mode** | Local (working tree não commitado) |
| **Scope** | 20 arquivos, 0 commits (mudanças não commitadas sobre `feat/mvp-contas-em-dia`) |
| **Subagents** | 6 of 6 — Security, Requirements, Tests, Architecture, Regression, Performance |
| **Docs loaded** | `single-theme-landing/context.md`, `single-theme-landing/spec.md`, `CLAUDE.md`, `AGENTS.md`, `TESTING.md` |
| **Findings** | 6 em 5 arquivos (0 SECURITY, 0 CRITICAL, 0 PERFORMANCE, 1 WARNING, 5 SUGGESTION) |

**Requirements:** 25/25 critérios de aceite ✅ PASS, 5/5 edge cases ✅. SPEC_DEVIATION (navy `#0C1D3F`) documentado e aplicado de forma consistente.

---

## WARNING (1)

- ✅ **Corrigido** (`<h1 className="sr-only">` no layout) — **`app/(auth)/layout.tsx:7-10` — `/login` e `/cadastro` sem nenhum heading.** O `<h1>Contas em Dia</h1>` foi trocado por `<Logo />` (um `<Link>`); os forms de `domains/auth` não têm heading → regressão de acessibilidade (navegação por headings / leitor de tela). *(Regression, Requirements)*
  Fix: `<h1 className="sr-only">Contas em Dia</h1>` junto ao logo, ou `h1` visível por página ("Entrar" / "Criar conta").

## SUGGESTION (5)

- **`shared/helpers/supabase/proxy.ts:36-40` — `withCookies` não propaga headers anti-cache do `setAll`.** `@supabase/ssr` envia `Cache-Control: private, no-cache, no-store…` no `setAll`; só cookies são copiados. Pré-existente no `redirectTo`, mas agora também atinge o rewrite da landing (HTML cacheável com possível `Set-Cookie`). *(Security)*
  Fix: guardar os `headers` recebidos no `setAll` e aplicá-los em `target`.
- **`e2e/landing.spec.ts` — anônimo direto em `/inicio` não testado.** Remover `LANDING_ROUTE` de `GUEST_ONLY_ROUTES` mandaria anônimo para `/login` sem quebrar teste. *(Tests)*
  Fix: `page.goto("/inicio")` → heading visível, URL não termina em `/login`.
- **`app/globals.css` / `shared/components/ui/*` — sem teste automatizado contra reintrodução de dark.** *(Tests)*
  Fix: e2e com `page.emulateMedia({ colorScheme: "dark" })` comparando `backgroundColor` do body com o modo light.
- **`app/(auth)/layout.tsx:10` — `rounded-2xl` diverge do padrão `rounded-xl` dos cards do app.** *(Architecture)*
- **`spec.md` / `context.md` — ACs ainda citam `#0F1E36` literalmente.** Coberto pelo SPEC_DEVIATION, mas vale alinhar o texto. *(Requirements)*

---

## Observação fora do diff

- `SalaryCard`, `LeftoverCard`, `PayableList`, `BillList`, `CardItemList`, `SimpleNameCrud`, `EmptyState` usam `rounded-xl border` sem `bg-card` → ficam creme, não brancos. Tensão com a intenção "cards brancos" da entrevista (o token `--card` está correto). *(Architecture)*

---

## Files With No Findings

- `domains/landing/components/Landing.tsx`, `app/(public)/inicio/page.tsx`, `shared/components/Logo.tsx`, `app/layout.tsx`, `app/onboarding/page.tsx`, `shared/components/PageHeader.tsx`, `shared/components/ui/*` (remoção de `dark:` verificada token a token, sem efeito colateral)

---

## Highlights

- **Security:** ordem dos guards preservada (sessão expirada antes do rewrite); destinos de redirect/rewrite constantes, sem open redirect.
- **Requirements:** todos os 25 ACs com evidência; textos da landing batem literalmente com context.md.
- **Tests:** `landing.spec.ts` cobre os 4 fluxos de roteamento com seletores por papel; e2e antigos ajustados sem afrouxar intenção.
- **Architecture:** `Logo` em `shared/` com 2 consumidores reais; `Landing` Server Component em domínio; `.theme-landing` reaproveita tokens sem fork de componentes.
- **Regression:** zero imports fantasmas; remoção regex de `dark:` cirúrgica.
- **Performance:** rewrite evita roundtrip de redirect; landing estática pré-renderizada; CSS menor sem bloco dark.
