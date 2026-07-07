-- ============================================================
-- Fase 0 - Hardening dos advisors e grants explicitos
-- - Move helpers SECURITY DEFINER de RLS para schema nao exposto.
-- - Remove listagem ampla do bucket publico de branding.
-- - Explicita grants para o Data API em projetos Supabase novos.
-- ============================================================

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- As policies dependem do OID das funcoes; mover o schema preserva essa
-- dependencia e tira as helpers da superficie RPC do schema public.
do $$
begin
  if to_regprocedure('public.eh_admin()') is not null
     and to_regprocedure('private.eh_admin()') is null then
    execute 'alter function public.eh_admin() set schema private';
  end if;

  if to_regprocedure('public.eh_equipe()') is not null
     and to_regprocedure('private.eh_equipe()') is null then
    execute 'alter function public.eh_equipe() set schema private';
  end if;

  if to_regprocedure('public.eh_membro_da_obra(uuid)') is not null
     and to_regprocedure('private.eh_membro_da_obra(uuid)') is null then
    execute 'alter function public.eh_membro_da_obra(uuid) set schema private';
  end if;

  if to_regprocedure('public.eh_equipe_da_obra(uuid)') is not null
     and to_regprocedure('private.eh_equipe_da_obra(uuid)') is null then
    execute 'alter function public.eh_equipe_da_obra(uuid) set schema private';
  end if;

  if to_regprocedure('public.eh_cliente_da_obra(uuid)') is not null
     and to_regprocedure('private.eh_cliente_da_obra(uuid)') is null then
    execute 'alter function public.eh_cliente_da_obra(uuid) set schema private';
  end if;

  if to_regprocedure('public.compartilha_obra(uuid)') is not null
     and to_regprocedure('private.compartilha_obra(uuid)') is null then
    execute 'alter function public.compartilha_obra(uuid) set schema private';
  end if;
end $$;

create or replace function private.eh_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and p.papel = 'admin'
  );
$$;

create or replace function private.eh_equipe()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and p.papel in ('admin', 'equipe')
  );
$$;

create or replace function private.eh_membro_da_obra(p_obra uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.obra_membros om
    where om.obra_id = p_obra
      and om.perfil_id = auth.uid()
  ) or private.eh_admin();
$$;

create or replace function private.eh_equipe_da_obra(p_obra uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select private.eh_equipe() and private.eh_membro_da_obra(p_obra);
$$;

create or replace function private.eh_cliente_da_obra(p_obra uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.obra_membros om
    where om.obra_id = p_obra
      and om.perfil_id = auth.uid()
      and om.papel_na_obra = 'cliente'
  );
$$;

create or replace function private.compartilha_obra(p_perfil uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.obra_membros meu
    join public.obra_membros outro on outro.obra_id = meu.obra_id
    where meu.perfil_id = auth.uid()
      and outro.perfil_id = p_perfil
  );
$$;

revoke execute on all functions in schema private from public;
grant execute on function private.eh_admin() to anon, authenticated, service_role;
grant execute on function private.eh_equipe() to anon, authenticated, service_role;
grant execute on function private.eh_membro_da_obra(uuid) to anon, authenticated, service_role;
grant execute on function private.eh_equipe_da_obra(uuid) to anon, authenticated, service_role;
grant execute on function private.eh_cliente_da_obra(uuid) to anon, authenticated, service_role;
grant execute on function private.compartilha_obra(uuid) to anon, authenticated, service_role;

-- Otimizacoes de RLS apontadas pelo Performance Advisor.
drop policy if exists "le proprio perfil, colegas de obra ou admin" on public.perfis;
create policy "le proprio perfil, colegas de obra ou admin" on public.perfis
  for select to authenticated using (
    id = (select auth.uid())
    or private.eh_admin()
    or private.compartilha_obra(id)
  );

drop policy if exists "atualiza proprio perfil" on public.perfis;
drop policy if exists "admin atualiza qualquer perfil" on public.perfis;
drop policy if exists "atualiza proprio perfil ou admin" on public.perfis;
create policy "atualiza proprio perfil ou admin" on public.perfis
  for update to authenticated
  using (id = (select auth.uid()) or private.eh_admin())
  with check (id = (select auth.uid()) or private.eh_admin());

drop policy if exists "equipe le fotos das suas obras" on public.fotos;
drop policy if exists "cliente so ve fotos visiveis" on public.fotos;
drop policy if exists "membros leem fotos conforme acesso" on public.fotos;
create policy "membros leem fotos conforme acesso" on public.fotos
  for select to authenticated using (
    private.eh_equipe_da_obra(obra_id)
    or (visivel_cliente = true and private.eh_cliente_da_obra(obra_id))
  );

drop policy if exists "equipe le feed" on public.atividades;
drop policy if exists "cliente le feed visivel" on public.atividades;
drop policy if exists "membros leem feed conforme acesso" on public.atividades;
create policy "membros leem feed conforme acesso" on public.atividades
  for select to authenticated using (
    private.eh_equipe_da_obra(obra_id)
    or (visivel_cliente = true and private.eh_cliente_da_obra(obra_id))
  );

drop policy if exists "equipe le agenda" on public.compromissos;
drop policy if exists "cliente le agenda visivel" on public.compromissos;
drop policy if exists "membros leem agenda conforme acesso" on public.compromissos;
create policy "membros leem agenda conforme acesso" on public.compromissos
  for select to authenticated using (
    private.eh_equipe_da_obra(obra_id)
    or (visivel_cliente = true and private.eh_cliente_da_obra(obra_id))
  );

drop policy if exists "equipe le lancamentos" on public.lancamentos;
drop policy if exists "cliente le financeiro liberado" on public.lancamentos;
drop policy if exists "membros leem lancamentos conforme acesso" on public.lancamentos;
create policy "membros leem lancamentos conforme acesso" on public.lancamentos
  for select to authenticated using (
    private.eh_equipe_da_obra(obra_id)
    or (
      visivel_cliente = true
      and private.eh_cliente_da_obra(obra_id)
      and exists (
        select 1
        from public.obras o
        where o.id = lancamentos.obra_id
          and o.financeiro_visivel_cliente = true
      )
    )
  );

-- Trigger/helper functions remanescentes em public nao devem virar RPC.
revoke execute on all functions in schema public from anon, authenticated, public;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  revoke execute on functions from anon, authenticated, public;

alter default privileges in schema private
  revoke execute on functions from public;

-- Advisors de search_path em funcoes public nao-definer.
alter function public.atualizar_updated_at() set search_path = public;
alter function public.bloquear_mudanca_papel() set search_path = public;

-- Bucket publico ja serve objetos por URL; esta policy permitia listagem.
drop policy if exists "branding e publico" on storage.objects;

-- Data API: grants explicitos (RLS continua sendo a autorizacao por linha).
grant usage on schema public to anon, authenticated, service_role;
revoke all privileges on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  revoke select, insert, update, delete on tables from anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

commit;
