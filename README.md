# Contas em Dia

App web mobile-first para controlar os pagamentos prioritários do mês (boletos e faturas de cartão de crédito) e ver **quanto sobra do salário**.

O usuário cadastra uma vez suas recorrências e, a cada mês, registra o que pagou. A tela inicial mostra salário líquido, sobra, pendências e gráficos.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Deploy](#deploy)
- [Regras de negócio](#regras-de-negócio)
- [Arquitetura e convenções](#arquitetura-e-convenções)
- [Workflow de desenvolvimento (SDD)](#workflow-de-desenvolvimento-sdd)

---

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, `cacheComponents`, `proxy.ts`) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix), lucide-react |
| Gráficos | Recharts |
| Validação | Zod 4 |
| Banco e auth | Supabase (Postgres + Auth), `@supabase/ssr` + `supabase-js` |
| Segurança de dados | Row Level Security por usuário, RPCs `security definer` |
| Migrations e types | Supabase CLI (SQL versionado, types gerados) |
| Testes | Vitest (unit + integration), Playwright (e2e mobile + desktop) |
| Linguagem | TypeScript |
| Runtime | Node.js 22.16.0 (`.nvmrc`) |
| Hospedagem | Vercel + Supabase |

Fontes: **DM Sans** (texto) e **Space Grotesk** (títulos), via `next/font/google`.

---

## Como executar

### Pré-requisitos

- **Node.js 22.16.0**. Use `nvm use`, que lê o `.nvmrc`. O Node 20 não serve, porque falta `Map.groupBy`.
- **Docker** rodando, para o Supabase local.
- **npm**.

### 1. Instalar dependências

```bash
nvm use
npm install
```

### 2. Subir o Supabase local

```bash
npx supabase start   # sobe Postgres, Auth e Studio no Docker e aplica supabase/migrations
npx supabase status  # mostra a URL da API e as chaves locais
```

| Serviço | URL |
| --- | --- |
| API | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

A confirmação de email está desligada no ambiente local e no MVP.

### 3. Variáveis de ambiente

Crie o `.env.development.local` com os valores de `npx supabase status`. Esse arquivo é usado por `next dev`, pelos testes de integração e pelos e2e, e tem prioridade sobre o `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key local>

# Só testes (admin API local). Nunca usar no código da app.
SUPABASE_SECRET_KEY=<secret key local>
```

O [`.env.example`](.env.example) lista as variáveis de produção:

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (exposta ao browser) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (exposta ao browser) |
| `SUPABASE_PROJECT_REF` | Só para a CLI (`link`, `db push`, `gen types`) |
| `SUPABASE_DB_PASSWORD` | Só para a CLI |

Todos os arquivos `.env*` ficam fora do git, exceto o `.env.example`.

### 4. Rodar

```bash
npm run dev
```

Abra http://localhost:3000. Visitante vê a landing. Crie uma conta, faça o onboarding (nome e salário) e use o app.

### Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários |
| `npm run test:int` | Testes de integração (precisa do Supabase local) |
| `npm run test:e2e` | E2E com Playwright (precisa do Supabase local) |
| `npm run db:types` | Regera `shared/types/database.ts` a partir do schema |

---

## Testes

| Tipo | Ferramenta | Cobre |
| --- | --- | --- |
| unit | Vitest (`*.test.ts`) | Utils, helpers puros, schemas Zod, builders e cálculos dos services |
| integration | Vitest (`*.int.test.ts`) | Migrations, RLS (usuário A não lê nem escreve dados de B), RPCs |
| e2e | Playwright (`e2e/`) | Um fluxo por tela, nos projetos `mobile` (Pixel 7) e `desktop` (1280px) |

```bash
npm run lint && npm run typecheck && npm test   # gate rápido
npm run test:int && npm run build               # gate completo
npm run test:e2e                                # e2e
```

- Integration e e2e **não** rodam em paralelo, porque compartilham o banco local. Cada teste cria o próprio usuário e o remove no final.
- O Playwright reaproveita o `next dev` que já estiver na porta 3000. Esse servidor precisa estar rodando em Node 22.
- O e2e falha se a página tiver erro não tratado (`pageerror`).

---

## Deploy

1. Crie um projeto no Supabase e preencha `SUPABASE_PROJECT_REF` e `SUPABASE_DB_PASSWORD` no `.env.local`.
2. Aplique as migrations:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   Cada nova migration precisa ir para produção **antes** do deploy do código que depende dela. Se não for, a API do Supabase devolve `PGRST205` (tabela não encontrada).
3. Na Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e use Node 22.

---

## Regras de negócio

### Conceitos

- **Recorrência**: boleto ou item de cartão que se repete todo mês (tela Recorrências).
- **Pagamento do mês**: registro de que a recorrência foi paga no mês corrente (feito pela tela Início).
- **Compra avulsa**: compra à vista no crédito, válida só no mês em que foi cadastrada (tela Avulsos).
- Valores são guardados como **inteiros em centavos**.
- O mês corrente é calculado no fuso **America/Sao_Paulo**. Todo mês começa com tudo "não pago". O app só opera no mês corrente.

### Conta e sessão

- Cadastro com email e senha, sem confirmação de email.
- Sessão com refresh token rotacionado e **limite de 30 dias desde o login**. Depois disso o usuário precisa entrar de novo.
- Fluxo: cadastro → onboarding (nome + salário líquido > 0) → Início.
- Sem sessão, as rotas protegidas redirecionam para `/login`. Quem não fez o onboarding é levado para `/onboarding`.
- Visitante em `/` vê a landing, que é um rewrite e mantém a URL. Usuário logado em `/inicio` é redirecionado para `/`.

### Tipos e bancos (Configurações)

- **Tipos** classificam boletos, itens de cartão e avulsos, e são compartilhados entre eles. **Bancos** agrupam a fatura do cartão.
- O nome é obrigatório e não pode repetir (sem diferenciar maiúsculas de minúsculas).
- Não é possível excluir um tipo ou banco em uso. O sistema bloqueia e mostra o motivo.

### Boletos recorrentes

- **Valor fixo**: valor obrigatório no cadastro, maior que 0.
- **Valor variável**: sem valor no cadastro; o valor é informado na hora de pagar.
- Remover um boleto encerra a recorrência. O histórico de pagamentos continua nos gráficos (soft delete).

### Itens recorrentes do cartão

- Têm nome, tipo, banco e valor mensal. Podem ser **sempre recorrentes** ou **parcelados**, com meses restantes ≥ 1.
- Cada pagamento confirmado desconta 1 mês das parcelas. Quando chega a 0, o item é encerrado.
- Um item recorrente pode estar **ativo**, **pausado** ou **removido**. Removido encerra a recorrência e mantém o histórico.

### Compras avulsas

- Têm descrição (até 100 caracteres), banco, tipo e valor maior que 0. Não têm data, porque o mês é atribuído automaticamente.
- Sempre são à vista no crédito. Não existe avulso parcelado nem fora do cartão.
- Entram na fatura do banco na Início, com o badge "Avulso", e somam no total. Um banco que só tem avulsos também gera fatura.
- **Fatura já paga no mês bloqueia** adicionar, editar e excluir avulsos daquele banco. A regra é aplicada no banco de dados.
- Avulsos não pagos **não passam** para o mês seguinte.

### Registrar pagamento (Início › Adicionar pagamento)

- **Boleto**: só aparecem boletos ativos ainda não pagos no mês. Boleto fixo mostra o valor cadastrado. Boleto variável pede o valor do mês.
- **Cartão**: escolha o banco e confira o checklist da fatura.
  - Itens ativos vêm marcados. Itens recorrentes podem ser desmarcados, e aí ficam fora só deste mês.
  - **Pausar** tira o item deste mês. Nos meses seguintes ele aparece desmarcado com o badge "pausado". Marcar de novo um item pausado paga o item e reativa a recorrência.
  - **Parcelas e avulsos ficam sempre incluídos**, travados.
  - O total é a soma dos itens marcados. Com total zero, não dá para confirmar.
- Os valores pagos são lidos do banco de dados, nunca do cliente, e ficam gravados no pagamento. Editar a recorrência depois não muda um pagamento já feito.
- Pagar duas vezes o mesmo boleto ou banco no mês, por exemplo em duas abas, é rejeitado.
- Se der erro de rede ou de servidor, o modal continua aberto com os dados e a mensagem de erro.

### Desfazer pagamento

- Disponível só no mês corrente, com confirmação. Não existe edição: para corrigir, desfaça e pague de novo.
- Desfazer devolve as parcelas descontadas (reabrindo itens que tinham sido encerrados), volta itens reativados ao estado de pausado e marca a linha como "não pago" de novo.

### Salário e sobra

- **Sobra = salário do mês − total pago no mês.** Pendências não entram na conta, e a sobra pode ficar negativa.
- O salário só pode ser alterado se **não houver pagamento no mês atual**. A alteração tem um modal de confirmação e vale do mês atual em diante. Os meses anteriores ficam como estavam.

### Tela Início

- Mostra o salário, a sobra e uma lista com uma linha por boleto e uma linha por banco. A linha do banco abre para mostrar os itens.
- Ordem da lista: **não pagos primeiro**, depois por valor decrescente.
- Gráfico 1: total pago por mês, de janeiro a dezembro do ano atual.
- Gráfico 2: total pago por banco no mês atual.
- Recorrências encerradas continuam contando nos meses em que foram pagas.

### Navegação e layout

- Menu com **Início · Recorrências** (abas Boletos e Cartão) **· Avulsos · Configurações** (Tipos, Bancos e Perfil com logout).
- No mobile há uma barra de topo de 32px com a logo e uma bottom nav fixa. No desktop há uma sidebar.
- O layout não pode ter scroll lateral a partir de 360px.
- Os cadastros são feitos em modais. O modal de pagamento tem altura máxima de `100dvh - 60px`, e só a lista de itens do cartão rola.
- Tema único claro: fundo `#F9F7F1` e identidade navy `#0F1E36`. A landing pública é toda em navy.

---

## Arquitetura e convenções

Organização por domínio:

```
app/                 # Só view: rotas, layouts, pages, loading/error
domains/<dominio>/   # auth, banks, bills, card-items, card-purchases, categories,
  actions/           #   dashboard, landing, payments, profile, salary
  components/
  schemas/           # Zod; types derivados com z.infer
  services/          # Regras de negócio e acesso a dados
shared/
  components/        # Reutilizáveis (inclui ui/ do shadcn)
  helpers/           # Auxiliares com contexto da aplicação
  utils/             # Funções puras e genéricas
  types/             # Inclui database.ts (gerado)
supabase/
  migrations/        # SQL versionado
  tests/             # Testes de integração do banco
e2e/                 # Playwright
.specs/              # Specs, decisões e reviews de cada feature
```

### Regras

- **`app/` é só view.** Não pode ter regra de negócio, validação, acesso direto a dados nem Server Action inline.
- **Os domínios são independentes.** Um domínio não importa os detalhes internos de outro. Código usado por mais de um domínio vai para `shared/`.
- **`shared/` nunca importa de `domains/`.**
- Imports sempre pelos aliases `@/domains/...` e `@/shared/...`.
- **Server Component por padrão.** Use `"use client"` só quando precisar de estado, efeito, evento ou API do browser, e o mais baixo possível na árvore.
- As mutações passam por Server Actions em `domains/<d>/actions/`, no fluxo Zod → RPC/query → `refresh()`.
- Antes de criar algo, procure se já existe. Extraia só duplicação real, sem abstração especulativa.
- O Next.js 16 tem breaking changes. Consulte `node_modules/next/dist/docs/` antes de usar qualquer API.

### Banco de dados

- Toda tabela tem **RLS** por `user_id`. FKs compostas `(id, user_id)` impedem referenciar dados de outro usuário.
- Operações que precisam ser atômicas, como pagar, desfazer e alterar salário, são **RPCs `security definer`** com `search_path = ''` e locks (`for update` / `for share`).
- As regras críticas (fatura paga, pagamento duplicado, salário bloqueado) são aplicadas **no banco**, não só na UI.

---

## Workflow de desenvolvimento (SDD)

As features seguem um fluxo orientado a especificação, e os artefatos ficam em `.specs/features/<feature>/`:

```
interview → specify → design → taskify → execute → review → commit/publish
```

| Etapa | Artefato |
| --- | --- |
| interview | `context.md` (decisões) |
| specify | `spec.md` (critérios WHEN/THEN/SHALL e rastreabilidade) |
| design | `design.md` (arquitetura, quando necessário) |
| taskify | `tasks.md` (tarefas atômicas, quando necessário) |
| review | `review.md` (6 revisores: segurança, requisitos, testes, arquitetura, regressão e performance) |

Convenções de teste: [`.specs/codebase/TESTING.md`](.specs/codebase/TESTING.md). Commits seguem o [Conventional Commits](https://www.conventionalcommits.org).
