-- Salário só é gravado pelas RPCs (onboarding e update_salary), que aplicam as regras.
drop policy "salaries: insert own" on public.salaries;
drop policy "salaries: update own" on public.salaries;
revoke insert, update on public.salaries from authenticated;

-- Recriada como security definer: precisa gravar o salário inicial sem permissão direta na tabela.
create or replace function public.complete_onboarding(p_name text, p_amount_cents integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Sessão inválida.';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Onboarding já concluído.';
  end if;

  insert into public.profiles (id, name)
  values (v_user_id, trim(p_name));

  insert into public.salaries (user_id, amount_cents, effective_month)
  values (v_user_id, p_amount_cents, public.current_month());
end;
$$;

-- Novo salário vale do mês corrente em diante. Bloqueado se já houver pagamento no mês.
create function public.update_salary(p_amount_cents integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if coalesce(p_amount_cents, 0) <= 0 then
    raise exception 'Informe um valor maior que zero.';
  end if;

  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Onboarding não concluído.';
  end if;

  if exists (select 1 from public.payments where user_id = v_user_id and month = public.current_month()) then
    raise exception 'Desfaça os pagamentos do mês para alterar o salário.';
  end if;

  insert into public.salaries (user_id, amount_cents, effective_month)
  values (v_user_id, p_amount_cents, public.current_month())
  on conflict (user_id, effective_month) do update set amount_cents = excluded.amount_cents;
end;
$$;

revoke execute on function public.update_salary(integer) from public, anon;
grant execute on function public.update_salary(integer) to authenticated;
