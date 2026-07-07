# Sistema de Gestão de Obras — Plano de Desenvolvimento Completo

> **Documento de especificação para desenvolvimento com Claude Code.**
> Projeto novo, do zero. Web app instalável (PWA) para escritório de arquitetura e engenharia gerenciar obras, com portal exclusivo para cada cliente acompanhar a própria obra.

---

## 1. Visão geral

### 1.1 O problema
Um escritório de arquitetura e engenharia gerencia várias obras simultaneamente. Hoje a informação fica espalhada: fotos no WhatsApp, planilhas de compras, orçamentos em PDF, cronograma na cabeça do engenheiro. O cliente final liga perguntando "como está minha obra?" e alguém precisa parar para montar a resposta.

### 1.2 A solução — "um motor, duas janelas"
Uma única plataforma onde:

- **Janela da equipe (painel interno):** o escritório cadastra obras, registra progresso, fotos, compras, cotações, financeiro e quantitativos. É onde o trabalho acontece.
- **Janela do cliente (portal):** cada cliente acessa **somente a própria obra**, em modo leitura, e vê exatamente a mesma informação que a equipe registrou em campo — progresso por etapa, fotos, avisos e (se liberado) o financeiro.

O dado é registrado **uma vez** e alimenta as duas visões. Não existe "relatório para o cliente" separado do sistema: o portal **é** o relatório, sempre atualizado.

### 1.3 Princípios de produto
1. **Registrar em campo tem que ser rápido.** A equipe usa no celular, no canteiro, com uma mão. Fluxos de 2–3 toques para as ações mais comuns (tirar foto, atualizar percentual).
2. **O cliente nunca vê o que não deve.** Isolamento total por obra e por papel, garantido no banco (RLS), não só na interface.
3. **Progresso é calculado, não chutado.** Percentuais ponderados por peso, propagados de subetapa → etapa → obra.
4. **Menos digitação, mais automação.** Leitura de orçamentos por IA, etapas pré-definidas, herança entre pavimentos, feed de atividade automático.
5. **Visual do escritório, não do software.** Identidade personalizável (logo, cores, fonte Raleway) — o cliente sente que está no portal do escritório.

---

## 2. Personas e fluxos principais

### 2.1 Personas
| Persona | Papel no sistema | Dispositivo típico | O que faz |
|---|---|---|---|
| **Sócio / engenheiro responsável** | `admin` | Desktop + celular | Cria obras, define estrutura, aprova cotações, controla financeiro, libera acesso de clientes |
| **Equipe de campo (mestre, estagiário, arquiteto)** | `equipe` | Celular | Registra fotos, atualiza progresso, lança compras, marca compromissos |
| **Cliente final (dono da obra)** | `cliente` | Celular | Acompanha progresso, vê fotos e avisos, consulta financeiro se liberado |

### 2.2 Fluxos críticos (devem ser impecáveis)

**F1 — Registrar progresso em campo (equipe, celular):**
Abrir obra → tocar na etapa em execução → tirar/anexar foto → informar percentual → salvar. A foto é comprimida no client, o percentual atualiza a subetapa, o progresso da etapa e da obra recalculam, o feed registra a atividade, e o portal do cliente reflete tudo imediatamente.

**F2 — Cliente acompanhando (cliente, celular):**
Recebe convite por e-mail/WhatsApp → primeiro acesso com senha provisória → define senha própria → cai direto na tela da própria obra: barra de progresso geral, etapas com percentuais, galeria de fotos, avisos e agenda de compromissos.

**F3 — Cotação de compra (admin/equipe):**
Criar item de compra ("Porcelanato 80x80, 120 m²") → status `cotando` → anexar orçamentos de 2–3 fornecedores (manual **ou** enviando PDF/foto que a IA lê e preenche) → comparar lado a lado (unitário, frete, total) → escolher a melhor → status `aprovado` → registrar entrega → status `entregue`. A economia (diferença entre a proposta mais cara e a escolhida) é registrada no financeiro.

