-- Supabase não permite ALTER DATABASE ... SET pra parâmetros customizados
-- (exige superusuário que nem o dono do projeto tem em instâncias gerenciadas).
-- Troca a fonte da service_role_key de current_setting(...) pro Vault nativo
-- do Supabase, que é o jeito suportado de guardar segredos acessíveis por
-- funções/cron. A chave em si foi salva via vault.create_secret(...) (não
-- entra em nenhum arquivo versionado).

-- notify_user (contestações/Stop assíncrono) — antes lia current_setting()
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id uuid,
  p_title   text,
  p_body    text,
  p_data    jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key text;
  v_url text := 'https://luvgzsvchwvuhlfmgmsq.supabase.co/functions/v1/enviar-notificacao';
BEGIN
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';
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
  NULL;
END;
$$;

-- Cron dispatch-notifications — recriado usando o Vault em vez de current_setting()
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
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body    := '{}'
  );
  $$
);

-- Cron verificar-sequencias-risco — recriado pela mesma razão (usava current_setting())
SELECT cron.unschedule('verificar-sequencias-risco') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'verificar-sequencias-risco'
);

SELECT cron.schedule(
  'verificar-sequencias-risco',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://luvgzsvchwvuhlfmgmsq.supabase.co/functions/v1/verificar-sequencias-risco',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body    := '{}'
  );
  $$
);
