-- Mês corrente no fuso de São Paulo (fonte única para escritas no banco)
create function public.current_month()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'America/Sao_Paulo')::date
$$;

-- Perfil do usuário (criado no onboarding)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, insert, update on public.profiles to authenticated;

-- Salário vigente a partir de effective_month (histórico por mês)
create table public.salaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  effective_month date not null check (extract(day from effective_month) = 1),
  created_at timestamptz not null default now(),
  unique (user_id, effective_month)
);

alter table public.salaries enable row level security;

create policy "salaries: select own" on public.salaries
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "salaries: insert own" on public.salaries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "salaries: update own" on public.salaries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.salaries to authenticated;

-- Onboarding: perfil + salário do mês corrente, atômico
create function public.complete_onboarding(p_name text, p_amount_cents integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = (select auth.uid())) then
    raise exception 'Onboarding já concluído.';
  end if;

  insert into public.profiles (id, name)
  values ((select auth.uid()), trim(p_name));

  insert into public.salaries (user_id, amount_cents, effective_month)
  values ((select auth.uid()), p_amount_cents, public.current_month());
end;
$$;

revoke execute on function public.complete_onboarding(text, integer) from public, anon;
grant execute on function public.complete_onboarding(text, integer) to authenticated;