**F4 — Montar estrutura de obra nova (admin):**
Criar obra (nome, endereço, metragem, nº de pavimentos) → escolher template de etapas pré-definidas → o sistema replica as etapas para cada pavimento (herança) → ajustar pesos e remover o que não se aplica → obra pronta para acompanhamento em minutos.

---

## 3. Stack técnica

| Camada | Escolha | Justificativa |
|---|---|---|
| Frontend | **React 18 + Vite + TypeScript** | Rápido de desenvolver, ecossistema maduro |
| Estilo | **Tailwind CSS** + tokens de design próprios | Consistência visual, tema customizável por CSS variables |
| Fonte | **Raleway** (Google Fonts, self-hosted no build) | Identidade do produto |
| Roteamento | **React Router v6** | Rotas separadas para painel (`/app`) e portal (`/portal`) |
| Estado servidor | **TanStack Query (React Query)** | Cache, revalidação, otimistic updates |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime) | Banco relacional com RLS nativa, auth pronto, storage para fotos |
| PWA | **vite-plugin-pwa** (Workbox) | Instalável no celular e desktop, cache offline de leitura |
| Gráficos/relatórios | **Recharts** | Relatórios de custo e cronograma |
| Formulários | **React Hook Form + Zod** | Validação tipada ponta a ponta |
| IA (leitura de orçamento) | **Anthropic API via Supabase Edge Function** | PDF/foto → JSON estruturado da cotação |
| Datas | **date-fns** com locale pt-BR | |
| Testes | **Vitest + Testing Library** (unitário) | Foco nas funções de cálculo de progresso e quantitativos |

### 3.1 Estrutura de pastas
```
src/
├── app/                    # Janela da EQUIPE (painel interno)
│   ├── obras/              # listagem, detalhe, estrutura
│   ├── acompanhamento/     # fotos, feed, agenda
│   ├── suprimentos/        # compras, cotações, fornecedores
│   ├── financeiro/
│   ├── quantitativos/
│   ├── relatorios/
│   └── configuracoes/      # branding, equipe, templates
├── portal/                 # Janela do CLIENTE (read-only)
│   ├── ProgressoPage.tsx
│   ├── FotosPage.tsx
│   ├── AvisosPage.tsx
│   └── FinanceiroPage.tsx  # só renderiza se liberado
├── shared/
│   ├── components/         # UI kit (Button, Card, ProgressBar, PhotoGrid…)
│   ├── hooks/
│   ├── lib/                # supabase client, cálculo de progresso, formatação
│   └── types/              # tipos gerados do schema Supabase
├── styles/                 # tokens, tema
supabase/
├── migrations/             # SQL versionado
├── functions/
│   ├── ler-orcamento/      # Edge Function de IA
│   └── convidar-cliente/   # cria usuário + senha provisória + e-mail
└── seed.sql                # templates de etapas, itens de catálogo
```

### 3.2 Regra de ouro da arquitetura
**Toda regra de acesso vive no banco (RLS).** O frontend nunca é a única barreira. As duas janelas usam o mesmo client Supabase; o que muda é o que as policies deixam cada papel enxergar.

---
## 4. Modelo de dados (Supabase / Postgres)

> Convenção: nomes em português, `snake_case`, `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at` via trigger. Todas as tabelas de domínio carregam `obra_id` para simplificar RLS.

### 4.1 Identidade e acesso

```sql
-- Perfil espelha auth.users
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel text not null check (papel in ('admin', 'equipe', 'cliente')),
  avatar_url text,
  primeiro_acesso boolean default true,   -- força troca da senha provisória
  created_at timestamptz default now()
);

-- Vínculo usuário ↔ obra (isolamento do cliente e escopo da equipe)
create table obra_membros (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  perfil_id uuid not null references perfis(id) on delete cascade,
  papel_na_obra text not null check (papel_na_obra in ('responsavel', 'equipe', 'cliente')),
  unique (obra_id, perfil_id)
);

-- Convites de cliente
create table convites (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  email text not null,
  nome text not null,
  status text default 'pendente' check (status in ('pendente', 'aceito', 'expirado')),
  criado_por uuid references perfis(id),
  expira_em timestamptz,
  created_at timestamptz default now()
);
```

### 4.2 Obras e estrutura

