-- Paga a fatura de um banco no mês corrente, somando os avulsos do banco no mês.
-- p_items: [{ card_item_id, included, pause? }]
-- Recorrente incluído → ativo (reativa pausado); excluído + pause → pausado; parcelado → -1 mês (encerra em 0).
-- Avulsos: sempre incluídos, valores lidos do banco; ficam imutáveis enquanto a fatura estiver paga (trigger).
create or replace function public.pay_card(p_bank_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_total integer;
  v_included_count integer;
  v_purchases_total integer;
  v_purchases_count integer;
  v_payment_id uuid;
begin
  -- Trava o banco: avulso novo (trigger `for share`) espera o pagamento terminar
  perform 1 from public.banks where id = p_bank_id and user_id = v_user_id for update;

  if not found then
    raise exception 'Banco não encontrado.';
  end if;

  perform 1
  from public.card_items
  where user_id = v_user_id and bank_id = p_bank_id and ended_at is null
  for update;

  select coalesce(sum(amount_cents) filter (where included), 0), count(*) filter (where included)
  into v_total, v_included_count
  from public.card_selection(v_user_id, p_bank_id, p_items);

  select coalesce(sum(amount_cents), 0), count(*)
  into v_purchases_total, v_purchases_count
  from public.card_purchases
  where user_id = v_user_id and bank_id = p_bank_id and month = public.current_month();

  if v_included_count + v_purchases_count = 0 then
    raise exception 'Selecione ao menos um item.';
  end if;

  v_payment_id := public.insert_payment(v_user_id, 'card', null, p_bank_id, v_total + v_purchases_total);

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
