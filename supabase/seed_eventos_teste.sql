-- Um evento de exemplo por categoria, para o usuário teste@teste.com, já aprovado
-- e dentro da janela de exibição — usado para testar visualmente as cores/layouts
-- do BannerAd por categoria. Script de uso único, não é uma migration.

DO $$
DECLARE
  v_user uuid := 'e374a22b-a878-4f7a-a7e5-d53a22459615';
BEGIN
  INSERT INTO public.eventos_patrocinados
    (usuario_id, titulo, categoria, descricao, data_inicio, data_fim, local_evento,
     alcance, periodo, status, exibicao_inicio, exibicao_fim, aprovado_em)
  VALUES
    (v_user, 'Retiro de Carnaval em Aparecida', 'retiro',
     'Um final de semana de oração, silêncio e partilha com a comunidade.',
     CURRENT_DATE + 20, CURRENT_DATE + 22, 'Santuário Nacional de Aparecida — Aparecida/SP',
     'nacional', 15, 'aprovado', CURRENT_DATE, CURRENT_DATE + 15, now()),

    (v_user, 'Festa do Padroeiro São José', 'festa',
     'Celebração, procissão e festa comunitária em honra ao padroeiro.',
     CURRENT_DATE + 3, CURRENT_DATE + 3, 'Paróquia São José — Joinville/SC',
     'nacional', 7, 'aprovado', CURRENT_DATE, CURRENT_DATE + 7, now()),

    (v_user, 'Missa de Ação de Graças', 'missa',
     'Missa especial de ação de graças pelos 50 anos da paróquia.',
     CURRENT_DATE + 15, CURRENT_DATE + 15, 'Catedral Metropolitana — São Paulo/SP',
     'nacional', 15, 'aprovado', CURRENT_DATE, CURRENT_DATE + 15, now()),

    (v_user, 'Curso de Formação em Teologia Bíblica', 'curso',
     'Curso de 8 semanas sobre introdução à teologia bíblica, com certificado.',
     CURRENT_DATE + 30, CURRENT_DATE + 72, 'Online — Zoom',
     'nacional', 30, 'aprovado', CURRENT_DATE, CURRENT_DATE + 30, now()),

    (v_user, 'Novena de Nossa Senhora Aparecida', 'novena',
     'Novena diária em preparação à festa da padroeira do Brasil.',
     CURRENT_DATE + 5, CURRENT_DATE + 14, 'Paróquia Nossa Senhora Aparecida — Curitiba/PR',
     'nacional', 15, 'aprovado', CURRENT_DATE, CURRENT_DATE + 15, now()),

    (v_user, 'Encontro de Casais em Cristo', 'outro',
     'Encontro para casais fortalecerem o casamento à luz da fé.',
     CURRENT_DATE + 10, CURRENT_DATE + 11, 'Casa de Retiros Emaús — Belo Horizonte/MG',
     'nacional', 15, 'aprovado', CURRENT_DATE, CURRENT_DATE + 15, now());
END $$;