```sql
create table obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  metragem_m2 numeric(10,2),
  status text default 'ativa' check (status in ('ativa', 'pausada', 'arquivada')),
  data_inicio date,
  previsao_entrega date,
  capa_url text,
  financeiro_visivel_cliente boolean default false,  -- liberação por obra
  progresso numeric(5,2) default 0,                  -- cache calculado (0–100)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table pavimentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  nome text not null,            -- "Térreo", "1º Pavimento", "Cobertura"
  ordem int not null default 0
);

create table etapas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  pavimento_id uuid references pavimentos(id) on delete cascade, -- null = etapa geral da obra
  nome text not null,            -- "Fundação", "Alvenaria", "Elétrica"
  peso numeric(5,2) not null default 1,     -- ponderação no progresso da obra
  ordem int not null default 0,
  progresso numeric(5,2) default 0,          -- cache: média ponderada das subetapas
  instalando_agora boolean default false,    -- destaque "frente de trabalho ativa"
  depende_de uuid references etapas(id),     -- dependência simples (bloqueio visual)
  template_origem uuid references etapa_templates(id),
  created_at timestamptz default now()
);

create table subetapas (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references etapas(id) on delete cascade,
  obra_id uuid not null references obras(id) on delete cascade,
  nome text not null,            -- "Marcação", "Elevação", "Encunhamento"
  peso numeric(5,2) not null default 1,
  ordem int not null default 0,
  progresso numeric(5,2) default 0 check (progresso between 0 and 100)
);

-- Templates pré-definidos (seed) — permitem montar obra em minutos
create table etapa_templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  peso_sugerido numeric(5,2) default 1,
  ordem int default 0,
  categoria text               -- "residencial", "comercial", "reforma"
);

create table subetapa_templates (
  id uuid primary key default gen_random_uuid(),
  etapa_template_id uuid not null references etapa_templates(id) on delete cascade,
  nome text not null,
  peso_sugerido numeric(5,2) default 1,
  ordem int default 0
);
```

**Regras de negócio da estrutura:**
- **Herança entre pavimentos:** ao criar a obra com N pavimentos e escolher um template, o sistema clona o conjunto de etapas/subetapas para cada pavimento. Depois cada pavimento evolui de forma independente.
- **Cálculo de progresso (função pura em `shared/lib/progresso.ts` + trigger SQL espelho):**
  - `progresso_etapa = Σ(progresso_subetapa × peso_subetapa) / Σ(peso_subetapa)`
  - `progresso_obra = Σ(progresso_etapa × peso_etapa) / Σ(peso_etapa)`
  - Recalcular via trigger `after update on subetapas` para os caches nunca divergirem.
- **`instalando_agora`:** no máximo destacado por frente/pavimento; aparece com selo no painel e no portal do cliente ("Acontecendo agora: Elétrica — 2º pavimento").
- **Dependências:** se `depende_de` aponta para etapa com progresso < 100, exibir aviso ao tentar lançar progresso (não bloquear de forma rígida — obra real tem sobreposição).
- **Arquivamento:** obra `arquivada` some das listagens padrão, mas fica consultável (histórico e relatórios preservados).

### 4.3 Acompanhamento (fotos, avisos, feed, agenda)

```sql
create table fotos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  etapa_id uuid references etapas(id) on delete set null,
  subetapa_id uuid references subetapas(id) on delete set null,
  storage_path text not null,        -- bucket 'fotos-obras'
  thumb_path text,                   -- gerada no upload (client-side resize)
  legenda text,
  percentual_registrado numeric(5,2),-- percentual da subetapa no momento da foto
  visivel_cliente boolean default true,
  criado_por uuid references perfis(id),
  created_at timestamptz default now()
);

create table avisos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  criado_por uuid references perfis(id),
  created_at timestamptz default now()
);

-- Feed automático: alimentado por triggers/inserts do app em eventos-chave
create table atividades (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  tipo text not null,     -- 'foto_adicionada' | 'progresso_atualizado' | 'compra_aprovada' | 'aviso_publicado' | 'etapa_concluida' | ...
  payload jsonb not null default '{}',  -- ex: { "etapa": "Alvenaria", "de": 40, "para": 55 }
  visivel_cliente boolean default true,
  ator uuid references perfis(id),
  created_at timestamptz default now()
);

create table compromissos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  titulo text not null,
  descricao text,
  data_hora timestamptz not null,
  visivel_cliente boolean default true,
  criado_por uuid references perfis(id),
  created_at timestamptz default now()
);
```

