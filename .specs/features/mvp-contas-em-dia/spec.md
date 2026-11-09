# MVP Contas em Dia Specification

**Context:** `.specs/features/mvp-contas-em-dia/context.md`

## Problem Statement

Quem tem vários boletos e assinaturas/parcelas no cartão perde o controle do que já foi pago no mês e de quanto sobra do salário. Não existe um lugar único que mostre, mês a mês, o que é prioritário pagar e o saldo restante.

## Proposed Solution

App web mobile-first onde o usuário cadastra uma vez suas recorrências (boletos e itens de cartão de crédito) e, a cada mês, registra os pagamentos. A tela inicial mostra salário líquido, sobra do mês, lista de pagamentos com status (não-pagos primeiro) e dois gráficos: total pago por mês no ano e total pago por cartão no mês atual.

## Goals

- [ ] Usuário registra todos os pagamentos prioritários do mês em ≤ 1 modal por boleto/banco.
- [ ] Usuário vê, em uma tela, quanto do salário sobra após os pagamentos do mês.
- [ ] Usuário identifica pendências do mês sem rolar além dos itens não-pagos (ordenação).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Gastos extras (saídas, alimentação etc.) | Fora do MVP por definição |
| Data de vencimento de boletos | Deferred (interview) |
| Linha de salário no gráfico anual | Deferred (interview) |
| Projeção de gastos de meses futuros | Deferred — boletos variáveis não têm valor previsto |
| Confirmação de email / SMTP próprio | Deferred — fricção e limite de envio no MVP |
| Edição de pagamento já registrado | Substituído por desfazer + pagar novamente |
| Pagamento de meses anteriores/futuros | MVP opera apenas no mês corrente |

---

## User Stories

### P1: Cadastro e login ⭐ MVP

**User Story**: Como usuário, quero criar conta com email e senha e permanecer logado por 30 dias, para acessar meus dados sem login frequente.

**Why P1**: Sem auth não há dados por usuário.

**Acceptance Criteria**:

1. WHEN usuário envia email válido + senha válida no cadastro THEN sistema SHALL criar conta, iniciar sessão e redirecionar para onboarding (sem confirmação de email).
2. WHEN email já cadastrado THEN sistema SHALL exibir erro no formulário sem criar conta.
3. WHEN usuário envia credenciais corretas no login THEN sistema SHALL iniciar sessão e redirecionar para tela inicial (ou onboarding, se não concluído).
4. WHEN credenciais incorretas THEN sistema SHALL exibir erro genérico ("email ou senha inválidos").
5. WHEN access token expira e refresh token é válido THEN sistema SHALL renovar a sessão sem ação do usuário, rotacionando o refresh token.
6. WHEN passam 30 dias desde o login THEN sistema SHALL encerrar a sessão e exigir novo login.
7. WHEN usuário sem sessão acessa rota protegida THEN sistema SHALL redirecionar para login.
8. WHEN usuário clica logout (Configurações › Perfil) THEN sistema SHALL encerrar sessão e redirecionar para login.

**Independent Test**: Criar conta, fechar navegador, reabrir — continua logado; logout — rota protegida redireciona.

---

### P1: Onboarding ⭐ MVP

**User Story**: Como novo usuário, quero informar nome e salário líquido, para que o app calcule minha sobra.

**Why P1**: Salário é base do cálculo da sobra.

**Acceptance Criteria**:

1. WHEN usuário sem onboarding acessa qualquer rota protegida THEN sistema SHALL redirecionar para onboarding.
2. WHEN usuário envia nome não vazio + salário > 0 THEN sistema SHALL salvar perfil, registrar salário vigente a partir do mês atual e redirecionar para tela inicial.
3. WHEN salário ≤ 0 ou nome vazio THEN sistema SHALL exibir erro de validação.
4. WHEN usuário com onboarding concluído acessa onboarding THEN sistema SHALL redirecionar para tela inicial.

**Independent Test**: Conta nova → onboarding → tela inicial exibe nome e salário informados.

---

### P1: Cadastro de tipos ⭐ MVP

