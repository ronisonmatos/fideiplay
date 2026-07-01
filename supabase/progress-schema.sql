-- SantosPlay — Progresso do usuário (offline-first sync)
-- Execute no SQL Editor do Supabase

-- 1. Tabela de progresso
create table if not exists user_progress (
  user_id               uuid        primary key references auth.users(id) on delete cascade,
  games_played          int         not null default 0,
  games_xp              int         not null default 0,
  unlocked_achievements text[]      not null default '{}',
  licoes_concluidas     text[]      not null default '{}',
  trilhas_xp            int         not null default 0,
  updated_at            timestamptz not null default now()
);

-- 2. RLS — cada usuário acessa só o próprio progresso
alter table user_progress enable row level security;

create policy "Usuário lê o próprio progresso"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Usuário insere o próprio progresso"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza o próprio progresso"
  on user_progress for update
  using (auth.uid() = user_id);

-- 3. Função de upsert atômico com merge (nunca perde dados)
--    Usa MAX para números e array_union para listas
--    COALESCE nos arrays protege contra o cliente JS enviar null para text[]
create or replace function merge_user_progress(
  p_user_id               uuid,
  p_games_played          int     default 0,
  p_games_xp              int     default 0,
  p_unlocked_achievements text[]  default '{}',
  p_licoes_concluidas     text[]  default '{}',
  p_trilhas_xp            int     default 0
)
returns void language plpgsql security definer as $$
declare
  v_achievements text[] := coalesce(p_unlocked_achievements, '{}');
  v_licoes       text[] := coalesce(p_licoes_concluidas,     '{}');
begin
  insert into user_progress (
    user_id, games_played, games_xp,
    unlocked_achievements, licoes_concluidas, trilhas_xp, updated_at
  )
  values (
    p_user_id, p_games_played, p_games_xp,
    v_achievements, v_licoes, p_trilhas_xp, now()
  )
  on conflict (user_id) do update set
    games_played          = greatest(user_progress.games_played, excluded.games_played),
    games_xp              = greatest(user_progress.games_xp, excluded.games_xp),
    unlocked_achievements = coalesce(
      (select array_agg(distinct elem)
       from unnest(user_progress.unlocked_achievements || coalesce(excluded.unlocked_achievements, '{}')) as elem),
      '{}'
    ),
    licoes_concluidas     = coalesce(
      (select array_agg(distinct elem)
       from unnest(user_progress.licoes_concluidas || coalesce(excluded.licoes_concluidas, '{}')) as elem),
      '{}'
    ),
    trilhas_xp            = greatest(user_progress.trilhas_xp, excluded.trilhas_xp),
    updated_at            = now();
end;
$$;