**Regras de negócio do acompanhamento:**
- **Compressão de foto no client:** redimensionar para máx. 1920px no lado maior, qualidade ~0.8 (canvas ou `browser-image-compression`), gerar thumb de 400px. Nunca subir a foto original de 12 MB do celular.
- **Foto carrega percentual:** ao anexar foto numa subetapa, o formulário oferece atualizar o percentual ali mesmo — um só fluxo para os dois registros.
- **Feed de atividade:** gerado automaticamente; o cliente vê a versão filtrada (`visivel_cliente = true` e sem eventos internos como cotações).

### 4.4 Suprimentos e compras

```sql
create table fornecedores (
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
create table itens_catalogo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,          -- "Cimento CP-II 50kg"
  unidade text not null,       -- "sc", "m²", "m³", "un", "kg", "barra"
  categoria text               -- "estrutura", "acabamento", "elétrica", "hidráulica"
);

create table compras (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  etapa_id uuid references etapas(id) on delete set null,
  item_catalogo_id uuid references itens_catalogo(id),
  descricao text not null,     -- livre, mesmo quando vem do catálogo
  quantidade numeric(12,3) not null,
  unidade text not null,
  status text default 'cotando' check (status in ('cotando', 'aprovado', 'entregue', 'cancelado')),
  data_compra date,
  previsao_entrega date,
  data_entrega date,
  criado_por uuid references perfis(id),
  created_at timestamptz default now()
);

create table cotacoes (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id) on delete cascade,
  obra_id uuid not null references obras(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id),
  fornecedor_nome_livre text,      -- quando a IA lê um fornecedor não cadastrado
  valor_unitario numeric(12,2) not null,
  frete numeric(12,2) default 0,
  total numeric(14,2) generated always as (valor_unitario * 0 + 0) stored, -- ver nota
  escolhida boolean default false,
  origem text default 'manual' check (origem in ('manual', 'ia')),
  arquivo_origem_path text,        -- PDF/foto do orçamento no storage
  observacoes text,
  created_at timestamptz default now()
);
-- NOTA para implementação: total = (valor_unitario × quantidade da compra) + frete.
-- Como depende de outra tabela, calcular no app/na view, não em coluna gerada.
```

**Regras de negócio de suprimentos:**
- **Comparação de cotações:** tela lado a lado ordenada por total; escolher uma marca `escolhida = true` e move a compra para `aprovado`.
- **Economia na negociação:** `economia = max(total das cotações) − total da escolhida`, gravada como lançamento informativo no financeiro e somada no relatório da obra.
- **Só uma cotação escolhida por compra** (constraint parcial: `create unique index on cotacoes (compra_id) where escolhida`).
- **Datas:** `data_compra` ao aprovar, `previsao_entrega` informada, `data_entrega` ao marcar entregue — alimentam o cronograma de entregas.

### 4.5 Leitura de orçamento por IA (Edge Function `ler-orcamento`)

Fluxo:
1. Usuário anexa PDF ou foto do orçamento na tela da compra.
2. Frontend sobe o arquivo para o bucket `orcamentos` e chama a Edge Function com o path.
3. A função baixa o arquivo, envia para a Anthropic API (documento/imagem em base64) com prompt que exige **somente JSON** no formato:
```json
{
  "fornecedor": "Casa do Construtor Ltda",
  "cnpj": "00.000.000/0001-00",
  "itens": [
    { "descricao": "Porcelanato 80x80 Bege", "quantidade": 120, "unidade": "m²", "valor_unitario": 89.90 }
  ],
  "frete": 250.00,
  "total": 11038.00,
  "validade": "2026-07-20",
  "confianca": "alta"
}
```
4. Frontend exibe o resultado **pré-preenchido em modo revisão** — a equipe confere, ajusta e aprova. Nada entra no banco sem confirmação humana.
5. Se o fornecedor lido não existir, oferecer "cadastrar fornecedor" em um toque.

