-- ============================================================
-- Fase 0 — Buckets de storage e policies
-- Convenção de path: {obra_id}/... — a policy valida o prefixo
-- contra obra_membros (espelha as policies de tabela).
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('fotos-obras', 'fotos-obras', false),
  ('orcamentos', 'orcamentos', false),
  ('branding', 'branding', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- fotos-obras (privado): membros da obra leem; equipe escreve.
-- Para clientes, o app entrega URLs assinadas com expiração.
-- ------------------------------------------------------------

create policy "membros leem fotos da obra" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos-obras'
    and public.eh_membro_da_obra(((storage.foldername(name))[1])::uuid)
  );

create policy "equipe sobe fotos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-obras'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

create policy "equipe atualiza fotos storage" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos-obras'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

create policy "equipe remove fotos storage" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos-obras'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

-- ------------------------------------------------------------
-- orcamentos (privado): somente equipe da obra
-- ------------------------------------------------------------

create policy "equipe le orcamentos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'orcamentos'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

create policy "equipe sobe orcamentos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'orcamentos'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

create policy "equipe remove orcamentos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'orcamentos'
    and public.eh_equipe_da_obra(((storage.foldername(name))[1])::uuid)
  );

-- ------------------------------------------------------------
-- branding (público): leitura livre; escrita de admin
-- ------------------------------------------------------------

create policy "branding e publico" on storage.objects
  for select
  using (bucket_id = 'branding');

create policy "admin sobe branding" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and public.eh_admin());

create policy "admin atualiza branding" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and public.eh_admin());

create policy "admin remove branding" on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and public.eh_admin());
