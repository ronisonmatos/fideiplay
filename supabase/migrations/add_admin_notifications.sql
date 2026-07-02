-- Painel admin: enviar notificação geral (todos os usuários) ou direta (um usuário),
-- imediata ou agendada. Reaproveita a tabela `notifications` já existente.
--
-- A policy antiga permitia INSERT de qualquer cliente autenticado (WITH CHECK true) —
-- qualquer usuário podia inserir notificação falsa pra qualquer outro. Fechado aqui:
-- só passa pelas funções admin abaixo.

DROP POLICY IF EXISTS "service_insere" ON notifications;
CREATE POLICY "apenas_admin_functions_inserem" ON notifications
  FOR INSERT WITH CHECK (false);

-- Notificação pra um usuário específico (imediata ou agendada)
CREATE OR REPLACE FUNCTION admin_send_notification(
  p_user_id      uuid,
  p_title        text,
  p_body         text,
  p_scheduled_at timestamptz DEFAULT now()
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  INSERT INTO notifications (user_id, title, body, scheduled_at)
  VALUES (p_user_id, p_title, p_body, p_scheduled_at)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Notificação pra TODOS os usuários (imediata ou agendada)
CREATE OR REPLACE FUNCTION admin_broadcast_notification(
  p_title        text,
  p_body         text,
  p_scheduled_at timestamptz DEFAULT now()
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  INSERT INTO notifications (user_id, title, body, scheduled_at)
  SELECT id, p_title, p_body, p_scheduled_at FROM profiles;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Cron: dispara a Edge Function dispatch-notifications a cada 2 minutos —
-- ela manda o push (Expo) de tudo que já venceu (scheduled_at <= now()) e
-- ainda não foi enviado. Cobre agendamentos futuros e serve de rede de
-- segurança pro envio "imediato" (o admin também dispara na hora pelo app).
--
-- PRÉ-REQUISITO: rode no SQL Editor (privilégio de superusuário, o CLI não tem):
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'sua_service_role_key';
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('dispatch-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'dispatch-notifications'
);

SELECT cron.schedule(
  'dispatch-notifications',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://luvgzsvchwvuhlfmgmsq.supabase.co/functions/v1/dispatch-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body    := '{}'
  );
  $$
);
