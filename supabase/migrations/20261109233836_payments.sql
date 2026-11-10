-- FKs compostas (id, user_id) a partir de payments/payment_items
alter table public.bills add constraint bills_id_user_id_key unique (id, user_id);
alter table public.card_items add constraint card_items_id_user_id_key unique (id, user_id);

-- Pagamento do mês: um por boleto ou um por banco (fatura)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1),
  kind text not null check (kind in ('bill', 'card')),
  bill_id uuid,
  bank_id uuid,
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  constraint payments_id_user_id_key unique (id, user_id),
  constraint payments_bill_fkey foreign key (bill_id, user_id) references public.bills (id, user_id),
  constraint payments_bank_fkey foreign key (bank_id, user_id) references public.banks (id, user_id),
  constraint payments_kind_target check (
    (kind = 'bill' and bill_id is not null and bank_id is null)
    or (kind = 'card' and bank_id is not null and bill_id is null)
  )
);

create unique index payments_bill_month_key on public.payments (user_id, month, bill_id) where kind = 'bill';
create unique index payments_bank_month_key on public.payments (user_id, month, bank_id) where kind = 'card';

-- Itens da fatura no momento do pagamento: histórico + snapshot para desfazer
create table public.payment_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  payment_id uuid not null,
  card_item_id uuid not null,
  included boolean not null,
  amount_cents integer not null check (amount_cents > 0),
  prev_status text not null,
  prev_remaining_months integer,
  prev_ended_at timestamptz,
  constraint payment_items_payment_fkey foreign key (payment_id, user_id)
    references public.payments (id, user_id) on delete cascade,
  constraint payment_items_card_item_fkey foreign key (card_item_id, user_id)
    references public.card_items (id, user_id)
);

create index payment_items_payment_id_idx on public.payment_items (payment_id);

-- Leitura própria; escrita só pelas RPCs (security definer)
alter table public.payments enable row level security;
alter table public.payment_items enable row level security;

create policy "payments: select own" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "payment_items: select own" on public.payment_items
  for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.payments to authenticated;
grant select on public.payment_items to authenticated;

-- Insere o pagamento; duplicidade no mês vira mensagem para o usuário
create function public.insert_payment(
  p_user_id uuid,
  p_kind text,
  p_bill_id uuid,
  p_bank_id uuid,
  p_total_cents integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment_id uuid;
begin
  insert into public.payments (user_id, month, kind, bill_id, bank_id, total_cents)
  values (p_user_id, public.current_month(), p_kind, p_bill_id, p_bank_id, p_total_cents)
  returning id into v_payment_id;

  return v_payment_id;
exception
  when unique_violation then
    raise exception 'Este pagamento já foi registrado.';
end;
$$;

revoke execute on function public.insert_payment(uuid, text, uuid, uuid, integer) from public, anon, authenticated;

-- Paga um boleto no mês corrente. Fixo usa o valor do cadastro; variável exige valor > 0.
create function public.pay_bill(p_bill_id uuid, p_amount_cents integer default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_bill public.bills;
begin
  select * into v_bill
  from public.bills
  where id = p_bill_id and user_id = v_user_id and ended_at is null;

  if not found then
    raise exception 'Boleto não encontrado.';
  end if;

  if v_bill.value_mode = 'variable' and coalesce(p_amount_cents, 0) <= 0 then
    raise exception 'Informe um valor maior que zero.';
  end if;

  return public.insert_payment(
    v_user_id,
    'bill',
    v_bill.id,
    null,
    case when v_bill.value_mode = 'fixed' then v_bill.amount_cents else p_amount_cents end
  );
end;
$$;

revoke execute on function public.pay_bill(uuid, integer) from public, anon;
grant execute on function public.pay_bill(uuid, integer) to authenticated;
