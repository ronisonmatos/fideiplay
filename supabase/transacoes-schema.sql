-- FideiPlay — Tabela de transações de moedas
-- Execute no SQL Editor do Supabase APÓS profiles-schema.sql

CREATE TABLE IF NOT EXISTS transacoes_moedas (
  id         SERIAL       PRIMARY KEY,
  usuario_id UUID         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  valor      INTEGER      NOT NULL,
  tipo       TEXT         NOT NULL CHECK (tipo IN ('ganho', 'gasto')),
  motivo     TEXT,
  criado_em  TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE transacoes_moedas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias transações" ON transacoes_moedas
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprias transações" ON transacoes_moedas
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON transacoes_moedas (usuario_id, criado_em DESC);

-- Atualiza add_coins para também registrar a transação
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
