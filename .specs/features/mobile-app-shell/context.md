# Layout mobile do app logado — Interview Decisions

**Date:** 2026-11-10
**Scope:** Corrigir o layout mobile do app logado: header da página sem estourar a largura, bottom nav com ícone acima do texto cabendo sem scroll lateral (mantendo a cor navy), e nova barra de topo com logo centralizada, fundo primário, 32px de altura.
**Source:** informal discussion

---

## Decisions

### 1. Barra de topo (nova)

- **Só mobile** (`lg:hidden`); desktop já tem logo na sidebar.
- **Fixa** no topo (`sticky top-0 z-40`), altura **32px** (`h-8`).
- Fundo `bg-primary` (navy); `Logo` branca (`text-white`) **centralizada**.
- Logo em tamanho reduzido para caber em 32px (texto ~`text-sm`, ícone ~16px) — `Logo` ganha variação de tamanho; sidebar e auth mantêm o tamanho atual.
- Vive no `AppShell` (só rotas logadas `(app)`); landing/auth/onboarding não mudam.
- **Rationale:** identidade sempre visível, espelha a bottom nav fixa.

### 2. Header da página

- `PageHeader` volta a ser **puro**: props `title`, `aside?: ReactNode` (texto à direita), `action?: ReactNode` (slot opcional). **Sem imports de `domains/`** (corrige violação `shared/` → `domains/`).
- **Mobile:** linha 1 = título à esquerda + `aside` (mês) à direita; linha 2 = `action` em **largura total**.
- **Desktop (`lg`):** tudo em uma linha (título | aside + action).
- **Início:** compõe `AddPaymentDialog` (com `getMonthPayables()` em `Suspense`) como `action` e o mês como `aside`; resolve os imports não usados em `app/(app)/page.tsx`.
- **`/avulsos`:** volta a usar `<PageHeader title="Avulsos" aside={mês} />`; remove o header montado à parte (e o workaround documentado).
- Nenhum conteúdo pode causar largura > viewport no mobile.
- **Rationale:** remove a causa do estouro (3 itens forçados numa linha) e o acoplamento indevido.

### 3. Bottom nav — caber sem scroll lateral

- Mantém cor atual (`bg-primary`, itens inativos brancos).
- Item: `flex flex-col items-center justify-center`, **ícone (`size-5`) acima do texto**.
- Texto `text-[11px] leading-tight`; padding horizontal mínimo (`px-1`), `min-w-0`, `truncate` como segurança (< 340px).
- **Rótulos mantidos** ("Início", "Recorrências", "Avulsos", "Configurações") — iguais à sidebar; e2e por nome intactos.
- 4 colunas cabendo em 360px sem overflow horizontal.

### 4. Item ativo da bottom nav

- Mantém **pílula creme** (`bg-muted`, texto navy) no ativo, envolvendo ícone + texto (`px-2 py-1 rounded-lg`), centralizada na coluna.
- Inativos brancos.
- **Rationale:** usuário pediu manter as cores atuais; só a geometria muda.

---

## Agent's Discretion

- Ajuste de padding do `main` para a barra de topo sticky (não sobrepor conteúdo) e espaço inferior da bottom nav.
- Forma da variação de tamanho do `Logo` (prop `size` ou classe).
- Classes exatas de quebra do `PageHeader` (flex-wrap vs grid).

---

## Deferred Ideas

- Mudanças de layout no desktop além do necessário — escopo.

---

## Open Questions

- Nenhuma.

---

## Notas do código

- Overflow atual: `shared/components/PageHeader.tsx` (título + `AddPaymentDialog` + mês numa linha; ~481px em viewport 412px).
- Bottom nav: `shared/components/AppNav.tsx` — div interna com `flex-col` sem `flex`; `p-2` + `text-xs` estoura em 4 colunas.
- Verificação: e2e mobile (Pixel 7, 412px) e checagem em 360px — `document.documentElement.scrollWidth <= innerWidth` em `/`, `/recorrencias`, `/avulsos`, `/configuracoes`.
