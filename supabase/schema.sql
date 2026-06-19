-- Stop Católico Online — Execute no SQL Editor do Supabase

create table if not exists stop_rooms (
  id              uuid primary key default gen_random_uuid(),
  letter          char(1) not null,
  status          text    not null default 'waiting',
  -- waiting: aguardando player2
  -- active:  ambos conectados, jogando
  -- done:    ambos enviaram respostas
  player1_id      text    not null,
  player2_id      text,
  p1_rematch      boolean default false,
  p2_rematch      boolean default false,
  rematch_room_id uuid    default null,
  created_at      timestamptz default now()
);

create table if not exists stop_answers (
  id          uuid    primary key default gen_random_uuid(),
  room_id     uuid    not null references stop_rooms(id) on delete cascade,
  player_id   text    not null,
  answers     jsonb   not null default '{}',
  score       int     not null default 0,
  valid_count int     not null default 0,
  submitted   boolean not null default false,
  created_at  timestamptz default now(),
  unique(room_id, player_id)
);

-- RLS: acesso público (MVP sem autenticação)
alter table stop_rooms   enable row level security;
alter table stop_answers enable row level security;
create policy "public" on stop_rooms   for all using (true) with check (true);
create policy "public" on stop_answers for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table stop_rooms;
alter publication supabase_realtime add table stop_answers;

-- Limpeza automática de salas antigas (opcional, rodar manualmente ou via cron)
-- delete from stop_rooms where created_at < now() - interval '2 hours';
