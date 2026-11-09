# Testing

## Ferramentas

| Tipo | Ferramenta | Ambiente |
| --- | --- | --- |
| unit | Vitest (project `unit`) | Node, sem rede |
| integration | Vitest (project `integration`) | Supabase local (`npx supabase start`, requer Docker) |
| e2e | Playwright | `next dev` + Supabase local |

## Test Coverage Matrix

| Camada | Tipo exigido | Observação |
| --- | --- | --- |
| `shared/utils/*` | unit | Funções puras |
| `shared/helpers/*` — funções puras (ex: `mapDbError`, `isSessionExpired`) | unit | |
| `shared/helpers/supabase/*` — wrappers de client | none | Wrapper de lib; exercitado pelos e2e |
| `shared/components/*` | none | UI; validado nos e2e das telas que usam |
| `domains/*/schemas` | unit | Casos válidos e inválidos |
| `domains/*/services` — lógica pura (builders, cálculos) | unit | Extrair lógica pura de queries |
| `domains/*/services` — queries Supabase | none | Coberto por integration (DB) + e2e |
| `domains/*/actions` | none | Orquestração fina: Zod → rpc/query → `refresh()`; comportamento coberto por schema unit + DB integration + e2e da tela |
| `domains/*/components` + `app/**` (telas) | e2e | 1 fluxo e2e por fatia de UI |
| `supabase/migrations` (tabelas, RLS, RPC) | integration | RLS: usuário A não lê/escreve dados de B |
| Config / tooling | none | Gate = build |

## Gate Commands

| Gate | Comando |
| --- | --- |
| quick | `npm run lint && npx tsc --noEmit && npx vitest run --project unit` |
| full | quick + `npx vitest run --project integration` + `npm run build` |
| e2e | `npx playwright test` |

## Parallel Safety

- unit: parallel-safe.
- integration: **não** parallel-safe entre tasks (banco local compartilhado) — cada teste cria usuários próprios e limpa ao final.
- e2e: **não** parallel-safe entre tasks (servidor + banco compartilhados).