**User Story**: Como usuário, quero cadastrar tipos (ex: Internet, Energia, Streaming), para classificar boletos e itens de cartão.

**Why P1**: Tipo é campo obrigatório de boletos e itens de cartão.

**Acceptance Criteria**:

1. WHEN usuário cria tipo com nome não vazio THEN sistema SHALL salvar e listar em Configurações › Tipos.
2. WHEN usuário edita tipo THEN sistema SHALL refletir o novo nome em boletos e itens de cartão que o usam.
3. WHEN usuário tenta criar tipo com nome já existente (case-insensitive) THEN sistema SHALL exibir erro.
4. WHEN usuário tenta excluir tipo em uso por recorrência ativa THEN sistema SHALL bloquear e informar o motivo.
5. Tipos SHALL ser os mesmos (compartilhados) nos cadastros de boleto e de cartão.

**Independent Test**: Criar tipo → aparece no select dos cadastros de boleto e cartão.

---

### P1: Cadastro de bancos ⭐ MVP

**User Story**: Como usuário, quero cadastrar os bancos dos meus cartões, para agrupar itens e pagar a fatura por banco.

**Why P1**: Pagamento de cartão é agrupado por banco.

**Acceptance Criteria**:

1. WHEN usuário cria banco com nome não vazio THEN sistema SHALL salvar e listar em Configurações › Bancos.
2. WHEN usuário edita banco THEN sistema SHALL refletir o nome em itens, lista e gráficos.
3. WHEN nome duplicado (case-insensitive) THEN sistema SHALL exibir erro.
4. WHEN usuário tenta excluir banco com itens ativos THEN sistema SHALL bloquear e informar o motivo.

**Independent Test**: Criar banco → aparece no select do cadastro de item de cartão.

---

### P1: Cadastro de boletos recorrentes ⭐ MVP

**User Story**: Como usuário, quero cadastrar boletos que se repetem todo mês, para registrar o pagamento mensal deles.

**Why P1**: Núcleo do produto.

**Acceptance Criteria**:

1. WHEN usuário abre Recorrências › Boletos › "+" THEN sistema SHALL abrir modal com: nome, tipo (select), modo de valor (Fixo | Variável), valor.
2. WHEN modo = Fixo THEN campo valor SHALL ser obrigatório e > 0.
3. WHEN modo = Variável THEN campo valor SHALL ser ocultado e não salvo.
4. WHEN dados válidos THEN sistema SHALL salvar e o boleto SHALL aparecer na lista de pagamentos do mês atual como "não pago".
5. WHEN usuário edita boleto THEN sistema SHALL abrir o mesmo modal preenchido.
6. WHEN usuário remove boleto THEN sistema SHALL encerrar a recorrência (some dos meses seguintes) e manter histórico de pagamentos nos gráficos.
7. WHEN não existe nenhum tipo THEN modal SHALL indicar que é preciso cadastrar um tipo antes.

**Independent Test**: Cadastrar boleto fixo e variável → ambos aparecem na lista da tela inicial como não pagos.

---

### P1: Cadastro de itens recorrentes no cartão ⭐ MVP

**User Story**: Como usuário, quero cadastrar assinaturas e parcelas do cartão, para compor a fatura mensal por banco.

**Why P1**: Núcleo do produto.

**Acceptance Criteria**:

1. WHEN usuário abre Recorrências › Cartão › "+" THEN sistema SHALL abrir modal com: nome, tipo (select), banco (select), valor mensal, "sempre recorrente" (sim/não), meses restantes.
2. WHEN "sempre recorrente" = não THEN meses restantes SHALL ser obrigatório, inteiro ≥ 1.
3. WHEN "sempre recorrente" = sim THEN campo meses restantes SHALL ser ocultado.
4. WHEN dados válidos THEN sistema SHALL salvar e o item SHALL compor a fatura do banco no mês atual.
5. WHEN usuário edita item THEN sistema SHALL abrir o mesmo modal preenchido.
6. WHEN usuário remove item THEN sistema SHALL encerrar a recorrência e manter histórico.
7. WHEN não existe tipo ou banco THEN modal SHALL indicar o cadastro faltante.
8. Lista SHALL exibir status do item: ativo, pausado, parcelado (com meses restantes).

