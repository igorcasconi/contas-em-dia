# Compras avulsas no cartão — Interview Decisions

**Date:** 2026-11-10
**Scope:** Cadastro de compras avulsas à vista no crédito (descrição, banco, tipo, valor), válidas só para o mês atual, que entram na fatura do banco na Home e são pagas junto com os itens recorrentes.
**Source:** informal discussion

---

## Decisions

### 0. Natureza do avulso

- Sempre compra **à vista no crédito**, sempre ligada à **fatura de um banco**.
- Não existe avulso parcelado (parcelas = `card_items` com `remaining_months`).
- Não existe avulso fora do cartão (Pix, débito etc.).

### 1. Campos do cadastro

- **Descrição** — obrigatória, trim, máx. 100 caracteres (mesmo padrão de `bills`/`card_items`).
- **Banco** — select (obrigatório).
- **Tipo** — select de categorias (obrigatório).
- **Valor** — `MoneyInput`, > 0.
- Sem data da compra; o mês é atribuído automaticamente (`current_month()`, fuso São Paulo).
- **Rationale:** descrição identifica cada linha na fatura; reaproveita formulário/validação de cartão.

### 2. Onde fica a seção

- Página nova **`/avulsos`**, item **"Avulsos"** no menu (`AppNav`: bottom nav + sidebar), entre Recorrências e Configurações; ícone lucide de compra (ex. `ShoppingBagIcon`).
- Cabeçalho "Avulsos" + mês atual (como na Início).
- Lista **agrupada por banco**, com subtotal por banco (padrão da aba Cartão).
- `Fab` para adicionar; estado vazio quando não há avulsos no mês.
- Editar e excluir por item (padrão `RecordActions`/`ConfirmDialog`).
- **Rationale:** avulso não é recorrência; página própria a 1 toque.

### 3. Exibição na Home

- Avulsos entram **dentro da fatura do banco** (linha `kind: "card"`), como itens da lista expandida, com badge **"Avulso"**.
- **Somam no total** da fatura não paga.
- **Banco só com avulsos gera linha de fatura** (hoje banco sem `card_items` abertos não gera).
- Ordem dentro da fatura: recorrentes (por nome) → avulsos (por nome).
- Banco com só avulsos deve aparecer também nas opções do "Adicionar pagamento" (derivado das linhas pendentes).
- **Rationale:** espelha a fatura real: 1 linha, 1 pagamento por banco.

### 4. Pagamento da fatura

- No checklist (`CardPaymentForm`), avulsos aparecem **travados e sempre incluídos** (como parcela: cadeado + badge "Avulso").
- `pay_card` inclui os avulsos do banco no mês corrente no total, com valores lidos do banco (nunca do cliente).
- Valor de cada avulso fica **registrado no snapshot do pagamento** (histórico).
- **Desfazer** (`undo_payment`): fatura volta a "Não pago"; avulsos voltam a ser itens abertos do mês.
- Sobra e gráficos (derivados de `payments.total_cents`) passam a refletir avulsos automaticamente após o pagamento.
- **Rationale:** mesma regra das parcelas; total pago sempre bate com a fatura.

### 5. Fatura já paga no mês

- Banco com fatura paga no mês corrente: **bloqueia adicionar, editar e excluir** avulsos desse banco.
- Em `/avulsos`, grupo do banco mostra badge **"Fatura paga"**; itens sem ações de editar/excluir.
- Ao adicionar escolhendo banco com fatura paga: erro *"A fatura do {banco} deste mês já foi paga. Desfaça o pagamento na Início para alterar."*
- Regra **aplicada no banco de dados** (RPC/constraint), não só na UI — como `pay_bill`.
- Sem fatura paga: editar/excluir livres.
- **Rationale:** pagamento registrado nunca diverge dos itens; correção = desfazer e pagar de novo.

### 6. Virada do mês

- Cada avulso pertence ao mês em que foi cadastrado. Home e `/avulsos` mostram **só o mês atual**.
- Avulsos não pagos do mês anterior **não migram**; ficam gravados (base para histórico futuro).
- **Rationale:** "todo mês começa zerado"; mesmo comportamento de boletos/faturas esquecidos.

---

## Agent's Discretion

- Modelagem no banco: nova tabela (ex. `card_purchases`) com `month`, FK composta `(bank_id, user_id)`/`(category_id, user_id)`, RLS; como guardar o snapshot no pagamento (ex. tornar `payment_items.card_item_id` opcional + `card_purchase_id`, ou tabela própria de snapshot) — decidir no design.
- Escrita via RPC `security definer` (para aplicar a regra de fatura paga) vs. tabela com policy/trigger — decidir no design, mantendo validação no banco.
- Nome do domínio (ex. `domains/card-purchases/`), ícone exato do menu, copy de estado vazio.
- Exclusão: hard delete (avulso não pago do mês corrente não tem histórico a preservar).

---

## Deferred Ideas

- Página de histórico de avulsos por mês — veio no pedido inicial ("futuramente").
- Avulso fora do cartão (Pix, débito) — área 0.
- Data da compra / conferência com extrato — área 1.
- Carregar avulsos não pagos para o mês seguinte — área 6.

---

## Open Questions

- Nenhuma.

---

## Notas do código (para spec/design)

- `payment_items.card_item_id` é `not null` → schema precisa mudar para o snapshot de avulsos.
- `buildPayableRows.toCardRows` hoje ignora banco sem `card_items` abertos → precisa considerar avulsos.
- Exclusão de banco/tipo com avulso vinculado: FK `on delete restrict` → reaproveita mensagem de "em uso" existente.
