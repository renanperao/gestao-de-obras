-- ============================================================
-- Seed — templates de etapas (obra residencial) e catálogo básico.
-- Idempotente: só insere se as tabelas estiverem vazias.
-- ============================================================

-- ------------------------------------------------------------
-- Templates de etapas residenciais (15 etapas, 3–6 subetapas cada)
-- ------------------------------------------------------------

do $$
declare
  eid uuid;
begin
  if exists (select 1 from public.etapa_templates) then
    return;
  end if;

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Serviços preliminares', 3, 1, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Limpeza do terreno', 1, 1),
    (eid, 'Canteiro e tapume', 1, 2),
    (eid, 'Locação da obra', 1, 3),
    (eid, 'Ligações provisórias (água/energia)', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Fundação', 10, 2, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Escavação', 1, 1),
    (eid, 'Formas e armação', 2, 2),
    (eid, 'Concretagem', 2, 3),
    (eid, 'Impermeabilização de baldrames', 1, 4),
    (eid, 'Aterro e compactação', 1, 5);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Estrutura', 15, 3, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Formas', 2, 1),
    (eid, 'Armação', 2, 2),
    (eid, 'Concretagem de pilares', 2, 3),
    (eid, 'Concretagem de vigas e lajes', 3, 4),
    (eid, 'Desforma e cura', 1, 5);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Alvenaria', 10, 4, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Marcação', 1, 1),
    (eid, 'Elevação', 3, 2),
    (eid, 'Vergas e contravergas', 1, 3),
    (eid, 'Encunhamento', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Cobertura', 7, 5, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Estrutura do telhado', 2, 1),
    (eid, 'Telhamento', 2, 2),
    (eid, 'Rufos e calhas', 1, 3),
    (eid, 'Impermeabilização da laje', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Instalações elétricas', 7, 6, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Infraestrutura (eletrodutos e caixas)', 2, 1),
    (eid, 'Enfiação', 2, 2),
    (eid, 'Quadros e disjuntores', 1, 3),
    (eid, 'Tomadas e interruptores', 1, 4),
    (eid, 'Luminárias', 1, 5);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Instalações hidráulicas', 7, 7, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Água fria', 2, 1),
    (eid, 'Água quente', 1, 2),
    (eid, 'Esgoto e ventilação', 2, 3),
    (eid, 'Águas pluviais', 1, 4),
    (eid, 'Testes de estanqueidade', 1, 5);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Reboco', 6, 8, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Chapisco', 1, 1),
    (eid, 'Reboco interno', 2, 2),
    (eid, 'Reboco externo', 2, 3);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Contrapiso', 4, 9, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Nivelamento e taliscas', 1, 1),
    (eid, 'Execução do contrapiso', 2, 2),
    (eid, 'Cura', 1, 3);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Revestimentos', 8, 10, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Impermeabilização de áreas molhadas', 1, 1),
    (eid, 'Revestimento de paredes', 2, 2),
    (eid, 'Assentamento de pisos', 3, 3),
    (eid, 'Rejunte e acabamento', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Forro', 3, 11, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Estrutura do forro', 1, 1),
    (eid, 'Placas de gesso', 2, 2),
    (eid, 'Acabamento e sancas', 1, 3);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Pintura', 6, 12, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Preparação e massa corrida', 2, 1),
    (eid, 'Selador / fundo', 1, 2),
    (eid, 'Primeira demão', 1, 3),
    (eid, 'Demão final', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Esquadrias', 5, 13, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Portas', 1, 1),
    (eid, 'Janelas', 1, 2),
    (eid, 'Vidros', 1, 3),
    (eid, 'Ferragens e ajustes', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Louças e metais', 4, 14, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Bancadas', 1, 1),
    (eid, 'Louças', 1, 2),
    (eid, 'Metais', 1, 3),
    (eid, 'Acessórios', 1, 4);

  insert into public.etapa_templates (nome, peso_sugerido, ordem, categoria)
  values ('Limpeza final', 2, 15, 'residencial') returning id into eid;
  insert into public.subetapa_templates (etapa_template_id, nome, peso_sugerido, ordem) values
    (eid, 'Limpeza grossa', 1, 1),
    (eid, 'Limpeza fina', 1, 2),
    (eid, 'Vistoria e entrega', 1, 3);
