-- Desfaz um pagamento do mês corrente, restaurando o estado dos itens do cartão pelo snapshot.
create function public.undo_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_payment public.payments;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  if v_payment.month <> public.current_month() then
    raise exception 'Só é possível desfazer pagamentos do mês atual.';
  end if;

  update public.card_items item
  set
    status = snapshot.prev_status,
    remaining_months = snapshot.prev_remaining_months,
    ended_at = snapshot.prev_ended_at
  from public.payment_items snapshot
  where snapshot.payment_id = v_payment.id
    and item.id = snapshot.card_item_id;

  delete from public.payments where id = v_payment.id;
end;
$$;

revoke execute on function public.undo_payment(uuid) from public, anon;
grant execute on function public.undo_payment(uuid) to authenticated;
