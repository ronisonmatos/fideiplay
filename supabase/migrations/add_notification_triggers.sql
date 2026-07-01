-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers de notificação automática
--
-- PRÉ-REQUISITO (execute uma vez no SQL Editor do Supabase):
--
--   ALTER DATABASE postgres
--     SET app.settings.service_role_key = 'eyJ...sua_service_role_key...';
--
-- A service_role_key fica em: Supabase Dashboard → Settings → API
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extensão pg_net (HTTP async a partir do banco) ─────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ── 2. Função auxiliar: chama a Edge Function enviar-notificacao ──────────────
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id uuid,
  p_title   text,
  p_body    text,
  p_data    jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key  text := current_setting('app.settings.service_role_key', true);
  v_url  text := 'https://luvgzsvchwvuhlfmgmsq.supabase.co/functions/v1/enviar-notificacao';
BEGIN
  -- Sem chave configurada → aborta silenciosamente
  IF v_key IS NULL OR v_key = '' THEN RETURN; END IF;

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object(
      'user_id', p_user_id,
      'title',   p_title,
      'body',    p_body,
      'data',    p_data
    )::text
  );
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloqueia a transação principal
  NULL;
END;
$$;

-- ── 3. Trigger: resultado do Stop Online (assíncrono) ─────────────────────────
--
-- Dispara em dois momentos:
--   a) status → 'async_wait_p2': P1 terminou → avisa P2 para jogar
--   b) status → 'completed':     P2 terminou → avisa P1 que o resultado está pronto
--
CREATE OR REPLACE FUNCTION trg_fn_stop_notify()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- a) P1 enviou respostas — notifica P2 para jogar
  IF NEW.status = 'async_wait_p2'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.player2_id IS NOT NULL
  THEN
    PERFORM notify_user(
      NEW.player2_id::uuid,
      '⚔️ ' || COALESCE(NEW.player1_name, 'Seu adversário') || ' jogou!',
      'Sua vez no Stop Católico. Responda antes do prazo!',
      jsonb_build_object('type', 'stop_async_invite', 'room_id', NEW.id::text)
    );
  END IF;

  -- b) P2 enviou respostas — notifica P1 que o resultado está disponível
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM NEW.status
  THEN
    PERFORM notify_user(
      NEW.player1_id::uuid,
      '🏁 Resultado disponível!',
      COALESCE(NEW.player2_name, 'Seu adversário') || ' respondeu. Veja quem ganhou!',
      jsonb_build_object('type', 'stop_result', 'room_id', NEW.id::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stop_notify ON stop_rooms;
CREATE TRIGGER trg_stop_notify
  AFTER UPDATE OF status ON stop_rooms
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_stop_notify();

-- ── 4. Trigger: nova mensagem no chat comunitário ─────────────────────────────
--
-- Notifica até 10 usuários que enviaram mensagem nos últimos 30 min
-- (exceto o próprio remetente).
-- As chamadas pg_net são assíncronas — não bloqueiam o INSERT.
--
CREATE OR REPLACE FUNCTION trg_fn_chat_notify()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  rec record;
  cnt int := 0;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id
    FROM community_messages
    WHERE user_id   != NEW.user_id
      AND created_at >= now() - interval '30 minutes'
    LIMIT 10
  LOOP
    PERFORM notify_user(
      rec.user_id,
      '💬 ' || NEW.user_name,
      NEW.content,
      jsonb_build_object('type', 'chat')
    );
    cnt := cnt + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_notify ON community_messages;
CREATE TRIGGER trg_chat_notify
  AFTER INSERT ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_chat_notify();
