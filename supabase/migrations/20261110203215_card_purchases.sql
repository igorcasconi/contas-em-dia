-- Compras avulsas no cartão: entram na fatura do banco no mês em que foram cadastradas
create table public.card_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month date not null default public.current_month() check (extract(day from month) = 1),
  bank_id uuid not null,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0 and length(name) <= 100),
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  constraint card_purchases_bank_fkey foreign key (bank_id, user_id)
    references public.banks (id, user_id) on delete restrict,
  constraint card_purchases_category_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete restrict
);

create index card_purchases_user_month_bank_idx on public.card_purchases (user_id, month, bank_id);

alter table public.card_purchases enable row level security;

create policy "card_purchases: select own" on public.card_purchases
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "card_purchases: insert own" on public.card_purchases
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "card_purchases: update own" on public.card_purchases
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "card_purchases: delete own" on public.card_purchases
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.card_purchases to authenticated;

-- Recusa escrita em avulso de banco com fatura do mês já paga.
-- `for share` no banco serializa com `pay_card` (que trava o banco `for update`).
create function public.assert_card_invoice_open(p_user_id uuid, p_bank_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bank_name text;
begin
  select name into v_bank_name
  from public.banks
  where id = p_bank_id and user_id = p_user_id
  for share;

  if exists (
    select 1
    from public.payments
    where user_id = p_user_id
      and kind = 'card'
      and bank_id = p_bank_id
      and month = public.current_month()
  ) then
    raise exception 'A fatura do % deste mês já foi paga. Desfaça o pagamento na Início para alterar.', v_bank_name;
  end if;
end;
$$;

revoke execute on function public.assert_card_invoice_open(uuid, uuid) from public, anon, authenticated;

-- Mês automático e imutável; só avulsos do mês atual mudam; fatura paga trava o banco.
create function public.card_purchases_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Exclusão em cascata do usuário: o usuário já não existe, nada a proteger
  if tg_op = 'DELETE' and not exists (select 1 from auth.users where id = old.user_id) then
    return old;
  end if;

  if tg_op = 'INSERT' then
    -- service_role (seeds/manutenção) pode gravar outro mês
    if (select auth.role()) is distinct from 'service_role' then
      new.month := public.current_month();
    end if;
  else
    if old.month <> public.current_month() then
      raise exception 'Só é possível alterar avulsos do mês atual.';
    end if;
    perform public.assert_card_invoice_open(old.user_id, old.bank_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if tg_op = 'UPDATE' then
    new.month := old.month;
    new.user_id := old.user_id;
    if new.bank_id = old.bank_id then
      return new;
    end if;
  end if;

  perform public.assert_card_invoice_open(new.user_id, new.bank_id);
  return new;
end;
$$;

revoke execute on function public.card_purchases_guard() from public, anon, authenticated;

create trigger card_purchases_guard
  before insert or update or delete on public.card_purchases
  for each row execute function public.card_purchases_guard();
