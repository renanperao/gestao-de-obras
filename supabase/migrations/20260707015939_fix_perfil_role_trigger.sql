-- Mantem a protecao de papel depois que os helpers de RLS foram movidos
-- para o schema private no hardening dos advisors.
create or replace function public.bloquear_mudanca_papel()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.papel is distinct from old.papel and (select auth.uid()) is not null then
    if not private.eh_admin() then
      raise exception 'Apenas administradores podem alterar o papel de um usuario';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.bloquear_mudanca_papel() from anon, authenticated, public;