Tratamento de erros: JSON inválido → retry com instrução de correção (1x); falha → mensagem clara e fallback para preenchimento manual. Logar `confianca` para monitorar qualidade.

### 4.6 Financeiro

```sql
create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  etapa_id uuid references etapas(id) on delete set null,
  compra_id uuid references compras(id) on delete set null,  -- vínculo quando nasce de compra
  tipo text not null check (tipo in ('pagar', 'receber')),
  categoria text not null check (categoria in ('material', 'mao_de_obra', 'servico', 'taxa', 'honorarios', 'outro')),
  descricao text not null,
  valor numeric(14,2) not null,
  vencimento date,
  pago_em date,                 -- null = em aberto
  economia_negociacao numeric(14,2) default 0,
  visivel_cliente boolean default true,
  criado_por uuid references perfis(id),
  created_at timestamptz default now()
);
```

**Regras de negócio do financeiro:**
- Ao marcar compra como `aprovado`, criar automaticamente lançamento `pagar` (categoria `material`) com o total da cotação escolhida e a economia registrada.
- **Custo por etapa** = soma dos lançamentos vinculados à etapa. **Custo realizado por item** vem do vínculo compra → lançamento.
- **Mão de obra:** categoria própria, lançada manualmente (medição semanal/quinzenal por etapa).
- Visão "contas da semana": vencimentos próximos em destaque no dashboard.
- Portal do cliente só mostra financeiro se `obras.financeiro_visivel_cliente = true` **e** apenas lançamentos com `visivel_cliente = true`.

### 4.7 Quantitativos

```sql
create table ambientes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  pavimento_id uuid references pavimentos(id) on delete cascade,
  nome text not null,            -- "Sala", "Suíte 1", "Banheiro social"
  area_m2 numeric(10,2) not null,
  desconto_m2 numeric(10,2) default 0   -- vãos, portas, janelas
);

create table quantitativo_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references obras(id) on delete cascade,
  ambiente_id uuid references ambientes(id) on delete cascade,  -- null = obra inteira
  item_catalogo_id uuid references itens_catalogo(id),
  descricao text not null,
  consumo_por_m2 numeric(12,4),      -- ex.: 1.05 m² de piso por m² de área
  indice_perda_pct numeric(5,2) default 10,
  quantidade_calculada numeric(12,3),-- (area − desconto) × consumo × (1 + perda/100)
  quantidade_ajustada numeric(12,3), -- edição manual prevalece
  unidade text not null
);
```

**Regras de negócio:** cálculo automático ao salvar; `quantidade_ajustada` (quando preenchida) prevalece e fica marcada como "editado manualmente"; botão "gerar compra a partir do quantitativo" cria o item em suprimentos com a quantidade final.

### 4.8 Personalização visual (branding)

```sql
create table configuracao_escritorio (
  id int primary key default 1 check (id = 1),   -- linha única
  nome_escritorio text not null,
  logo_url text,
  cor_primaria text default '#1a1a1a',
  cor_destaque text default '#e05a33',
  slogan text
);
```
Aplicada via CSS variables no carregamento; vale para o painel e para o portal do cliente.

---

## 5. Segurança e RLS (crítico — implementar na Fase 1)

### 5.1 Papéis
- `admin`: tudo, em todas as obras.
- `equipe`: leitura/escrita nas obras onde é membro (`obra_membros`), sem acesso a configurações e sem excluir obra.
- `cliente`: **somente leitura**, **somente na(s) obra(s)** onde é membro com `papel_na_obra = 'cliente'`, e somente registros com `visivel_cliente = true`.

### 5.2 Padrão de policies (exemplo — replicar em todas as tabelas de domínio)

