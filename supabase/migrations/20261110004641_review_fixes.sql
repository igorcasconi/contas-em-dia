-- Leituras de payments filtram por (user_id, month) sem `kind`: os índices parciais não servem.
create index payments_user_id_month_idx on public.payments (user_id, month);

-- Perfil só é criado pelo onboarding (RPC security definer), que também grava o salário.
drop policy "profiles: insert own" on public.profiles;
revoke insert on public.profiles from authenticated;

-- Limite de tamanho dos nomes (também validado no Zod).
alter table public.profiles add constraint profiles_name_length check (length(name) <= 100);
alter table public.categories add constraint categories_name_length check (length(name) <= 100);
alter table public.banks add constraint banks_name_length check (length(name) <= 100);
alter table public.bills add constraint bills_name_length check (length(name) <= 100);
alter table public.card_items add constraint card_items_name_length check (length(name) <= 100);

-- Desfazer só reverte o que o próprio pagamento mudou. Alterações posteriores
-- (item removido, parcelas editadas) são preservadas.
create or replace function public.undo_payment(p_payment_id uuid)
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
    -- Parcela: só volta se ainda está no valor que o pagamento deixou
    remaining_months = case
      when item.remaining_months = snapshot.prev_remaining_months - 1 then snapshot.prev_remaining_months
      else item.remaining_months
    end,
    -- Reabre apenas o que o pagamento encerrou (última parcela)
    ended_at = case
      when snapshot.prev_remaining_months = 1 and item.remaining_months = 0 then snapshot.prev_ended_at
      else item.ended_at
    end
  from public.payment_items snapshot
  where snapshot.payment_id = v_payment.id
    and item.id = snapshot.card_item_id
    -- Item encerrado depois do pagamento (removido pelo usuário) fica encerrado
    and (item.ended_at is null or (snapshot.prev_remaining_months = 1 and item.remaining_months = 0));

  delete from public.payments where id = v_payment.id;
end;
$$;
