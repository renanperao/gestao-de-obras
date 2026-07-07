-- ============================================================
-- Fase 0 — RLS (regra de ouro: toda regra de acesso vive no banco)
-- Papéis:
--   admin   → tudo, em todas as obras
--   equipe  → leitura/escrita nas obras onde é membro; sem configurações
--   cliente → somente leitura, somente nas próprias obras,
--             somente registros com visivel_cliente = true
-- ============================================================

-- ------------------------------------------------------------
-- Funções auxiliares (security definer para evitar recursão de RLS)
-- ------------------------------------------------------------

create or replace function public.eh_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from perfis p where p.id = auth.uid() and p.papel = 'admin'
  );
$$;

-- admin ou equipe (papéis internos do escritório)
create or replace function public.eh_equipe()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from perfis p
    where p.id = auth.uid() and p.papel in ('admin', 'equipe')
  );
$$;

create or replace function public.eh_membro_da_obra(p_obra uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from obra_membros om
    where om.obra_id = p_obra and om.perfil_id = auth.uid()
  ) or public.eh_admin();
$$;

-- membro interno (admin global, ou equipe vinculada à obra)
create or replace function public.eh_equipe_da_obra(p_obra uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select public.eh_equipe() and public.eh_membro_da_obra(p_obra);
$$;

create or replace function public.eh_cliente_da_obra(p_obra uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from obra_membros om
    where om.obra_id = p_obra
      and om.perfil_id = auth.uid()
      and om.papel_na_obra = 'cliente'
  );
$$;

-- usuários que compartilham ao menos uma obra com o usuário logado
create or replace function public.compartilha_obra(p_perfil uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from obra_membros meu
    join obra_membros outro on outro.obra_id = meu.obra_id
    where meu.perfil_id = auth.uid() and outro.perfil_id = p_perfil
  );
$$;

-- ------------------------------------------------------------
-- perfis
-- ------------------------------------------------------------

alter table public.perfis enable row level security;

create policy "le proprio perfil, colegas de obra ou admin" on public.perfis
  for select using (
    id = auth.uid() or public.eh_admin() or public.compartilha_obra(id)
  );

create policy "atualiza proprio perfil" on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "admin atualiza qualquer perfil" on public.perfis
  for update using (public.eh_admin()) with check (public.eh_admin());

create policy "admin remove perfis" on public.perfis
  for delete using (public.eh_admin());

-- Ninguém muda o próprio papel: só admin promove/rebaixa.
-- (auth.uid() null = contexto service_role/SQL direto — permitido)
create or replace function public.bloquear_mudanca_papel()
returns trigger
language plpgsql
as $$
begin
  if new.papel is distinct from old.papel
     and auth.uid() is not null
     and not public.eh_admin() then
    raise exception 'Apenas administradores podem alterar o papel de um usuário';
  end if;
  return new;
end;
$$;

create trigger protege_papel
  before update on public.perfis
  for each row execute function public.bloquear_mudanca_papel();

-- ------------------------------------------------------------
-- obras
-- ------------------------------------------------------------

alter table public.obras enable row level security;

create policy "membros veem a obra" on public.obras
  for select using (public.eh_membro_da_obra(id));

create policy "admin cria obras" on public.obras
  for insert with check (public.eh_admin());

create policy "equipe da obra atualiza" on public.obras
  for update using (public.eh_equipe_da_obra(id)) with check (public.eh_equipe_da_obra(id));

create policy "admin exclui obras" on public.obras
  for delete using (public.eh_admin());

-- ------------------------------------------------------------
-- obra_membros
-- ------------------------------------------------------------

alter table public.obra_membros enable row level security;

create policy "membros veem membros da obra" on public.obra_membros
  for select using (public.eh_membro_da_obra(obra_id));

create policy "admin gerencia membros insert" on public.obra_membros
  for insert with check (public.eh_admin());

create policy "admin gerencia membros update" on public.obra_membros
  for update using (public.eh_admin()) with check (public.eh_admin());

create policy "admin gerencia membros delete" on public.obra_membros
  for delete using (public.eh_admin());

-- ------------------------------------------------------------
-- convites (só o escritório mexe; cliente nunca vê)
-- ------------------------------------------------------------

alter table public.convites enable row level security;

create policy "admin ve convites" on public.convites
  for select using (public.eh_admin());

create policy "admin cria convites" on public.convites
  for insert with check (public.eh_admin());

create policy "admin atualiza convites" on public.convites
  for update using (public.eh_admin()) with check (public.eh_admin());

create policy "admin remove convites" on public.convites
  for delete using (public.eh_admin());

-- ------------------------------------------------------------
-- Estrutura: pavimentos, etapas, subetapas
-- (cliente lê tudo — é o progresso que ele acompanha; só equipe escreve)
-- ------------------------------------------------------------

alter table public.pavimentos enable row level security;

create policy "membros leem pavimentos" on public.pavimentos
  for select using (public.eh_membro_da_obra(obra_id));
create policy "equipe insere pavimentos" on public.pavimentos
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza pavimentos" on public.pavimentos
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove pavimentos" on public.pavimentos
  for delete using (public.eh_equipe_da_obra(obra_id));

alter table public.etapas enable row level security;

create policy "membros leem etapas" on public.etapas
  for select using (public.eh_membro_da_obra(obra_id));
create policy "equipe insere etapas" on public.etapas
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza etapas" on public.etapas
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove etapas" on public.etapas
  for delete using (public.eh_equipe_da_obra(obra_id));

alter table public.subetapas enable row level security;

create policy "membros leem subetapas" on public.subetapas
  for select using (public.eh_membro_da_obra(obra_id));
create policy "equipe insere subetapas" on public.subetapas
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza subetapas" on public.subetapas
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove subetapas" on public.subetapas
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- Templates (leitura para o escritório; escrita de admin)
-- ------------------------------------------------------------

alter table public.etapa_templates enable row level security;

create policy "equipe le templates" on public.etapa_templates
  for select using (public.eh_equipe());
create policy "admin insere templates" on public.etapa_templates
  for insert with check (public.eh_admin());
create policy "admin atualiza templates" on public.etapa_templates
  for update using (public.eh_admin()) with check (public.eh_admin());
create policy "admin remove templates" on public.etapa_templates
  for delete using (public.eh_admin());

alter table public.subetapa_templates enable row level security;

create policy "equipe le subtemplates" on public.subetapa_templates
  for select using (public.eh_equipe());
create policy "admin insere subtemplates" on public.subetapa_templates
  for insert with check (public.eh_admin());
create policy "admin atualiza subtemplates" on public.subetapa_templates
  for update using (public.eh_admin()) with check (public.eh_admin());
create policy "admin remove subtemplates" on public.subetapa_templates
  for delete using (public.eh_admin());

-- ------------------------------------------------------------
-- fotos (padrão do plano §5.2)
-- ------------------------------------------------------------

alter table public.fotos enable row level security;

create policy "equipe le fotos das suas obras" on public.fotos
  for select using (public.eh_equipe_da_obra(obra_id));

create policy "cliente so ve fotos visiveis" on public.fotos
  for select using (visivel_cliente = true and public.eh_cliente_da_obra(obra_id));

create policy "equipe insere fotos" on public.fotos
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza fotos" on public.fotos
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove fotos" on public.fotos
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- avisos (cliente lê todos — são endereçados a ele)
-- ------------------------------------------------------------

alter table public.avisos enable row level security;

create policy "membros leem avisos" on public.avisos
  for select using (public.eh_membro_da_obra(obra_id));
create policy "equipe insere avisos" on public.avisos
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza avisos" on public.avisos
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove avisos" on public.avisos
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- atividades (feed) — cliente vê a versão filtrada
-- ------------------------------------------------------------

alter table public.atividades enable row level security;

create policy "equipe le feed" on public.atividades
  for select using (public.eh_equipe_da_obra(obra_id));

create policy "cliente le feed visivel" on public.atividades
  for select using (visivel_cliente = true and public.eh_cliente_da_obra(obra_id));

create policy "equipe insere atividades" on public.atividades
  for insert with check (public.eh_equipe_da_obra(obra_id));

create policy "admin remove atividades" on public.atividades
  for delete using (public.eh_admin());

-- ------------------------------------------------------------
-- compromissos (agenda)
-- ------------------------------------------------------------

alter table public.compromissos enable row level security;

create policy "equipe le agenda" on public.compromissos
  for select using (public.eh_equipe_da_obra(obra_id));

create policy "cliente le agenda visivel" on public.compromissos
  for select using (visivel_cliente = true and public.eh_cliente_da_obra(obra_id));

create policy "equipe insere compromissos" on public.compromissos
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza compromissos" on public.compromissos
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove compromissos" on public.compromissos
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- Suprimentos (cliente NUNCA vê cotações/compras/fornecedores)
-- ------------------------------------------------------------

alter table public.fornecedores enable row level security;

create policy "equipe le fornecedores" on public.fornecedores
  for select using (public.eh_equipe());
create policy "equipe insere fornecedores" on public.fornecedores
  for insert with check (public.eh_equipe());
create policy "equipe atualiza fornecedores" on public.fornecedores
  for update using (public.eh_equipe()) with check (public.eh_equipe());
create policy "admin remove fornecedores" on public.fornecedores
  for delete using (public.eh_admin());

alter table public.itens_catalogo enable row level security;

create policy "equipe le catalogo" on public.itens_catalogo
  for select using (public.eh_equipe());
create policy "equipe insere no catalogo" on public.itens_catalogo
  for insert with check (public.eh_equipe());
create policy "admin atualiza catalogo" on public.itens_catalogo
  for update using (public.eh_admin()) with check (public.eh_admin());
create policy "admin remove do catalogo" on public.itens_catalogo
  for delete using (public.eh_admin());

alter table public.compras enable row level security;

create policy "equipe le compras" on public.compras
  for select using (public.eh_equipe_da_obra(obra_id));
create policy "equipe insere compras" on public.compras
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza compras" on public.compras
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove compras" on public.compras
  for delete using (public.eh_equipe_da_obra(obra_id));

alter table public.cotacoes enable row level security;

create policy "equipe le cotacoes" on public.cotacoes
  for select using (public.eh_equipe_da_obra(obra_id));
create policy "equipe insere cotacoes" on public.cotacoes
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza cotacoes" on public.cotacoes
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove cotacoes" on public.cotacoes
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- lancamentos — cliente só vê se a obra liberou E o lançamento é visível
-- ------------------------------------------------------------

alter table public.lancamentos enable row level security;

create policy "equipe le lancamentos" on public.lancamentos
  for select using (public.eh_equipe_da_obra(obra_id));

create policy "cliente le financeiro liberado" on public.lancamentos
  for select using (
    visivel_cliente = true
    and public.eh_cliente_da_obra(obra_id)
    and exists (
      select 1 from public.obras o
      where o.id = lancamentos.obra_id and o.financeiro_visivel_cliente = true
    )
  );

create policy "equipe insere lancamentos" on public.lancamentos
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza lancamentos" on public.lancamentos
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove lancamentos" on public.lancamentos
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- Quantitativos (interno; cliente não vê)
-- ------------------------------------------------------------

alter table public.ambientes enable row level security;

create policy "equipe le ambientes" on public.ambientes
  for select using (public.eh_equipe_da_obra(obra_id));
create policy "equipe insere ambientes" on public.ambientes
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza ambientes" on public.ambientes
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove ambientes" on public.ambientes
  for delete using (public.eh_equipe_da_obra(obra_id));

alter table public.quantitativo_itens enable row level security;

create policy "equipe le quantitativos" on public.quantitativo_itens
  for select using (public.eh_equipe_da_obra(obra_id));
create policy "equipe insere quantitativos" on public.quantitativo_itens
  for insert with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe atualiza quantitativos" on public.quantitativo_itens
  for update using (public.eh_equipe_da_obra(obra_id)) with check (public.eh_equipe_da_obra(obra_id));
create policy "equipe remove quantitativos" on public.quantitativo_itens
  for delete using (public.eh_equipe_da_obra(obra_id));

-- ------------------------------------------------------------
-- configuracao_escritorio — branding é lido por todos os logados
-- (o portal aplica logo/cores), mas só admin altera
-- ------------------------------------------------------------

alter table public.configuracao_escritorio enable row level security;

create policy "logados leem branding" on public.configuracao_escritorio
  for select to authenticated using (true);

create policy "admin insere branding" on public.configuracao_escritorio
  for insert with check (public.eh_admin());
create policy "admin atualiza branding" on public.configuracao_escritorio
  for update using (public.eh_admin()) with check (public.eh_admin());