```sql
alter table fotos enable row level security;

-- helper: função security definer
create function eh_membro_da_obra(p_obra uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from obra_membros om
    where om.obra_id = p_obra and om.perfil_id = auth.uid()
  ) or exists (
    select 1 from perfis p where p.id = auth.uid() and p.papel = 'admin'
  );
$$;

create policy "equipe le fotos das suas obras" on fotos for select
  using (eh_membro_da_obra(obra_id));

create policy "cliente so ve fotos visiveis" on fotos for select
  using (
    visivel_cliente = true
    and exists (
      select 1 from obra_membros om
      where om.obra_id = fotos.obra_id
        and om.perfil_id = auth.uid()
        and om.papel_na_obra = 'cliente'
    )
  );

create policy "equipe escreve" on fotos for insert
  with check (
    eh_membro_da_obra(obra_id)
    and exists (select 1 from perfis p where p.id = auth.uid() and p.papel in ('admin','equipe'))
  );
```

### 5.3 Storage
Buckets: `fotos-obras` (privado), `orcamentos` (privado), `branding` (público). Policies de storage espelham as de tabela: path das fotos começa com `{obra_id}/…` e a policy valida o prefixo contra `obra_membros`.

### 5.4 Convite de cliente (Edge Function `convidar-cliente`)
1. Admin informa nome + e-mail + obra.
2. Função cria usuário no Supabase Auth com **senha provisória** aleatória, cria `perfis` (papel `cliente`, `primeiro_acesso = true`) e `obra_membros`.
3. Retorna a senha provisória para o admin enviar por WhatsApp (padrão do escritório) — e opcionalmente dispara e-mail.
4. No primeiro login o app força redefinição de senha antes de liberar o portal.

### 5.5 Exportação de dados
Botão em configurações (admin): gera JSON/CSV por obra (estrutura, fotos como lista de URLs assinadas, financeiro, compras). Atende à cláusula contratual de que os dados pertencem ao escritório.

---
## 6. Interface e design

### 6.1 Design system
- **Fonte:** Raleway (pesos 300/400/500/600/700), fallback `system-ui`.
- **Tokens (CSS variables):** `--cor-primaria`, `--cor-destaque`, `--fundo`, `--superficie`, `--texto`, `--texto-suave`, `--borda`, raios (`--raio-card: 12px`), sombras suaves. Sobrescritos pela `configuracao_escritorio`.
- **Estética:** minimalista e editorial (referência: a própria proposta comercial) — muito espaço em branco, tipografia com tracking generoso em labels, destaque em laranja queimado, fundos off-white.
- **Mobile-first sempre.** O painel da equipe é usado majoritariamente no celular em canteiro: botões grandes, bottom navigation no mobile, sidebar no desktop.

### 6.2 Telas do painel da equipe (`/app`)
1. **Dashboard:** cards das obras ativas com progresso, foto de capa, selo "instalando agora"; contas a vencer na semana; compromissos próximos.
2. **Obra → Visão geral:** progresso geral, progresso por pavimento/etapa (barras), feed de atividade, atalhos rápidos (+ foto, + compra, + aviso).
3. **Obra → Estrutura:** árvore pavimento → etapa → subetapa; edição de pesos e ordem; aplicar template; marcar "instalando agora".
4. **Obra → Fotos:** upload com compressão, grid por etapa, lightbox com zoom, toggle `visível ao cliente`.
5. **Obra → Suprimentos:** lista de compras por status (abas Cotando / Aprovado / Entregue), tela de comparação de cotações, botão "ler orçamento com IA".
6. **Obra → Financeiro:** contas a pagar/receber, custo por etapa (gráfico de barras), economia acumulada.
7. **Obra → Quantitativos:** ambientes com áreas, itens calculados, gerar compra.
8. **Obra → Agenda e avisos.**
9. **Relatórios:** cronograma de entregas por data; custo total da obra; gasto mensal; gasto por material.
10. **Configurações:** branding, equipe, templates de etapas, fornecedores, catálogo de itens, convites de cliente.

### 6.3 Telas do portal do cliente (`/portal`)
1. **Home da obra:** foto de capa, progresso geral em destaque, "acontecendo agora", últimas fotos, próximos compromissos.
2. **Progresso:** etapas por pavimento com barras e percentuais.
3. **Fotos:** galeria cronológica e por etapa.
4. **Avisos:** lista cronológica.
5. **Financeiro** (aba só existe se liberado): resumo simples — pago, em aberto, custo por etapa.
6. Rodapé discreto com identidade do escritório.

