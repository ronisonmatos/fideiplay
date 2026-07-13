-- Corrige o pack "Consagração a Nossa Senhora (Montfort)" (id
-- e6efe7c1-6ddd-4833-880d-ac6abe2b2d83, game_type='trilhas'): marcar
-- gratuito=false NESSA LINHA fez o pack inteiro sumir (mergeTrilhas não
-- filtra mais por pack.owned, mas na época ainda filtrava — bug corrigido em
-- hooks/use-game-packs.ts). O certo é gratuito=true sempre nessa linha, e o
-- "gratis"/"preco" DENTRO da trilha é quem controla premium de verdade.

UPDATE game_packs
SET
  gratuito = true,
  conteudo = jsonb_set(
    jsonb_set(conteudo, '{trilhas,0,gratis}', 'false'::jsonb),
    '{trilhas,0,preco}', '9.90'::jsonb
  )
WHERE id = 'e6efe7c1-6ddd-4833-880d-ac6abe2b2d83'
  AND game_type = 'trilhas';
