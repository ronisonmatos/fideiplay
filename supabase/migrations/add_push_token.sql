-- Adiciona coluna push_token para notificações push remotas via Expo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;

-- Índice parcial: só perfis que têm token cadastrado
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
  ON profiles(id)
  WHERE push_token IS NOT NULL;

-- Permissão: usuário atualiza o próprio token
DROP POLICY IF EXISTS "usuario_atualiza_push_token" ON profiles;
CREATE POLICY "usuario_atualiza_push_token" ON profiles
  FOR UPDATE USING (auth.uid() = id);
