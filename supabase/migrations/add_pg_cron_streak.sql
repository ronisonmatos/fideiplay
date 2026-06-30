-- ─────────────────────────────────────────────────────────────────────────────
-- pg_cron: sequência em risco — roda todo dia às 20h (Brasília = 23h UTC)
--
-- PRÉ-REQUISITO: extensão pg_cron deve estar ativa no Supabase.
-- Ative em: Dashboard → Database → Extensions → pg_cron
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Função SQL: usuários com sequência em risco ────────────────────────────
--
-- "Em risco" = jogou ontem (UTC-3) mas ainda não jogou hoje.
-- Retorna user_id e quantos dias consecutivos a sequência tem.
--
CREATE OR REPLACE FUNCTION get_streak_at_risk_users()
RETURNS TABLE(user_id uuid, streak_days bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  WITH
  -- Ajuste de fuso horário Brasil (UTC-3)
  hoje AS (
    SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS d
  ),
  ontem AS (
    SELECT ((now() AT TIME ZONE 'America/Sao_Paulo') - interval '1 day')::date AS d
  ),
  -- Quem jogou hoje
  jogaram_hoje AS (
    SELECT DISTINCT user_id
    FROM score_events
    WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (SELECT d FROM hoje)
  ),
  -- Quem jogou ontem mas NÃO jogou hoje
  em_risco AS (
    SELECT DISTINCT user_id
    FROM score_events
    WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (SELECT d FROM ontem)
      AND user_id NOT IN (SELECT user_id FROM jogaram_hoje)
  ),
  -- Tamanho da sequência: dias distintos jogados nos últimos 30 dias
  tamanho_sequencia AS (
    SELECT
      e.user_id,
      COUNT(DISTINCT (created_at AT TIME ZONE 'America/Sao_Paulo')::date) AS streak_days
    FROM score_events e
    JOIN em_risco r ON r.user_id = e.user_id
    WHERE e.created_at >= now() - interval '30 days'
    GROUP BY e.user_id
  )
  SELECT r.user_id, COALESCE(s.streak_days, 1) AS streak_days
  FROM em_risco r
  LEFT JOIN tamanho_sequencia s ON s.user_id = r.user_id
  -- Só notifica quem tem push token cadastrado
  WHERE EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = r.user_id
      AND p.push_token IS NOT NULL
  );
$$;

-- ── 2. Job pg_cron: chama a Edge Function todo dia às 23h UTC (20h Brasília) ──
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
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body    := '{}'
  );
  $$
);

-- ── 3. (Opcional) Limpeza de salas antigas via pg_cron ───────────────────────
-- Roda todo dia às 3h UTC para manter a tabela stop_rooms limpa
SELECT cron.unschedule('cleanup-stop-rooms') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stop-rooms'
);

SELECT cron.schedule(
  'cleanup-stop-rooms',
  '0 3 * * *',
  $$SELECT cleanup_old_stop_rooms();$$
);
