# Layout mobile do app logado Specification

## Problem Statement

No mobile, o header da Início renderiza título, "Adicionar pagamento" e mês numa linha só (~481px em viewport de 412px), causando scroll lateral em toda a página. A bottom nav exibe ícone ao lado do texto (div sem `flex`) e os 4 rótulos não cabem em 360px. Não há marca visível no mobile. Além disso, `shared/components/PageHeader.tsx` importa de `domains/` e é `async`, consultando pagamentos em toda página que o usa.

## Proposed Solution

App logado no mobile ganha uma barra de topo fixa navy de 32px com a logo branca centralizada. O `PageHeader` volta a ser puro, com slots `aside` e `action`, e quebra em duas linhas no mobile (título + mês; ação em largura total). A bottom nav mantém as cores, mostra ícone acima do texto e cabe em 360px sem scroll lateral.

Decisões detalhadas: [context.md](./context.md).

## Goals

- [x] Nenhuma página logada com scroll horizontal em 360px e 412px de largura
- [x] `shared/` sem nenhum import de `domains/`

## Out of Scope

| Feature | Reason |
| --- | --- |
| Barra de topo no desktop | Sidebar já mostra a logo (context.md) |
| Mudanças de layout no desktop além do necessário | Deferido |
| Encurtar rótulos da nav | Decisão: rótulos mantidos |
| Landing, auth, onboarding | Fora do app logado |

---

## User Stories

### P1: Barra de topo mobile ⭐ MVP

**User Story**: Como usuário no celular, quero ver a marca do app no topo para reconhecer onde estou.

**Why P1**: Pedido explícito.

**Acceptance Criteria**:

1. WHEN uma página logada é renderizada com viewport < `lg` THEN system SHALL exibir no topo uma barra de 32px de altura, fundo `primary`, com a logo (ícone carteira + "Contas em Dia") branca e centralizada.
2. WHEN o usuário rola a página THEN system SHALL manter a barra fixa no topo sem cobrir o conteúdo inicial.
3. WHEN viewport ≥ `lg` THEN system SHALL ocultar a barra (sidebar segue com a logo).
4. WHEN o usuário toca na logo da barra THEN system SHALL navegar para `/`.
5. WHEN landing, login, cadastro ou onboarding são renderizados THEN system SHALL não exibir a barra.

**Independent Test**: Em 412px, abrir `/recorrencias` → barra navy 32px com logo centralizada; rolar → barra permanece; em 1280px → barra ausente.

---

### P1: Header da página sem estourar ⭐ MVP

**User Story**: Como usuário no celular, quero ver o título, o mês e o botão de pagamento sem precisar rolar para o lado.

**Why P1**: Corrige o scroll lateral da Início.

**Acceptance Criteria**:

1. WHEN o `PageHeader` é usado THEN system SHALL aceitar `title`, `aside?: ReactNode` e `action?: ReactNode`, sem importar nada de `domains/` e sem ser `async`.
2. WHEN viewport < `lg` e há `action` THEN system SHALL exibir na linha 1 título (esquerda) e `aside` (direita), e na linha 2 a `action` em largura total.
3. WHEN viewport ≥ `lg` THEN system SHALL exibir título, `aside` e `action` em uma linha.
4. WHEN a Início é renderizada THEN system SHALL passar o mês como `aside` e o "Adicionar pagamento" como `action`, mantendo o comportamento atual do diálogo.
5. WHEN `/avulsos` é renderizada THEN system SHALL usar `PageHeader` com o mês como `aside`, sem botão "Adicionar pagamento" e sem header montado à parte.
6. WHEN páginas sem `aside`/`action` são renderizadas THEN system SHALL exibir só o título, como hoje.

**Independent Test**: Em 360px na Início, "Olá, {nome}" e mês na mesma linha, botão "Adicionar pagamento" abaixo ocupando a largura; `scrollWidth <= innerWidth`.

---

### P1: Bottom nav cabendo ⭐ MVP

**User Story**: Como usuário no celular, quero o menu inferior legível, com ícone acima do nome, sem rolar para o lado.

**Why P1**: Pedido explícito; causa de overflow.

**Acceptance Criteria**:

1. WHEN a bottom nav é renderizada THEN system SHALL manter fundo `primary` e itens inativos brancos.
2. WHEN a bottom nav é renderizada THEN system SHALL exibir cada item com o ícone centralizado acima do rótulo.
3. WHEN viewport tem 360px THEN system SHALL exibir os 4 itens ("Início", "Recorrências", "Avulsos", "Configurações") por inteiro, sem overflow horizontal.
4. WHEN o item corresponde à página atual THEN system SHALL destacá-lo com pílula creme (`bg-muted`, texto navy) envolvendo ícone e rótulo, e `aria-current="page"`.
5. WHEN viewport < 340px THEN system SHALL truncar rótulos em vez de causar overflow.

**Independent Test**: Em 360px, todos os rótulos visíveis inteiros; ícones acima do texto; item ativo com pílula.

---

## Edge Cases

- WHEN o nome do usuário é longo (até 100 caracteres) THEN system SHALL quebrar/truncar o título sem causar scroll horizontal.
- WHEN o conteúdo rola sob a barra de topo e a bottom nav THEN system SHALL manter primeiro e último elementos visíveis (padding do `main` compensa as barras).
- WHEN os pagamentos da Início ainda carregam THEN system SHALL exibir fallback do botão sem deslocar o layout para fora da tela.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| SHELL-01 | P1: Barra de topo — mobile, sticky, 32px, logo centralizada | Execute | Done |
| SHELL-02 | P1: Barra de topo — `Logo` com variação de tamanho | Execute | Done |
| HEAD-01 | P1: Header — `PageHeader` puro com `aside`/`action` | Execute | Done |
| HEAD-02 | P1: Header — Início compõe `AddPaymentDialog` como `action` | Execute | Done |
| HEAD-03 | P1: Header — `/avulsos` usa `PageHeader` com `aside` | Execute | Done |
| NAV-01 | P1: Bottom nav — ícone acima, cabe em 360px, pílula ativa | Execute | Done |
| NAV-02 | P1: e2e — sem overflow horizontal (360/412px) + barra de topo | Execute | Done |

**Coverage:** 7 total, 7 Done (tasks inline no execute — scope Medium)

---

## Success Criteria

- [x] E2E mobile: `document.documentElement.scrollWidth <= window.innerWidth` em `/`, `/recorrencias`, `/avulsos`, `/configuracoes` (412px e 360px)
- [x] E2E: barra de topo visível no mobile e ausente no desktop
- [x] `grep -rn "@/domains" shared` vazio
- [x] `npm run lint` sem os warnings de imports não usados em `app/(app)/page.tsx`
- [x] Lint, typecheck, unit, build e e2e completos passando
