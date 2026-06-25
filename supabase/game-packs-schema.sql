-- FideiPlay — Sistema de packs de conteúdo para jogos
-- Execute no SQL Editor do Supabase

-- 1. Tabela principal de packs
create table if not exists game_packs (
  id          uuid    primary key default gen_random_uuid(),
  game_type   text    not null, -- 'quiz' | 'versiculo' | 'peregrinacao' | 'palavras' | 'liturgico' | 'stop'
  titulo      text    not null,
  descricao   text,
  categoria   text,             -- ex: 'santos', 'biblia', 'liturgia', 'maria'
  visivel     boolean not null default true,
  gratuito    boolean not null default true,
  coins_price int     not null default 0,
  conteudo    jsonb   not null,  -- estrutura varia por game_type (ver abaixo)
  ativo       boolean not null default true,
  ordem       int     not null default 0,
  created_at  timestamptz default now()
);

-- conteudo por game_type:
--
-- quiz:
--   { "perguntas": [{ "topic": "...", "question": "...", "options": ["A","B","C","D"], "correct": 0, "difficulty": "facil|medio|dificil" }] }
--
-- versiculo:
--   { "frases": [{ "words": ["Palavra", "..."], "reference": "Jo 3,16", "options": ["A","B","C","D"], "type": "versículo|santo|papa|documento", "difficulty": "facil|medio|dificil" }] }
--
-- peregrinacao:
--   { "santuarios": [{ "emoji": "🇧🇷", "name": "...", "country": "...", "description": "...", "questions": [{ "question": "...", "options": ["A","B","C","D"], "correct": 0 }] }] }
--
-- palavras:
--   { "temas": [{ "title": "...", "subtitle": "...", "words": ["PALAVRA1", "PALAVRA2"], "difficulty": "facil|medio|dificil", "gridSize": 8 }] }
--
-- liturgico:
--   { "perguntas": [{ "question": "...", "options": ["A","B","C","D"], "correct": 0, "hint": "...", "difficulty": "facil|medio|dificil" }] }
--
-- stop:
--   { "categorias": [{ "key": "chave_unica", "label": "Nome da Categoria", "icon": "✝️", "description": "..." }] }

alter table game_packs enable row level security;

create policy "game_packs_public_read" on game_packs
  for select using (ativo = true and visivel = true);

-- Admin pode gerenciar via service role (sem policy adicional necessário)

-- 2. Tabela de packs comprados por usuário
create table if not exists user_game_packs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles(id) on delete cascade,
  pack_id   uuid not null references game_packs(id) on delete cascade,
  origem    text not null default 'coins', -- 'coins' | 'purchase' | 'gift' | 'admin'
  criado_em timestamptz default now(),
  unique(user_id, pack_id)
);

alter table user_game_packs enable row level security;

create policy "user_game_packs_own" on user_game_packs
  for all using (user_id = auth.uid());

-- 3. Função: comprar pack com moedas (atômica)
create or replace function buy_game_pack(p_pack_id uuid)
returns text language plpgsql security definer as $$
declare
  v_user_id    uuid := auth.uid();
  v_price      int;
  v_purchasable boolean;
  v_coins      int;
begin
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  select coins_price, gratuito into v_price, v_purchasable
    from game_packs where id = p_pack_id and ativo = true;

  if not found then return 'not_available'; end if;
  if v_purchasable then return 'not_available'; end if; -- gratuito, não precisa comprar

  if exists (select 1 from user_game_packs where user_id = v_user_id and pack_id = p_pack_id) then
    return 'already_owned';
  end if;

  select coins into v_coins from profiles where id = v_user_id;
  if v_coins < v_price then return 'insufficient_coins'; end if;

  update profiles set coins = coins - v_price where id = v_user_id;
  insert into user_game_packs(user_id, pack_id, origem) values (v_user_id, p_pack_id, 'coins');

  return 'success';
end;
$$;

-- 4. Índices para performance
create index if not exists idx_game_packs_type  on game_packs(game_type) where ativo = true;
create index if not exists idx_user_game_packs  on user_game_packs(user_id);
