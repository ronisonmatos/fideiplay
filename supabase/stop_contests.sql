-- Tabela de contestações de respostas do Stop
create table if not exists stop_contests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  room_id         uuid,                        -- null para partidas solo
  category_key    text not null,
  letter          char(1) not null,
  answer          text not null,
  original_result text not null,               -- 'invalid' | 'ai_invalid' | 'unverified'
  game_mode       text not null default 'solo',-- 'solo' | 'online'
  status          text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_at     timestamptz,
  reviewed_by     uuid references profiles(id),
  created_at      timestamptz not null default now()
);

-- Evita múltiplas contestações do mesmo jogador para a mesma resposta na mesma partida
create unique index if not exists stop_contests_unique
  on stop_contests (user_id, room_id, category_key)
  where room_id is not null;

-- RLS
alter table stop_contests enable row level security;

-- Usuário pode inserir e ver as próprias contestações
create policy "user insert own contests"
  on stop_contests for insert
  with check (auth.uid() = user_id);

create policy "user select own contests"
  on stop_contests for select
  using (auth.uid() = user_id);

-- Admins podem ver e atualizar todas
create policy "admin all contests"
  on stop_contests for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );
