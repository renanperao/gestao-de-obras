-- ============================================================
-- Fase 0 — Schema inicial
-- Convenções: nomes em pt-BR, snake_case, uuid como PK,
-- created_at default now(), updated_at via trigger.
-- Todas as tabelas de domínio carregam obra_id para simplificar RLS.
-- ============================================================

create extension if not exists "pgcrypto";

-- Trigger genérica de updated_at
create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Identidade e acesso
-- ------------------------------------------------------------

-- Perfil espelha auth.users
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel text not null check (papel in ('admin', 'equipe', 'cliente')),
  avatar_url text,
  primeiro_acesso boolean default true, -- força troca da senha provisória
  created_at timestamptz default now()
);

-- Cria o perfil automaticamente quando um usuário nasce no Auth.
-- Papel vem de raw_user_meta_data, mas NUNCA concede 'admin' por metadata:
-- admin só via SQL/console ou promoção por outro admin (ver política em perfis).
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'papel' in ('equipe', 'cliente')
        then new.raw_user_meta_data->>'papel'
      else 'cliente'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

-- ------------------------------------------------------------
-- Obras e estrutura
-- ------------------------------------------------------------

create table public.obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  metragem_m2 numeric(10,2),
  status text default 'ativa' check (status in ('ativa', 'pausada', 'arquivada')),
  data_inicio date,
  previsao_entrega date,
  capa_url text,
  financeiro_visivel_cliente boolean default false, -- liberação por obra
  progresso numeric(5,2) default 0,                 -- cache calculado (0–100)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger obras_updated_at
  before update on public.obras
  for each row execute function public.atualizar_updated_at();

-- Vínculo usuário ↔ obra (isolamento do cliente e escopo da equipe)
create table public.obra_membros (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  papel_na_obra text not null check (papel_na_obra in ('responsavel', 'equipe', 'cliente')),
  unique (obra_id, perfil_id)
);

create index obra_membros_perfil_idx on public.obra_membros (perfil_id);

-- Convites de cliente
create table public.convites (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  email text not null,
  nome text not null,
  status text default 'pendente' check (status in ('pendente', 'aceito', 'expirado')),
  criado_por uuid references public.perfis(id),
  expira_em timestamptz,
  created_at timestamptz default now()
);

create index convites_obra_idx on public.convites (obra_id);

create table public.pavimentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,            -- "Térreo", "1º Pavimento", "Cobertura"
  ordem int not null default 0
);

create index pavimentos_obra_idx on public.pavimentos (obra_id);

-- Templates pré-definidos (seed) — permitem montar obra em minutos
create table public.etapa_templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  peso_sugerido numeric(5,2) default 1,
  ordem int default 0,
  categoria text -- "residencial", "comercial", "reforma"
);

create table public.subetapa_templates (
  id uuid primary key default gen_random_uuid(),
  etapa_template_id uuid not null references public.etapa_templates(id) on delete cascade,
  nome text not null,
  peso_sugerido numeric(5,2) default 1,
  ordem int default 0
);

create index subetapa_templates_etapa_idx on public.subetapa_templates (etapa_template_id);

create table public.etapas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  pavimento_id uuid references public.pavimentos(id) on delete cascade, -- null = etapa geral da obra
  nome text not null,            -- "Fundação", "Alvenaria", "Elétrica"
  peso numeric(5,2) not null default 1,      -- ponderação no progresso da obra
  ordem int not null default 0,
  progresso numeric(5,2) default 0,          -- cache: média ponderada das subetapas
  instalando_agora boolean default false,    -- destaque "frente de trabalho ativa"
  depende_de uuid references public.etapas(id),
  template_origem uuid references public.etapa_templates(id),
  created_at timestamptz default now()
);

create index etapas_obra_idx on public.etapas (obra_id);
create index etapas_pavimento_idx on public.etapas (pavimento_id);

create table public.subetapas (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references public.etapas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,            -- "Marcação", "Elevação", "Encunhamento"
  peso numeric(5,2) not null default 1,
  ordem int not null default 0,
  progresso numeric(5,2) default 0 check (progresso between 0 and 100)
);

create index subetapas_etapa_idx on public.subetapas (etapa_id);
create index subetapas_obra_idx on public.subetapas (obra_id);

-- ------------------------------------------------------------
-- Acompanhamento (fotos, avisos, feed, agenda)
-- ------------------------------------------------------------

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  etapa_id uuid references public.etapas(id) on delete set null,
  subetapa_id uuid references public.subetapas(id) on delete set null,
  storage_path text not null,         -- bucket 'fotos-obras'
  thumb_path text,                    -- gerada no upload (client-side resize)
  legenda text,
  percentual_registrado numeric(5,2), -- percentual da subetapa no momento da foto
  visivel_cliente boolean default true,
  criado_por uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index fotos_obra_idx on public.fotos (obra_id, created_at desc);
create index fotos_etapa_idx on public.fotos (etapa_id);

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  criado_por uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index avisos_obra_idx on public.avisos (obra_id, created_at desc);

-- Feed automático: alimentado por triggers/inserts do app em eventos-chave
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null,  -- 'foto_adicionada' | 'progresso_atualizado' | 'compra_aprovada' | ...
  payload jsonb not null default '{}',
  visivel_cliente boolean default true,
  ator uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index atividades_obra_idx on public.atividades (obra_id, created_at desc);

create table public.compromissos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  titulo text not null,
  descricao text,
  data_hora timestamptz not null,
  visivel_cliente boolean default true,
  criado_por uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index compromissos_obra_idx on public.compromissos (obra_id, data_hora);

-- ------------------------------------------------------------
-- Suprimentos e compras
-- ------------------------------------------------------------

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text default 'fixo' check (tipo in ('fixo', 'eventual')),
  cnpj text,
  contato text,        -- telefone/WhatsApp
  email text,
  observacoes text,
  created_at timestamptz default now()
);

-- Catálogo de itens pré-definidos (seed + itens criados pelo escritório)
create table public.itens_catalogo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,     -- "Cimento CP-II 50kg"
  unidade text not null,  -- "sc", "m²", "m³", "un", "kg", "barra"
  categoria text          -- "estrutura", "acabamento", "elétrica", "hidráulica"
);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  etapa_id uuid references public.etapas(id) on delete set null,
  item_catalogo_id uuid references public.itens_catalogo(id),
  descricao text not null, -- livre, mesmo quando vem do catálogo
  quantidade numeric(12,3) not null,
  unidade text not null,
  status text default 'cotando' check (status in ('cotando', 'aprovado', 'entregue', 'cancelado')),
  data_compra date,
  previsao_entrega date,
  data_entrega date,
  criado_por uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index compras_obra_idx on public.compras (obra_id, status);

create table public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id),
  fornecedor_nome_livre text, -- quando a IA lê um fornecedor não cadastrado
  valor_unitario numeric(12,2) not null,
  frete numeric(12,2) default 0,
  escolhida boolean default false,
  origem text default 'manual' check (origem in ('manual', 'ia')),
  arquivo_origem_path text,   -- PDF/foto do orçamento no storage (bucket 'orcamentos')
  observacoes text,
  created_at timestamptz default now()
);

create index cotacoes_compra_idx on public.cotacoes (compra_id);

-- Só uma cotação escolhida por compra
create unique index cotacao_escolhida_unica on public.cotacoes (compra_id) where escolhida;

-- total = (valor_unitario × quantidade da compra) + frete.
-- Depende de outra tabela, então vive numa view (security_invoker preserva RLS).
create or replace view public.cotacoes_comparativo
with (security_invoker = true) as
select
  ct.*,
  round(ct.valor_unitario * cp.quantidade + coalesce(ct.frete, 0), 2) as total
from public.cotacoes ct
join public.compras cp on cp.id = ct.compra_id;

-- ------------------------------------------------------------
-- Financeiro
-- ------------------------------------------------------------

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  etapa_id uuid references public.etapas(id) on delete set null,
  compra_id uuid references public.compras(id) on delete set null, -- vínculo quando nasce de compra
  tipo text not null check (tipo in ('pagar', 'receber')),
  categoria text not null check (categoria in ('material', 'mao_de_obra', 'servico', 'taxa', 'honorarios', 'outro')),
  descricao text not null,
  valor numeric(14,2) not null,
  vencimento date,
  pago_em date, -- null = em aberto
  economia_negociacao numeric(14,2) default 0,
  visivel_cliente boolean default true,
  criado_por uuid references public.perfis(id),
  created_at timestamptz default now()
);

create index lancamentos_obra_idx on public.lancamentos (obra_id);
create index lancamentos_vencimento_idx on public.lancamentos (obra_id, vencimento);

-- ------------------------------------------------------------
-- Quantitativos
-- ------------------------------------------------------------

create table public.ambientes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  pavimento_id uuid references public.pavimentos(id) on delete cascade,
  nome text not null, -- "Sala", "Suíte 1", "Banheiro social"
  area_m2 numeric(10,2) not null,
  desconto_m2 numeric(10,2) default 0 -- vãos, portas, janelas
);

create index ambientes_obra_idx on public.ambientes (obra_id);

create table public.quantitativo_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  ambiente_id uuid references public.ambientes(id) on delete cascade, -- null = obra inteira
  item_catalogo_id uuid references public.itens_catalogo(id),
  descricao text not null,
  consumo_por_m2 numeric(12,4),        -- ex.: 1.05 m² de piso por m² de área
  indice_perda_pct numeric(5,2) default 10,
  quantidade_calculada numeric(12,3),  -- (area − desconto) × consumo × (1 + perda/100)
  quantidade_ajustada numeric(12,3),   -- edição manual prevalece
  unidade text not null
);

create index quantitativo_itens_obra_idx on public.quantitativo_itens (obra_id);

-- ------------------------------------------------------------
-- Personalização visual (branding) — linha única
-- ------------------------------------------------------------

create table public.configuracao_escritorio (
  id int primary key default 1 check (id = 1),
  nome_escritorio text not null,
  logo_url text,
  cor_primaria text default '#1a1a1a',
  cor_destaque text default '#e05a33',
  slogan text
);