**Independent Test**: Cadastrar item recorrente + item parcelado no mesmo banco → linha do banco na tela inicial soma ambos.

---

### P1: Registrar pagamento de boleto no mês ⭐ MVP

**User Story**: Como usuário, quero registrar que paguei um boleto neste mês, para acompanhar o que falta.

**Why P1**: Ação principal mensal.

**Acceptance Criteria**:

1. WHEN usuário clica "Adicionar pagamento" na tela inicial THEN sistema SHALL abrir modal com 1º select: Boleto | Cartão de crédito.
2. WHEN seleciona Boleto THEN sistema SHALL exibir 2º select apenas com boletos ativos **não pagos** no mês atual.
3. WHEN boleto é Fixo THEN modal SHALL ocultar campo valor e exibir o valor cadastrado em texto ao lado do botão confirmar.
4. WHEN boleto é Variável THEN modal SHALL exibir campo valor (obrigatório, > 0) e o valor digitado em texto ao lado do botão confirmar, atualizado ao digitar.
5. WHEN usuário confirma THEN sistema SHALL registrar pagamento no mês atual, fechar modal e atualizar lista, sobra e gráficos.
6. WHEN todos os boletos do mês estão pagos THEN 2º select SHALL indicar que não há boletos pendentes.

**Independent Test**: Pagar boleto variável com R$ 150 → linha vira "pago" com R$ 150; sobra = salário − 150.

---

### P1: Registrar pagamento de cartão no mês ⭐ MVP

**User Story**: Como usuário, quero registrar o pagamento da fatura de um banco escolhendo quais itens entram, para refletir o valor real pago.

**Why P1**: Ação principal mensal.

**Acceptance Criteria**:

1. WHEN seleciona Cartão de crédito THEN sistema SHALL exibir 2º select apenas com bancos que têm itens ativos/pausados e **não pagos** no mês atual.
2. WHEN seleciona banco THEN sistema SHALL exibir checklist dos itens do banco.
3. Itens ativos SHALL vir marcados; itens pausados SHALL vir desmarcados com badge "pausado".
4. Itens parcelados SHALL estar marcados e não desmarcáveis.
5. WHEN usuário desmarca item recorrente THEN sistema SHALL excluí-lo apenas do total deste mês.
6. WHEN usuário clica "pausar" em item recorrente THEN item SHALL ficar desmarcado e, ao confirmar, nos meses seguintes SHALL vir desmarcado com badge "pausado".
7. WHEN usuário marca item pausado THEN, ao confirmar, sistema SHALL incluí-lo no pagamento e reativar a recorrência.
8. WHEN usuário clica "remover" em item recorrente THEN sistema SHALL pedir confirmação e encerrar a recorrência (some da lista; histórico mantido).
9. Total ao lado do botão confirmar SHALL ser a soma dos itens marcados, atualizado a cada alteração.
10. WHEN usuário confirma THEN sistema SHALL registrar pagamento do banco no mês atual com os itens marcados e seus valores, decrementar 1 mês de cada item parcelado incluído e atualizar lista, sobra e gráficos.
11. WHEN item parcelado chega a 0 meses restantes THEN sistema SHALL encerrá-lo (não aparece nos meses seguintes).

**Independent Test**: Banco com 2 recorrentes (R$ 30, R$ 50) + 1 parcelado (R$ 100, 3 meses): desmarcar R$ 30 → total R$ 150; confirmar → parcelado fica com 2 meses.

---

### P1: Tela inicial — resumo e lista ⭐ MVP

**User Story**: Como usuário, quero ver salário, sobra e status dos pagamentos do mês, para saber o que falta pagar.

**Why P1**: Visão central do produto.

**Acceptance Criteria**:

