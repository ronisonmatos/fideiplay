-- ============================================================
-- SantosPlay — Stop Católico Online
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── Tabela de salas ──────────────────────────────────────────
create table if not exists stop_rooms (
  id              uuid        primary key default gen_random_uuid(),
  letter          char(1)     not null,

  -- Modo da sala:
  --   'realtime' : ambos jogam ao mesmo tempo (tempo real)
  --   'async'    : cada jogador responde no seu tempo (até 2 dias)
  mode            text        not null default 'realtime',

  -- Visibilidade:
  --   'public'  : aparece na lista de salas
  --   'private' : não aparece na lista; P2 entra via room_code
  visibility      text        not null default 'public',

  -- Código curto para salas privadas (6 chars, gerado no app)
  room_code       text        unique,

  -- Status da sala:
  --   'waiting'       : aguardando player2 (realtime) ou P1 preenchendo (async, transitório)
  --   'active'        : P2 entrou, ambos jogando (realtime)
  --   'async_wait_p2' : P1 enviou respostas, aguardando P2 (async)
  --   'async_p2'      : P2 está respondendo (async, sala reservada)
  --   'completed'     : ambos enviaram respostas (async)
  --   'abandoned'     : alguém abandonou (realtime)
  status          text        not null default 'waiting',

  player1_id      text        not null,
  player2_id      text,
  player1_name    text,                          -- nome para exibir na lista de salas
  player2_name    text,

  abandoned_by    text,                          -- player_id de quem abandonou
  deadline        timestamptz,                   -- prazo para P2 responder (async, now + 2 days)

  p1_rematch      boolean     default false,
  p2_rematch      boolean     default false,
  rematch_room_id uuid        default null,

  created_at      timestamptz default now()
);

-- ── Tabela de respostas ───────────────────────────────────────
create table if not exists stop_answers (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references stop_rooms(id) on delete cascade,
  player_id   text        not null,
  answers     jsonb       not null default '{}',
  score       int         not null default 0,
  valid_count int         not null default 0,
  submitted   boolean     not null default false,
  created_at  timestamptz default now(),
  unique(room_id, player_id)
);

-- ── Índices para performance ──────────────────────────────────
create index if not exists idx_stop_rooms_mode_status
  on stop_rooms(mode, status);

create index if not exists idx_stop_rooms_room_code
  on stop_rooms(room_code)
  where room_code is not null;

create index if not exists idx_stop_rooms_player1
  on stop_rooms(player1_id);

create index if not exists idx_stop_rooms_player2
  on stop_rooms(player2_id);

create index if not exists idx_stop_rooms_deadline
  on stop_rooms(deadline)
  where deadline is not null;

create index if not exists idx_stop_answers_room
  on stop_answers(room_id);

-- ── Row Level Security ────────────────────────────────────────
alter table stop_rooms   enable row level security;
alter table stop_answers enable row level security;

-- Permitir leitura de todas as salas para usuários autenticados
-- (necessário para matchmaking e listagem de salas)
drop policy if exists "public" on stop_rooms;
create policy "Leitura de salas autenticado"
  on stop_rooms for select
  using (auth.role() = 'authenticated');

-- Apenas o criador pode criar a sala
drop policy if exists "public insert" on stop_rooms;
create policy "Inserção de sala pelo criador"
  on stop_rooms for insert
  with check (player1_id = auth.uid()::text);

-- Criador ou P2 podem atualizar a sala
drop policy if exists "public update" on stop_rooms;
create policy "Atualização de sala pelos jogadores"
  on stop_rooms for update
  using (
    player1_id = auth.uid()::text
    or player2_id = auth.uid()::text
    or (status = 'waiting' and player2_id is null)   -- qualquer auth pode entrar como P2
    or (status = 'async_wait_p2' and player2_id is null)
  );

-- Apenas o criador pode deletar (ex: cancelar sala sem adversário)
drop policy if exists "public delete" on stop_rooms;
create policy "Remoção de sala pelo criador"
  on stop_rooms for delete
  using (player1_id = auth.uid()::text);

-- Respostas: usuário só pode inserir/atualizar as próprias
drop policy if exists "public" on stop_answers;
create policy "Leitura de respostas da sala"
  on stop_answers for select
  using (
    exists (
      select 1 from stop_rooms r
      where r.id = room_id
        and (r.player1_id = auth.uid()::text or r.player2_id = auth.uid()::text)
    )
  );

create policy "Inserção de resposta própria"
  on stop_answers for insert
  with check (player_id = auth.uid()::text);

create policy "Atualização de resposta própria"
  on stop_answers for update
  using (player_id = auth.uid()::text);

-- ── Migração incremental (banco existente) ───────────────────
-- Execute apenas se a tabela stop_rooms já existir sem essas colunas:
--   alter table stop_rooms add column if not exists visibility text not null default 'public';
--   alter table stop_rooms add column if not exists room_code  text unique;
--   create index if not exists idx_stop_rooms_room_code on stop_rooms(room_code) where room_code is not null;

-- ── Realtime ──────────────────────────────────────────────────
-- ATENÇÃO: execute apenas se as tabelas ainda não estiverem na publicação.
-- Se receber erro "already member of publication", pule estas linhas.
alter publication supabase_realtime add table stop_rooms;
alter publication supabase_realtime add table stop_answers;

-- ── Limpeza automática ────────────────────────────────────────
-- Salas realtime presas em 'waiting'/'active' por mais de 2 horas
-- Salas async concluídas ou abandonadas com mais de 30 dias
-- (rodar manualmente ou configurar pg_cron no Supabase)
--
-- delete from stop_rooms
--   where (mode = 'realtime' and status in ('waiting','active','abandoned')
--          and created_at < now() - interval '2 hours')
--      or (mode = 'async' and status in ('completed','abandoned')
--          and created_at < now() - interval '30 days')
--      or (mode = 'async' and status = 'async_wait_p2'
--          and deadline < now() - interval '7 days');
