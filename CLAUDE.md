@AGENTS.md

# Contas em Dia — Regras de Desenvolvimento

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Alias `@/*` aponta para a raiz do projeto.

## Arquitetura

Separação por domínio. Estrutura base:

```
app/                      # Apenas view: rotas, layouts, pages, loading/error
domains/
  <dominio>/              # ex: contas, usuarios, pagamentos
    actions/              # Server Actions do domínio ("use server")
    components/           # Componentes específicos do domínio
    schemas/              # Schemas de validação do domínio
    types/                # Types/interfaces exclusivos do domínio
    services/             # Regras de negócio e acesso a dados (se necessário)
shared/
  components/             # Componentes reutilizáveis entre domínios
  helpers/                # Funções auxiliares com contexto de aplicação
  utils/                  # Funções puras e genéricas (formatação, datas, etc.)
  types/                  # Types/interfaces compartilhados
```

### Regras de domínio

- Cada domínio é autocontido: actions, components, schemas e types próprios ficam dentro de `domains/<dominio>/`.
- Crie apenas as subpastas que o domínio realmente usa.
- Domínio não importa internals de outro domínio. Se dois domínios precisam do mesmo código, mova para `shared/`.
- Imports sempre via alias: `@/domains/...`, `@/shared/...`.

### Regras de `shared/`

- `shared/` contém apenas código usado por **mais de um** domínio ou pela camada `app/`.
- `shared/` nunca importa de `domains/`.
- `utils/` = funções puras, sem dependência de domínio. `helpers/` = auxiliares ligados ao contexto da aplicação.

### Regras de `app/`

- `app/` é **somente view**: compõe componentes de domínio/shared e define rotas.
- Proibido em `app/`: regra de negócio, validação, acesso direto a dados, cálculos, Server Actions inline.
- Pages buscam dados chamando funções de `domains/<dominio>/` e repassam para componentes.

## Server vs Client Components

- Padrão: **Server Component**.
- Use `"use client"` apenas quando necessário: estado (`useState`, `useReducer`), efeitos, event handlers, APIs do browser, libs client-only.
- Mantenha a fronteira client o mais baixa possível na árvore: extraia só a parte interativa para um Client Component pequeno, mantendo o restante no servidor.
- Nunca marque uma page ou layout inteiro como client sem justificativa.
- Mutações via Server Actions em `domains/<dominio>/actions/`.

## Evitar duplicação

- Antes de criar type, interface, helper, util ou componente: **procure se já existe** em `shared/` ou no domínio.
- Código repetido em 2+ domínios → extraia para `shared/`.
- Derive types a partir dos schemas (ex: `z.infer<typeof schema>`) em vez de redeclarar manualmente.
- Não crie abstrações especulativas: extraia apenas duplicação real.
- Ao criar algo novo, avalie se deve nascer como compartilhado.

## Antes de escrever código

- Consulte `node_modules/next/dist/docs/` para APIs do Next.js — esta versão tem breaking changes.
- Siga o estilo e as convenções já existentes no projeto.
