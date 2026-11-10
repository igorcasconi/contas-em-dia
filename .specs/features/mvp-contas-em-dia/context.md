# MVP Contas em Dia — Interview Decisions

**Date:** 2026-11-09
**Scope:** Telas, fluxos e arquitetura do MVP Contas em Dia — auth, onboarding, cadastros (boletos, pagamentos no cartão, tipos, bancos), tela inicial, modal de pagamento mensal e modal de salário. Gastos extras fora.
**Source:** informal discussion (requisitos enviados pelo usuário)

---

## Requisitos base (resumo do texto original)

- Armazenar finanças mensais: apenas gastos prioritários — boletos e cartões de crédito.
- Cadastro: email + senha. Login com sessão válida por 30 dias + refresh token.
- Onboarding: nome + salário líquido atual.
- Cadastro de boletos recorrentes: valor, flag de valor variável, tipo.
- Cadastro de pagamentos recorrentes no cartão: valor mensal, recorrente sempre ou nº de meses restantes, tipo, banco.
- Tipos compartilhados entre boletos e cartão (cadastro próprio).
- Cadastro de bancos (cartões de crédito).
- Tela inicial: 2 gráficos, salário líquido, sobra, lista de pagamentos do mês com status (não-pagos primeiro).
- Botão atualizar salário (modal + modal de confirmação).
- Botão adicionar pagamento do mês (modal boleto/cartão).

---

## Decisions

### Dois conceitos distintos: recorrência vs pagamento do mês

- **Recorrência** = cadastro do boleto/item de cartão que se repete (tela Recorrências).
- **Pagamento do mês** = registro de que a recorrência foi paga no mês corrente (modal na tela inicial).
- **Rationale:** usuário separou explicitamente as duas ações.

### Cadastro de boleto — valor

- Escolha binária no cadastro: **Valor fixo** (campo valor obrigatório) ou **Valor variável** (sem valor no cadastro).
- Campo tipo obrigatório (tipos compartilhados).
- **Rationale:** elimina terceiro estado ambíguo (sem valor e não variável).

### Modal de pagamento do mês — boleto

- 1º select: Boleto | Cartão de crédito.
- Boleto → 2º select com o boleto.
  - Fixo: sem campo de valor; valor exibido em texto ao lado do botão confirmar.
  - Variável: exibe campo para valor do mês; o valor digitado aparece em texto ao lado do botão confirmar.

### Modal de pagamento do mês — cartão

- Cartão → 2º select com o banco → checklist dos itens daquele banco.
- Itens vêm marcados por padrão. Total ao lado do botão = soma dos itens marcados.
- **Só itens recorrentes (sem parcelas) podem ser desmarcados.** Itens parcelados sempre marcados.
- Item recorrente tem 3 estados:
  1. Marcado — entra no total.
  2. Desmarcado — fora só deste mês.
  3. Pausado — botão ícone "pausar" no item; nos meses seguintes aparece desmarcado com badge "pausado".
- Re-marcar item pausado = paga neste mês **e reativa** a recorrência.
- Remover (ícone lixeira, no modal e no cadastro) = encerra a recorrência; some das próximas listas; histórico mantido nos gráficos (soft delete).
- Parcelas: meses restantes decrementam **a cada pagamento confirmado**.

### Desfazer pagamento

- Permite **desfazer** pagamentos apenas do mês corrente, via ação na linha da lista + modal de confirmação.
- Desfazer: restaura parcelas, linha volta a "não pago", libera alteração de salário se mês ficar sem pagamentos.
- Sem edição: corrigir = desfazer + pagar de novo.

### Salário

- Onboarding define salário inicial.
- Botão ao lado do valor na tela inicial → modal com novo valor → modal de confirmação.
- Vale do mês atual em diante (histórico por mês preservado).
- Só pode alterar se **não houver nenhum pagamento no mês atual**.

### Sobra

- Sobra = salário líquido do mês − total pago no mês corrente.
- Pendentes não descontam. Pode ser negativa (usuário pagou com dinheiro fora do salário).

### Lista de pagamentos (tela inicial)

- Uma linha por boleto + uma linha por banco de cartão (total da fatura + status), expansível para ver itens.
- Ordenação: não-pagos primeiro.
- Status: pago / não pago no mês corrente.

### Gráficos

- Gráfico 1: barras verticais, total **pago** por mês, jan–dez do ano atual. Meses futuros vazios (sem projeção).
- Gráfico 2: barras horizontais, total pago por banco no **mês atual**.

### Navegação e layout

- Responsivo, **mobile-first**.
- 3 entradas: **Início** · **Recorrências** (abas Boletos / Cartão) · **Configurações** (Tipos, Bancos, Perfil com nome + logout).
- Mobile: bottom nav fixa. Desktop: sidebar.
- Formulários de cadastro em modal (mesmo padrão dos modais de pagamento/salário).

### Auth e onboarding

- Supabase Auth (email + senha). Access token + refresh token rotacionado.
- **Sem confirmação de email no MVP.**
- Fluxo: cadastro → onboarding (nome + salário) → tela inicial.
- Login sem onboarding concluído → redireciona para onboarding. Rotas protegidas sem sessão → login.

### Stack

| Camada | Escolha |
|---|---|
| Banco | Supabase (Postgres hospedado) |
| Auth | Supabase Auth |
| Acesso a dados | `@supabase/ssr` + `supabase-js`, RLS por usuário |
| Types | Gerados pela Supabase CLI |
| Migrations | SQL via Supabase CLI |
| Validação | Zod |
| Gráficos | Recharts |
| UI | shadcn/ui (em `shared/components`) |
| Dinheiro | Inteiro em centavos |

- Arquitetura por domínio conforme `CLAUDE.md` (`domains/`, `shared/`, `app/` apenas view).

---

## Agent's Discretion

- Empty states: tela inicial sem recorrências mostra CTA para cadastrar boletos/cartões.
- Tipos e Bancos começam vazios; Banco tem apenas nome.
- Ordenação secundária da lista: valor decrescente dentro de cada grupo (não-pagos / pagos).
- Recorrência criada no meio do mês entra no mês atual; meses restantes contam a partir do mês atual.
- Modais de cadastro reaproveitados para edição.

---

## Deferred Ideas

- Data de vencimento dos boletos — surgiu em ordenação da lista.
- Linha de salário no gráfico anual — surgiu em gráficos.
- Projeção de gastos dos meses futuros — surgiu em gráficos.
- Gastos extras (saídas, alimentação etc.) — fora do MVP por definição.
- Confirmação de email com SMTP próprio — surgiu em auth.

---

## Open Questions

- Sessão de 30 dias: verificar se o time-box/inactivity timeout de sessão do Supabase Auth está disponível no plano em uso. Se não, aplicar limite de 30 dias via middleware/proxy da aplicação — bloqueado em verificação na fase de design.
- Compatibilidade de `@supabase/ssr`, Recharts e shadcn/ui com Next 16 / React 19 / Tailwind 4 — verificar na fase de design.
