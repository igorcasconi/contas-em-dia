# Tema único + Landing Specification

## Problem Statement

O app usa a paleta neutra padrão do shadcn (cinza) com variante dark automática pelo sistema operacional, sem identidade visual própria. Visitantes sem login que acessam `/` caem direto no `/login`, sem nenhuma apresentação do produto.

## Proposed Solution

Um tema único claro (fundo creme `#F9F7F1`, identidade navy `#0F1E36`, DM Sans + Space Grotesk) aplicado a todo o app, sem variante dark. Visitantes em `/` veem uma landing navy que apresenta o produto e leva a login/cadastro. Usuários logados continuam vendo o dashboard em `/`.

Decisões detalhadas: [context.md](./context.md).

> SPEC_DEVIATION: navy usado é `#0C1D3F` (amostrado da imagem de referência), não `#0F1E36` (estimativa da entrevista). `chart-2` = `#192E58` (card da landing). Reason: fidelidade às cores do modelo.

## Goals

- [x] App renderiza idêntico com o SO em modo claro ou escuro (zero regras dark ativas)
- [x] Visitante em `/` vê a landing; usuário logado em `/` vê o dashboard
- [x] Landing fiel às imagens de referência (desktop e mobile)

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alternância de tema (toggle claro/escuro) | Decisão: tema único |
| Redesign de layout/estrutura das telas internas | Só cores e fontes mudam; estrutura fica |
| Novas seções na landing (preços, FAQ, rodapé) | Não estão no modelo |
| Cabeçalho com logo no onboarding | Decisão: logo só no layout de auth |

---

## User Stories

### P1: Tema único claro ⭐ MVP

**User Story**: Como usuário, quero um visual único e consistente com identidade própria, independente do modo do meu SO.

**Why P1**: Base de todas as outras telas; remove comportamento dark involuntário.

**Acceptance Criteria**:

1. WHEN qualquer tela fora da landing é renderizada THEN system SHALL usar fundo `#F9F7F1` e texto `#0F1E36`.
2. WHEN o SO está em modo escuro THEN system SHALL renderizar exatamente as mesmas cores do modo claro.
3. WHEN `app/globals.css` é carregado THEN system SHALL definir os tokens apenas em `:root`, com os valores da tabela em context.md §1, sem `@media (prefers-color-scheme: dark)` nem `@custom-variant dark`.
4. WHEN o código de `shared/components/ui/*` é inspecionado THEN system SHALL não conter classes `dark:`, e `chart.tsx` SHALL não ter a entrada `dark` em `THEMES`.
5. WHEN cards, popovers e modais são renderizados THEN system SHALL usar fundo `#FFFFFF`.
6. WHEN gráficos do dashboard são renderizados THEN system SHALL usar os tokens `chart-*` em tons de navy.

**Independent Test**: Abrir dashboard e configurações com DevTools emulando `prefers-color-scheme: dark` e depois `light` → cores idênticas; `grep -r "dark:" shared/components/ui` vazio.

---

### P1: Tipografia nova ⭐ MVP

**User Story**: Como usuário, quero a mesma tipografia na landing e no app, para perceber um produto coeso.

**Why P1**: Parte da identidade visual pedida; a landing depende dela.

**Acceptance Criteria**:

1. WHEN qualquer página é renderizada THEN system SHALL usar DM Sans como `--font-sans`.
2. WHEN um elemento usa `font-heading`/`font-display` THEN system SHALL usar Space Grotesk.
3. WHEN fontes são carregadas THEN system SHALL usar `next/font/google` em `app/layout.tsx`, sem Geist Sans; Geist Mono permanece.
4. WHEN títulos de página (`PageHeader`, título de auth) são renderizados THEN system SHALL usar a fonte display.

**Independent Test**: Inspecionar computed `font-family` do body (DM Sans) e de um `h1` (Space Grotesk).

---

### P1: Landing para visitantes ⭐ MVP

**User Story**: Como visitante, quero entender o que o app faz ao acessar o site, para decidir criar conta ou entrar.

**Why P1**: Pedido central da feature.

**Acceptance Criteria**:

