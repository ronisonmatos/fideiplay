-- LGPD compliance fields
-- Execute este script no SQL Editor do Supabase

-- 1. Adiciona colunas na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date        date,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- 2. Atualiza a função/trigger de criação de perfil para incluir os novos campos.
--    Substitua "handle_new_user" pelo nome real da sua função de trigger, se for diferente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    avatar_emoji,
    birth_date,
    accepted_terms_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Jogador'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🙏'),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'accepted_terms_at', '')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    name              = EXCLUDED.name,
    avatar_emoji      = EXCLUDED.avatar_emoji,
    birth_date        = COALESCE(EXCLUDED.birth_date,        profiles.birth_date),
    accepted_terms_at = COALESCE(EXCLUDED.accepted_terms_at, profiles.accepted_terms_at);

  RETURN NEW;
END;
$$;

-- 3. Garante que o trigger continua ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
