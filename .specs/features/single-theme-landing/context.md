# Tema único + Landing — Interview Decisions

**Date:** 2026-11-10
**Scope:** Tema visual único claro no app todo (fundo `#F9F7F1`, identidade navy), sem variante dark, e uma nova landing pública para visitantes no visual navy do modelo.
**Source:** informal discussion (+ 2 imagens de referência: landing desktop e mobile)

---

## Decisions

### 1. Paleta do app (tokens em `app/globals.css`)

| Token | Valor |
|---|---|
| `background` | `#F9F7F1` |
| `foreground` | `#0F1E36` |
| `card` / `popover` | `#FFFFFF` (`*-foreground` = `#0F1E36`) |
| `primary` | `#0F1E36` |
| `primary-foreground` | `#F9F7F1` |
| `secondary` / `muted` / `accent` | `#EFEBE0` (`*-foreground` = `#0F1E36`) |
| `muted-foreground` | `#5B6578` |
| `border` / `input` | `#E3DED1` |
| `ring` | navy (tom a critério, ex. `#3A5A8C`) |
| `chart-1..5` | `#0F1E36`, `#16294A`, `#3A5A8C`, `#7C97C2`, `#C9D6EA` |
| `destructive` | mantém o atual |
| `sidebar-*` | alinhar aos equivalentes acima |

- Apenas um bloco `:root`; sem bloco dark.
- **Rationale:** navy vira identidade (texto, botões, gráficos); creme dá tom quente; cards brancos destacam do fundo.

### 2. Rota da landing

- Landing em rota só para visitantes (ex.: `app/(public)/inicio/page.tsx`), componentes em domínio/shared conforme regras do projeto (`app/` só view).
- Proxy (`shared/helpers/supabase/proxy.ts`): visitante sem sessão em `/` → **rewrite** para a landing (URL continua `/`).
- Logado em `/inicio` → redirect `/`. Logado em `/` → dashboard (inalterado).
- Demais rotas protegidas: visitante → `/login` (inalterado).
- "Entrar" → `/login`; "Começar agora" → `/cadastro`.
- **Rationale:** URLs atuais e e2e autenticados intactos; domínio raiz mostra landing para visitante.

### 3. Tipografia

- `--font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;`
- `--font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;`
- `--font-heading` passa a apontar para `--font-display`.
- Carregar via `next/font/google` em `app/layout.tsx`, substituindo Geist Sans. Geist Mono permanece.
- Vale para o app todo, não só a landing.
- **Rationale:** identidade coerente landing ↔ app.

### 4. Login / cadastro

- Fundo creme `#F9F7F1`, formulário em card branco.
- Cabeçalho do `(auth)/layout.tsx`: ícone carteira + "Contas em Dia" igual ao da landing, clicável → `/`.
- Onboarding usa `CenteredLayout` → herda o creme; não recebe o cabeçalho de logo (fica só no layout de auth).
- **Rationale:** requisito "fundo `#F9F7F1` em todas as telas fora a landing"; logo faz ponte visual e navegação de volta.

### 5. Landing (visual)

- Fundo navy em tela cheia; cards navy mais claros; texto creme; texto secundário azul-acinzentado; botões claros (fundo azul-gelo, texto navy), cantos arredondados.
- Header: ícone `Wallet` + "Contas em Dia" à esquerda, botão "Entrar" à direita.
- Hero: título "Quanto sobra do seu salário este mês?" (Space Grotesk, grande), subtítulo "Registre boletos e pagamentos recorrentes do cartão. Veja o que já foi pago, o que falta e quanto sobra.", botão "Começar agora".
- 3 cards (ícone + título + descrição):
  - `ReceiptText`/similar — **Boletos fixos e variáveis** — "Internet, energia, gás — com valor fixo ou informado no mês."
  - `CreditCard` — **Cartões por banco** — "Assinaturas e parcelas, com meses restantes."
  - `ChartPie` — **Painel do mês** — "Gastos por mês, por cartão e a sobra atualizada."
- **Desktop (`lg+`):** 2 colunas — hero à esquerda, cards empilhados à direita, verticalmente centralizados.
- **Mobile:** 1 coluna — header, hero (título grande, quebra em ~3 linhas), botão com largura natural (não full-width), cards empilhados abaixo.
- Ícones de `lucide-react` (já instalado).

### 6. Remoção do dark

- Remover bloco `@media (prefers-color-scheme: dark)` e `@custom-variant dark` de `app/globals.css`.
- Remover todas as classes `dark:` de `shared/components/ui/*` (button, input, select, badge, tabs, checkbox, radio-group, chart).
- `chart.tsx`: `THEMES = { light: "", dark: ".dark" }` — remover entrada `dark` e ajustar o que depender dela.
- **Rationale:** Tailwind 4 tem `dark:` embutido via `prefers-color-scheme`; sem remoção, SO escuro ainda alteraria inputs/botões.

---

## Agent's Discretion

- Hex exatos da landing (fundo ~`#0F1E36`, card ~`#16294A`, texto ~`#F5F0E6`, secundário ~`#A9B6CC`, botão ~`#E1E8F2`) — amostrar da imagem; definir como tokens/variáveis escopadas à landing, sem afetar o tema do app.
- Tom exato de `ring` e alinhamento dos tokens `sidebar-*`.
- Tamanhos exatos de tipografia/espaçamento, mantendo fidelidade às imagens.
- Escolha final do ícone do card "Boletos" (lucide).

---

## Deferred Ideas

- Nenhuma.

---

## Open Questions

- Nenhuma.