1. Tela SHALL exibir salário líquido vigente no mês atual.
2. Tela SHALL exibir sobra = salário do mês − total pago no mês atual; pendentes não descontam.
3. WHEN total pago > salário THEN sobra SHALL ser exibida negativa com destaque visual.
4. Lista SHALL ter uma linha por boleto ativo e uma linha por banco com itens no mês, com nome, valor e status (pago / não pago).
5. Valor da linha: boleto fixo = valor cadastrado; boleto variável não pago = "valor variável"; pago = valor efetivamente pago; banco não pago = soma dos itens ativos; banco pago = total pago.
6. Linha de banco SHALL ser expansível, exibindo seus itens.
7. Ordenação SHALL ser não-pagos primeiro; dentro de cada grupo, por valor decrescente.
8. WHEN não há recorrências THEN tela SHALL exibir estado vazio com CTA para Recorrências.
9. WHEN muda o mês THEN lista SHALL reiniciar com todos os itens como não pagos.

**Independent Test**: Com 1 boleto pago e 1 banco pendente, banco aparece primeiro e sobra desconta só o boleto.

---

### P1: Tela inicial — gráficos ⭐ MVP

**User Story**: Como usuário, quero ver o histórico de gastos do ano e a divisão por cartão, para entender meus gastos.

**Why P1**: Requisito explícito.

**Acceptance Criteria**:

1. Gráfico 1 SHALL exibir barras verticais com total pago por mês, jan–dez do ano atual; meses sem pagamento SHALL ficar vazios.
2. Gráfico 2 SHALL exibir barras horizontais com total pago por banco no mês atual.
3. WHEN não há pagamentos de cartão no mês THEN gráfico 2 SHALL exibir estado vazio.
4. Recorrências encerradas SHALL continuar contando nos meses em que foram pagas.

**Independent Test**: Pagar boleto R$ 100 e banco R$ 200 → gráfico 1 mês atual = 300; gráfico 2 mostra o banco com 200.

---

### P1: Atualizar salário ⭐ MVP

**User Story**: Como usuário, quero atualizar meu salário a partir do mês atual, para que a sobra reflita minha renda real.

**Why P1**: Requisito explícito.

**Acceptance Criteria**:

1. Botão de editar SHALL ficar ao lado do valor do salário na tela inicial.
2. WHEN existe ao menos um pagamento no mês atual THEN botão SHALL ficar desabilitado com explicação (tooltip/texto).
3. WHEN usuário informa novo valor > 0 e confirma THEN sistema SHALL abrir modal de aviso pedindo confirmação.
4. WHEN usuário confirma o aviso THEN sistema SHALL registrar salário vigente do mês atual em diante, preservando salários de meses anteriores.
5. WHEN usuário cancela o aviso THEN sistema SHALL manter o salário anterior.

**Independent Test**: Sem pagamentos no mês, alterar salário → sobra recalculada; registrar pagamento → botão desabilita.

---

### P1: Navegação e layout ⭐ MVP

**User Story**: Como usuário mobile, quero navegar entre Início, Recorrências e Configurações, para acessar todas as funções.

**Why P1**: Sem navegação as telas não são alcançáveis.

**Acceptance Criteria**:

1. Navegação SHALL ter 3 entradas: Início, Recorrências, Configurações.
2. WHEN viewport mobile THEN navegação SHALL ser bottom nav fixa; WHEN desktop THEN sidebar.
3. Recorrências SHALL ter abas Boletos e Cartão.
4. Configurações SHALL conter Tipos, Bancos e Perfil (nome + logout).
5. Telas de auth e onboarding SHALL não exibir navegação.

**Independent Test**: Em 375px e 1280px, todas as entradas navegam para a tela correta.

---

### P2: Desfazer pagamento do mês

**User Story**: Como usuário, quero desfazer um pagamento registrado por engano no mês atual, para corrigir valores.

**Why P2**: Correção de erro; MVP funciona sem, mas erro bloquearia salário.

**Acceptance Criteria**:

1. Linha paga na lista SHALL ter ação "desfazer" apenas para o mês atual.
2. WHEN usuário clica desfazer THEN sistema SHALL abrir modal de confirmação.
3. WHEN confirma THEN sistema SHALL remover o pagamento, restaurar meses restantes dos parcelados incluídos (reabrindo itens encerrados por chegar a 0), voltar linha a "não pago" e atualizar sobra e gráficos.
4. WHEN o mês fica sem pagamentos THEN botão de alterar salário SHALL ser habilitado.
5. WHEN pagamento de cartão reativou item pausado THEN desfazer SHALL restaurar o estado pausado.

