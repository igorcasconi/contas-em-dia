-- Permite FKs compostas (id, user_id): impede referenciar registro de outro usuário (FK ignora RLS)
alter table public.categories add constraint categories_id_user_id_key unique (id, user_id);
alter table public.banks add constraint banks_id_user_id_key unique (id, user_id);

-- Boletos recorrentes
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  value_mode text not null check (value_mode in ('fixed', 'variable')),
  amount_cents integer,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bills_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint bills_amount_matches_mode check (
    (value_mode = 'fixed' and amount_cents is not null and amount_cents > 0)
    or (value_mode = 'variable' and amount_cents is null)
  )
);

create index bills_user_id_idx on public.bills (user_id);

alter table public.bills enable row level security;

create policy "bills: select own" on public.bills
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "bills: insert own" on public.bills
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "bills: update own" on public.bills
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Sem delete: recorrência é encerrada via ended_at (histórico preservado)
grant select, insert, update on public.bills to authenticated;

-- Itens recorrentes/parcelados do cartão
create table public.card_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  bank_id uuid not null,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  amount_cents integer not null check (amount_cents > 0),
  -- null = sempre recorrente; 0 = parcelamento concluído
  remaining_months integer check (remaining_months >= 0),
  status text not null default 'active' check (status in ('active', 'paused')),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint card_items_bank_fkey foreign key (bank_id, user_id)
    references public.banks (id, user_id) on delete restrict,
  constraint card_items_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict,
  constraint card_items_installment_not_paused check (remaining_months is null or status = 'active')
);

create index card_items_user_id_bank_id_idx on public.card_items (user_id, bank_id);

alter table public.card_items enable row level security;

create policy "card_items: select own" on public.card_items
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "card_items: insert own" on public.card_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "card_items: update own" on public.card_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.card_items to authenticated;
