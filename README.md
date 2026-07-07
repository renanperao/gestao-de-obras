# Gestão de Obras

Web app instalável (PWA) para escritório de arquitetura e engenharia gerenciar
obras, com portal exclusivo para cada cliente acompanhar a própria obra.
**Um motor, duas janelas:** o dado é registrado uma vez no painel da equipe
(`/app`) e alimenta o portal do cliente (`/portal`).

Especificação completa: [PLANO-DESENVOLVIMENTO.md](./PLANO-DESENVOLVIMENTO.md).

## Stack

React 18 + Vite + TypeScript · Tailwind CSS (tokens próprios) · React Router v6
· TanStack Query · React Hook Form + Zod · Supabase (Postgres + Auth + Storage
+ Edge Functions) · vite-plugin-pwa · Vitest.

## Como rodar

### 1. Dependências

```bash
npm install
```

### 2. Projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Aplique as migrations (via [CLI](https://supabase.com/docs/guides/cli)):

   ```bash
   supabase link --project-ref SEU_REF
   supabase db push
   ```

   Sem CLI: cole o conteúdo de `supabase/migrations/*.sql` (em ordem) no SQL
   Editor do dashboard.
3. Rode o seed (`supabase/seed.sql`) no SQL Editor — cria os templates de
   etapas residenciais, o catálogo de itens e o branding padrão.
4. **Desabilite signup público** em Authentication → Providers → Email
   ("Allow new users to sign up" OFF). Usuários são criados pelo escritório.

### 3. Primeiro admin

Crie o usuário em Authentication → Users → *Add user* (e-mail + senha) e
promova-o no SQL Editor:

```sql
update perfis set papel = 'admin', primeiro_acesso = false
where id = (select id from auth.users where email = 'voce@escritorio.com');
```

> Por segurança, o papel `admin` nunca é concedido via signup/metadata — só
> por SQL ou por outro admin. Usuários de equipe/cliente são criados com
> metadata `{ "nome": "...", "papel": "equipe" | "cliente" }`.

### 4. Variáveis de ambiente

```bash
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Project Settings → API)
```

A chave da Anthropic (Fase 8, leitura de orçamentos por IA) vive **apenas**
como secret da Edge Function — nunca no frontend.

### 5. Rodar

```bash
npm run dev        # desenvolvimento
npm test           # testes unitários (cálculo de progresso etc.)
npm run build      # type-check + build de produção (gera a PWA)
```

## Estrutura

```
src/
├── app/        # janela da EQUIPE (painel interno)
├── portal/     # janela do CLIENTE (read-only)
├── shared/
│   ├── auth/        # login, guardas por papel, primeiro acesso
│   ├── components/  # UI kit (Button, Card, ProgressBar, Modal, Toast…)
│   ├── hooks/
│   ├── lib/         # supabase client, progresso, formatação, branding
│   └── types/       # tipos do schema (regenerar com supabase gen types)
├── styles/     # tokens de design (CSS variables) + Tailwind
supabase/
├── migrations/ # schema, RLS, triggers de progresso, storage
└── seed.sql    # templates de etapas + catálogo de itens
```

### Regra de ouro

**Toda regra de acesso vive no banco (RLS).** O frontend nunca é a única
barreira: `admin` vê tudo; `equipe` lê/escreve nas obras onde é membro;
`cliente` só lê a própria obra, e só registros `visivel_cliente = true`.

### Tipos do banco

`src/shared/types/database.ts` está no formato do gerador oficial. Com o
projeto vinculado, regenere com:

```bash
supabase gen types typescript --linked > src/shared/types/database.ts
```

## Roteiro (fases do plano)

- [x] **Fase 0 — Fundação:** setup, schema + RLS + triggers, seed, design
      tokens, componentes base, auth com papéis e primeiro acesso.
- [ ] Fase 1 — Obras e estrutura (wizard, templates, progresso em cascata)
- [ ] Fase 2 — Acompanhamento (fotos, feed, agenda)
- [ ] Fase 3 — Portal do cliente + convites + PWA
- [ ] Fase 4 — Suprimentos e cotações
- [ ] Fase 5 — Financeiro
- [ ] Fase 6 — Quantitativos
- [ ] Fase 7 — Cronograma e relatórios
- [ ] Fase 8 — IA de leitura de orçamento
- [ ] Fase 9 — Polimento e entrega

## Deploy

Vercel/Netlify: build `npm run build`, diretório `dist/`, variáveis
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Ícones da PWA são
placeholders — substituir pela marca do escritório na Fase 9
(`npm run gerar-icones` regenera os placeholders).