**Independent Test**: Pagar banco com parcelado (3 → 2) → desfazer → parcelado volta a 3, linha "não pago".

---

## Edge Cases

- WHEN usuário tenta pagar boleto/banco já pago no mês (ex: duas abas) THEN sistema SHALL rejeitar com erro e não duplicar.
- WHEN todos os itens do banco estão desmarcados THEN botão confirmar SHALL ficar desabilitado (total R$ 0).
- WHEN banco tem apenas itens pausados THEN banco SHALL aparecer no select com todos desmarcados.
- WHEN valor digitado tem formato inválido THEN campo SHALL exibir erro; valores armazenados em centavos.
- WHEN recorrência é editada após pagamento do mês THEN pagamento registrado SHALL manter o valor pago original.
- WHEN usuário acessa dados de outro usuário THEN sistema SHALL negar (RLS).
- WHEN virada de ano THEN gráfico 1 SHALL exibir o novo ano (meses vazios).
- WHEN falha de rede/servidor em uma ação THEN modal SHALL permanecer aberto com mensagem de erro e dados preservados.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Cadastro e login — cadastro | In Tasks | Implementing |
| AUTH-02 | P1: Cadastro e login — login/erros | In Tasks | Implementing |
| AUTH-03 | P1: Cadastro e login — refresh + 30 dias | In Tasks | Implementing |
| AUTH-04 | P1: Cadastro e login — rotas protegidas/logout | In Tasks | Implementing |
| ONB-01 | P1: Onboarding | In Tasks | Implementing |
| TIPO-01 | P1: Cadastro de tipos | In Tasks | Implementing |
| BANCO-01 | P1: Cadastro de bancos | In Tasks | Implementing |
| BOL-01 | P1: Cadastro de boletos — fixo/variável | In Tasks | Implementing |
| BOL-02 | P1: Cadastro de boletos — editar/remover | In Tasks | Implementing |
| CART-01 | P1: Itens de cartão — recorrente/parcelado | In Tasks | Implementing |
| CART-02 | P1: Itens de cartão — editar/remover/status | In Tasks | Implementing |
| PAG-01 | P1: Pagamento de boleto | In Tasks | In Tasks |
| PAG-02 | P1: Pagamento de cartão — checklist/total | In Tasks | In Tasks |
| PAG-03 | P1: Pagamento de cartão — pausar/reativar/remover | In Tasks | In Tasks |
| PAG-04 | P1: Pagamento de cartão — decremento de parcelas | In Tasks | In Tasks |
| HOME-01 | P1: Tela inicial — salário e sobra | In Tasks | In Tasks |
| HOME-02 | P1: Tela inicial — lista e ordenação | In Tasks | In Tasks |
| GRAF-01 | P1: Gráficos — anual | In Tasks | In Tasks |
| GRAF-02 | P1: Gráficos — por banco | In Tasks | In Tasks |
| SAL-01 | P1: Atualizar salário | In Tasks | In Tasks |
| NAV-01 | P1: Navegação e layout | In Tasks | Implementing |
| UNDO-01 | P2: Desfazer pagamento | In Tasks | In Tasks |

**Coverage:** 22 total, 22 mapped to tasks, 0 unmapped

---

## Open Questions (TODO)

- [ ] AUTH-03: confirmar se time-box de sessão (30 dias) do Supabase Auth está disponível no plano; senão, aplicar limite via proxy/middleware da aplicação.
- [ ] Verificar compatibilidade de `@supabase/ssr`, Recharts e shadcn/ui com Next 16 / React 19 / Tailwind 4.

---

## Success Criteria

- [ ] Usuário novo completa cadastro → onboarding → 1º pagamento em < 3 minutos.
- [ ] Sobra exibida sempre igual a salário do mês − soma dos pagamentos do mês.
- [ ] Todas as telas utilizáveis em 375px de largura sem scroll horizontal.
- [ ] Nenhum usuário acessa dados de outro (RLS validado).
