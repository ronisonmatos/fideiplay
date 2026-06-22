-- FideiPlay — Trilhas desbloqueadas por usuário
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS user_trilhas (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trilha_id  int  NOT NULL,
  origem     text NOT NULL DEFAULT 'manual', -- 'manual' | 'compra' | 'promo'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, trilha_id)
);

ALTER TABLE user_trilhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê suas trilhas" ON user_trilhas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Apenas service role insere" ON user_trilhas
  FOR INSERT WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_user_trilhas_user ON user_trilhas (user_id);

-- Função para admin desbloquear trilha manualmente
CREATE OR REPLACE FUNCTION admin_unlock_trilha(p_user_id uuid, p_trilha_id int, p_origem text DEFAULT 'manual')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_trilhas (user_id, trilha_id, origem)
  VALUES (p_user_id, p_trilha_id, p_origem)
  ON CONFLICT (user_id, trilha_id) DO NOTHING;
END;
$$;
