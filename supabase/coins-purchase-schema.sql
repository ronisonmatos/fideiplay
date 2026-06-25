-- FideiPlay — Compra de trilhas com moedas do jogo
-- Execute no SQL Editor do Supabase

-- Configuração por trilha: admin define quais trilhas aceitam moedas e o preço
CREATE TABLE IF NOT EXISTS trilha_config (
  trilha_id         int     PRIMARY KEY,
  coins_price       int     NOT NULL DEFAULT 500,
  coins_purchasable boolean NOT NULL DEFAULT false,
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE trilha_config ENABLE ROW LEVEL SECURITY;

-- Leitura pública (qualquer usuário autenticado ou anônimo vê os preços)
CREATE POLICY "Trilha config leitura" ON trilha_config
  FOR SELECT USING (true);

-- Somente service role pode inserir/atualizar (admin via dashboard ou script)
CREATE POLICY "Apenas service role edita config" ON trilha_config
  FOR ALL USING (false);

-- Função atômica: valida saldo, debita moedas e desbloqueia trilha em uma transação
CREATE OR REPLACE FUNCTION buy_trilha_with_coins(p_trilha_id int)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_coins_price int;
  v_user_coins  int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 'not_authenticated';
  END IF;

  -- Verifica se a trilha aceita compra com moedas
  SELECT coins_price INTO v_coins_price
  FROM trilha_config
  WHERE trilha_id = p_trilha_id AND coins_purchasable = true;

  IF NOT FOUND THEN
    RETURN 'not_available';
  END IF;

  -- Já desbloqueada?
  IF EXISTS (
    SELECT 1 FROM user_trilhas
    WHERE user_id = v_user_id AND trilha_id = p_trilha_id
  ) THEN
    RETURN 'already_unlocked';
  END IF;

  -- Saldo suficiente?
  SELECT coins INTO v_user_coins FROM profiles WHERE id = v_user_id;
  IF v_user_coins < v_coins_price THEN
    RETURN 'insufficient_coins';
  END IF;

  -- Debita moedas
  UPDATE profiles
  SET coins = coins - v_coins_price
  WHERE id = v_user_id;

  -- Desbloqueia trilha
  INSERT INTO user_trilhas (user_id, trilha_id, origem)
  VALUES (v_user_id, p_trilha_id, 'coins')
  ON CONFLICT (user_id, trilha_id) DO NOTHING;

  RETURN 'success';
END;
$$;

-- Exemplos de configuração (execute conforme necessidade):
-- INSERT INTO trilha_config (trilha_id, coins_price, coins_purchasable)
-- VALUES (4, 500, true)   -- Trilha id=4 por 500 moedas
-- ON CONFLICT (trilha_id) DO UPDATE SET coins_price = EXCLUDED.coins_price, coins_purchasable = EXCLUDED.coins_purchasable;
