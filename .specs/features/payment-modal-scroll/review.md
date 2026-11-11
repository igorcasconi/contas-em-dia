# Review — payment-modal-scroll

| | |
|---|---|
| **Mode** | Local (`5fb89a6..HEAD`) |
| **Scope** | 5 arquivos, 2 commits |
| **Subagents** | 6 of 6 — Security, Requirements, Tests, Architecture, Regression, Performance |
| **Docs loaded** | `payment-modal-scroll/context.md`, `payment-modal-scroll/spec.md`, `CLAUDE.md`, `AGENTS.md`, `TESTING.md` |
| **Findings** | 9 em 2 arquivos (0 SECURITY, 0 CRITICAL, 0 PERFORMANCE, 4 WARNING, 5 SUGGESTION) |

**Requirements:** 5/5 critérios implementados (AC4 com teste parcial), 3/3 edge cases tratados no código. `DialogContent` compartilhado intacto; `cn` resolve `grid` → `flex` mantendo `gap-4`.

---

## WARNING (4)

- ✅ **Corrigido** — **`e2e/payment-modal-scroll.spec.ts:35-41` — AC4: selects "Tipo de pagamento" e "Banco" não verificados.** Spec lista ambos entre os elementos sempre visíveis. *(Requirements, Tests)*
  Fix: `toBeInViewport()` para `getByLabel("Tipo de pagamento")` e `getByLabel("Banco")`, antes e depois do scroll.
- ✅ **Corrigido** — **`e2e/payment-modal-scroll.spec.ts:39-43` — após rolar a lista, título/total/"Confirmar" não são rechecados e não se prova que o modal em si não rola.** `click()` auto-rola; regressão com `overflow-y-auto` no `DialogContent` passaria. *(Tests, Requirements)*
  Fix: após L40, repetir `toBeInViewport()` de heading, total e "Confirmar"; asserir `dialog.evaluate(e => e.scrollHeight <= e.clientHeight)`.
- ✅ **Corrigido** — **`e2e/payment-modal-scroll.spec.ts:8` — AC2 / edge "poucos itens → sem barra" sem teste.** Trocar `max-h` por `h-` ou forçar `overflow-y-scroll` não quebraria nada. *(Tests, Requirements)*
  Fix: teste curto com 2–3 itens → `scrollHeight <= clientHeight` na lista e altura do dialog < `VIEWPORT.height - 60`.
- ✅ **Corrigido** — **`e2e/payment-modal-scroll.spec.ts:43` — edge "erro visível junto ao botão" sem teste com lista longa.** `payment-errors.spec.ts` cobre só boleto. *(Tests)*
  Fix: abortar a Server Action (`page.route`, como `payment-errors.spec.ts:36`) → `getByRole("alert")` e "Confirmar" `toBeInViewport()`; `unroute` e confirmar.

> Ao asserir que o modal não rola, apareceu `scrollHeight` 1416 > 640: os `<input>` ocultos dos checkboxes são `absolute` e, com a `ul` não posicionada, escapavam do clip da lista (containing block = dialog). Corrigido com `relative` na `ul` (`CardPaymentForm.tsx`).

## SUGGESTION (5)

- ✅ **Corrigido** — **`e2e/payment-modal-scroll.spec.ts:24`** — `boundingBox()!` medido antes de esperar a lista; `null` vira TypeError e medição precoce passaria à toa. Medir após `expect(invoiceItems).toBeVisible()`; `expect(box).not.toBeNull()`. *(Tests, Architecture, Regression)*
- **`domains/payments/components/AddPaymentDialog.tsx:61`** — comentário repete o valor da classe e descreve comportamento de `CardPaymentForm`. Remover ou reduzir a "margem de 30px acima/abaixo". *(Architecture)*
- **`domains/payments/components/AddPaymentDialog.tsx:62`** — boleto também passa a `flex flex-col` + `max-h`; equivalente na prática, mas sem checagem de layout. Opcional: "Confirmar" `toBeInViewport()` no boleto em 412×700. *(Tests, Regression)*
- **`domains/payments/components/AddPaymentDialog.tsx:62`** — viewport muito baixa (landscape): se cabeçalho + selects + rodapé > `100dvh-60px`, só a lista encolhe e o resto vaza. Fora do spec; registrar como limitação/Deferred. *(Requirements)*
- **`e2e/payment-modal-scroll.spec.ts:9`** — `test.skip` no corpo: no desktop cria usuário, faz onboarding e login antes de pular. Mesmo padrão de `journey`/`mobile-layout`; padronizar depois com skip em nível de arquivo (`({ isMobile }) => !isMobile`). *(Performance)*

---

## Files With No Findings

- `domains/payments/components/CardPaymentForm.tsx`

---

## Highlights

- **Security:** seed e2e passa pelo RLS com client do próprio usuário; sem service-role.
- **Requirements:** técnica idêntica à decidida no context.md; sem scope creep, sem SPEC_DEVIATION.
- **Tests:** RED confirmado (1513px) → GREEN; valores (Total R$ 250,00, Sobra R$ 4.750,00) provam o fluxo ponta a ponta.
- **Architecture:** 1 className + cadeia `min-h-0`, sem tocar `shared/components/ui/dialog.tsx`; `useId` segue `FormField`.
- **Regression:** fieldset → `div role="group"` preserva a11y; nenhum seletor dependia do fieldset; merge do `cn` verificado.
- **Performance:** só CSS — sem `ResizeObserver`, listener ou re-render extra.
