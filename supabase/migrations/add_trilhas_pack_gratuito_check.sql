-- Trava estrutural: "gratuito" da linha do game_packs não tem efeito nenhum
-- para game_type='trilhas' (quem controla free/premium é o campo "gratis"
-- dentro de cada trilha, no JSON — ver supabase/game-packs-schema.sql seção
-- 7). Marcar gratuito=false numa linha de trilhas faz o pack inteiro sumir
-- da lista em vez de virar premium (mergeTrilhas não filtra por pack.owned).
-- Essa constraint transforma esse engano em erro claro na hora do UPDATE/
-- INSERT, em vez de sumiço silencioso.

ALTER TABLE game_packs
ADD CONSTRAINT trilhas_pack_sempre_gratuito
CHECK (game_type <> 'trilhas' OR gratuito = true);
