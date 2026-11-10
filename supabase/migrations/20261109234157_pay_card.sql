-- Decisão efetiva por item aberto do banco, a partir da seleção enviada pelo cliente.
-- Parcelado: sempre incluído. Valores sempre lidos do cadastro.
create function public.card_selection(p_user_id uuid, p_bank_id uuid, p_items jsonb)
returns table (
  card_item_id uuid,
  amount_cents integer,
  status text,
  remaining_months integer,
  ended_at timestamptz,
  included boolean,
  pause boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    item.id,
    item.amount_cents,
    item.status,
    item.remaining_months,
    item.ended_at,
    item.remaining_months is not null or coalesce((choice.value ->> 'included')::boolean, false),
    coalesce((choice.value ->> 'pause')::boolean, false)
  from public.card_items item
  left join lateral (
    select value
    from jsonb_array_elements(p_items)
    where (value ->> 'card_item_id')::uuid = item.id
    limit 1
  ) choice on true
  where item.user_id = p_user_id
    and item.bank_id = p_bank_id
    and item.ended_at is null
$$;

revoke execute on function public.card_selection(uuid, uuid, jsonb) from public, anon, authenticated;

-- Paga a fatura de um banco no mês corrente.
-- p_items: [{ card_item_id, included, pause? }]
-- Recorrente incluído → ativo (reativa pausado); excluído + pause → pausado; parcelado → -1 mês (encerra em 0).
create function public.pay_card(p_bank_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_total integer;
  v_included_count integer;
  v_payment_id uuid;
begin
  if not exists (select 1 from public.banks where id = p_bank_id and user_id = v_user_id) then
    raise exception 'Banco não encontrado.';
  end if;

  perform 1
  from public.card_items
  where user_id = v_user_id and bank_id = p_bank_id and ended_at is null
  for update;

  select coalesce(sum(amount_cents) filter (where included), 0), count(*) filter (where included)
  into v_total, v_included_count
  from public.card_selection(v_user_id, p_bank_id, p_items);

  if v_included_count = 0 then
    raise exception 'Selecione ao menos um item.';
  end if;

  v_payment_id := public.insert_payment(v_user_id, 'card', null, p_bank_id, v_total);

  insert into public.payment_items (
    user_id, payment_id, card_item_id, included, amount_cents, prev_status, prev_remaining_months, prev_ended_at
  )
  select v_user_id, v_payment_id, card_item_id, included, amount_cents, status, remaining_months, ended_at
  from public.card_selection(v_user_id, p_bank_id, p_items);

  update public.card_items item
  set
    remaining_months = selection.remaining_months - 1,
    ended_at = case when selection.remaining_months = 1 then now() else item.ended_at end,
    status = case
      when selection.included then 'active'
      when selection.pause then 'paused'
      else item.status
    end
  from public.card_selection(v_user_id, p_bank_id, p_items) selection
  where item.id = selection.card_item_id;

  return v_payment_id;
end;
$$;

revoke execute on function public.pay_card(uuid, jsonb) from public, anon;
grant execute on function public.pay_card(uuid, jsonb) to authenticated;
