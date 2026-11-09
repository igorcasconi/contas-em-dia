-- Tipos de pagamento (compartilhados por boletos e itens de cartão)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create unique index categories_user_id_name_key on public.categories (user_id, lower(name));

alter table public.categories enable row level security;

create policy "categories: select own" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "categories: insert own" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "categories: update own" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories: delete own" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.categories to authenticated;

-- Bancos dos cartões de crédito
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create unique index banks_user_id_name_key on public.banks (user_id, lower(name));

alter table public.banks enable row level security;

create policy "banks: select own" on public.banks
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "banks: insert own" on public.banks
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "banks: update own" on public.banks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "banks: delete own" on public.banks
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.banks to authenticated;
