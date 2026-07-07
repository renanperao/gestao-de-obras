-- ============================================================
-- Fase 0 — Recálculo de progresso em cascata (espelho SQL da
-- função pura em src/shared/lib/progresso.ts):
--   progresso_etapa = Σ(progresso_subetapa × peso) / Σ(peso)
--   progresso_obra  = Σ(progresso_etapa × peso) / Σ(peso)
-- Trigger em subetapas mantém os caches sempre coerentes.
-- ============================================================

-- security definer: o recálculo do cache não pode falhar por RLS
create or replace function public.recalcular_progresso_etapa(p_etapa uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v numeric;
begin
  select round(sum(s.progresso * s.peso) / nullif(sum(s.peso), 0), 2)
    into v
  from subetapas s
  where s.etapa_id = p_etapa;

  -- sem subetapas (v null): mantém o progresso lançado direto na etapa
  if v is not null then
    update etapas
    set progresso = least(greatest(v, 0), 100)
    where id = p_etapa
      and progresso is distinct from least(greatest(v, 0), 100);
  end if;
end;
$$;

create or replace function public.recalcular_progresso_obra(p_obra uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v numeric;
begin
  select coalesce(round(sum(e.progresso * e.peso) / nullif(sum(e.peso), 0), 2), 0)
    into v
  from etapas e
  where e.obra_id = p_obra;

  update obras
  set progresso = least(greatest(v, 0), 100)
  where id = p_obra
    and progresso is distinct from least(greatest(v, 0), 100);
end;
$$;

-- subetapa mudou → recalcula a etapa (e a antiga, se trocou de etapa)
create or replace function public.trg_recalcular_etapa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_progresso_etapa(old.etapa_id);
  else
    perform public.recalcular_progresso_etapa(new.etapa_id);
    if tg_op = 'UPDATE' and new.etapa_id is distinct from old.etapa_id then
      perform public.recalcular_progresso_etapa(old.etapa_id);
    end if;
  end if;
  return null;
end;
$$;

create trigger recalcula_progresso_etapa
  after insert or update or delete on public.subetapas
  for each row execute function public.trg_recalcular_etapa();

-- etapa mudou (progresso/peso, criação ou remoção) → recalcula a obra
create or replace function public.trg_recalcular_obra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_progresso_obra(old.obra_id);
  else
    perform public.recalcular_progresso_obra(new.obra_id);
  end if;
  return null;
end;
$$;

create trigger recalcula_progresso_obra
  after insert or delete or update of progresso, peso on public.etapas
  for each row execute function public.trg_recalcular_obra();