1. WHEN visitante sem sessão acessa `/` THEN system SHALL exibir a landing com URL permanecendo `/` (rewrite no proxy).
2. WHEN usuário logado acessa `/` THEN system SHALL exibir o dashboard (comportamento atual).
3. WHEN usuário logado acessa a rota interna da landing (ex. `/inicio`) THEN system SHALL redirecionar para `/`.
4. WHEN visitante sem sessão acessa outra rota protegida (ex. `/recorrencias`) THEN system SHALL redirecionar para `/login` (inalterado).
5. WHEN a landing é renderizada THEN system SHALL exibir: header (ícone carteira + "Contas em Dia" à esquerda, botão "Entrar" à direita); título "Quanto sobra do seu salário este mês?"; subtítulo "Registre boletos e pagamentos recorrentes do cartão. Veja o que já foi pago, o que falta e quanto sobra."; botão "Começar agora"; 3 cards com ícone, título e descrição (textos em context.md §5).
6. WHEN o usuário clica "Entrar" THEN system SHALL navegar para `/login`.
7. WHEN o usuário clica "Começar agora" THEN system SHALL navegar para `/cadastro`.
8. WHEN viewport ≥ `lg` THEN system SHALL exibir 2 colunas (hero à esquerda, cards empilhados à direita).
9. WHEN viewport < `lg` THEN system SHALL exibir 1 coluna (hero, depois cards), botão "Começar agora" com largura natural.
10. WHEN a landing é renderizada THEN system SHALL usar fundo navy em tela cheia, cards navy mais claros, texto creme e botões claros, com cores escopadas à landing (sem alterar tokens do app).
11. WHEN a landing é implementada THEN system SHALL seguir as regras do projeto: `app/` só compõe; componentes fora de `app/`; Server Component (sem `"use client"`).

**Independent Test**: Em janela anônima, abrir `/` → landing; clicar "Começar agora" → `/cadastro`; voltar, "Entrar" → `/login`. Logado, abrir `/` → dashboard; abrir `/inicio` → `/`.

---

### P2: Auth com identidade nova

**User Story**: Como visitante no login/cadastro, quero reconhecer a mesma marca da landing e poder voltar a ela.

**Why P2**: Melhora continuidade, mas o login funciona sem isso.

**Acceptance Criteria**:

1. WHEN `/login` ou `/cadastro` é renderizado THEN system SHALL usar fundo `#F9F7F1` e o formulário dentro de um card branco.
2. WHEN `/login` ou `/cadastro` é renderizado THEN system SHALL exibir o cabeçalho ícone carteira + "Contas em Dia", igual ao da landing, como link para `/`.
3. WHEN o visitante clica no logo THEN system SHALL navegar para `/` (landing).
4. WHEN `/onboarding` é renderizado THEN system SHALL usar o fundo creme, sem o cabeçalho de logo.

**Independent Test**: Abrir `/login` anônimo → card branco sobre creme; clicar logo → landing.

---

## Edge Cases

- WHEN a sessão está expirada (>30 dias) e o usuário acessa `/` THEN system SHALL fazer signOut e redirecionar para `/login` (comportamento atual preservado).
- WHEN o usuário logado com onboarding pendente acessa `/` THEN system SHALL manter o fluxo atual (guarda → `/onboarding`).
- WHEN o usuário clica "Sair" THEN system SHALL continuar redirecionando para `/login`.
- WHEN a fonte do Google falha ao carregar THEN system SHALL cair no fallback `ui-sans-serif, system-ui, sans-serif`.
- WHEN estados de erro (`aria-invalid`) são exibidos em inputs THEN system SHALL manter o destaque `destructive` sem variante dark.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| THEME-01 | P1: Tema único — tokens creme/navy em `:root` | Execute | Done |
| THEME-02 | P1: Tema único — remover bloco dark e `@custom-variant` | Execute | Done |
| THEME-03 | P1: Tema único — remover `dark:` de `shared/components/ui/*` e `THEMES.dark` | Execute | Done |
| FONT-01 | P1: Tipografia — DM Sans + Space Grotesk via `next/font` | Execute | Done |
| FONT-02 | P1: Tipografia — `--font-heading` → display; títulos usam display | Execute | Done |
| LAND-01 | P1: Landing — rota pública + rewrite `/` no proxy | Execute | Done |
| LAND-02 | P1: Landing — logado em rota da landing → `/` | Execute | Done |
| LAND-03 | P1: Landing — conteúdo, links e visual navy | Execute | Done |
| LAND-04 | P1: Landing — responsivo (2 col `lg+`, 1 col mobile) | Execute | Done |
| LAND-05 | P1: Landing — atualizar e2e (`auth.spec.ts`, `profile.spec.ts`) e cobrir landing | Execute | Done |
| AUTH-01 | P2: Auth — card branco + logo link para `/` | Execute | Done |

**Coverage:** 11 total, 11 Done (tasks implícitas no execute — scope Medium)

---

## Success Criteria

- [x] `grep -rn "dark" app/globals.css shared/components/ui` sem regras/classes dark
- [x] Emulação `prefers-color-scheme: dark` não altera nenhuma cor
- [x] Anônimo em `/` → landing (URL `/`); logado em `/` → dashboard
- [x] Landing visualmente fiel às 2 imagens de referência
- [x] `npm run lint`, typecheck, testes unitários e e2e passando
