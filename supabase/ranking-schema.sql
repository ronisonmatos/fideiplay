-- ─────────────────────────────────────────────────────────────────────────────
-- FideiPlay — Ranking semanal, bônus de entrada e pontuação
-- Execute no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Colunas adicionais na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins            int         NOT NULL DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_coin_reward timestamptz;

-- Função atômica para adicionar/remover moedas (nunca abaixo de 0)
CREATE OR REPLACE FUNCTION add_coins(p_user_id uuid, p_amount int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_coins int;
BEGIN
  UPDATE profiles
    SET coins = greatest(0, coins + p_amount)
    WHERE id = p_user_id
    RETURNING coins INTO new_coins;
  RETURN coalesce(new_coins, 0);
END;
$$;

-- 2. Tabela de eventos de pontuação (alimenta o ranking semanal)
CREATE TABLE IF NOT EXISTS score_events (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source     text        NOT NULL,  -- 'stop_solo' | 'stop_online'
  points     int         NOT NULL CHECK (points > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jogador insere próprio" ON score_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leitura pública" ON score_events
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_score_events_user_created
  ON score_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_events_created
  ON score_events (created_at DESC);

-- 3. Função: ranking dos top-10 na semana atual (seg–dom, UTC)
CREATE OR REPLACE FUNCTION get_weekly_ranking()
RETURNS TABLE (
  user_id      uuid,
  name         text,
  avatar_emoji text,
  weekly_score bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id              AS user_id,
    p.name,
    p.avatar_emoji,
    SUM(e.points)::bigint AS weekly_score
  FROM score_events e
  JOIN profiles p ON p.id = e.user_id
  WHERE e.created_at >= date_trunc('week', now())
  GROUP BY p.id, p.name, p.avatar_emoji
  ORDER BY weekly_score DESC
  LIMIT 10;
$$;

-- 4. Função: resgatar bônus de 2 horas (atômico, server-side)
--    Retorna o novo total de moedas se concedeu, ou -1 se ainda não está na hora.
CREATE OR REPLACE FUNCTION claim_daily_reward(p_user_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  last_reward timestamptz;
  new_coins   int;
BEGIN
  SELECT last_coin_reward INTO last_reward
  FROM profiles WHERE id = p_user_id;

  IF last_reward IS NULL OR now() - last_reward >= interval '2 hours' THEN
    UPDATE profiles
    SET coins            = greatest(0, coins + 5),
        last_coin_reward = now()
    WHERE id = p_user_id
    RETURNING coins INTO new_coins;
    RETURN new_coins;
  ELSE
    RETURN -1;  -- muito cedo, sem recompensa
  END IF;
END;
$$;
