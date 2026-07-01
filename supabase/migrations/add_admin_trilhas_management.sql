-- Painel admin: buscar usuário por nome/e-mail e liberar/revogar trilhas premium manualmente.
--
-- admin_unlock_trilha já existia (supabase/trilhas-schema.sql) mas NÃO verificava se
-- quem chama é admin — qualquer usuário autenticado podia desbloquear trilhas premium
-- de graça para si mesmo. Corrigido aqui junto com as novas funções.

CREATE OR REPLACE FUNCTION admin_unlock_trilha(p_user_id uuid, p_trilha_id int, p_origem text DEFAULT 'manual')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  INSERT INTO user_trilhas (user_id, trilha_id, origem)
  VALUES (p_user_id, p_trilha_id, p_origem)
  ON CONFLICT (user_id, trilha_id) DO NOTHING;
END;
$$;

-- Revoga uma trilha liberada manualmente (corrigir engano / encerrar teste)
CREATE OR REPLACE FUNCTION admin_revoke_trilha(p_user_id uuid, p_trilha_id int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  DELETE FROM user_trilhas WHERE user_id = p_user_id AND trilha_id = p_trilha_id;
END;
$$;

-- RLS de user_trilhas só deixa cada usuário ver as próprias trilhas — admin precisa
-- de uma função com SECURITY DEFINER para ver as de terceiros.
CREATE OR REPLACE FUNCTION admin_list_user_trilhas(p_user_id uuid)
RETURNS TABLE(trilha_id int, origem text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
  SELECT ut.trilha_id, ut.origem, ut.created_at
  FROM user_trilhas ut
  WHERE ut.user_id = p_user_id;
END;
$$;

-- Busca por nome (profiles) ou e-mail (auth.users — não exposto ao client diretamente)
CREATE OR REPLACE FUNCTION admin_search_users(p_query text)
RETURNS TABLE(id uuid, name text, avatar_emoji text, email text, coins int, total_score int, is_admin boolean)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.avatar_emoji, u.email::text, p.coins, p.total_score, p.is_admin
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.name ILIKE '%' || p_query || '%'
     OR u.email ILIKE '%' || p_query || '%'
  ORDER BY p.name
  LIMIT 20;
END;
$$;
