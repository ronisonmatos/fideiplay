-- Corrige o erro "Não foi possível usar a dica agora. Tente novamente." (e
-- falhas silenciosas de moedas em vários jogos).
--
-- Causa: coexistiam DUAS versões da função add_coins no banco —
--   add_coins(uuid, int)         → profiles-schema.sql / ranking-schema.sql
--   add_coins(uuid, int, text)   → transacoes-schema.sql (p_motivo DEFAULT NULL)
-- Como têm assinaturas diferentes, o `CREATE OR REPLACE` da segunda NÃO removeu
-- a primeira: as duas passaram a existir ao mesmo tempo. Quando o app chama com
-- 2 argumentos ({p_user_id, p_amount}), o PostgREST não consegue decidir entre
-- as duas candidatas e responde PGRST203 ("could not choose the best candidate
-- function"). A dica do Stop é uma das poucas ações que checam o erro do RPC
-- (`if (error) throw error`), por isso ela mostra o alerta; a maioria das outras
-- chamadas de moeda ignora o erro e falha em silêncio (moedas não creditadas /
-- debitadas).
--
-- Solução: manter APENAS a versão de 3 argumentos (com p_motivo DEFAULT NULL),
-- que atende tanto as chamadas de 2 quanto as de 3 argumentos, eliminando a
-- ambiguidade. Rode este arquivo no SQL Editor do Supabase.

DROP FUNCTION IF EXISTS add_coins(uuid, int);

CREATE OR REPLACE FUNCTION add_coins(p_user_id uuid, p_amount int, p_motivo text DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_coins int;
BEGIN
  UPDATE profiles
    SET coins = greatest(0, coins + p_amount)
    WHERE id = p_user_id
    RETURNING coins INTO new_coins;

  IF p_amount != 0 THEN
    INSERT INTO transacoes_moedas (usuario_id, valor, tipo, motivo)
    VALUES (
      p_user_id,
      abs(p_amount),
      CASE WHEN p_amount > 0 THEN 'ganho' ELSE 'gasto' END,
      p_motivo
    );
  END IF;

  RETURN coalesce(new_coins, 0);
END;
$$;
