-- O trigger (security definer) roda antes do WITH CHECK da RLS: recusa insert em nome de
-- outro usuário antes de consultar banco/fatura, para não revelar status nem nome do banco.
create or replace function public.card_purchases_guard()
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
    -- service_role (seeds/manutenção) pode gravar outro mês e outro usuário
    if (select auth.role()) is distinct from 'service_role' then
      if new.user_id is distinct from (select auth.uid()) then
        raise exception 'Acesso negado.' using errcode = '42501';
      end if;
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
