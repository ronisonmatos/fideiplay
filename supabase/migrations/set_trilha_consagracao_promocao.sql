-- Marca a trilha "Consagração a Nossa Senhora (Montfort)" como em promoção
-- (faixa visual no card, sem alterar preço/cobrança — ver components/promo-ribbon.tsx).

UPDATE game_packs
SET conteudo = jsonb_set(conteudo, '{trilhas,0,emPromocao}', 'true'::jsonb)
WHERE id = 'e6efe7c1-6ddd-4833-880d-ac6abe2b2d83'
  AND game_type = 'trilhas';