Sem nenhum botão de edição, em lugar nenhum. Se o cliente tem mais de uma obra, seletor simples no topo.

### 6.4 PWA
- `manifest` com nome/ícone do escritório, `display: standalone`, tema com a cor primária.
- Service worker (Workbox): cache-first para assets, stale-while-revalidate para dados de leitura; banner "instalar aplicativo" no primeiro acesso do cliente.
- Offline mínimo: última visão carregada da obra permanece legível sem rede (escrita offline fica fora do v1).

---

## 7. Plano de desenvolvimento em fases (roteiro para o Claude Code)

> Cada fase termina com o app rodando e testável. Não avançar de fase com pendências de RLS.

### Fase 0 — Fundação (setup)
- [ ] `npm create vite@latest` (React + TS), Tailwind, React Router, TanStack Query, React Hook Form + Zod, date-fns, vite-plugin-pwa.
- [ ] Projeto Supabase: migrations iniciais (todas as tabelas da seção 4), função `eh_membro_da_obra`, triggers de `updated_at` e de recálculo de progresso, buckets de storage.
- [ ] `seed.sql`: templates de etapas de obra residencial (Serviços preliminares, Fundação, Estrutura, Alvenaria, Cobertura, Instalações elétricas, Instalações hidráulicas, Reboco, Contrapiso, Revestimentos, Forro, Pintura, Esquadrias, Louças e metais, Limpeza final — cada uma com 3–6 subetapas e pesos sugeridos) + catálogo básico de ~40 itens de material.
- [ ] Design tokens + fonte Raleway + componentes base (Button, Input, Card, ProgressBar, Modal, Tabs, EmptyState, Toast).
- [ ] Auth: login, recuperação de senha, guarda de rotas por papel, fluxo de primeiro acesso (troca de senha provisória).

**Aceite:** login funciona para os 3 papéis; usuário `cliente` é redirecionado para `/portal`, `equipe/admin` para `/app`.

### Fase 1 — Obras e estrutura
- [ ] CRUD de obras (com capa, metragem, datas, status, arquivamento).
- [ ] Wizard de criação: dados → pavimentos → template de etapas → revisão de pesos.
- [ ] Herança: clonar etapas/subetapas do template para cada pavimento.
- [ ] Tela de estrutura com edição inline de pesos/ordem, `instalando_agora`, dependências.
- [ ] Atualização de progresso de subetapa (slider/steps de 5%) com recálculo em cascata.
- [ ] RLS completa de `obras`, `pavimentos`, `etapas`, `subetapas`, `obra_membros`.
- [ ] Testes unitários das funções de cálculo de progresso.

**Aceite:** criar obra de 3 pavimentos em < 3 min; alterar subetapa reflete na barra da obra; usuário de outra obra não enxerga nada dela (testar com 2 contas).

### Fase 2 — Acompanhamento
- [ ] Upload de fotos com compressão + thumb no client, vinculação a etapa/subetapa, percentual junto da foto.
- [ ] Galeria com filtro por etapa, lightbox, toggle de visibilidade ao cliente.
- [ ] Avisos ao cliente (CRUD simples).
- [ ] Feed de atividades automático (inserts nos eventos: foto, progresso, etapa concluída, aviso, compra aprovada).
- [ ] Agenda de compromissos por obra.

**Aceite:** fluxo F1 completo em ≤ 4 toques no celular; foto de 8 MB vira ~300 KB no bucket.

### Fase 3 — Portal do cliente
- [ ] Edge Function `convidar-cliente` (senha provisória) + tela de convites no admin.
- [ ] Todas as telas do portal (6.3), 100% read-only.
- [ ] Financeiro condicionado à liberação por obra.
- [ ] PWA configurada (manifest, service worker, banner de instalação).
- [ ] Teste de isolamento: conta cliente A jamais acessa dados da obra B (incluindo URLs diretas de foto — URLs assinadas com expiração).

**Aceite:** convite → primeiro acesso → troca de senha → portal da obra correta, instalável no celular.