end $$;

-- ------------------------------------------------------------
-- Catálogo básico de itens (~40)
-- ------------------------------------------------------------

do $$
begin
  if exists (select 1 from public.itens_catalogo) then
    return;
  end if;

  insert into public.itens_catalogo (nome, unidade, categoria) values
    -- estrutura
    ('Cimento CP-II 50kg', 'sc', 'estrutura'),
    ('Areia média lavada', 'm³', 'estrutura'),
    ('Brita 1', 'm³', 'estrutura'),
    ('Concreto usinado FCK 25', 'm³', 'estrutura'),
    ('Aço CA-50 10mm (barra 12m)', 'barra', 'estrutura'),
    ('Aço CA-60 5mm (barra 12m)', 'barra', 'estrutura'),
    ('Tela soldada Q92', 'un', 'estrutura'),
    ('Arame recozido nº 18', 'kg', 'estrutura'),
    ('Prego 17x27', 'kg', 'estrutura'),
    ('Tábua de pinus 30cm (forma)', 'm', 'estrutura'),
    ('Escora de eucalipto 3m', 'un', 'estrutura'),
    ('Bloco cerâmico 9x19x39', 'un', 'estrutura'),
    ('Bloco de concreto 14x19x39', 'un', 'estrutura'),
    ('Impermeabilizante para baldrame', 'l', 'estrutura'),
    -- acabamento
    ('Porcelanato 80x80', 'm²', 'acabamento'),
    ('Cerâmica 45x45', 'm²', 'acabamento'),
    ('Argamassa colante AC-II 20kg', 'sc', 'acabamento'),
    ('Argamassa colante AC-III 20kg', 'sc', 'acabamento'),
    ('Rejunte flexível', 'kg', 'acabamento'),
    ('Massa corrida PVA 25kg', 'sc', 'acabamento'),
    ('Tinta acrílica 18L', 'lata', 'acabamento'),
    ('Tinta esmalte 3,6L', 'gl', 'acabamento'),
    ('Selador acrílico 18L', 'lata', 'acabamento'),
    ('Gesso em pó', 'kg', 'acabamento'),
    ('Placa de gesso 60x60', 'un', 'acabamento'),
    ('Granito para bancada', 'm²', 'acabamento'),
    -- elétrica
    ('Eletroduto corrugado 3/4"', 'm', 'elétrica'),
    ('Cabo flexível 2,5mm²', 'm', 'elétrica'),
    ('Cabo flexível 4mm²', 'm', 'elétrica'),
    ('Tomada 10A completa', 'un', 'elétrica'),
    ('Interruptor simples', 'un', 'elétrica'),
    ('Disjuntor bipolar 40A', 'un', 'elétrica'),
    ('Quadro de distribuição 24 circuitos', 'un', 'elétrica'),
    ('Caixa 4x2 amarela', 'un', 'elétrica'),
    -- hidráulica
    ('Tubo PVC soldável 25mm (barra 6m)', 'barra', 'hidráulica'),
    ('Tubo PVC esgoto 100mm (barra 6m)', 'barra', 'hidráulica'),
    ('Joelho 90° soldável 25mm', 'un', 'hidráulica'),
    ('Registro de gaveta 3/4"', 'un', 'hidráulica'),
    ('Caixa d''água 1000L', 'un', 'hidráulica'),
    ('Vaso sanitário com caixa acoplada', 'un', 'hidráulica'),
    ('Torneira para lavatório', 'un', 'hidráulica'),
    ('Sifão universal', 'un', 'hidráulica'),
    ('Engate flexível 40cm', 'un', 'hidráulica');
end $$;

-- ------------------------------------------------------------
-- Branding padrão (linha única)
-- ------------------------------------------------------------

insert into public.configuracao_escritorio (id, nome_escritorio, cor_primaria, cor_destaque, slogan)
values (1, 'Meu Escritório', '#1a1a1a', '#e05a33', 'Arquitetura e engenharia')
on conflict (id) do nothing;
