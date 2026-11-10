# Review — mobile-app-shell

| | |
|---|---|
| **Mode** | Local (`7b745ef..HEAD`) |
| **Scope** | 10 arquivos, 3 commits |
| **Subagents** | 6 of 6 — Security, Requirements, Tests, Architecture, Regression, Performance |
| **Docs loaded** | `mobile-app-shell/context.md`, `mobile-app-shell/spec.md`, `CLAUDE.md`, `AGENTS.md`, `TESTING.md` |
| **Findings** | 8 em 4 arquivos (0 SECURITY, 0 CRITICAL, 0 PERFORMANCE, 2 WARNING, 6 SUGGESTION) |

**Requirements:** 16/16 critérios ✅, 3/3 edge cases ✅. `shared/` sem imports de `domains/`.

---

## WARNING (2)

- ✅ **Corrigido** — **`e2e/fixtures.ts:17-27` — override global esconde também o overlay de erro do Next.** Erros de hidratação/runtime que não quebram a asserção passam em silêncio. *(Tests, Requirements)*
  Fix: no fixture `page`, coletar `page.on("pageerror")` e falhar após `provide` se houver erro.
- ✅ **Corrigido** — **`shared/components/PageHeader.tsx:8` — edge case "nome com até 100 caracteres" sem teste.** Remover `min-w-0`/`truncate` não quebraria nada. *(Tests)*
  Fix: caso em `mobile-layout.spec.ts` com nome de 100 caracteres → `scrollWidth <= 360` em `/`.

## SUGGESTION (6)

- **`shared/components/Logo.tsx:17`** — `className` por template literal; usar `cn` (padrão do `AppNav`, resolve conflito com `color`). *(Architecture)*
- ✅ **Corrigido** — **`e2e/fixtures.ts:28-29`** — linha em branco duplicada. *(Architecture, Regression)*
- **`e2e/mobile-layout.spec.ts:8`** — NAV AC5 (< 340px trunca) sem teste; incluir 320px só na checagem de overflow. *(Tests)*
- **`e2e/mobile-layout.spec.ts:21-25`** — sem asserção de barra fixa ao rolar, logo centralizada e header em 2 linhas. *(Tests, Requirements)*
- **`e2e/mobile-layout.spec.ts:5-38`** — teste monolítico; `expect.soft` ou separar por história; `boundingBox()!` gera TypeError pouco claro. *(Tests)*
- **`app/(app)/page.tsx` — fallback do botão no desktop tem largura 0** (`Skeleton h-10` em wrapper `lg:w-auto`); não é regressão. `h-10 w-full lg:w-48`. *(Requirements)*

---

## Files With No Findings

- `app/(app)/avulsos/page.tsx`, `shared/components/AppShell.tsx`, `shared/components/AppNav.tsx`

---

## Highlights

- **Security:** ação de pagamento e consulta saíram de todas as páginas; ficam só na Início.
- **Requirements:** 16/16 ACs; reuso do `w-full lg:w-auto` já existente no botão.
- **Tests:** checagem de overflow correta (compara com largura do aparelho, não `innerWidth`); ícone acima do texto medido por posição.
- **Architecture:** `PageHeader` puro corrige violação `shared/` → `domains/`; `AddPayment` segue padrão local.
- **Regression:** nenhuma tela perdeu comportamento; Suspense do botão passou a funcionar de fato.
- **Performance:** header não bloqueia mais em 5 queries; `cache()` deduplica `getMonthPayables`.