### Fase 4 — Suprimentos e compras
- [ ] CRUD de fornecedores e catálogo de itens.
- [ ] Compras com fluxo de status (cotando → aprovado → entregue) e datas.
- [ ] Cotações múltiplas com comparação lado a lado e escolha da melhor.
- [ ] Economia calculada e exibida.
- [ ] Ao aprovar, gerar lançamento financeiro automático.

**Aceite:** fluxo F3 completo; constraint de cotação única escolhida funcionando.

### Fase 5 — Financeiro
- [ ] Lançamentos a pagar/receber com categorias, vencimento e baixa.
- [ ] Visões: contas da semana, custo por etapa, mão de obra, custo realizado por item, economia acumulada.
- [ ] Gráficos (Recharts): custo por etapa, gasto mensal.

**Aceite:** custo por etapa bate com a soma dos lançamentos vinculados (teste com dados de exemplo).

### Fase 6 — Quantitativos
- [ ] Ambientes com área e desconto por pavimento.
- [ ] Itens com consumo/m², índice de perdas, cálculo automático e ajuste manual.
- [ ] "Gerar compra a partir do quantitativo".

### Fase 7 — Cronograma e relatórios
- [ ] Cronograma de entregas (compras por data prevista/realizada) em linha do tempo.
- [ ] Relatórios: custo total da obra, gasto mensal, gasto por material, evolução do progresso no tempo (snapshot semanal em tabela `progresso_historico` alimentada por trigger).
- [ ] Exportação de dados (JSON/CSV por obra).

### Fase 8 — IA de leitura de orçamento
- [ ] Edge Function `ler-orcamento` (seção 4.5) com Anthropic API.
- [ ] UI de revisão do resultado antes de gravar; cadastro rápido de fornecedor novo.
- [ ] Tratamento de erro e fallback manual.

**Aceite:** PDF real de orçamento de fornecedor → cotação preenchida e revisada em < 1 min.

### Fase 9 — Polimento e entrega
- [ ] Branding aplicado de ponta a ponta (logo, cores) via configurações.
- [ ] Estados vazios com orientação ("Nenhuma foto ainda — registre a primeira do canteiro").
- [ ] Skeleton loaders, tratamento de erro global, toasts.
- [ ] Revisão de acessibilidade básica (contraste, foco, labels).
- [ ] Checklist final de RLS em todas as tabelas e buckets.
- [ ] README com instruções de deploy (Vercel/Netlify + Supabase) e de treinamento da equipe.

---

## 8. Convenções para o Claude Code

1. **Idioma:** UI, nomes de tabela e mensagens em pt-BR; código (variáveis/funções TS) pode misturar, mas domínio em português (`obra`, `etapa`, `cotacao`).
2. **Migrations sempre versionadas** em `supabase/migrations` — nunca alterar schema direto no dashboard.
3. **Tipos gerados:** `supabase gen types typescript` → `src/shared/types/database.ts`; nunca tipar tabelas à mão.
4. **Toda mutação via TanStack Query** com invalidação explícita; optimistic update apenas em progresso de subetapa e toggle de visibilidade.
5. **Nenhuma tabela nova sem RLS habilitada na mesma migration.**
6. **Componentes de UI só em `shared/components`** — painel e portal reutilizam o mesmo kit.
7. **Funções de cálculo (progresso, quantitativos, economia) puras e testadas** em `shared/lib`, espelhadas em SQL quando houver trigger.
8. **Commits por fase/feature** com mensagem descritiva; cada fase encerra com os critérios de aceite verificados.
9. **Variáveis de ambiente:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; a chave da Anthropic vive **apenas** como secret da Edge Function, nunca no frontend.

## 9. Fora do escopo do v1 (registrar para não escorregar)

- Escrita offline com sincronização.
- Notificações push.
- Chat cliente ↔ escritório dentro do app.
- Múltiplos escritórios (multi-tenant) — o v1 é single-tenant, um deploy por escritório.
- Integração bancária / emissão de boletos.
- Diagrama de Gantt completo com dependências críticas (v1 tem cronograma de entregas e dependência simples entre etapas).

Essas ideias entram no backlog de evolução, orçadas à parte conforme o contrato.
