-- Stop Online: suporte a múltiplos jogadores (2–5) em tempo real
-- Execute no SQL Editor do Supabase

-- ── 1. Novas colunas em stop_rooms ───────────────────────────────────────────
ALTER TABLE stop_rooms
  ADD COLUMN IF NOT EXISTS max_players int   NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS players     jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS seen_count  int   NOT NULL DEFAULT 0;

-- ── 2. Entrada atômica na sala ────────────────────────────────────────────────
-- Garante que dois jogadores não peguem a mesma vaga ao mesmo tempo
CREATE OR REPLACE FUNCTION join_stop_room(
  p_room_id     uuid,
  p_player_id   text,
  p_player_name text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_room       stop_rooms;
  v_count      int;
  v_new_count  int;
  v_is_full    bool;
BEGIN
  SELECT * INTO v_room FROM stop_rooms WHERE id = p_room_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_room.status != 'waiting' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_waiting');
  END IF;

  v_count := jsonb_array_length(v_room.players);

  IF v_count >= v_room.max_players THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'full');
  END IF;

  -- Já entrou antes?
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_room.players) elem
    WHERE elem->>'id' = p_player_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_joined');
  END IF;

  v_new_count := v_count + 1;
  v_is_full   := v_new_count >= v_room.max_players;

  UPDATE stop_rooms SET
    players      = players || jsonb_build_array(
                     jsonb_build_object('id', p_player_id, 'name', p_player_name)),
    -- mantém player2_id/name para compatibilidade com salas 1v1 e async
    player2_id   = CASE WHEN v_count = 1 THEN p_player_id   ELSE player2_id   END,
    player2_name = CASE WHEN v_count = 1 THEN p_player_name ELSE player2_name END,
    status       = CASE WHEN v_is_full   THEN 'active'      ELSE status       END
  WHERE id = p_room_id;

  RETURN jsonb_build_object(
    'ok',           true,
    'player_count', v_new_count,
    'max_players',  v_room.max_players,
    'is_full',      v_is_full
  );
END;
$$;

-- ── 3. Marcar resultado visto; apaga sala quando todos viram ──────────────────
CREATE OR REPLACE FUNCTION mark_stop_result_seen(p_room_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_seen   int;
  v_needed int;
BEGIN
  UPDATE stop_rooms SET seen_count = seen_count + 1 WHERE id = p_room_id;

  SELECT seen_count,
         GREATEST(jsonb_array_length(players), 2)
    INTO v_seen, v_needed
  FROM stop_rooms
  WHERE id = p_room_id;

  IF FOUND AND v_seen >= v_needed THEN
    DELETE FROM stop_rooms WHERE id = p_room_id;
  END IF;
END;
$$;

-- ── 4. Limpeza periódica (execute manualmente ou agende via pg_cron) ──────────
CREATE OR REPLACE FUNCTION cleanup_old_stop_rooms()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Salas em espera sem atividade há mais de 10 minutos
  DELETE FROM stop_rooms
  WHERE status = 'waiting' AND created_at < now() - interval '10 minutes';

  -- Salas assíncronas concluídas há mais de 2 dias
  DELETE FROM stop_rooms
  WHERE mode = 'async' AND status = 'completed'
    AND COALESCE(deadline, created_at) < now() - interval '2 days';
END;
$$;
